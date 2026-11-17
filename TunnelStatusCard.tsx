import React from 'react';
import { BondingStatus } from '../../types';
import { 
  ShieldCheck, 
  Server, 
  Layers, 
  Cpu, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Clock
} from 'lucide-react';
import { formatUptime, formatLatency } from '../../utils/formatters';

interface TunnelStatusCardProps {
  bonding: BondingStatus;
}

export const TunnelStatusCard: React.FC<TunnelStatusCardProps> = ({ bonding }) => {
  const isConnected = bonding.tunnel.connected;

  return (
    <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-5 backdrop-blur-md">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/60">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">Multipath Bonding Tunnel</h3>
            <p className="text-xs text-slate-400">Remote encapsulation tunnel & packet reassembly</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {bonding.dualPathVerified ? (
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Dual-Path Verified</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-950/60 border border-amber-500/30 text-amber-300">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Single Path Active</span>
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <span className="text-[10px] uppercase text-slate-400 block mb-1">Tunnel Protocol</span>
          <span className="text-xs font-mono font-bold text-cyan-300">{bonding.tunnel.protocol}</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <span className="text-[10px] uppercase text-slate-400 block mb-1">Relay Endpoint</span>
          <span className="text-xs font-mono text-slate-200 truncate block">{bonding.tunnel.serverEndpoint}</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <span className="text-[10px] uppercase text-slate-400 block mb-1">Re-seq Buffer</span>
          <span className="text-xs font-mono text-emerald-400 font-bold">{bonding.tunnel.reorderingBufferSizeKb} KB</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <span className="text-[10px] uppercase text-slate-400 block mb-1">Tunnel Uptime</span>
          <span className="text-xs font-mono text-slate-200">{formatUptime(bonding.uptimeSeconds)}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60 gap-2">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Encryption: <strong className="text-slate-200">{bonding.tunnel.encryption}</strong></span>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Last Handshake: <strong className="text-slate-200">{bonding.tunnel.handshakeTimeAgo}</strong></span>
        </div>
      </div>
    </div>
  );
};

