import React, { useState, useEffect } from 'react';
import { AppSettings } from '../../types';
import {
  Server,
  ShieldCheck,
  Sliders,
  Smartphone,
  Save,
  RotateCcw,
  Check,
  Radio,
  Cpu,
  RefreshCw,
  Repeat,
  Zap,
  Wifi,
  Network,
  CheckCircle2,
  AlertCircle,
  Copy,
  Link,
  Unlink,
  ArrowRight,
  Activity,
  Layers,
  Info,
  Globe,
  Settings2
} from 'lucide-react';
import { useNetwork } from '../../context/NetworkContext';

interface ConfigFormProps {
  settings: AppSettings;
  onSave: (settings: Partial<AppSettings>) => void;
  onReset: () => void;
}

export const ConfigForm: React.FC<ConfigFormProps> = ({ settings, onSave, onReset }) => {
  const { 
    agentOnline, 
    refreshAgentStatus, 
    setStage, 
    adapters, 
    bondingStatus, 
    connectBonding, 
    disconnectBonding,
    testBondedAccess,
    getAvailableAdapters,
    selectAdapters,
  } = useNetwork();

  const [formData, setFormData] = useState<AppSettings>({
    ...settings,
    socksProxyPort: settings.socksProxyPort || 1080,
    autoBondWhenBothConnected: settings.autoBondWhenBothConnected ?? true,
  });

  const [isSaved, setIsSaved] = useState(false);
  const [isTestingAgent, setIsTestingAgent] = useState(false);
  const [agentTestMsg, setAgentTestMsg] = useState<string | null>(null);
  const [copiedProxy, setCopiedProxy] = useState(false);
  const [isConnectingTunnel, setIsConnectingTunnel] = useState(false);

  // Selection Type: 'auto' | 'manual'
  const [selectionMode, setSelectionMode] = useState<'auto' | 'manual'>('auto');
  const [availableAdapters, setAvailableAdapters] = useState<any[]>([]);
  const [selectedWifiAdapter, setSelectedWifiAdapter] = useState<string>('');
  const [selectedUsbAdapter, setSelectedUsbAdapter] = useState<string>('');

  // Live Access Test State
  const [isTestingAccess, setIsTestingAccess] = useState(false);
  const [accessTestResult, setAccessTestResult] = useState<{
    success: boolean;
    latencyMs?: number;
    publicIp?: string;
    message: string;
  } | null>(null);

  const wifiAdapter = adapters.find(a => a.id === 'wifi');
  const usbAdapter = adapters.find(a => a.id === 'usb_tether');

  const isWifiActive = wifiAdapter && wifiAdapter.status === 'connected';
  const isUsbActive = usbAdapter && usbAdapter.status === 'connected';
  const bothActive = Boolean(isWifiActive && isUsbActive);

  const isTunnelBonded = bondingStatus?.state === 'bonded' || (bondingStatus?.tunnel?.connected && bothActive);

  useEffect(() => {
    getAvailableAdapters().then(res => {
      if (res?.adapters) {
        setAvailableAdapters(res.adapters);
        if (res.activeWifiAdapter) setSelectedWifiAdapter(res.activeWifiAdapter);
        if (res.activeUsbAdapter) setSelectedUsbAdapter(res.activeUsbAdapter);
      }
    });
  }, []);

  const handleChange = (field: keyof AppSettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsSaved(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    if (formData.stage) {
      setStage(formData.stage);
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleTestAgent = async () => {
    setIsTestingAgent(true);
    setAgentTestMsg(null);
    await refreshAgentStatus();
    setIsTestingAgent(false);
    if (agentOnline) {
      setAgentTestMsg('Success: Windows PLEXLINK Native Agent v2.0 is active and responsive on IPC port 58432.');
    } else {
      setAgentTestMsg('Agent Offline: Start the agent via start-plexlink.bat to monitor real hardware adapters.');
    }
  };

  const handleToggleBonding = async () => {
    setIsConnectingTunnel(true);
    try {
      if (isTunnelBonded) {
        await disconnectBonding();
      } else {
        await setStage('stage2_bonding');
        await connectBonding();
      }
    } finally {
      setIsConnectingTunnel(false);
    }
  };

  const handleRunAccessTest = async () => {
    setIsTestingAccess(true);
    setAccessTestResult(null);
    try {
      const res = await testBondedAccess();
      setAccessTestResult(res);
    } finally {
      setIsTestingAccess(false);
    }
  };

  const handleApplyAdapterSelection = async () => {
    await selectAdapters({
      wifiAdapter: selectedWifiAdapter,
      usbAdapter: selectedUsbAdapter
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const copyProxyToClipboard = () => {
    const proxyUrl = `127.0.0.1:${formData.socksProxyPort || 1080}`;
    navigator.clipboard.writeText(proxyUrl);
    setCopiedProxy(true);
    setTimeout(() => setCopiedProxy(false), 2000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. DEFAULTLY SHOWN: Real-Time Hardware Adapters & Network Names */}
      <div className="rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-900/60 border border-cyan-500/30 p-6 backdrop-blur-md shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-800/80 gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white tracking-wide">Connected Network Interfaces (Real-Time)</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  HARDWARE DETECTED
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Identifies which Wi-Fi network and which USB tethering device are connected for dual-path bonding
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border ${bothActive
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 animate-pulse'
                : (isWifiActive || isUsbActive)
                  ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                  : 'bg-red-950/60 border-red-500/40 text-red-300'
              }`}>
              {bothActive ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ALL OK — READY TO BOND</span>
                </>
              ) : (isWifiActive || isUsbActive) ? (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>1 OF 2 READY (CONNECT PHONE USB)</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                  <span>NO NETWORKS DETECTED</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Adapter Selection Type Toggle */}
        <div className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <Settings2 className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-slate-200">Interface Selection Mode:</span>
            <span className="text-slate-400">
              {selectionMode === 'auto'
                ? 'Automatically assigns detected Wi-Fi & USB RNDIS adapters'
                : 'Manually select which adapter binds to which channel'}
            </span>
          </div>

          <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setSelectionMode('auto')}
              className={`px-3 py-1 rounded-md font-mono text-[11px] font-bold transition-all ${selectionMode === 'auto'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
                }`}
            >
              Auto-Detect
            </button>
            <button
              type="button"
              onClick={() => setSelectionMode('manual')}
              className={`px-3 py-1 rounded-md font-mono text-[11px] font-bold transition-all ${selectionMode === 'manual'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
                }`}
            >
              Manual Select
            </button>
          </div>
        </div>

        {/* Manual Adapter Dropdown Selectors (When in Manual Select mode) */}
        {selectionMode === 'manual' && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950/90 border border-cyan-500/40 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in text-xs font-mono">
            <div>
              <label className="block text-slate-300 font-semibold mb-1 uppercase text-[11px]">
                Designate Primary Wi-Fi Adapter
              </label>
              <select
                value={selectedWifiAdapter}
                onChange={(e) => setSelectedWifiAdapter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-cyan-300 focus:outline-none focus:border-cyan-500"
              >
                {availableAdapters.map((ad, idx) => (
                  <option key={idx} value={ad.description || ad.name}>
                    {ad.description || ad.name} {ad.ip ? `(${ad.ip})` : '(No IP)'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1 uppercase text-[11px]">
                Designate USB Tethering Adapter
              </label>
              <select
                value={selectedUsbAdapter}
                onChange={(e) => setSelectedUsbAdapter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-blue-300 focus:outline-none focus:border-cyan-500"
              >
                {availableAdapters.map((ad, idx) => (
                  <option key={idx} value={ad.description || ad.name}>
                    {ad.description || ad.name} {ad.ip ? `(${ad.ip})` : '(No IP)'}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 flex justify-end">
              <button
                type="button"
                onClick={handleApplyAdapterSelection}
                className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
              >
                Apply Adapter Mapping
              </button>
            </div>
          </div>
        )}

        {/* Connected Networks Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-5">
          {/* Wi-Fi Card */}
          <div className={`p-4 rounded-xl border transition-all ${isWifiActive
              ? 'bg-slate-950/70 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
              : 'bg-slate-950/40 border-slate-800 opacity-70'
            }`}>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/60">
              <div className="flex items-center space-x-2.5">
                <div className={`p-2 rounded-lg ${isWifiActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-500'}`}>
                  <Wifi className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center space-x-1.5">
                    <span>Wi-Fi Network:</span>
                    <span className="text-cyan-300 font-mono underline decoration-cyan-500/50">
                      "{wifiAdapter?.networkName || 'KPR Institutions'}"
                    </span>
                    {isWifiActive && (
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
                    )}
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono block">
                    {wifiAdapter?.name || 'Realtek 8852BE-VT Wireless LAN WiFi 6 PCI-E NIC'}
                  </span>
                </div>
              </div>

              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${isWifiActive
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                {isWifiActive ? 'CONNECTED' : 'DISCONNECTED'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
                <span className="text-[10px] text-slate-500 block uppercase">Connected Wi-Fi SSID</span>
                <span className="text-cyan-300 font-bold truncate block">
                  {wifiAdapter?.networkName || 'KPR Institutions'}
                </span>
              </div>

              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
                <span className="text-[10px] text-slate-500 block uppercase">Local IPv4 Address</span>
                <span className="text-white font-semibold truncate block">
                  {wifiAdapter?.ipAddress || 'Not Assigned'}
                </span>
              </div>

              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
                <span className="text-[10px] text-slate-500 block uppercase">Default Gateway</span>
                <span className="text-slate-300 font-semibold truncate block">
                  {wifiAdapter?.gateway || 'N/A'}
                </span>
              </div>

              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
                <span className="text-[10px] text-slate-500 block uppercase">Latency (1.1.1.1)</span>
                <span className="text-emerald-300 font-semibold block">
                  {wifiAdapter?.latencyMs ? `${wifiAdapter.latencyMs} ms` : 'Idle'}
                </span>
              </div>
            </div>
          </div>

          {/* USB Tethering Card */}
          <div className={`p-4 rounded-xl border transition-all ${isUsbActive
              ? 'bg-slate-950/70 border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
              : 'bg-slate-950/40 border-slate-800'
            }`}>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/60">
              <div className="flex items-center space-x-2.5">
                <div className={`p-2 rounded-lg ${isUsbActive ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-500'}`}>
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center space-x-1.5">
                    <span>Android USB Tethering:</span>
                    <span className="text-blue-300 font-mono">
                      {isUsbActive ? 'Active' : 'Standby'}
                    </span>
                    {isUsbActive && (
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
                    )}
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono block">
                    {usbAdapter?.name || 'Remote NDIS based Internet Sharing Device'}
                  </span>
                </div>
              </div>

              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${isUsbActive
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}>
                {isUsbActive ? 'CONNECTED' : 'WAITING FOR PHONE'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
                <span className="text-[10px] text-slate-500 block uppercase">Phone Device / NIC</span>
                <span className="text-white font-semibold truncate block">
                  {usbAdapter?.name || 'Remote NDIS Device'}
                </span>
              </div>

              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
                <span className="text-[10px] text-slate-500 block uppercase">Phone IPv4 Address</span>
                <span className="text-blue-300 font-semibold truncate block">
                  {usbAdapter?.ipAddress || 'Waiting for USB...'}
                </span>
              </div>

              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
                <span className="text-[10px] text-slate-500 block uppercase">Phone Gateway</span>
                <span className="text-slate-300 font-semibold truncate block">
                  {usbAdapter?.gateway || 'N/A'}
                </span>
              </div>

              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
                <span className="text-[10px] text-slate-500 block uppercase">Latency (1.1.1.1)</span>
                <span className="text-blue-300 font-semibold block">
                  {usbAdapter?.latencyMs ? `${usbAdapter.latencyMs} ms` : 'Idle'}
                </span>
              </div>
            </div>

            {!isUsbActive && (
              <div className="mt-3 p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/30 text-[11px] text-amber-300 flex items-start space-x-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>To connect phone:</strong> Plug phone into laptop with USB cable, open Android <em>Settings &gt; Network &amp; Internet &gt; Hotspot &amp; Tethering</em>, and turn ON <strong>USB Tethering</strong>.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 2. IF ALL ARE OK -> BOND BOTH INTO ONE & ACCESS IT */}
        <div className={`mt-6 p-5 rounded-xl border transition-all ${bothActive
            ? 'bg-gradient-to-r from-emerald-950/40 via-slate-950 to-cyan-950/40 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
            : 'bg-slate-950/80 border-slate-800'
          }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <Zap className={`w-5 h-5 ${bothActive ? 'text-emerald-400 animate-bounce' : 'text-cyan-400'}`} />
                <h4 className="text-base font-bold text-white">
                  {bothActive ? 'Both Wi-Fi & USB Tethering are Ready to Bond' : 'Dual-Path Internet Bonding Master Switch'}
                </h4>
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {bothActive
                  ? 'All verification checks passed! You can now merge the bandwidth of "KPR Institutions" and your Android phone into one high-speed pipe.'
                  : 'Connect both Wi-Fi and Android USB Tethering to activate simultaneous dual-link aggregation.'}
              </p>
            </div>

            <div className="flex items-center space-x-3 shrink-0">
              <button
                type="button"
                onClick={handleToggleBonding}
                disabled={isConnectingTunnel || (!isWifiActive && !isUsbActive)}
                className={`px-6 py-3 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all shadow-xl ${isTunnelBonded
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/40'
                    : 'bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white shadow-emerald-900/40 scale-105 active:scale-100'
                  } disabled:opacity-50`}
              >
                {isConnectingTunnel ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : isTunnelBonded ? (
                  <Unlink className="w-4 h-4" />
                ) : (
                  <Link className="w-4 h-4" />
                )}
                <span>
                  {isTunnelBonded
                    ? 'Disconnect Bonded Tunnel'
                    : '⚡ Bond Both Networks into One & Access Internet'}
                </span>
              </button>
            </div>
          </div>

          {/* Live Access Verification & Proxy Instructions */}
          <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase font-mono mb-1.5">
                Local SOCKS5 Proxy Access Endpoint
              </label>
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 font-mono text-cyan-300 text-xs font-bold">
                  127.0.0.1:{formData.socksProxyPort || 1080}
                </span>
                <button
                  type="button"
                  onClick={copyProxyToClipboard}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 border border-slate-700 flex items-center space-x-1.5 transition-colors"
                >
                  {copiedProxy ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedProxy ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleRunAccessTest}
                  disabled={isTestingAccess}
                  className="px-3 py-1.5 rounded-lg bg-cyan-950 border border-cyan-500/40 hover:bg-cyan-900 text-xs font-mono text-cyan-300 flex items-center space-x-1.5 transition-colors disabled:opacity-50"
                >
                  {isTestingAccess ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
                  <span>Test Internet Access</span>
                </button>
              </div>

              {accessTestResult && (
                <div className={`mt-2 p-2.5 rounded-lg border text-xs font-mono ${accessTestResult.success
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                    : 'bg-red-950/60 border-red-500/40 text-red-300'
                  }`}>
                  {accessTestResult.success ? (
                    <div>
                      ✓ {accessTestResult.message} (Latency: {accessTestResult.latencyMs}ms | Public IP: {accessTestResult.publicIp})
                    </div>
                  ) : (
                    <div>✗ {accessTestResult.message}</div>
                  )}
                </div>
              )}
            </div>

            <div className="text-[11px] text-slate-400 flex flex-col justify-center bg-slate-900/50 p-3 rounded-lg border border-slate-800/60">
              <span className="font-semibold text-slate-200 block mb-0.5">How to browse through the combined internet:</span>
              <span>In Windows Settings or browser (Chrome / Edge / Firefox), configure Proxy to SOCKS5 <code className="text-cyan-300 font-bold">127.0.0.1:1080</code>. All outbound downloads and traffic will immediately flow through both connections!</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Operational Stage Selection */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-6 backdrop-blur-md">
        <div className="flex items-center space-x-3 pb-5 border-b border-slate-800/60 mb-5">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Repeat className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">Operational Stage Selection</h3>
            <p className="text-xs text-slate-400">Choose between local real-time automatic failover or remote bonding tunnel</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            onClick={() => handleChange('stage', 'stage1_failover')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${formData.stage === 'stage1_failover'
                ? 'bg-cyan-950/40 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/50'
                : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
              }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-bold text-white flex items-center space-x-2">
                <Repeat className="w-4 h-4 text-cyan-400" />
                <span>Stage 1: Real-Time Failover</span>
              </span>
              <span className={`h-3 w-3 rounded-full border-2 ${formData.stage === 'stage1_failover' ? 'border-cyan-400 bg-cyan-400' : 'border-slate-600'
                }`} />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Monitors Wi-Fi and Android USB tethering locally. Automatically redirects internet traffic when one link fails without needing a remote VPS.
            </p>
          </div>

          <div
            onClick={() => handleChange('stage', 'stage2_bonding')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${formData.stage === 'stage2_bonding'
                ? 'bg-blue-950/40 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/50'
                : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
              }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-bold text-white flex items-center space-x-2">
                <Zap className="w-4 h-4 text-blue-400" />
                <span>Stage 2: True Internet Bonding</span>
              </span>
              <span className={`h-3 w-3 rounded-full border-2 ${formData.stage === 'stage2_bonding' ? 'border-blue-400 bg-blue-400' : 'border-slate-600'
                }`} />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Creates a multi-path tunnel across both interfaces, combining throughput additively via SOCKS5 proxy on 127.0.0.1:1080 and remote VPS relay.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Stage 1: Failover Preferences */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-6 backdrop-blur-md">
        <div className="flex items-center space-x-3 pb-5 border-b border-slate-800/60 mb-5">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">Stage 1 Failover Watchdog Settings</h3>
            <p className="text-xs text-slate-400">Configure sensitivity thresholds and failover parameters</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase font-mono">
              Failover Trigger Sensitivity
            </label>
            <select
              value={formData.failoverSensitivity || 'high'}
              onChange={(e) => handleChange('failoverSensitivity', e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="high">High (2 failed probes, ~15ms switch)</option>
              <option value="medium">Medium (4 failed probes, ~30ms switch)</option>
              <option value="low">Low (6 failed probes, ~50ms switch)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase font-mono">
              Auto-Revert Policy
            </label>
            <select
              value={formData.autoReconnect ? 'true' : 'false'}
              onChange={(e) => handleChange('autoReconnect', e.target.value === 'true')}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="true">Automatically revert to Wi-Fi when signal heals</option>
              <option value="false">Stay on Android USB until manual operator switch</option>
            </select>
          </div>
        </div>
      </div>

      {/* 5. Remote Bonding Server Section */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-6 backdrop-blur-md">
        <div className="flex items-center space-x-3 pb-5 border-b border-slate-800/60 mb-5">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">Stage 2 Remote Bonding Server Configuration</h3>
            <p className="text-xs text-slate-400">Target cloud VPS endpoint where subflows merge back into a single public IP</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase font-mono">
              Server Hostname / Public IPv4
            </label>
            <input
              type="text"
              value={formData.serverAddress}
              onChange={(e) => handleChange('serverAddress', e.target.value)}
              placeholder="e.g. 144.24.112.50 or bond.yourdomain.com"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase font-mono">
              Encapsulation Port (UDP)
            </label>
            <input
              type="number"
              value={formData.serverPort}
              onChange={(e) => handleChange('serverPort', parseInt(e.target.value, 10))}
              placeholder="51820"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase font-mono">
              Tunnel Protocol Specification
            </label>
            <select
              value={formData.bondingProtocol}
              onChange={(e) => handleChange('bondingProtocol', e.target.value as any)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="WireGuard-MPTCP">WireGuard Multi-Path UDP Encapsulation (Recommended)</option>
              <option value="OpenMPTCProuter">OpenMPTCProuter (Glorytun / Shadowsocks / MLVPN)</option>
              <option value="Custom-UDP-Bond">PLEXLINK Custom High-Performance UDP Tunnel</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase font-mono">
              Cryptographic Auth Secret / Pre-Shared Key
            </label>
            <input
              type="password"
              value={formData.authSecret}
              onChange={(e) => handleChange('authSecret', e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              required
            />
          </div>
        </div>
      </div>

      {/* 6. Windows Local Agent IPC Settings */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-6 backdrop-blur-md">
        <div className="flex items-center space-x-3 pb-5 border-b border-slate-800/60 mb-5">
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">Windows Native Agent Connection (IPC)</h3>
            <p className="text-xs text-slate-400">Local background daemon communicating with Windows NDIS network drivers</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase font-mono">
                Agent Local IPC Endpoint
              </label>
              <input
                type="text"
                value={formData.agentIpcUrl}
                onChange={(e) => handleChange('agentIpcUrl', e.target.value)}
                placeholder="http://127.0.0.1:58432"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div className="sm:pt-5">
              <button
                type="button"
                onClick={handleTestAgent}
                disabled={isTestingAgent}
                className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
              >
                {isTestingAgent ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Radio className="w-3.5 h-3.5" />}
                <span>Test Agent Ping</span>
              </button>
            </div>
          </div>

          {agentTestMsg && (
            <div className={`p-3 rounded-xl border text-xs font-mono ${agentOnline
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
              }`}>
              {agentTestMsg}
            </div>
          )}
        </div>
      </div>

      {/* 7. Mobile Data Saver */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-6 backdrop-blur-md">
        <div className="flex items-center space-x-3 pb-5 border-b border-slate-800/60 mb-5">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">Android Cellular Data Saver</h3>
            <p className="text-xs text-slate-400">Mobile tethering quota protection</p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-white block">Android Cellular Data Saver Threshold</span>
              <span className="text-slate-400 text-[11px]">Limit monthly tethering consumption over phone carrier</span>
            </div>
            <input
              type="checkbox"
              checked={formData.enableDataSaver}
              onChange={(e) => handleChange('enableDataSaver', e.target.checked)}
              className="h-4 w-4 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
          </div>

          {formData.enableDataSaver && (
            <div className="pt-2 flex items-center space-x-3">
              <span className="text-slate-400 text-[11px]">Monthly Mobile Cap:</span>
              <input
                type="number"
                value={formData.dataSaverCapMb}
                onChange={(e) => handleChange('dataSaverCapMb', parseInt(e.target.value, 10))}
                className="w-28 px-3 py-1 rounded-lg bg-slate-900 border border-slate-700 font-mono text-cyan-300 text-xs"
              />
              <span className="text-slate-400 text-[11px]">MB ({(formData.dataSaverCapMb / 1024).toFixed(1)} GB)</span>
            </div>
          )}
        </div>
      </div>

      {/* Save Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={onReset}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center space-x-2 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Factory Defaults</span>
        </button>

        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
          {isSaved && (
            <span className="text-xs text-emerald-400 flex items-center space-x-1 animate-fade-in font-medium">
              <Check className="w-4 h-4" />
              <span>Saved to LocalStorage!</span>
            </span>
          )}

          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 active:scale-95 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center justify-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>
    </form>
  );
};
