import React from 'react';
import { NetworkAdapter } from '../../types';
import { 
  Wifi, 
  Smartphone, 
  Power, 
  Radio, 
  ShieldCheck, 
  Cpu, 
  Network, 
  HardDrive, 
  Activity,
  ArrowDown,
  ArrowUp,
  Server,
  Zap
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { formatSpeed, formatBytes, formatLatency } from '../../utils/formatters';

interface InterfaceDetailCardProps {
  adapter: NetworkAdapter;
  onToggle: (state?: boolean) => void;
}

export const InterfaceDetailCard: React.FC<InterfaceDetailCardProps> = ({ adapter, onToggle }) => {
  const isWifi = adapter.type === 'wifi';
  const isConnected = adapter.enabled && adapter.status === 'connected';

  const theme = isWifi
    ? {
        border: isConnected ? 'border-emerald-500/30' : 'border-slate-800',
        iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        badge: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30',
        icon: Wifi,
      }
    : {
        border: isConnected ? 'border-cyan-500/30' : 'border-slate-800',
        iconBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
        badge: 'bg-cyan-950/60 text-cyan-300 border-cyan-500/30',
        icon: Smartphone,
      };

  const Icon = theme.icon;

  return (
    <div className={`rounded-2xl bg-slate-900/60 border p-6 backdrop-blur-md shadow-xl transition-all duration-300 ${theme.border}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-800/80 gap-4">
        <div className="flex items-start sm:items-center space-x-3.5">
          <div className={`p-3 rounded-xl border ${theme.iconBg}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h3 className="text-base font-bold text-white tracking-wide">{adapter.displayName}</h3>
              <StatusBadge status={isConnected ? 'connected' : 'disconnected'} size="sm" />
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{adapter.name}</p>
          </div>
        </div>

        {/* Toggle Action */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onToggle()}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 border transition-all ${
              isConnected
                ? 'bg-rose-500/15 border-rose-500/30 text-rose-300 hover:bg-rose-500/25'
                : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{isConnected ? 'Simulate Disconnect' : 'Enable & Connect'}</span>
          </button>
        </div>
      </div>

      {/* Primary KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold mb-1">
            <span>Download Rate</span>
            <ArrowDown className="w-3 h-3 text-cyan-400" />
          </div>
          <span className="text-lg font-bold font-mono text-white">
            {isConnected ? formatSpeed(adapter.currentDownloadMbps) : '0.0 Mbps'}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Peak: {adapter.peakDownloadMbps} Mbps</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold mb-1">
            <span>Upload Rate</span>
            <ArrowUp className="w-3 h-3 text-blue-400" />
          </div>
          <span className="text-lg font-bold font-mono text-white">
            {isConnected ? formatSpeed(adapter.currentUploadMbps) : '0.0 Mbps'}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Symmetric channel</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold mb-1">
            <span>Path Latency</span>
            <Activity className="w-3 h-3 text-amber-400" />
          </div>
          <span className="text-lg font-bold font-mono text-amber-400">
            {isConnected ? formatLatency(adapter.latencyMs) : 'Offline'}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Jitter: {adapter.jitterMs} ms</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold mb-1">
            <span>Packet Loss</span>
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
          </div>
          <span className={`text-lg font-bold font-mono ${adapter.packetLossPct === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isConnected ? `${adapter.packetLossPct.toFixed(2)}%` : '100%'}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">FEC active</span>
        </div>
      </div>

      {/* Detailed Technical Specs Table */}
      <div className="border border-slate-800/80 rounded-xl overflow-hidden bg-slate-950/40">
        <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
          <Network className="w-3.5 h-3.5 text-cyan-400" />
          <span>Adapter Configuration & TCP/IP Stack</span>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6 text-xs font-mono">
          <div className="flex justify-between py-1.5 border-b border-slate-800/50">
            <span className="text-slate-400">IPv4 Address:</span>
            <span className="text-white font-medium">{adapter.ipAddress}</span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-slate-800/50">
            <span className="text-slate-400">Subnet Mask:</span>
            <span className="text-slate-300">{adapter.subnetMask}</span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-slate-800/50">
            <span className="text-slate-400">Default Gateway:</span>
            <span className="text-slate-300">{adapter.gateway}</span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-slate-800/50">
            <span className="text-slate-400">DNS Servers:</span>
            <span className="text-slate-300">{adapter.dnsServers.join(', ')}</span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-slate-800/50">
            <span className="text-slate-400">Physical (MAC) Address:</span>
            <span className="text-slate-300">{adapter.macAddress}</span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-slate-800/50">
            <span className="text-slate-400">Windows Interface Metric:</span>
            <span className="text-cyan-300 font-bold">{adapter.interfaceMetric} (Managed by PLEXLINK)</span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-slate-800/50">
            <span className="text-slate-400">MTU / Link Payload:</span>
            <span className="text-slate-300">{adapter.mtu} bytes</span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-slate-800/50">
            <span className="text-slate-400">Hardware / Radio Band:</span>
            <span className="text-emerald-400">{adapter.frequencyOrBand}</span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-slate-800/50">
            <span className="text-slate-400">Total Transferred:</span>
            <span className="text-slate-300">
              RX: {formatBytes(adapter.bytesReceived)} | TX: {formatBytes(adapter.bytesSent)}
            </span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-slate-800/50">
            <span className="text-slate-400">Driver Specification:</span>
            <span className="text-slate-400 truncate max-w-[220px]">{adapter.driverVersion}</span>
          </div>
        </div>
      </div>

      {/* Android USB Specific Hardware Tip */}
      {!isWifi && (
        <div className="mt-4 p-3.5 rounded-xl bg-blue-950/30 border border-blue-500/20 text-xs text-blue-200">
          <div className="flex items-center space-x-2 font-semibold text-blue-300 mb-1">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>Android USB-Tethering Hardware Requirements</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            Plug your Android phone into any USB 3.0/3.2 Type-C port and enable <strong>Settings &rarr; Network & internet &rarr; Hotspot & tethering &rarr; USB tethering</strong>. 
            Windows automatically detects it as a standard <em>Remote NDIS (RNDIS)</em> network card. PLEXLINK aggregates this interface alongside your laptop's built-in Wi-Fi adapter without requiring root or extra phone software.
          </p>
        </div>
      )}
    </div>
  );
};

