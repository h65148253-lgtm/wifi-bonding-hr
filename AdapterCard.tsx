import React from 'react';
import { NetworkAdapter } from '../../types';
import { 
  Wifi, 
  Smartphone, 
  ArrowDown, 
  ArrowUp, 
  Clock, 
  Percent, 
  ToggleLeft, 
  ToggleRight,
  Shield,
  Radio
} from 'lucide-react';
import { formatSpeed, formatLatency } from '../../utils/formatters';

interface AdapterCardProps {
  adapter: NetworkAdapter;
  onToggle: (state?: boolean) => void;
  loadSharePct: number;
}

export const AdapterCard: React.FC<AdapterCardProps> = ({ adapter, onToggle, loadSharePct }) => {
  const isWifi = adapter.type === 'wifi';
  const isConnected = adapter.enabled && adapter.status === 'connected';

  const accentColor = isWifi 
    ? {
        border: isConnected ? 'border-emerald-500/30 hover:border-emerald-500/50' : 'border-slate-800',
        badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        bar: 'bg-emerald-500',
        glow: isConnected ? 'shadow-[0_0_20px_rgba(16,185,129,0.1)]' : '',
        icon: Wifi,
      }
    : {
        border: isConnected ? 'border-cyan-500/30 hover:border-cyan-500/50' : 'border-slate-800',
        badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
        bar: 'bg-cyan-500',
        glow: isConnected ? 'shadow-[0_0_20px_rgba(6,182,212,0.1)]' : '',
        icon: Smartphone,
      };

  const Icon = accentColor.icon;

  return (
    <div className={`rounded-2xl bg-slate-900/60 border p-5 backdrop-blur-md transition-all duration-300 ${accentColor.border} ${accentColor.glow}`}>
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/60">
        <div className="flex items-center space-x-3">
          <div className={`p-2.5 rounded-xl border ${accentColor.badge}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white tracking-wide">{adapter.displayName}</h3>
              {adapter.isPrimaryRoute && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  PRIMARY ROUTE
                </span>
              )}
              {adapter.status === 'standby' && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  HOT STANDBY
                </span>
              )}
              <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : (adapter.status === 'standby' ? 'bg-amber-400' : 'bg-slate-600')}`} />
            </div>
            <p className="text-xs text-slate-400 truncate max-w-[200px] sm:max-w-[260px]">{adapter.name}</p>
          </div>
        </div>

        {/* Toggle switch for simulated disconnect / reconnect */}
        <button
          onClick={() => onToggle()}
          title={isConnected ? 'Simulate Disconnect' : 'Reconnect Path'}
          className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors p-1"
        >
          {isConnected ? (
            <ToggleRight className="w-7 h-7 text-cyan-400 transition-transform active:scale-95" />
          ) : (
            <ToggleLeft className="w-7 h-7 text-slate-600 transition-transform active:scale-95" />
          )}
        </button>
      </div>

      {/* Network metadata */}
      <div className="grid grid-cols-2 gap-3 my-4 text-xs font-mono">
        <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
          <span className="text-[10px] uppercase text-slate-400 block mb-0.5">Network / SSID</span>
          <span className="text-slate-200 font-medium truncate block">{adapter.networkName}</span>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
          <span className="text-[10px] uppercase text-slate-400 block mb-0.5">Band / Tech</span>
          <span className="text-cyan-300 font-medium truncate block">{adapter.frequencyOrBand}</span>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
          <span className="text-[10px] uppercase text-slate-400 block mb-0.5">Interface IP</span>
          <span className="text-slate-300 truncate block">{adapter.ipAddress}</span>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
          <span className="text-[10px] uppercase text-slate-400 block mb-0.5">Path Latency</span>
          <span className="text-amber-400 font-bold block">{isConnected ? formatLatency(adapter.latencyMs) : 'Offline'}</span>
        </div>
      </div>

      {/* Speed gauges */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
            <ArrowDown className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase text-slate-400 block font-medium">Download</span>
            <span className="text-base font-bold font-mono text-white">
              {isConnected ? formatSpeed(adapter.currentDownloadMbps) : '0.0 Mbps'}
            </span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
            <ArrowUp className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase text-slate-400 block font-medium">Upload</span>
            <span className="text-base font-bold font-mono text-white">
              {isConnected ? formatSpeed(adapter.currentUploadMbps) : '0.0 Mbps'}
            </span>
          </div>
        </div>
      </div>

      {/* Traffic Share Percentage Bar */}
      <div>
        <div className="flex justify-between items-center text-xs mb-1.5">
          <span className="text-slate-400 font-medium">Bonding Traffic Allocation</span>
          <span className="font-mono text-cyan-300 font-bold">{isConnected ? `${loadSharePct}%` : '0%'}</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div 
            className={`h-1.5 rounded-full transition-all duration-500 ${accentColor.bar}`}
            style={{ width: `${isConnected ? loadSharePct : 0}%` }}
          />
        </div>
      </div>
    </div>
  );
};

