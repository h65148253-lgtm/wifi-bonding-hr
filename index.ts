export type AdapterType = 'wifi' | 'usb_tether';

export type AdapterStatus = 'connected' | 'connecting' | 'disconnected' | 'error' | 'standby';

export type AppStage = 'stage1_failover' | 'stage2_bonding';

export interface NetworkAdapter {
  id: AdapterType;
  name: string;
  displayName: string;
  type: AdapterType;
  status: AdapterStatus;
  enabled: boolean;
  ipAddress: string;
  ipv6Address: string;
  subnetMask: string;
  gateway: string;
  macAddress: string;
  dnsServers: string[];
  signalStrength: number; // 0 - 100%
  frequencyOrBand: string; // "5 GHz (802.11ax / Wi-Fi 6)" or "5G NSA / Sub-6"
  networkName: string; // SSID or Carrier
  currentDownloadMbps: number;
  currentUploadMbps: number;
  peakDownloadMbps: number;
  latencyMs: number;
  jitterMs: number;
  packetLossPct: number;
  interfaceMetric: number;
  mtu: number;
  driverVersion: string;
  bytesReceived: number;
  bytesSent: number;
  carrierOrHardware: string;
  isPrimaryRoute?: boolean;
}

export type BondingMode = 
  | 'dynamic_ratio' 
  | 'round_robin' 
  | 'redundant' 
  | 'active_backup';

export type BondingOverallState = 
  | 'bonded' 
  | 'degraded' 
  | 'connecting' 
  | 'disconnected' 
  | 'simulated'
  | 'failover_active';

export interface TunnelStatus {
  connected: boolean;
  serverEndpoint: string;
  protocol: 'WireGuard-MPTCP' | 'Custom-UDP-Bond' | 'OpenMPTCProuter';
  handshakeTimeAgo: string;
  reorderingBufferSizeKb: number;
  roundTripTimeMs: number;
  lossCorrectionRecovered: number;
  encryption: string;
  keepaliveSec: number;
  socksProxyPort?: number;
}

export interface FailoverStatus {
  activePrimary: AdapterType;
  standbyBackup: AdapterType;
  autoFailoverEnabled: boolean;
  sensitivity: 'high' | 'medium' | 'low';
  failoverCount: number;
  lastFailoverTimestamp: string | null;
  lastFailoverReason: string | null;
  switchDurationMs: number;
  autoRevert: boolean;
  healthProbes: {
    wifiOk: boolean;
    usbOk: boolean;
    consecutiveLoss: number;
  };
}

export interface BondingStatus {
  stage: AppStage;
  state: BondingOverallState;
  mode: BondingMode;
  trafficRatio: {
    wifi: number; // percentage (e.g. 65)
    usb: number;  // percentage (e.g. 35)
  };
  tunnel: TunnelStatus;
  failover: FailoverStatus;
  isRealBackend: boolean; // false = demo / simulated mode
  totalDownloadMbps: number;
  totalUploadMbps: number;
  averageLatencyMs: number;
  totalPacketLossPct: number;
  uptimeSeconds: number;
  dualPathVerified: boolean;
}

export interface BandwidthDataPoint {
  time: string;
  totalDownload: number;
  totalUpload: number;
  wifiDownload: number;
  usbDownload: number;
  latency: number;
}

export type LogLevel = 'info' | 'warn' | 'error' | 'success';

export type LogSource = 
  | 'AGENT' 
  | 'BOND_ENGINE' 
  | 'FAILOVER_ENGINE'
  | 'WIFI_MONITOR' 
  | 'USB_TETHER' 
  | 'TUNNEL' 
  | 'DIAGNOSTICS';

export interface NetworkLog {
  id: string;
  timestamp: string;
  level: LogLevel;
  source: LogSource;
  message: string;
  details?: string;
}

export interface DiagnosticsResult {
  running: boolean;
  lastRunTimestamp: string | null;
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'untested';
  wifiPing: number;
  usbPing: number;
  bondedPing: number;
  jitterMs: number;
  bufferbloatGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  packetLossPct: number;
  mtuTestResult: string;
  dnsResolutionMs: number;
  speedTestDownloadMbps: number;
  speedTestUploadMbps: number;
  notes: string[];
}

export interface VpsRelayConfig {
  serverIp: string;
  port: number;
  protocol: string;
  authSecret: string;
  handshakeOk: boolean;
  serverLocation: string;
  dockerComposeScript: string;
  ubuntuInstallScript: string;
}

export interface AppSettings {
  stage: AppStage;
  serverAddress: string;
  serverPort: number;
  authSecret: string;
  bondingProtocol: 'WireGuard-MPTCP' | 'Custom-UDP-Bond' | 'OpenMPTCProuter';
  agentIpcUrl: string;
  autoReconnect: boolean;
  fallbackToSingleAdapter: boolean;
  autoFailoverEnabled: boolean;
  failoverSensitivity: 'high' | 'medium' | 'low';
  dataSaverCapMb: number;
  enableDataSaver: boolean;
  theme: 'navy' | 'slate' | 'cyber';
  telemetryIntervalMs: number;
  simulationModeManual: boolean;
  preferredWifiAdapter?: string;
  preferredUsbAdapter?: string;
  autoBondWhenBothConnected?: boolean;
  socksProxyPort?: number;
}
