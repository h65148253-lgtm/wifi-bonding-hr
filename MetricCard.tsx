import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  subValue?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendText?: string;
  color?: 'cyan' | 'blue' | 'emerald' | 'amber' | 'purple';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subValue,
  icon: Icon,
  trend,
  trendText,
  color = 'cyan',
}) => {
  const colorMap = {
    cyan: {
      border: 'border-cyan-500/20 hover:border-cyan-500/40',
      iconBg: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
      glow: 'group-hover:shadow-[0_0_25px_rgba(6,182,212,0.15)]',
      accent: 'text-cyan-400',
    },
    blue: {
      border: 'border-blue-500/20 hover:border-blue-500/40',
      iconBg: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      glow: 'group-hover:shadow-[0_0_25px_rgba(59,130,246,0.15)]',
      accent: 'text-blue-400',
    },
    emerald: {
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      glow: 'group-hover:shadow-[0_0_25px_rgba(16,185,129,0.15)]',
      accent: 'text-emerald-400',
    },
    amber: {
      border: 'border-amber-500/20 hover:border-amber-500/40',
      iconBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      glow: 'group-hover:shadow-[0_0_25px_rgba(245,158,11,0.15)]',
      accent: 'text-amber-400',
    },
    purple: {
      border: 'border-indigo-500/20 hover:border-indigo-500/40',
      iconBg: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
      glow: 'group-hover:shadow-[0_0_25px_rgba(99,102,241,0.15)]',
      accent: 'text-indigo-400',
    },
  };

  const scheme = colorMap[color];

  return (
    <div className={`group relative rounded-xl bg-slate-900/70 backdrop-blur-md p-5 border transition-all duration-300 ${scheme.border} ${scheme.glow}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
        <div className={`p-2 rounded-lg transition-transform duration-300 group-hover:scale-110 ${scheme.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      
      <div className="flex items-baseline space-x-2">
        <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-mono">{value}</span>
      </div>

      {(subValue || trendText) && (
        <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
          {subValue && <span>{subValue}</span>}
          {trendText && (
            <span className={`inline-flex items-center font-medium ${trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : 'text-slate-400'}`}>
              {trendText}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

