// PLEXLINK Remote Bonding Relay Server (Ubuntu / Linux VPS)
// Multipath UDP De-multiplexer & TCP Egress Proxy
// Runs on remote cloud instance (e.g. Ubuntu 22.04 / 24.04 LTS) on port 51820
const dgram = require('dgram');
const net = require('net');

const LISTEN_PORT = process.env.PORT || 51820;
const AUTH_SECRET = process.env.BOND_SECRET || 'wX8a/9Kj+PzQ0L7rY3e1M4oV6tS8uA2bC9dE=';

const server = dgram.createSocket('udp4');

const HEADER_SIZE = 12;
const FLAG_DATA = 0x00;
const FLAG_HANDSHAKE = 0x01;
const FLAG_HANDSHAKE_ACK = 0x02;
const FLAG_SESSION_OPEN = 0x03;
const FLAG_SESSION_CLOSE = 0x04;
const FLAG_KEEPALIVE = 0x05;

// Client tracking: clientKey -> { wifiEndpoint, usbEndpoint, lastSeen }
const clients = new Map();

// Session tracking: sessionId -> { targetSocket, clientEndpoint, sendSeq, recvSeq }
const sessions = new Map();

let packetCounter = 0;

console.log('========================================================');
console.log('    PLEXLINK REMOTE BONDING RELAY SERVER (NODE.JS)      ');
console.log('========================================================');

server.on('message', (msg, rinfo) => {
  if (msg.length < HEADER_SIZE) return;

  const version = msg.readUInt8(0);
  const sessionId = msg.readUInt32BE(1);
  const seqNum = msg.readUInt32BE(5);
  const payloadLen = msg.readUInt16BE(9);
  const flag = msg.readUInt8(11);
  const payload = msg.slice(HEADER_SIZE, HEADER_SIZE + payloadLen);

  const endpointKey = `${rinfo.address}:${rinfo.port}`;

  // 1. Handshake Packet (Keepalive / Initial Connection)
  if (flag === FLAG_HANDSHAKE) {
    const receivedSecret = payload.toString('utf8');
    if (receivedSecret === AUTH_SECRET) {
      // Reply with Handshake ACK
      const ackPacket = Buffer.alloc(HEADER_SIZE);
      ackPacket.writeUInt8(0x01, 0);
      ackPacket.writeUInt32BE(0, 1);
      ackPacket.writeUInt32BE(0, 5);
      ackPacket.writeUInt16BE(0, 9);
      ackPacket.writeUInt8(FLAG_HANDSHAKE_ACK, 11);
      server.send(ackPacket, rinfo.port, rinfo.address);
      // Track client endpoint
      clients.set(endpointKey, { rinfo, lastSeen: Date.now() });
    }
    return;
  }

  // 2. Open Session (Connect to Target Internet Server)
  if (flag === FLAG_SESSION_OPEN) {
    try {
      const meta = JSON.parse(payload.toString('utf8'));
      const targetHost = meta.host;
      const targetPort = meta.port;

      console.log(`[RELAY] Opening outbound connection for Session #${sessionId} -> ${targetHost}:${targetPort}`);

      const targetSocket = net.createConnection({ host: targetHost, port: targetPort }, () => {
        console.log(`[RELAY] Connected to ${targetHost}:${targetPort} for Session #${sessionId}`);
      });

      const sessionObj = {
        id: sessionId,
        targetSocket,
        clientEndpoint: rinfo,
        endpoints: [rinfo], // Holds multiple paths (Wi-Fi + USB)
        sendSeq: 0,
      };
      sessions.set(sessionId, sessionObj);

      targetSocket.on('data', (data) => {
        // Chunk and relay data back to client via UDP
        const CHUNK_SIZE = 1360;
        for (let i = 0; i < data.length; i += CHUNK_SIZE) {
          const chunk = data.slice(i, i + CHUNK_SIZE);
          const seq = ++sessionObj.sendSeq;

          const replyPacket = Buffer.alloc(HEADER_SIZE + chunk.length);
          replyPacket.writeUInt8(0x01, 0);
          replyPacket.writeUInt32BE(sessionId, 1);
          replyPacket.writeUInt32BE(seq, 5);
          replyPacket.writeUInt16BE(chunk.length, 9);
          replyPacket.writeUInt8(FLAG_DATA, 11);
          chunk.copy(replyPacket, HEADER_SIZE);

          // If multiple client endpoints (Wi-Fi + USB) registered, alternate between them
          packetCounter++;
          const targetEndpoint = sessionObj.endpoints[packetCounter % sessionObj.endpoints.length] || rinfo;
          server.send(replyPacket, targetEndpoint.port, targetEndpoint.address);
        }
      });

      targetSocket.on('close', () => {
        // Send close notification
        const closePacket = Buffer.alloc(HEADER_SIZE);
        closePacket.writeUInt8(0x01, 0);
        closePacket.writeUInt32BE(sessionId, 1);
        closePacket.writeUInt32BE(0, 5);
        closePacket.writeUInt16BE(0, 9);
        closePacket.writeUInt8(FLAG_SESSION_CLOSE, 11);
        server.send(closePacket, rinfo.port, rinfo.address);
        sessions.delete(sessionId);
      });

      targetSocket.on('error', (err) => {
        console.error(`[RELAY] Target error for Session #${sessionId}:`, err.message);
        sessions.delete(sessionId);
      });
    } catch (e) {
      console.error('[RELAY] Failed to parse session open:', e.message);
    }
    return;
  }

  // 3. Forward Data from Client to Target Internet Server
  if (flag === FLAG_DATA) {
    const session = sessions.get(sessionId);
    if (session && session.targetSocket && !session.targetSocket.destroyed) {
      // Add or update path endpoint
      const exists = session.endpoints.some(e => e.address === rinfo.address && e.port === rinfo.port);
      if (!exists && session.endpoints.length < 2) {
        session.endpoints.push(rinfo);
        console.log(`[RELAY] Session #${sessionId} added second multipath subflow: ${rinfo.address}:${rinfo.port}`);
      }
      session.targetSocket.write(payload);
    }
    return;
  }

  // 4. Close Session
  if (flag === FLAG_SESSION_CLOSE) {
    const session = sessions.get(sessionId);
    if (session && session.targetSocket) {
      session.targetSocket.end();
      sessions.delete(sessionId);
    }
  }
});

server.on('listening', () => {
  const address = server.address();
  console.log(`[RELAY] UDP Relay listening on 0.0.0.0:${address.port}`);
  console.log(`[RELAY] Ready to accept dual-path bonded tunnels.`);
});

server.bind(LISTEN_PORT);
