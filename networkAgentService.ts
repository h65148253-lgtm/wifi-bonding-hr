import { 
  NetworkAdapter, 
  BondingStatus, 
  BandwidthDataPoint, 
  NetworkLog, 
  DiagnosticsResult,
  AppSettings,
  AppStage,
  VpsRelayConfig
} from '../types';
import { SimulationEngine } from './simulationEngine';

export class NetworkAgentService {
  private simulationEngine: SimulationEngine;
  private isConnectedToAgent: boolean = false;
  private agentBaseUrl: string = 'http://127.0.0.1:58432';
  private agentWebSocketUrl: string = 'ws://127.0.0.1:58432/ws';
  private ws: WebSocket | null = null;
  private telemetrySubscribers: ((point: BandwidthDataPoint) => void)[] = [];
  private pollInterval: any = null;

  constructor() {
    this.simulationEngine = new SimulationEngine();
    this.startSimulationTelemetry();
    this.checkAgentAvailability();
  }

  public async checkAgentAvailability(): Promise<{ online: boolean; message: string }> {
    // If running in HTTPS cloud deployment (like Vercel), direct connection to local insecure http://127.0.0.1 is blocked by browser mixed-content policy
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && this.agentBaseUrl.startsWith('http://')) {
      this.isConnectedToAgent = false;
      return {
        online: false,
        message: 'Running in Cloud Deployment (Vercel). Real-time simulation and topology interactive mode active.'
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);
      
      const response = await fetch(`${this.agentBaseUrl}/api/v1/health`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        this.isConnectedToAgent = true;
        this.initAgentWebSocket();
        return { online: true, message: 'Connected to Windows PLEXLINK Native Agent v2.0' };
      }
    } catch (e) {
      this.isConnectedToAgent = false;
    }

    return { 
      online: false, 
      message: 'Windows Native Agent not running on port 58432. Active in Demo Simulation Mode.' 
    };
  }

  private initAgentWebSocket() {
    if (this.ws) return;
    try {
      this.ws = new WebSocket(this.agentWebSocketUrl);
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'telemetry') {
            this.telemetrySubscribers.forEach(cb => cb(data.payload));
          }
        } catch (err) {
          console.error('Error parsing agent WS message:', err);
        }
      };
      this.ws.onclose = () => {
        this.isConnectedToAgent = false;
        this.ws = null;
      };
    } catch {
      this.isConnectedToAgent = false;
    }
  }

  private startSimulationTelemetry() {
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.pollInterval = setInterval(() => {
      if (!this.isConnectedToAgent) {
        const point = this.simulationEngine.tick();
        this.telemetrySubscribers.forEach(cb => cb(point));
      }
    }, 1500);
  }

  public subscribeTelemetry(callback: (point: BandwidthDataPoint) => void): () => void {
    this.telemetrySubscribers.push(callback);
    return () => {
      this.telemetrySubscribers = this.telemetrySubscribers.filter(cb => cb !== callback);
    };
  }

  public async getAdapters(): Promise<NetworkAdapter[]> {
    if (this.isConnectedToAgent) {
      try {
        const res = await fetch(`${this.agentBaseUrl}/api/v1/adapters`);
        if (res.ok) return await res.json();
      } catch {
        this.isConnectedToAgent = false;
      }
    }
    return this.simulationEngine.getAdapters();
  }

  public async getBondingStatus(): Promise<BondingStatus> {
    if (this.isConnectedToAgent) {
      try {
        const res = await fetch(`${this.agentBaseUrl}/api/v1/bonding/status`);
        if (res.ok) {
          const status = await res.json();
          return {
            ...status,
            isRealBackend: true,
          };
        }
      } catch {
        this.isConnectedToAgent = false;
      }
    }
    return this.simulationEngine.getBondingStatus();
  }

  public async getHistory(): Promise<BandwidthDataPoint[]> {
    if (this.isConnectedToAgent) {
      try {
        const res = await fetch(`${this.agentBaseUrl}/api/v1/history`);
        if (res.ok) return await res.json();
      } catch {}
    }
    return this.simulationEngine.getHistory();
  }

  public async getLogs(): Promise<NetworkLog[]> {
    if (this.isConnectedToAgent) {
      try {
        const res = await fetch(`${this.agentBaseUrl}/api/v1/logs`);
        if (res.ok) return await res.json();
      } catch {}
    }
    return this.simulationEngine.getLogs();
  }

  public async clearLogs(): Promise<void> {
    if (this.isConnectedToAgent) {
      try {
        await fetch(`${this.agentBaseUrl}/api/v1/logs/clear`, { method: 'POST' });
        return;
      } catch {}
    }
    this.simulationEngine.clearLogs();
  }

  public async toggleAdapter(adapterId: 'wifi' | 'usb_tether', state?: boolean): Promise<boolean> {
    if (this.isConnectedToAgent) {
      try {
        await fetch(`${this.agentBaseUrl}/api/v1/adapters/${adapterId}/toggle`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state }),
        });
      } catch {
        this.isConnectedToAgent = false;
      }
    }
    return this.simulationEngine.toggleAdapter(adapterId, state);
  }

  public async setStage(stage: AppStage): Promise<void> {
    if (this.isConnectedToAgent) {
      try {
        await fetch(`${this.agentBaseUrl}/api/v1/stage/switch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stage }),
        });
        return;
      } catch {
        this.isConnectedToAgent = false;
      }
    }
    this.simulationEngine.setStage(stage);
  }

  public async triggerManualFailover(): Promise<void> {
    if (this.isConnectedToAgent) {
      try {
        await fetch(`${this.agentBaseUrl}/api/v1/failover/trigger-manual`, { method: 'POST' });
        return;
      } catch {
        this.isConnectedToAgent = false;
      }
    }
    this.simulationEngine.triggerManualFailover();
  }

  public async updateFailoverPolicy(policy: { enabled?: boolean; sensitivity?: 'high' | 'medium' | 'low'; autoRevert?: boolean }): Promise<void> {
    if (this.isConnectedToAgent) {
      try {
        await fetch(`${this.agentBaseUrl}/api/v1/failover/toggle-auto`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(policy),
        });
        return;
      } catch {
        this.isConnectedToAgent = false;
      }
    }
  }

  public async runLiveSpeedBurst(): Promise<{ speedMbps: number; timestamp: string }> {
    if (this.isConnectedToAgent) {
      try {
        const res = await fetch(`${this.agentBaseUrl}/api/v1/speedtest/start`, { method: 'POST' });
        if (res.ok) return await res.json();
      } catch {}
    }
    await new Promise(r => setTimeout(r, 1200));
    return { speedMbps: 48.6, timestamp: new Date().toLocaleTimeString() };
  }

  public async getVpsRelayConfig(): Promise<VpsRelayConfig> {
    if (this.isConnectedToAgent) {
      try {
        const res = await fetch(`${this.agentBaseUrl}/api/v1/bonding/vps-config`);
        if (res.ok) return await res.json();
      } catch {}
    }
    return this.simulationEngine.getVpsRelayConfig();
  }

  public async connectBonding(): Promise<boolean> {
    if (this.isConnectedToAgent) {
      try {
        const res = await fetch(`${this.agentBaseUrl}/api/v1/bonding/connect`, { method: 'POST' });
        return res.ok;
      } catch {
        this.isConnectedToAgent = false;
      }
    }
    return this.simulationEngine.connectBonding();
  }

  public async disconnectBonding(): Promise<boolean> {
    if (this.isConnectedToAgent) {
      try {
        const res = await fetch(`${this.agentBaseUrl}/api/v1/bonding/disconnect`, { method: 'POST' });
        return res.ok;
      } catch {
        this.isConnectedToAgent = false;
      }
    }
    return this.simulationEngine.disconnectBonding();
  }

  public async setBondingMode(mode: BondingStatus['mode']): Promise<void> {
    if (this.isConnectedToAgent) {
      try {
        await fetch(`${this.agentBaseUrl}/api/v1/bonding/mode`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode }),
        });
        return;
      } catch {
        this.isConnectedToAgent = false;
      }
    }
    this.simulationEngine.setBondingMode(mode);
  }

  public async setTrafficRatio(wifi: number, usb: number): Promise<void> {
    if (this.isConnectedToAgent) {
      try {
        await fetch(`${this.agentBaseUrl}/api/v1/bonding/ratio`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wifi, usb }),
        });
        return;
      } catch {
        this.isConnectedToAgent = false;
      }
    }
    this.simulationEngine.setTrafficRatio(wifi, usb);
  }

  public async runDiagnostics(): Promise<DiagnosticsResult> {
    if (this.isConnectedToAgent) {
      try {
        const res = await fetch(`${this.agentBaseUrl}/api/v1/diagnostics/run`);
        if (res.ok) return await res.json();
      } catch {}
    }
    await new Promise(r => setTimeout(r, 1400));
    return this.simulationEngine.runDiagnostics();
  }

  public async getAvailableAdapters(): Promise<any> {
    if (this.isConnectedToAgent) {
      try {
        const res = await fetch(`${this.agentBaseUrl}/api/v1/adapters/available`);
        if (res.ok) return await res.json();
      } catch {}
    }
    return this.simulationEngine.getAvailableAdapters();
  }

  public async selectAdapters(mapping: { wifiAdapter?: string; usbAdapter?: string }): Promise<void> {
    if (this.isConnectedToAgent) {
      try {
        await fetch(`${this.agentBaseUrl}/api/v1/adapters/select`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mapping),
        });
      } catch {}
    }
    this.simulationEngine.selectAdapters(mapping);
  }

  public async testBondedAccess(): Promise<{ success: boolean; latencyMs?: number; publicIp?: string; message: string }> {
    if (this.isConnectedToAgent) {
      try {
        const res = await fetch(`${this.agentBaseUrl}/api/v1/bonding/test-access`, { method: 'POST' });
        if (res.ok) return await res.json();
      } catch {}
    }
    return this.simulationEngine.testBondedAccess();
  }

  public isAgentConnected(): boolean {
    return this.isConnectedToAgent;
  }
}

export const networkService = new NetworkAgentService();
