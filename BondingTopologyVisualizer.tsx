import React from 'react';
import { 
  Laptop, 
  Wifi, 
  Smartphone, 
  Server, 
  Globe, 
  Radio, 
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { BondingStatus, NetworkAdapter } from '../../types';

interface BondingTopologyVisualizerProps {
  bonding: BondingStatus;
  adapters: NetworkAdapter[];
}

export const BondingTopologyVisualizer: React.FC<BondingTopologyVisualizerProps> = ({
  bonding,
  adapters,
}) => {
  const wifi = adapters.find(a => a.type === 'wifi');
  const usb = adapters.find(a => a.type === 'usb_tether');

  const wifiActive = wifi?.enabled && wifi?.status === 'connected';
  const usbActive = usb?.enabled && usb?.status === 'connected';

  return (
    <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-6 backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-800/60 gap-2">
        <div>
          <h3 className="text-base font-bold text-white tracking-wide">Multi-Path Channel Bonding Topology</h3>
          <p className="text-xs text-slate-400">Packet aggregation across heterogeneous network interfaces</p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="text-slate-400">Mode:</span>
          <span className="px-2.5 py-1 rounded-md bg-cyan-950/50 border border-cyan-500/30 text-cyan-300 font-bold uppercase">
            {bonding.mode.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Visual Diagram */}
      <div className="py-8 px-2 sm:px-6 overflow-x-auto">
        <div className="min-w-[700px] flex items-center justify-between relative">
          
          {/* Node 1: Laptop Client */}
          <div className="flex flex-col items-center z-10">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/90 border border-slate-700 flex items-center justify-center shadow-lg group hover:border-cyan-500 transition-all">
              <Laptop className="w-8 h-8 text-slate-200 group-hover:text-cyan-400 transition-colors" />
            </div>
            <span className="text-xs font-bold text-white mt-2">Windows Laptop</span>
            <span className="text-[10px] font-mono text-slate-400">Host OS Sockets</span>
          </div>

          {/* Connection Lines & Aggregator Hub */}
          <div className="flex-1 flex flex-col justify-center px-4 relative">
            
            {/* Top Branch: Built-in Wi-Fi Path */}
            <div className={`mb-6 p-3 rounded-xl border transition-all duration-300 flex items-center justify-between ${
              wifiActive 
                ? 'bg-emerald-950/30 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                : 'bg-slate-950/40 border-slate-800 opacity-50'
            }`}>
              <div className="flex items-center space-x-2.5">
                <div className={`p-2 rounded-lg ${wifiActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                  <Wifi className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <span>Path 1: Built-in Wi-Fi 6</span>
                    {wifiActive && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{wifi?.networkName} ({wifi?.frequencyOrBand})</span>
                </div>
              </div>

              <div className="text-right font-mono">
                <span className="text-xs font-bold text-emerald-400">{wifiActive ? `${wifi?.currentDownloadMbps} Mbps` : '0 Mbps'}</span>
                <span className="text-[10px] text-slate-400 block">{bonding.trafficRatio.wifi}% split</span>
              </div>
            </div>

            {/* Bottom Branch: Android Phone USB Tethering Path */}
            <div className={`p-3 rounded-xl border transition-all duration-300 flex items-center justify-between ${
              usbActive 
                ? 'bg-cyan-950/30 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)]' 
                : 'bg-slate-950/40 border-slate-800 opacity-50'
            }`}>
              <div className="flex items-center space-x-2.5">
                <div className={`p-2 rounded-lg ${usbActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-500'}`}>
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <span>Path 2: Android USB Tethering</span>
                    {usbActive && <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{usb?.networkName} ({usb?.frequencyOrBand})</span>
                </div>
              </div>

              <div className="text-right font-mono">
                <span className="text-xs font-bold text-cyan-400">{usbActive ? `${usb?.currentDownloadMbps} Mbps` : '0 Mbps'}</span>
                <span className="text-[10px] text-slate-400 block">{bonding.trafficRatio.usb}% split</span>
              </div>
            </div>
          </div>

          {/* Node 2: Remote Bonding Relay VPS */}
          <div className="flex flex-col items-center z-10 px-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-900/60 to-indigo-950/80 border border-blue-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.2)]">
              <Server className="w-8 h-8 text-cyan-300" />
            </div>
            <span className="text-xs font-bold text-white mt-2">Bonding VPS Relay</span>
            <span className="text-[10px] font-mono text-cyan-400">144.24.112.50</span>
          </div>

          {/* Node 3: Target Internet */}
          <div className="flex flex-col items-center z-10">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/90 border border-slate-700 flex items-center justify-center shadow-lg">
              <Globe className="w-8 h-8 text-emerald-400" />
            </div>
            <span className="text-xs font-bold text-white mt-2">Global Internet</span>
            <span className="text-[10px] font-mono text-slate-400">Single Public IP</span>
          </div>
        </div>
      </div>

      {/* Feature Explanations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-slate-800/60 text-xs">
        <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80">
          <span className="font-bold text-cyan-300 block mb-1">Additive Throughput</span>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Downloads & streams leverage both Wi-Fi and 5G cellular paths concurrently for cumulative bandwidth.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80">
          <span className="font-bold text-emerald-300 block mb-1">Seamless 0-ms Failover</span>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            If Wi-Fi drops out or phone is unplugged, active connections continue uninterrupted on the surviving path.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80">
          <span className="font-bold text-blue-300 block mb-1">Packet Re-Sequencing</span>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Jitter compensation engine re-orders out-of-order packets at the tunnel endpoint to prevent TCP head-of-line blocking.
          </p>
        </div>
      </div>
    </div>
  );
};

