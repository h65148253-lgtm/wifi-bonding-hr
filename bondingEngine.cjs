// PLEXLINK Real-Time Bonding Engine v2.0
// User-space Dual-Path Multipath SOCKS5 Aggregator & UDP Tunnel Multiplexer
// Binds independently to Wi-Fi IP and Android USB Tethering IP
const dgram = require('dgram');
const net = require('net');
const crypto = require('crypto');
const { EventEmitter } = require('events');

class BondingEngine extends EventEmitter {
  constructor() {
    super();

    // Configuration
    this.socksPort = 1080;
    this.socksHost = '127.0.0.1';
    this.vpsHost = '144.24.112.50';
    this.vpsPort = 51820;
    this.authSecret = 'wX8a/9Kj+PzQ0L7rY3e1M4oV6tS8uA2bC9dE=';

    // State
    this.isRunning = false;
    this.isHandshakeOk = false;
    this.wifiPathActive = false;
    this.usbPathActive = false;
    this.wifiIp = '';
    this.usbIp = '';
    this.mode = 'dynamic_ratio'; // 'dynamic_ratio' | 'round_robin' | 'redundant' | 'active_backup'
    this.trafficRatio = { wifi: 60, usb: 40 };

    // Sockets & Servers
    this.socksServer = null;
    this.wifiUdpSocket = null;
    this.usbUdpSocket = null;
    this.localRelayServer = null; // Built-in local loopback relay when VPS is offline

    // Session Management
    this.sessions = new Map(); // sessionId -> { socket, targetHost, targetPort, sendSeq, recvSeq, buffer: Map }
    this.nextSessionId = 1000;
    this.packetCounter = 0;
    this.startTime = 0;
    this.lastHandshakeTimestamp = 0;

    // Byte Tracking
    this.stats = {
      wifiBytesIn: 0,
      wifiBytesOut: 0,
      usbBytesIn: 0,
      usbBytesOut: 0,
      packetsSent: 0,
      packetsReceived: 0,
      reorderedPackets: 0,
    };

    // Protocol Header Constants
    this.HEADER_SIZE = 12; // 1B ver + 4B session + 4B seq + 2B len + 1B flag
    this.FLAG_DATA = 0x00;
    this.FLAG_HANDSHAKE = 0x01;
    this.FLAG_HANDSHAKE_ACK = 0x02;
    this.FLAG_SESSION_OPEN = 0x03;
    this.FLAG_SESSION_CLOSE = 0x04;
    this.FLAG_KEEPALIVE = 0x05;

    // Periodic Keepalive / Ping Interval
    this.keepaliveTimer = null;
  }

  // Start the Bonding Engine
  async start(wifiIp, usbIp, vpsHost, vpsPort, authSecret) {
    if (this.isRunning) {
      await this.stop();
    }

    this.wifiIp = wifiIp || '';
    this.usbIp = usbIp || '';
    if (vpsHost) this.vpsHost = vpsHost;
    if (vpsPort) this.vpsPort = parseInt(vpsPort, 10);
    if (authSecret) this.authSecret = authSecret;

    this.isRunning = true;
    this.startTime = Date.now();

    // 1. Initialize UDP Sockets bound to specific adapter IPs
    this.initUdpSockets();

    // 2. Start SOCKS5 Proxy Server
    await this.startSocksServer();

    // 3. Start Keepalive & Handshake Prober
    this.startKeepalives();

    console.log(`[BOND_ENGINE] Started on SOCKS5 127.0.0.1:${this.socksPort}`);
    console.log(`[BOND_ENGINE] Wi-Fi Path: ${this.wifiIp || 'Auto/Unbound'} | USB Path: ${this.usbIp || 'Standby/Unbound'}`);
    console.log(`[BOND_ENGINE] VPS Relay Target: ${this.vpsHost}:${this.vpsPort}`);

    return true;
  }

  // Stop the Bonding Engine cleanly
  async stop() {
    this.isRunning = false;
    this.isHandshakeOk = false;
    this.wifiPathActive = false;
    this.usbPathActive = false;

    if (this.keepaliveTimer) {
      clearInterval(this.keepaliveTimer);
      this.keepaliveTimer = null;
    }

    // Close all active client sessions
    for (const [id, session] of this.sessions.entries()) {
      try {
        session.socket.destroy();
      } catch (e) {}
    }
    this.sessions.clear();

    // Close UDP sockets
    if (this.wifiUdpSocket) {
      try { this.wifiUdpSocket.close(); } catch (e) {}
      this.wifiUdpSocket = null;
    }
    if (this.usbUdpSocket) {
      try { this.usbUdpSocket.close(); } catch (e) {}
      this.usbUdpSocket = null;
    }

    // Close SOCKS5 server
    if (this.socksServer) {
      await new Promise(resolve => this.socksServer.close(resolve));
      this.socksServer = null;
    }

    console.log('[BOND_ENGINE] Stopped cleanly.');
  }

  // Bind UDP sockets to specific interface IPs
  initUdpSockets() {
    // Wi-Fi UDP Socket
    try {
      this.wifiUdpSocket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
      this.wifiUdpSocket.on('message', (msg, rinfo) => this.handleUdpMessage('wifi', msg, rinfo));
      this.wifiUdpSocket.on('error', (err) => {
        console.error('[BOND_ENGINE] Wi-Fi UDP Socket error:', err.message);
        this.wifiPathActive = false;
      });

      if (this.wifiIp && this.wifiIp !== '0.0.0.0') {
        this.wifiUdpSocket.bind(0, this.wifiIp, () => {
          const addr = this.wifiUdpSocket.address();
          console.log(`[BOND_ENGINE] Wi-Fi socket bound to ${addr.address}:${addr.port}`);
        });
      } else {
        this.wifiUdpSocket.bind(0, '0.0.0.0');
      }
    } catch (e) {
      console.error('[BOND_ENGINE] Failed creating Wi-Fi UDP socket:', e.message);
    }

    // USB Tethering UDP Socket
    try {
      this.usbUdpSocket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
      this.usbUdpSocket.on('message', (msg, rinfo) => this.handleUdpMessage('usb', msg, rinfo));
      this.usbUdpSocket.on('error', (err) => {
        console.error('[BOND_ENGINE] USB UDP Socket error:', err.message);
        this.usbPathActive = false;
      });

      if (this.usbIp && this.usbIp !== '0.0.0.0') {
        this.usbUdpSocket.bind(0, this.usbIp, () => {
          const addr = this.usbUdpSocket.address();
          console.log(`[BOND_ENGINE] USB socket bound to ${addr.address}:${addr.port}`);
        });
      } else {
        // Standby or unbound
      }
    } catch (e) {
      console.error('[BOND_ENGINE] Failed creating USB UDP socket:', e.message);
    }
  }

  // SOCKS5 Proxy Server Implementation (RFC 1928)
  startSocksServer() {
    return new Promise((resolve, reject) => {
      this.socksServer = net.createServer((clientSocket) => {
        this.handleSocksConnection(clientSocket);
      });

      this.socksServer.on('error', (err) => {
        console.error('[BOND_ENGINE] SOCKS5 Server error:', err.message);
        reject(err);
      });

      this.socksServer.listen(this.socksPort, this.socksHost, () => {
        console.log(`[BOND_ENGINE] SOCKS5 server listening on ${this.socksHost}:${this.socksPort}`);
        resolve();
      });
    });
  }

  handleSocksConnection(clientSocket) {
    let stage = 0; // 0 = Auth negotiation, 1 = Request, 2 = Tunnel Streaming
    let sessionId = null;

    clientSocket.on('data', (data) => {
      // Stage 0: SOCKS5 Initial Greeting / Method Selection
      if (stage === 0) {
        if (data[0] !== 0x05) {
          clientSocket.end();
          return;
        }
        // Respond with No Authentication Required (0x05, 0x00)
        clientSocket.write(Buffer.from([0x05, 0x00]));
        stage = 1;
        return;
      }

      // Stage 1: SOCKS5 Connection Request
      if (stage === 1) {
        if (data[0] !== 0x05 || data[1] !== 0x01) { // Only CONNECT command (0x01) supported
          clientSocket.write(Buffer.from([0x05, 0x07, 0x00, 0x01, 0, 0, 0, 0, 0, 0])); // Command not supported
          clientSocket.end();
          return;
        }

        const addressType = data[3];
        let targetHost = '';
        let targetPort = 0;
        let offset = 4;

        if (addressType === 0x01) {
          // IPv4
          targetHost = `${data[offset]}.${data[offset + 1]}.${data[offset + 2]}.${data[offset + 3]}`;
          offset += 4;
        } else if (addressType === 0x03) {
          // Domain name
          const domainLen = data[offset++];
          targetHost = data.slice(offset, offset + domainLen).toString('utf8');
          offset += domainLen;
        } else if (addressType === 0x04) {
          // IPv6
          targetHost = data.slice(offset, offset + 16).toString('hex').match(/.{1,4}/g).join(':');
          offset += 16;
        }

        targetPort = data.readUInt16BE(offset);

        // Assign session ID
        sessionId = this.nextSessionId++;
        const session = {
          id: sessionId,
          socket: clientSocket,
          targetHost,
          targetPort,
          sendSeq: 0,
          recvSeq: 0,
          reorderBuffer: new Map(),
          createdAt: Date.now(),
        };
        this.sessions.set(sessionId, session);

        // Reply SOCKS5 Success
        clientSocket.write(Buffer.from([0x05, 0x00, 0x00, 0x01, 0x7f, 0x00, 0x00, 0x01, 0x04, 0x38]));
        stage = 2;

        // Send SESSION_OPEN packet to VPS relay
        const openPayload = Buffer.from(JSON.stringify({ host: targetHost, port: targetPort }));
        this.sendMultipathPacket(sessionId, 0, this.FLAG_SESSION_OPEN, openPayload);
        return;
      }

      // Stage 2: SOCKS5 Data Streaming -> Chunk & Multiplex through dual paths
      if (stage === 2 && sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        // Chunk data into MTU-safe fragments (e.g. 1360 bytes)
        const CHUNK_SIZE = 1360;
        for (let i = 0; i < data.length; i += CHUNK_SIZE) {
          const chunk = data.slice(i, i + CHUNK_SIZE);
          const seq = ++session.sendSeq;
          this.sendMultipathPacket(sessionId, seq, this.FLAG_DATA, chunk);
        }
      }
    });

    clientSocket.on('close', () => {
      if (sessionId && this.sessions.has(sessionId)) {
        // Send SESSION_CLOSE packet
        this.sendMultipathPacket(sessionId, 0, this.FLAG_SESSION_CLOSE, Buffer.alloc(0));
        this.sessions.delete(sessionId);
      }
    });

    clientSocket.on('error', (err) => {
      if (sessionId && this.sessions.has(sessionId)) {
        this.sessions.delete(sessionId);
      }
    });
  }

  // Multipath Packet Dispatcher (Schedules packets across Wi-Fi and USB sockets)
  sendMultipathPacket(sessionId, seqNum, flag, payload) {
    const packet = Buffer.alloc(this.HEADER_SIZE + payload.length);
    packet.writeUInt8(0x01, 0); // Protocol Version 1
    packet.writeUInt32BE(sessionId, 1);
    packet.writeUInt32BE(seqNum, 5);
    packet.writeUInt16BE(payload.length, 9);
    packet.writeUInt8(flag, 11);
    payload.copy(packet, this.HEADER_SIZE);

    const hasWifi = this.wifiUdpSocket && this.wifiIp;
    const hasUsb = this.usbUdpSocket && this.usbIp;

    this.packetCounter++;

    // Scheduling Logic
    if (this.mode === 'redundant' && hasWifi && hasUsb) {
      // Send on BOTH sockets simultaneously (0% loss mode)
      this.sendViaWifi(packet);
      this.sendViaUsb(packet);
      return;
    }

    if (this.mode === 'round_robin' && hasWifi && hasUsb) {
      if (this.packetCounter % 2 === 0) {
        this.sendViaWifi(packet);
      } else {
        this.sendViaUsb(packet);
      }
      return;
    }

    if (this.mode === 'dynamic_ratio' && hasWifi && hasUsb) {
      // Weighted distribution (e.g., 60% Wi-Fi / 40% USB)
      const mod = this.packetCounter % 100;
      if (mod < this.trafficRatio.wifi) {
        this.sendViaWifi(packet);
      } else {
        this.sendViaUsb(packet);
      }
      return;
    }

    // Default or Fallback: active interface
    if (hasWifi) {
      this.sendViaWifi(packet);
    } else if (hasUsb) {
      this.sendViaUsb(packet);
    }
  }

  sendViaWifi(buffer) {
    if (!this.wifiUdpSocket) return;
    try {
      this.wifiUdpSocket.send(buffer, this.vpsPort, this.vpsHost, (err) => {
        if (!err) {
          this.stats.wifiBytesOut += buffer.length;
          this.stats.packetsSent++;
        }
      });
    } catch (e) {}
  }

  sendViaUsb(buffer) {
    if (!this.usbUdpSocket) return;
    try {
      this.usbUdpSocket.send(buffer, this.vpsPort, this.vpsHost, (err) => {
        if (!err) {
          this.stats.usbBytesOut += buffer.length;
          this.stats.packetsSent++;
        }
      });
    } catch (e) {}
  }

  // Handle incoming UDP packets from VPS relay server
  handleUdpMessage(path, msg, rinfo) {
    if (msg.length < this.HEADER_SIZE) return;

    if (path === 'wifi') {
      this.stats.wifiBytesIn += msg.length;
      this.wifiPathActive = true;
    } else {
      this.stats.usbBytesIn += msg.length;
      this.usbPathActive = true;
    }
    this.stats.packetsReceived++;

    const version = msg.readUInt8(0);
    const sessionId = msg.readUInt32BE(1);
    const seqNum = msg.readUInt32BE(5);
    const payloadLen = msg.readUInt16BE(9);
    const flag = msg.readUInt8(11);
    const payload = msg.slice(this.HEADER_SIZE, this.HEADER_SIZE + payloadLen);

    // Handshake ACK received
    if (flag === this.FLAG_HANDSHAKE_ACK) {
      this.isHandshakeOk = true;
      this.lastHandshakeTimestamp = Date.now();
      if (path === 'wifi') this.wifiPathActive = true;
      if (path === 'usb') this.usbPathActive = true;
      return;
    }

    // Keepalive response
    if (flag === this.FLAG_KEEPALIVE) {
      if (path === 'wifi') this.wifiPathActive = true;
      if (path === 'usb') this.usbPathActive = true;
      return;
    }

    // Data packet for an active SOCKS5 session
    const session = this.sessions.get(sessionId);
    if (!session || !session.socket || session.socket.destroyed) {
      return;
    }

    if (flag === this.FLAG_SESSION_CLOSE) {
      session.socket.end();
      this.sessions.delete(sessionId);
      return;
    }

    if (flag === this.FLAG_DATA) {
      // In-order streaming with jitter reorder buffer
      if (seqNum === session.recvSeq + 1) {
        session.recvSeq = seqNum;
        session.socket.write(payload);

        // Check if buffered out-of-order packets can now be flushed
        while (session.reorderBuffer.has(session.recvSeq + 1)) {
          const nextSeq = session.recvSeq + 1;
          const nextData = session.reorderBuffer.get(nextSeq);
          session.reorderBuffer.delete(nextSeq);
          session.recvSeq = nextSeq;
          session.socket.write(nextData);
          this.stats.reorderedPackets++;
        }
      } else if (seqNum > session.recvSeq + 1) {
        // Out-of-order packet: buffer it
        session.reorderBuffer.set(seqNum, payload);
        // Timeout safeguard to avoid deadlock if a packet was permanently dropped
        setTimeout(() => {
          if (session.reorderBuffer.has(seqNum)) {
            session.reorderBuffer.delete(seqNum);
            session.socket.write(payload);
          }
        }, 120);
      }
    }
  }

  // Periodic Keepalive on both physical UDP paths
  startKeepalives() {
    this.keepaliveTimer = setInterval(() => {
      if (!this.isRunning) return;

      const keepalivePayload = Buffer.from(this.authSecret);
      // Send Handshake / Keepalive on Wi-Fi
      if (this.wifiUdpSocket) {
        const pingPacket = Buffer.alloc(this.HEADER_SIZE + keepalivePayload.length);
        pingPacket.writeUInt8(0x01, 0);
        pingPacket.writeUInt32BE(0, 1);
        pingPacket.writeUInt32BE(0, 5);
        pingPacket.writeUInt16BE(keepalivePayload.length, 9);
        pingPacket.writeUInt8(this.FLAG_HANDSHAKE, 11);
        keepalivePayload.copy(pingPacket, this.HEADER_SIZE);
        this.sendViaWifi(pingPacket);
      }

      // Send Handshake / Keepalive on USB
      if (this.usbUdpSocket && this.usbIp) {
        const pingPacket = Buffer.alloc(this.HEADER_SIZE + keepalivePayload.length);
        pingPacket.writeUInt8(0x01, 0);
        pingPacket.writeUInt32BE(0, 1);
        pingPacket.writeUInt32BE(0, 5);
        pingPacket.writeUInt16BE(keepalivePayload.length, 9);
        pingPacket.writeUInt8(this.FLAG_HANDSHAKE, 11);
        keepalivePayload.copy(pingPacket, this.HEADER_SIZE);
        this.sendViaUsb(pingPacket);
      }
    }, 5000);
  }

  // Update scheduling mode & traffic ratio
  setMode(mode) {
    if (['dynamic_ratio', 'round_robin', 'redundant', 'active_backup'].includes(mode)) {
      this.mode = mode;
    }
  }

  setRatio(wifi, usb) {
    this.trafficRatio = { wifi: Math.max(0, Math.min(100, wifi)), usb: Math.max(0, Math.min(100, usb)) };
  }

  // Query engine status
  getStatus() {
    const uptimeMs = this.startTime ? Date.now() - this.startTime : 0;
    const agoSec = this.lastHandshakeTimestamp ? Math.round((Date.now() - this.lastHandshakeTimestamp) / 1000) : null;

    const dualActive = Boolean(this.wifiPathActive && this.usbPathActive);

    return {
      running: this.isRunning,
      connected: this.isRunning && (this.wifiPathActive || this.usbPathActive),
      handshakeOk: this.isHandshakeOk,
      sessionCount: this.sessions.size,
      socksPort: this.socksPort,
      socksHost: this.socksHost,
      vpsHost: this.vpsHost,
      vpsPort: this.vpsPort,
      wifiIp: this.wifiIp,
      usbIp: this.usbIp,
      wifiPathOk: this.wifiPathActive,
      usbPathOk: this.usbPathActive,
      dualPathVerified: dualActive,
      mode: this.mode,
      trafficRatio: { ...this.trafficRatio },
      uptimeMs,
      lastHandshakeAgo: agoSec !== null ? `${agoSec}s ago` : 'Waiting...',
      stats: { ...this.stats },
    };
  }

  isConnected() {
    return this.isRunning && this.isHandshakeOk && (this.wifiPathActive || this.usbPathActive);
  }

  isDualPath() {
    return this.isRunning && this.wifiPathActive && this.usbPathActive;
  }
}

// Singleton export
const engineInstance = new BondingEngine();
module.exports = engineInstance;
