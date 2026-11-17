import React from 'react';
import { 
  Repeat, 
  Wifi, 
  Smartphone, 
  ArrowRightLeft, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Sliders, 
  Zap,
  Activity
} from 'lucide-react';
import { useNetwork } from '../../context/NetworkContext';

export const FailoverControlCard: React.FC = () => {
  const { 
    bondingStatus, 
    triggerManualFailover, 
    updateFailoverPolicy, 
    toggleAdapter,
    adapters 
  } = useNetwork();

  const failover = bondingStatus?.failover;
  const isWifiPrimary = failover?.activePrimary === 'wifi';
  const wifi = adapters.find(a => a.type === 'wifi');
  const usb = adapters.find(a => a.type === 'usb_tether');

  if (!failover) return null;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-cyan-950/20 border border-slate-800/80 p-5 backdrop-blur-md shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/60 gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Repeat className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white tracking-wide">Stage 1 Automatic Failover Controller</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400">Zero-downtime gateway metric failover between Wi-Fi and Android USB</p>
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => triggerManualFailover()}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/25 active:scale-95 transition-all flex items-center space-x-1.5 shadow-[0_0_12px_rgba(6,182,212,0.15)]"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Switch Primary Link</span>
          </button>
        </div>
      </div>

      {/* Main Path Diagram: Active Route vs Standby Backup */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-5">
        {/* Primary Route */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/40 relative overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.1)]">
          <div className="absolute top-0 right-0 bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold px-3 py-1 rounded-bl-lg border-l border-b border-cyan-500/30">
            PRIMARY DEFAULT GATEWAY
          </div>

          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-300">
              {isWifiPrimary ? <Wifi className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
            </div>
            <div>
              <span className="text-sm font-bold text-white block">
                {isWifiPrimary ? 'Wi-Fi 6 PCI-E Interface' : 'Android USB Tethering (RNDIS)'}
              </span>
              <span className="text-xs font-mono text-cyan-400">
                {isWifiPrimary ? wifi?.ipAddress : (usb?.ipAddress || '192.168.42.88')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-900 text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Routing Metric</span>
              <span className="text-emerald-400 font-bold">10 (Lowest)</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Path Latency</span>
              <span className="text-white font-bold">{isWifiPrimary ? wifi?.latencyMs : usb?.latencyMs} ms</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Current Rate</span>
              <span className="text-cyan-300 font-bold">{isWifiPrimary ? wifi?.currentDownloadMbps : usb?.currentDownloadMbps} M</span>
            </div>
          </div>
        </div>

        {/* Hot Standby Backup */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-slate-800 text-slate-400 text-[10px] font-mono font-bold px-3 py-1 rounded-bl-lg border-l border-b border-slate-700">
            HOT STANDBY BACKUP
          </div>

          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 rounded-lg bg-slate-800 text-slate-400">
              {!isWifiPrimary ? <Wifi className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
            </div>
            <div>
              <span className="text-sm font-bold text-slate-300 block">
                {!isWifiPrimary ? 'Wi-Fi 6 PCI-E Interface' : 'Android USB Tethering (RNDIS)'}
              </span>
              <span className="text-xs font-mono text-slate-400">
                {!isWifiPrimary ? wifi?.ipAddress : (usb?.ipAddress || 'Waiting for USB Plug')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-900 text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Routing Metric</span>
              <span className="text-slate-400 font-bold">55 (Standby)</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Heartbeat</span>
              <span className="text-emerald-400 font-bold flex items-center space-x-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>Ready</span>
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Switch Delay</span>
              <span className="text-amber-300 font-bold">&lt; 20 ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* Failover Telemetry Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/60 text-xs">
        <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/80">
          <span className="text-[10px] uppercase text-slate-400 block">Total Failover Switches</span>
          <span className="text-base font-bold font-mono text-white">{failover.failoverCount}</span>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/80">
          <span className="text-[10px] uppercase text-slate-400 block">Last Switch Duration</span>
          <span className="text-base font-bold font-mono text-cyan-300">{failover.switchDurationMs} ms</span>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/80">
          <span className="text-[10px] uppercase text-slate-400 block">Watchdog Sensitivity</span>
          <span className="text-base font-bold font-mono text-emerald-400 capitalize">{failover.sensitivity}</span>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/80">
          <span className="text-[10px] uppercase text-slate-400 block">Auto-Revert Policy</span>
          <span className="text-base font-bold font-mono text-slate-300">{failover.autoRevert ? 'Enabled' : 'Manual'}</span>
        </div>
      </div>

      {/* Failover Test Action Banner */}
      <div className="mt-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
        <div className="flex items-center space-x-2 text-slate-300">
          <Activity className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>Test failover behavior: Simulate a link drop to verify sub-second gateway switchover.</span>
        </div>

        <button
          onClick={() => toggleAdapter('wifi')}
          className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-mono font-medium border border-slate-700 shrink-0 transition-colors"
        >
          Simulate Wi-Fi Drop
        </button>
      </div>
    </div>
  );
};

