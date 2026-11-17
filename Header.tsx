import React, { useState } from 'react';
import { 
  Menu, 
  Power, 
  RefreshCw, 
  Info, 
  Zap,
  ShieldCheck,
  Repeat,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  ArrowRightLeft
} from 'lucide-react';
import { useNetwork } from '../../context/NetworkContext';
import { StatusBadge } from './StatusBadge';
import { NavTab } from './Sidebar';
import { formatSpeed } from '../../utils/formatters';

interface HeaderProps {
  currentTab: NavTab;
  onOpenMobileNav: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onOpenMobileNav }) => {
  const { 
    bondingStatus, 
    isConnecting, 
    connectBonding, 
    disconnectBonding,
    agentOnline,
    refreshAgentStatus,
    stage,
    setStage,
    triggerManualFailover,
    runLiveSpeedBurst
  } = useNetwork();

  const [isMeasuringSpeed, setIsMeasuringSpeed] = useState(false);
  const [speedTestResult, setSpeedTestResult] = useState<string | null>(null);

  const isBonded = bondingStatus?.state === 'bonded' || bondingStatus?.state === 'simulated' || bondingStatus?.state === 'failover_active';
  const isStage1 = stage === 'stage1_failover';
  const activePrimary = bondingStatus?.failover?.activePrimary || 'wifi';

  const handleSpeedTest = async () => {
    setIsMeasuringSpeed(true);
    setSpeedTestResult(null);
    try {
      const res = await runLiveSpeedBurst();
      setSpeedTestResult(`${res.speedMbps} Mbps`);
      setTimeout(() => setSpeedTestResult(null), 5000);
    } catch {
      setSpeedTestResult('Error');
    } finally {
      setIsMeasuringSpeed(false);
    }
  };

  const tabTitles: Record<NavTab, { title: string; subtitle: string }> = {
    dashboard: { 
      title: isStage1 ? 'Stage 1 — Real-Time Monitoring & Failover' : 'Stage 2 — True Internet Bonding Control', 
      subtitle: isStage1 
        ? 'Real network speeds, live adapter detection, and instant automatic failover switch'
        : 'Multipath UDP aggregation tunnel merging Wi-Fi and phone 5G into single public IP' 
    },
    connections: { 
      title: 'Physical Adapters & TCP/IP Routes', 
      subtitle: 'Monitoring Realtek Wi-Fi 6 + Android USB Tethering (RNDIS)' 
    },
    bonding: { 
      title: isStage1 ? 'Failover Engine & Routing Controls' : 'Multipath Tunnel & Traffic Distribution', 
      subtitle: isStage1 
        ? 'Automatic failover sensitivity, gateway metric switching, and failover history'
        : 'Packet striping algorithm and remote VPS reassembly configuration' 
    },
    diagnostics: { 
      title: 'Diagnostics, MTU & Event Log Suite', 
      subtitle: 'Deep telemetry, path ping matrix, and troubleshooting assistant' 
    },
    settings: { 
      title: 'Bonding Server & Agent Settings', 
      subtitle: 'Remote WireGuard relay, local IPC hooks, and preferences' 
    },
  };

  return (
    <header className="sticky top-0 z-30 bg-[#070b14]/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 lg:px-8 py-3 transition-all">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left title & mobile trigger */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenMobileNav}
            className="lg:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {tabTitles[currentTab].title}
              </h1>
              {bondingStatus && (
                <StatusBadge 
                  status={bondingStatus.state} 
                  label={
                    isStage1
                      ? `Stage 1: ${activePrimary === 'wifi' ? 'Wi-Fi Primary' : 'Android USB Primary'}`
                      : (bondingStatus.isRealBackend ? 'Stage 2: Bonded' : 'Stage 2: Simulated')
                  } 
                  size="sm"
                />
              )}
            </div>
            <p className="hidden sm:block text-xs text-slate-400 mt-0.5">
              {tabTitles[currentTab].subtitle}
            </p>
          </div>
        </div>

        {/* Center / Right Controls: Stage 1 / Stage 2 Switcher + Actions */}
        <div className="flex items-center flex-wrap gap-2.5 justify-end">
          {/* Two-Stage Mode Toggle */}
          <div className="p-1 rounded-xl bg-slate-950 border border-slate-800 flex items-center space-x-1 text-xs font-mono">
            <button
              onClick={() => setStage('stage1_failover')}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 font-bold transition-all ${
                isStage1
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Stage 1: Real-time monitoring and automatic failover without a remote VPS"
            >
              <Repeat className="w-3.5 h-3.5" />
              <span>Stage 1: Failover</span>
            </button>

            <button
              onClick={() => setStage('stage2_bonding')}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 font-bold transition-all ${
                !isStage1
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Stage 2: True channel bonding with remote server reassembly"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Stage 2: Bonding</span>
            </button>
          </div>

          {/* Quick Active Speed Burst Test */}
          <button
            onClick={handleSpeedTest}
            disabled={isMeasuringSpeed}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 flex items-center space-x-1.5 transition-all disabled:opacity-50"
            title="Download test burst to measure actual current Mbps"
          >
            <Gauge className={`w-3.5 h-3.5 text-cyan-400 ${isMeasuringSpeed ? 'animate-spin' : ''}`} />
            <span>{isMeasuringSpeed ? 'Measuring...' : speedTestResult ? `Burst: ${speedTestResult}` : 'Measure Speed'}</span>
          </button>

          {/* In Stage 1: Quick Manual Failover Switch Button */}
          {isStage1 && (
            <button
              onClick={triggerManualFailover}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 flex items-center space-x-1.5 transition-all shadow-[0_0_10px_rgba(245,158,11,0.15)]"
              title="Switch default route between Wi-Fi and Android USB"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
              <span>Switch Route</span>
            </button>
          )}

          {/* Connect / Disconnect */}
          {isBonded ? (
            <button
              onClick={disconnectBonding}
              disabled={isConnecting}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 active:scale-95 transition-all shadow-[0_0_12px_rgba(244,63,94,0.15)] disabled:opacity-50 flex items-center space-x-1.5"
            >
              {isConnecting ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-400" /> : <Power className="w-3.5 h-3.5 text-rose-400" />}
              <span>Disconnect</span>
            </button>
          ) : (
            <button
              onClick={connectBonding}
              disabled={isConnecting}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 active:scale-95 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:opacity-50 flex items-center space-x-1.5"
            >
              {isConnecting ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" /> : <Zap className="w-3.5 h-3.5 text-white" />}
              <span>Connect</span>
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Status / Mode Banner */}
      <div className="mt-2.5 px-3 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-300 gap-2">
        <div className="flex items-center space-x-2">
          {isStage1 ? (
            <>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span>
                <strong>Stage 1 Active:</strong> Real-time monitoring & automatic failover. Active default gateway is <span className="font-bold text-cyan-300">{activePrimary === 'wifi' ? 'Wi-Fi 6 (10.42.202.192)' : 'Android USB Tethering (192.168.42.88)'}</span>.
              </span>
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse shrink-0" />
              <span>
                <strong>Stage 2 Active:</strong> True Multipath Channel Bonding. Packets are aggregated across Wi-Fi & USB and reassembled via remote VPS relay.
              </span>
            </>
          )}
        </div>

        <div className="flex items-center space-x-3 text-slate-400 font-mono text-[10px]">
          <span>Agent: <strong className={agentOnline ? 'text-emerald-400' : 'text-amber-400'}>{agentOnline ? 'Online (Port 58432)' : 'Simulated RPC'}</strong></span>
          <button 
            onClick={refreshAgentStatus} 
            className="hover:text-cyan-300 underline flex items-center space-x-1"
            title="Probe Windows Agent"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Probe</span>
          </button>
        </div>
      </div>
    </header>
  );
};
