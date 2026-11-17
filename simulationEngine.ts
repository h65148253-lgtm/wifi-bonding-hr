import { 
  NetworkAdapter, 
  BondingStatus, 
  BandwidthDataPoint, 
  NetworkLog, 
  DiagnosticsResult,
  AppStage,
  FailoverStatus,
  VpsRelayConfig
} from '../types';

export class SimulationEngine {
  private currentStage: AppStage = 'stage1_failover';
  private wifiEnabled: boolean = true;
  private usbEnabled: boolean = true;
  private isBondingActive: boolean = true;
  private uptimeSeconds: number = 1420;
  private history: BandwidthDataPoint[] = [];
  private logs: NetworkLog[] = [];
  private currentMode: BondingStatus['mode'] = 'dynamic_ratio';
  private trafficRatio = { wifi: 60, usb: 40 };

  private failoverState: FailoverStatus = {
    activePrimary: 'wifi',
    standbyBackup: 'usb_tether',
    autoFailoverEnabled: true,
    sensitivity: 'high',
    failoverCount: 0,
    lastFailoverTimestamp: null,
    lastFailoverReason: null,
    switchDurationMs: 14,
    autoRevert: true,
    healthProbes: {
      wifiOk: true,
      usbOk: true,
      consecutiveLoss: 0,
    },
  };

  constructor() {
    this.initHistory();
    this.initInitialLogs();
  }

  private initHistory() {
    const now = new Date();
    for (let i = 25; i >= 0; i--) {
      const pastTime = new Date(now.getTime() - i * 2000);
      const timeStr = pastTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const wifiDl = 48 + Math.sin(i * 0.5) * 8;
      const usbDl = 32 + Math.cos(i * 0.4) * 6;
      this.history.push({
        time: timeStr,
        totalDownload: Math.round(wifiDl * 10) / 10,
        totalUpload: 12.4,
        wifiDownload: Math.round(wifiDl * 10) / 10,
        usbDownload: 0,
        latency: 28,
      });
    }
  }

  private initInitialLogs() {
    const now = Date.now();
    this.logs = [
      {
        id: 'log-1',
        timestamp: new Date(now - 120000).toLocaleTimeString(),
        level: 'info',
        source: 'AGENT',
        message: 'PLEXLINK Local Networking Controller initialized on 127.0.0.1:58432',
        details: 'Operating Stage: Stage 1 — Real-Time Monitoring & Automatic Failover',
      },
      {
        id: 'log-2',
        timestamp: new Date(now - 95000).toLocaleTimeString(),
        level: 'success',
        source: 'WIFI_MONITOR',
        message: 'Realtek 8852BE-VT Wireless LAN WiFi 6 PCI-E NIC bound as Primary Route',
        details: 'IP: 10.42.202.192 | Gateway: 10.42.202.60 | Metric: 10 (Active Gateway)',
      },
      {
        id: 'log-3',
        timestamp: new Date(now - 82000).toLocaleTimeString(),
        level: 'success',
        source: 'USB_TETHER',
        message: 'Android USB RNDIS Adapter bound as Hot Standby Backup',
        details: 'IP: 192.168.42.88 | Gateway: 192.168.42.129 | Metric: 55 (Standby)',
      },
      {
        id: 'log-4',
        timestamp: new Date(now - 60000).toLocaleTimeString(),
        level: 'info',
        source: 'FAILOVER_ENGINE',
        message: 'Automatic failover watchdog monitoring link health (Probing 1.1.1.1 / 8.8.8.8)',
        details: 'Sensitivity: High (2 failed pings trigger instant gateway promotion)',
      },
    ];
  }

  public getAdapters(): NetworkAdapter[] {
    const wifiNoise = (Math.random() - 0.5) * 6;
    const usbNoise = (Math.random() - 0.5) * 5;

    const wifiBase = this.wifiEnabled && this.isBondingActive ? 52.4 + wifiNoise : 0;
    const usbBase = this.usbEnabled && this.isBondingActive ? 36.8 + usbNoise : 0;

    const wifiIsPrimary = this.failoverState.activePrimary === 'wifi';
    const usbIsPrimary = this.failoverState.activePrimary === 'usb_tether';

    const wifiAdapter: NetworkAdapter = {
      id: 'wifi',
      name: 'Realtek 8852BE-VT Wireless LAN WiFi 6 PCI-E NIC',
      displayName: 'Wi-Fi 6 (Real Laptop Adapter)',
      type: 'wifi',
      status: this.wifiEnabled ? (wifiIsPrimary ? 'connected' : 'standby') : 'disconnected',
      enabled: this.wifiEnabled,
      ipAddress: '10.42.202.192',
      ipv6Address: '2401:4900:4a95:5691:626d:eae3:b15f:eaa8',
      subnetMask: '255.255.255.0',
      gateway: '10.42.202.60',
      macAddress: 'F0-68-E3-68-D9-44',
      dnsServers: ['10.42.202.60', '1.1.1.1'],
      signalStrength: 92,
      frequencyOrBand: '5.0 GHz (Realtek Wi-Fi 6 PCI-E)',
      networkName: 'Wi-Fi (Active Windows Interface)',
      currentDownloadMbps: Math.max(0, Math.round(wifiBase * 10) / 10),
      currentUploadMbps: this.wifiEnabled && this.isBondingActive ? Math.round((14 + (Math.random() - 0.5) * 2) * 10) / 10 : 0,
      peakDownloadMbps: 185.0,
      latencyMs: this.wifiEnabled ? Math.round(26 + Math.random() * 3) : 0,
      jitterMs: 1.8,
      packetLossPct: this.wifiEnabled ? 0.0 : 100,
      interfaceMetric: wifiIsPrimary ? 10 : 55,
      mtu: 1500,
      driverVersion: 'Realtek Windows 11 Driver (PCI-E)',
      bytesReceived: 19400000000,
      bytesSent: 3820000000,
      carrierOrHardware: 'Realtek 8852BE-VT PCI-E',
      isPrimaryRoute: wifiIsPrimary,
    };

    const usbAdapter: NetworkAdapter = {
      id: 'usb_tether',
      name: 'Remote NDIS based Internet Sharing Device',
      displayName: 'Android Phone (USB 3.2 Tethering)',
      type: 'usb_tether',
      status: this.usbEnabled ? (usbIsPrimary ? 'connected' : 'standby') : 'disconnected',
      enabled: this.usbEnabled,
      ipAddress: '192.168.42.88',
      ipv6Address: 'fe80::c284:76ab:e410:331b%18',
      subnetMask: '255.255.255.0',
      gateway: '192.168.42.129',
      macAddress: '02-00-4C-4F-4F-50',
      dnsServers: ['192.168.42.129', '8.8.8.8'],
      signalStrength: 95,
      frequencyOrBand: '5G SA Sub-6 (USB 3.2 Type-C)',
      networkName: 'Android 5G Cellular',
      currentDownloadMbps: Math.max(0, Math.round(usbBase * 10) / 10),
      currentUploadMbps: this.usbEnabled && this.isBondingActive ? Math.round((10 + (Math.random() - 0.5) * 2) * 10) / 10 : 0,
      peakDownloadMbps: 145.0,
      latencyMs: this.usbEnabled ? Math.round(31 + Math.random() * 4) : 0,
      jitterMs: 2.6,
      packetLossPct: this.usbEnabled ? 0.02 : 100,
      interfaceMetric: usbIsPrimary ? 10 : 60,
      mtu: 1500,
      driverVersion: 'Microsoft Remote NDIS 6.0',
      bytesReceived: 8400000000,
      bytesSent: 1620000000,
      carrierOrHardware: 'Android Phone Type-C RNDIS',
      isPrimaryRoute: usbIsPrimary,
    };

    return [wifiAdapter, usbAdapter];
  }

  public getBondingStatus(): BondingStatus {
    const adapters = this.getAdapters();
    const wifiActive = this.wifiEnabled && this.isBondingActive;
    const usbActive = this.usbEnabled && this.isBondingActive;

    let overallState: BondingStatus['state'] = 'disconnected';
    let dualPath = false;

    if (this.isBondingActive) {
      if (this.currentStage === 'stage1_failover') {
        overallState = (wifiActive && usbActive) ? 'failover_active' : (wifiActive || usbActive ? 'degraded' : 'disconnected');
        dualPath = wifiActive && usbActive;
      } else {
        overallState = (wifiActive && usbActive) ? 'bonded' : (wifiActive || usbActive ? 'degraded' : 'disconnected');
        dualPath = wifiActive && usbActive;
      }
    }

    let totalDownload = 0;
    let totalUpload = 0;

    if (this.currentStage === 'stage2_bonding') {
      totalDownload = (wifiActive ? adapters[0].currentDownloadMbps : 0) + 
                      (usbActive ? adapters[1].currentDownloadMbps : 0);
      totalUpload = (wifiActive ? adapters[0].currentUploadMbps : 0) + 
                    (usbActive ? adapters[1].currentUploadMbps : 0);
    } else {
      const active = this.failoverState.activePrimary === 'wifi' ? adapters[0] : adapters[1];
      totalDownload = active.currentDownloadMbps;
      totalUpload = active.currentUploadMbps;
    }

    let avgLatency = 28;
    if (this.currentStage === 'stage2_bonding' && wifiActive && usbActive) {
      avgLatency = Math.round((adapters[0].latencyMs * 0.6 + adapters[1].latencyMs * 0.4));
    } else if (this.failoverState.activePrimary === 'usb_tether' && usbActive) {
      avgLatency = adapters[1].latencyMs;
    } else if (wifiActive) {
      avgLatency = adapters[0].latencyMs;
    }

    return {
      stage: this.currentStage,
      state: overallState,
      mode: this.currentMode,
      trafficRatio: { ...this.trafficRatio },
      failover: { ...this.failoverState },
      tunnel: {
        connected: this.isBondingActive && (wifiActive || usbActive),
        serverEndpoint: '144.24.112.50:51820',
        protocol: 'WireGuard-MPTCP',
        handshakeTimeAgo: '10s ago',
        reorderingBufferSizeKb: 2048,
        roundTripTimeMs: avgLatency,
        lossCorrectionRecovered: 168,
        encryption: 'ChaCha20-Poly1305 (256-bit)',
        keepaliveSec: 25,
      },
      isRealBackend: false,
      totalDownloadMbps: Math.round(totalDownload * 10) / 10,
      totalUploadMbps: Math.round(totalUpload * 10) / 10,
      averageLatencyMs: avgLatency,
      totalPacketLossPct: (wifiActive || usbActive) ? 0.0 : 100,
      uptimeSeconds: this.isBondingActive ? this.uptimeSeconds : 0,
      dualPathVerified: dualPath,
    };
  }

  public tick(): BandwidthDataPoint {
    this.uptimeSeconds += 1.5;
    const status = this.getBondingStatus();
    const adapters = this.getAdapters();

    const wifiActive = this.wifiEnabled && this.isBondingActive;
    const usbActive = this.usbEnabled && this.isBondingActive;

    const newPoint: BandwidthDataPoint = {
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      totalDownload: status.totalDownloadMbps,
      totalUpload: status.totalUploadMbps,
      wifiDownload: wifiActive ? adapters[0].currentDownloadMbps : 0,
      usbDownload: usbActive ? adapters[1].currentDownloadMbps : 0,
      latency: status.averageLatencyMs,
    };

    this.history.push(newPoint);
    if (this.history.length > 30) this.history.shift();

    return newPoint;
  }

  public setStage(stage: AppStage) {
    this.currentStage = stage;
    this.addLog({
      level: 'info',
      source: 'AGENT',
      message: `Operational stage switched to: ${stage === 'stage1_failover' ? 'Stage 1 (Real-Time Monitoring & Failover)' : 'Stage 2 (True Internet Bonding)'}`,
      details: stage === 'stage1_failover' ? 'Local gateway metric failover active' : 'Multipath tunnel scheduler engaged',
    });
  }

  public triggerManualFailover() {
    const nextPrimary = this.failoverState.activePrimary === 'wifi' ? 'usb_tether' : 'wifi';
    this.failoverState.activePrimary = nextPrimary;
    this.failoverState.standbyBackup = nextPrimary === 'wifi' ? 'usb_tether' : 'wifi';
    this.failoverState.failoverCount += 1;
    this.failoverState.lastFailoverTimestamp = new Date().toLocaleTimeString();
    this.failoverState.lastFailoverReason = 'Manual operator switch from PLEXLINK dashboard';

    this.addLog({
      level: nextPrimary === 'usb_tether' ? 'warn' : 'success',
      source: 'FAILOVER_ENGINE',
      message: `Default route switched to: ${nextPrimary === 'wifi' ? 'Wi-Fi 6' : 'Android USB Tethering'}`,
      details: `Active failover switch executed in ${this.failoverState.switchDurationMs} ms without terminating TCP sockets.`,
    });
  }

  public toggleAdapter(adapterId: 'wifi' | 'usb_tether', state?: boolean): boolean {
    if (adapterId === 'wifi') {
      this.wifiEnabled = state !== undefined ? state : !this.wifiEnabled;
      if (!this.wifiEnabled && this.failoverState.autoFailoverEnabled && this.failoverState.activePrimary === 'wifi') {
        this.failoverState.activePrimary = 'usb_tether';
        this.failoverState.standbyBackup = 'wifi';
        this.failoverState.failoverCount += 1;
        this.failoverState.lastFailoverTimestamp = new Date().toLocaleTimeString();
        this.failoverState.lastFailoverReason = 'Wi-Fi connection lost (Simulated disconnect)';
        this.addLog({
          level: 'warn',
          source: 'FAILOVER_ENGINE',
          message: 'AUTO-FAILOVER: Wi-Fi dropped! Redirected default route to Android USB Tethering',
          details: 'Switch completed in 14ms. Connection maintained via mobile carrier.',
        });
      } else if (this.wifiEnabled && this.failoverState.autoRevert && this.failoverState.activePrimary === 'usb_tether') {
        this.failoverState.activePrimary = 'wifi';
        this.failoverState.standbyBackup = 'usb_tether';
        this.addLog({
          level: 'success',
          source: 'FAILOVER_ENGINE',
          message: 'AUTO-REVERT: Wi-Fi signal recovered, restored as primary gateway',
          details: 'Traffic routed back to Wi-Fi 6 without interrupting active streams.',
        });
      }
      return this.wifiEnabled;
    } else {
      this.usbEnabled = state !== undefined ? state : !this.usbEnabled;
      if (!this.usbEnabled && this.failoverState.autoFailoverEnabled && this.failoverState.activePrimary === 'usb_tether') {
        this.failoverState.activePrimary = 'wifi';
        this.failoverState.standbyBackup = 'usb_tether';
        this.addLog({
          level: 'warn',
          source: 'FAILOVER_ENGINE',
          message: 'USB Tethering unplugged, failed back to Wi-Fi 6',
          details: 'Default gateway assigned to Wi-Fi.',
        });
      }
      return this.usbEnabled;
    }
  }

  public getHistory(): BandwidthDataPoint[] {
    return [...this.history];
  }

  public getLogs(): NetworkLog[] {
    return [...this.logs];
  }

  public addLog(log: Omit<NetworkLog, 'id' | 'timestamp'>) {
    this.logs.unshift({
      ...log,
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toLocaleTimeString(),
    });
    if (this.logs.length > 100) this.logs.pop();
  }

  public clearLogs() {
    this.logs = [];
  }

  public connectBonding(): boolean {
    this.isBondingActive = true;
    return true;
  }

  public disconnectBonding(): boolean {
    this.isBondingActive = false;
    return false;
  }

  public setBondingMode(mode: BondingStatus['mode']) {
    this.currentMode = mode;
  }

  public setTrafficRatio(wifi: number, usb: number) {
    this.trafficRatio = { wifi, usb };
  }

  public async runDiagnostics(): Promise<DiagnosticsResult> {
    await new Promise(r => setTimeout(r, 1200));
    return {
      running: false,
      lastRunTimestamp: new Date().toLocaleTimeString(),
      overallHealth: this.wifiEnabled && this.usbEnabled ? 'excellent' : 'good',
      wifiPing: 26.4,
      usbPing: 31.8,
      bondedPing: 26.4,
      jitterMs: 1.8,
      bufferbloatGrade: 'A+',
      packetLossPct: 0.0,
      mtuTestResult: 'Pass (1500 bytes unfragmented, WireGuard MSS clamped to 1380)',
      dnsResolutionMs: 12.8,
      speedTestDownloadMbps: 54.2,
      speedTestUploadMbps: 14.8,
      notes: [
        `Operational Mode: ${this.currentStage === 'stage1_failover' ? 'Stage 1 — Real-Time Monitoring & Automatic Failover' : 'Stage 2 — True Channel Bonding Tunnel'}`,
        'Active Route: Wi-Fi 6 Primary with Android USB Tethering Standby Backup',
        'Failover response benchmark: 14 ms switch time on packet timeout',
      ],
    };
  }

  public getAvailableAdapters() {
    return {
      wifiConnectedSsid: 'KPR Institutions',
      activeWifiAdapter: 'Realtek 8852BE-VT Wireless LAN WiFi 6 PCI-E NIC',
      activeUsbAdapter: 'Remote NDIS based Internet Sharing Device',
      adapters: [
        {
          name: 'Wireless LAN adapter Wi-Fi',
          description: 'Realtek 8852BE-VT Wireless LAN WiFi 6 PCI-E NIC',
          ip: '172.168.64.128',
          gateway: '172.168.64.1',
          subnet: '255.255.192.0',
          mac: 'F0-68-E3-68-D9-44',
          status: 'connected',
          isWifi: true,
          isUsb: false,
        },
        {
          name: 'Ethernet adapter USB Tethering',
          description: 'Remote NDIS based Internet Sharing Device',
          ip: '192.168.42.88',
          gateway: '192.168.42.129',
          subnet: '255.255.255.0',
          mac: '02-00-4C-4F-4F-50',
          status: 'connected',
          isWifi: false,
          isUsb: true,
        },
        {
          name: 'Unknown adapter McAfee VPN',
          description: 'TAP-Windows Adapter V9',
          ip: '',
          gateway: '',
          subnet: '',
          mac: '00-FF-00-2B-35-0B',
          status: 'disconnected',
          isWifi: false,
          isUsb: false,
        }
      ]
    };
  }

  public selectAdapters(mapping: { wifiAdapter?: string; usbAdapter?: string }) {
    this.addLog({
      level: 'info',
      source: 'AGENT',
      message: 'Interface selection updated in cloud simulation',
      details: `Wi-Fi: ${mapping.wifiAdapter || 'Default'} | USB: ${mapping.usbAdapter || 'Default'}`
    });
  }

  public async testBondedAccess(): Promise<{ success: boolean; latencyMs?: number; publicIp?: string; message: string }> {
    await new Promise(r => setTimeout(r, 600));
    return {
      success: true,
      latencyMs: 24,
      publicIp: '103.130.89.21 (Cloud Multipath Egress)',
      message: 'Bonded internet access verified! Dual subflows passing data concurrently.'
    };
  }

  public getVpsRelayConfig(): VpsRelayConfig {
    return {
      serverIp: '144.24.112.50',
      port: 51820,
      protocol: 'WireGuard-MPTCP',
      authSecret: 'wX8a/9Kj+PzQ0L7rY3e1M4oV6tS8uA2bC9dE=',
      handshakeOk: true,
      serverLocation: 'Frankfurt / Singapore Cloud VPS',
      dockerComposeScript: `version: '3.8'
services:
  plexlink-relay:
    image: ghcr.io/multipath-tcp/mptcpd:latest
    container_name: plexlink-bonding-server
    restart: always
    network_mode: host
    cap_add:
      - NET_ADMIN
    environment:
      - BOND_SECRET=wX8a/9Kj+PzQ0L7rY3e1M4oV6tS8uA2bC9dE=
      - TUNNEL_PORT=51820
      - MTU=1420
`,
      ubuntuInstallScript: `#!/usr/bin/env bash
sudo apt-get update && sudo apt-get install -y wireguard iptables mptcpd
sudo sysctl -w net.ipv4.ip_forward=1
sudo sysctl -w net.mptcp.enabled=1
sudo ufw allow 51820/udp
echo "PLEXLINK Bonding Relay Ready!"
`,
    };
  }
}
