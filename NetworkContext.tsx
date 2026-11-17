import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  NetworkAdapter, 
  BondingStatus, 
  BandwidthDataPoint, 
  NetworkLog, 
  DiagnosticsResult,
  AppSettings,
  BondingMode,
  AppStage,
  FailoverStatus,
  VpsRelayConfig
} from '../types';
import { networkService } from '../services/networkAgentService';

const DEFAULT_SETTINGS: AppSettings = {
  stage: 'stage1_failover',
  serverAddress: '144.24.112.50',
  serverPort: 51820,
  authSecret: 'wX8a/9Kj+PzQ0L7rY3e1M4oV6tS8uA2bC9dE=',
  bondingProtocol: 'WireGuard-MPTCP',
  agentIpcUrl: 'http://127.0.0.1:58432',
  autoReconnect: true,
  fallbackToSingleAdapter: true,
  autoFailoverEnabled: true,
  failoverSensitivity: 'high',
  dataSaverCapMb: 10240,
  enableDataSaver: true,
  theme: 'navy',
  telemetryIntervalMs: 1500,
  simulationModeManual: false,
};

interface NetworkContextType {
  adapters: NetworkAdapter[];
  bondingStatus: BondingStatus | null;
  history: BandwidthDataPoint[];
  logs: NetworkLog[];
  settings: AppSettings;
  diagnostics: DiagnosticsResult | null;
  agentOnline: boolean;
  isConnecting: boolean;
  error: string | null;
  stage: AppStage;
  vpsConfig: VpsRelayConfig | null;
  setStage: (stage: AppStage) => Promise<void>;
  triggerManualFailover: () => Promise<void>;
  updateFailoverPolicy: (policy: { enabled?: boolean; sensitivity?: 'high' | 'medium' | 'low'; autoRevert?: boolean }) => Promise<void>;
  runLiveSpeedBurst: () => Promise<{ speedMbps: number; timestamp: string }>;
  connectBonding: () => Promise<void>;
  disconnectBonding: () => Promise<void>;
  toggleAdapter: (adapterId: 'wifi' | 'usb_tether', state?: boolean) => Promise<void>;
  setBondingMode: (mode: BondingMode) => Promise<void>;
  setTrafficRatio: (wifi: number, usb: number) => Promise<void>;
  runDiagnostics: () => Promise<void>;
  clearLogs: () => Promise<void>;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  resetSettings: () => void;
  refreshAgentStatus: () => Promise<void>;
  testBondedAccess: () => Promise<{ success: boolean; latencyMs?: number; publicIp?: string; message: string }>;
  getAvailableAdapters: () => Promise<any>;
  selectAdapters: (mapping: { wifiAdapter?: string; usbAdapter?: string }) => Promise<void>;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adapters, setAdapters] = useState<NetworkAdapter[]>([]);
  const [bondingStatus, setBondingStatus] = useState<BondingStatus | null>(null);
  const [history, setHistory] = useState<BandwidthDataPoint[]>([]);
  const [logs, setLogs] = useState<NetworkLog[]>([]);
  const [agentOnline, setAgentOnline] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<DiagnosticsResult | null>(null);
  const [vpsConfig, setVpsConfig] = useState<VpsRelayConfig | null>(null);

  // Settings loaded from LocalStorage
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('plexlink_settings');
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch (e) {
      console.warn('Could not read settings from localStorage', e);
    }
    return DEFAULT_SETTINGS;
  });

  const stage = bondingStatus?.stage || settings.stage || 'stage1_failover';

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('plexlink_settings', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save settings to localStorage', e);
      }
      return updated;
    });
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.removeItem('plexlink_settings');
    } catch {}
  };

  const refreshData = useCallback(async () => {
    try {
      const [curAdapters, curBonding, curHistory, curLogs] = await Promise.all([
        networkService.getAdapters(),
        networkService.getBondingStatus(),
        networkService.getHistory(),
        networkService.getLogs(),
      ]);

      setAdapters(curAdapters);
      setBondingStatus(curBonding);
      setHistory(curHistory);
      setLogs(curLogs);
    } catch (err: any) {
      console.error('Failed to fetch network telemetry:', err);
      setError(err?.message || 'Error communicating with network service');
    }
  }, []);

  const refreshAgentStatus = useCallback(async () => {
    const res = await networkService.checkAgentAvailability();
    setAgentOnline(res.online);
    if (res.online) {
      const config = await networkService.getVpsRelayConfig();
      setVpsConfig(config);
    }
  }, []);

  useEffect(() => {
    refreshData();
    refreshAgentStatus();

    const unsubscribe = networkService.subscribeTelemetry((point) => {
      setHistory(prev => {
        const next = [...prev, point];
        return next.length > 30 ? next.slice(next.length - 30) : next;
      });
      refreshData();
    });

    return () => {
      unsubscribe();
    };
  }, [refreshData, refreshAgentStatus]);

  const setStage = async (newStage: AppStage) => {
    updateSettings({ stage: newStage });
    await networkService.setStage(newStage);
    await refreshData();
  };

  const triggerManualFailover = async () => {
    await networkService.triggerManualFailover();
    await refreshData();
  };

  const updateFailoverPolicy = async (policy: { enabled?: boolean; sensitivity?: 'high' | 'medium' | 'low'; autoRevert?: boolean }) => {
    await networkService.updateFailoverPolicy(policy);
    if (policy.enabled !== undefined) updateSettings({ autoFailoverEnabled: policy.enabled });
    if (policy.sensitivity) updateSettings({ failoverSensitivity: policy.sensitivity });
    await refreshData();
  };

  const runLiveSpeedBurst = async () => {
    const result = await networkService.runLiveSpeedBurst();
    await refreshData();
    return result;
  };

  const connectBonding = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      await networkService.connectBonding();
      await refreshData();
    } catch (e: any) {
      setError(e?.message || 'Failed to connect bonding tunnel');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectBonding = async () => {
    setIsConnecting(true);
    try {
      await networkService.disconnectBonding();
      await refreshData();
    } catch (e: any) {
      setError(e?.message || 'Failed to disconnect bonding tunnel');
    } finally {
      setIsConnecting(false);
    }
  };

  const toggleAdapter = async (adapterId: 'wifi' | 'usb_tether', state?: boolean) => {
    try {
      await networkService.toggleAdapter(adapterId, state);
      await refreshData();
    } catch (e: any) {
      setError(e?.message || `Failed to toggle ${adapterId}`);
    }
  };

  const setBondingMode = async (mode: BondingMode) => {
    try {
      await networkService.setBondingMode(mode);
      await refreshData();
    } catch (e: any) {
      setError(e?.message || 'Failed to change bonding mode');
    }
  };

  const setTrafficRatio = async (wifi: number, usb: number) => {
    try {
      await networkService.setTrafficRatio(wifi, usb);
      await refreshData();
    } catch (e: any) {
      setError(e?.message || 'Failed to update traffic split');
    }
  };

  const runDiagnostics = async () => {
    setDiagnostics(prev => prev ? { ...prev, running: true } : {
      running: true,
      lastRunTimestamp: null,
      overallHealth: 'untested',
      wifiPing: 0,
      usbPing: 0,
      bondedPing: 0,
      jitterMs: 0,
      bufferbloatGrade: 'A',
      packetLossPct: 0,
      mtuTestResult: 'Testing...',
      dnsResolutionMs: 0,
      speedTestDownloadMbps: 0,
      speedTestUploadMbps: 0,
      notes: [],
    });

    try {
      const res = await networkService.runDiagnostics();
      setDiagnostics(res);
      await refreshData();
    } catch (e: any) {
      setError(e?.message || 'Diagnostics execution failed');
      setDiagnostics(null);
    }
  };

  const clearLogs = async () => {
    await networkService.clearLogs();
    setLogs([]);
  };

  const testBondedAccess = async () => {
    return await networkService.testBondedAccess();
  };

  const getAvailableAdapters = async () => {
    return await networkService.getAvailableAdapters();
  };

  const selectAdapters = async (mapping: { wifiAdapter?: string; usbAdapter?: string }) => {
    await networkService.selectAdapters(mapping);
    await refreshData();
  };

  return (
    <NetworkContext.Provider
      value={{
        adapters,
        bondingStatus,
        history,
        logs,
        settings,
        diagnostics,
        agentOnline,
        isConnecting,
        error,
        stage,
        vpsConfig,
        setStage,
        triggerManualFailover,
        updateFailoverPolicy,
        runLiveSpeedBurst,
        connectBonding,
        disconnectBonding,
        toggleAdapter,
        setBondingMode,
        setTrafficRatio,
        runDiagnostics,
        clearLogs,
        updateSettings,
        resetSettings,
        refreshAgentStatus,
        testBondedAccess,
        getAvailableAdapters,
        selectAdapters,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};
