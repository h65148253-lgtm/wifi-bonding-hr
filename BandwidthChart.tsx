import React, { useState } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from 'recharts';
import { BandwidthDataPoint } from '../../types';
import { Activity, Eye, EyeOff } from 'lucide-react';

interface BandwidthChartProps {
  data: BandwidthDataPoint[];
}

export const BandwidthChart: React.FC<BandwidthChartProps> = ({ data }) => {
  const [showWifi, setShowWifi] = useState(true);
  const [showUsb, setShowUsb] = useState(true);
  const [showCombined, setShowCombined] = useState(true);

  // Custom Dark Cyber Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950/95 border border-cyan-500/30 rounded-lg p-3 shadow-2xl backdrop-blur-md text-xs font-mono space-y-1.5 min-w-[180px]">
          <p className="text-slate-400 font-semibold mb-1 border-b border-slate-800 pb-1">
            Time: <span className="text-slate-200">{label}</span>
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between space-x-3">
              <span className="flex items-center space-x-1.5" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}:</span>
              </span>
              <span className="font-bold text-white">{entry.value} Mbps</span>
            </div>
          ))}
          {payload[0]?.payload?.latency && (
            <div className="pt-1 mt-1 border-t border-slate-800 text-[10px] text-amber-300 flex justify-between">
              <span>Path Latency:</span>
              <span>{payload[0].payload.latency} ms</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-5 backdrop-blur-md shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/60 gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">Live Aggregated Bandwidth Stream</h3>
            <p className="text-xs text-slate-400">Real-time throughput comparison across active subflows</p>
          </div>
        </div>

        {/* Stream toggles */}
        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={() => setShowCombined(!showCombined)}
            className={`px-2.5 py-1 rounded-md font-mono flex items-center space-x-1.5 transition-all border ${
              showCombined 
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300' 
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            {showCombined ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            <span>Combined</span>
          </button>

          <button
            onClick={() => setShowWifi(!showWifi)}
            className={`px-2.5 py-1 rounded-md font-mono flex items-center space-x-1.5 transition-all border ${
              showWifi 
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' 
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            {showWifi ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            <span>Wi-Fi 6</span>
          </button>

          <button
            onClick={() => setShowUsb(!showUsb)}
            className={`px-2.5 py-1 rounded-md font-mono flex items-center space-x-1.5 transition-all border ${
              showUsb 
                ? 'bg-blue-500/15 border-blue-500/40 text-blue-300' 
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            {showUsb ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            <span>Android USB</span>
          </button>
        </div>
      </div>

      {/* Chart container */}
      <div className="h-64 sm:h-72 w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradientTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="gradientWifi" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="gradientUsb" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis 
              dataKey="time" 
              stroke="#64748b" 
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis 
              stroke="#64748b" 
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              unit="M"
            />
            <Tooltip content={<CustomTooltip />} />

            {showCombined && (
              <Area 
                type="monotone" 
                dataKey="totalDownload" 
                name="Combined Bandwidth"
                stroke="#06b6d4" 
                strokeWidth={2.5}
                fillOpacity={1} 
                fill="url(#gradientTotal)" 
                isAnimationActive={false}
              />
            )}

            {showWifi && (
              <Area 
                type="monotone" 
                dataKey="wifiDownload" 
                name="Wi-Fi 6 Subflow"
                stroke="#10b981" 
                strokeWidth={1.8}
                strokeDasharray="4 2"
                fillOpacity={1} 
                fill="url(#gradientWifi)" 
                isAnimationActive={false}
              />
            )}

            {showUsb && (
              <Area 
                type="monotone" 
                dataKey="usbDownload" 
                name="Android USB Subflow"
                stroke="#3b82f6" 
                strokeWidth={1.8}
                fillOpacity={1} 
                fill="url(#gradientUsb)" 
                isAnimationActive={false}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

