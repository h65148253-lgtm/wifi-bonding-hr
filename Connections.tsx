import React from 'react';
import { useNetwork } from '../context/NetworkContext';
import { InterfaceDetailCard } from '../components/connections/InterfaceDetailCard';
import { Network, PlusCircle, RefreshCw, Cpu, Layers } from 'lucide-react';

export const Connections: React.FC = () => {
  const { adapters, toggleAdapter } = useNetwork();

  const wifiAdapter = adapters.find(a => a.type === 'wifi');
  const usbAdapter = adapters.find(a => a.type === 'usb_tether');

  return (
    <div className="space-y-6">
      {/* Intro banner */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Network className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">Heterogeneous Interface Management</h2>
            <p className="text-xs text-slate-400">
              Aggregating 1&times; Laptop Built-in Wi-Fi 6 Adapter + 1&times; Android Phone USB Tethering (RNDIS)
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span>Active Paths: <strong className="text-white">{adapters.filter(a => a.enabled).length} / 2</strong></span>
        </div>
      </div>

      {/* Interface Detail Cards (Wi-Fi and Android USB Tethering) */}
      <div className="space-y-6">
        {wifiAdapter && (
          <InterfaceDetailCard
            adapter={wifiAdapter}
            onToggle={(state) => toggleAdapter('wifi', state)}
          />
        )}

        {usbAdapter && (
          <InterfaceDetailCard
            adapter={usbAdapter}
            onToggle={(state) => toggleAdapter('usb_tether', state)}
          />
        )}
      </div>
    </div>
  );
};

