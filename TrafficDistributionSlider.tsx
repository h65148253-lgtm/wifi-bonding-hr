import React from 'react';
import { BondingStatus, BondingMode } from '../../types';
import { 
  Zap, 
  ShieldAlert, 
  Repeat, 
  Shield, 
  Sliders, 
  Wifi, 
  Smartphone,
  Cpu,
  Layers
} from 'lucide-react';

interface TrafficDistributionSliderProps {
  bonding: BondingStatus;
  onSetMode: (mode: BondingMode) => void;
  onSetRatio: (wifi: number, usb: number) => void;
}

export const TrafficDistributionSlider: React.FC<TrafficDistributionSliderProps> = ({
  bonding,
  onSetMode,
  onSetRatio,
}) => {
  const modes: { id: BondingMode; title: string; subtitle: string; icon: any }[] = [
    {
      id: 'dynamic_ratio',
      title: 'Dynamic Weighted Ratio',
      subtitle: 'Automatically balances traffic proportional to measured interface speeds and latency.',
      icon: Zap,
    },
    {
      id: 'round_robin',
      title: 'Round-Robin Striping',
      subtitle: 'Alternates individual packet transmissions across both paths for peak single-stream speed.',
      icon: Repeat,
    },
    {
      id: 'redundant',
      title: 'Redundant (Reliability Mode)',
      subtitle: 'Duplicates every packet on both Wi-Fi & USB. Zero packet loss, lowest jitter for gaming & calls.',
      icon: Shield,
    },
    {
      id: 'active_backup',
      title: 'Active-Backup (Data Saver)',
      subtitle: 'Routes 100% via Wi-Fi; instantly fails over to Android USB cellular if Wi-Fi degrades.',
      icon: ShieldAlert,
    },
  ];

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const wifi = parseInt(e.target.value, 10);
    const usb = 100 - wifi;
    onSetRatio(wifi, usb);
  };

  const applyPreset = (wifi: number, usb: number) => {
    onSetRatio(wifi, usb);
  };

  return (
    <div className="space-y-6">
      {/* Mode Selection Cards */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-6 backdrop-blur-md">
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-800/60 mb-5">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">Bonding Aggregation Strategy</h3>
            <p className="text-xs text-slate-400">Select packet scheduling algorithm for the local Windows agent</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modes.map((m) => {
            const Icon = m.icon;
            const isSelected = bonding.mode === m.id;
            return (
              <div
                key={m.id}
                onClick={() => onSetMode(m.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'bg-gradient-to-br from-cyan-950/50 via-slate-900 to-blue-950/40 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/50'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2.5">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-white">{m.title}</span>
                  </div>
                  <span className={`h-3 w-3 rounded-full border-2 ${
                    isSelected ? 'border-cyan-400 bg-cyan-400' : 'border-slate-600'
                  }`} />
                </div>
                <p className="text-xs text-slate-400 pl-9 leading-relaxed">{m.subtitle}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Manual Traffic Ratio Slider (active in dynamic_ratio and custom) */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-6 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/60 mb-5 gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">Traffic Distribution Weight</h3>
              <p className="text-xs text-slate-400">Fine-tune egress packet allocation ratio between links</p>
            </div>
          </div>

          {/* Quick presets */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => applyPreset(50, 50)}
              className="px-2.5 py-1 text-xs font-mono rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            >
              50 / 50 Balanced
            </button>
            <button
              onClick={() => applyPreset(70, 30)}
              className="px-2.5 py-1 text-xs font-mono rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            >
              70 / 30 Standard
            </button>
            <button
              onClick={() => applyPreset(90, 10)}
              className="px-2.5 py-1 text-xs font-mono rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            >
              90 / 10 Cellular Saver
            </button>
          </div>
        </div>

        {/* Current split readout */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Wifi className="w-5 h-5 text-emerald-400" />
              <div>
                <span className="text-xs uppercase text-slate-400 font-bold block">Wi-Fi 6 Subflow</span>
                <span className="text-xs text-slate-400">Primary laptop path</span>
              </div>
            </div>
            <span className="text-2xl font-black font-mono text-emerald-400">{bonding.trafficRatio.wifi}%</span>
          </div>

          <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Smartphone className="w-5 h-5 text-cyan-400" />
              <div>
                <span className="text-xs uppercase text-slate-400 font-bold block">Android USB Subflow</span>
                <span className="text-xs text-slate-400">Mobile tethering path</span>
              </div>
            </div>
            <span className="text-2xl font-black font-mono text-cyan-400">{bonding.trafficRatio.usb}%</span>
          </div>
        </div>

        {/* Slider Input */}
        <div className="space-y-3">
          <input
            type="range"
            min="0"
            max="100"
            value={bonding.trafficRatio.wifi}
            onChange={handleSliderChange}
            disabled={bonding.mode === 'redundant' || bonding.mode === 'active_backup'}
            className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 disabled:opacity-40"
          />
          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span>0% Wi-Fi / 100% USB</span>
            <span>50% / 50%</span>
            <span>100% Wi-Fi / 0% USB</span>
          </div>
        </div>
      </div>
    </div>
  );
};

