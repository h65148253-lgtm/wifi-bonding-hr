import React from 'react';
import { BondingOverallState, AdapterStatus } from '../../types';

interface StatusBadgeProps {
  status: BondingOverallState | AdapterStatus | 'online' | 'offline' | 'warning';
  label?: string;
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  label, 
  size = 'md',
  pulse = true
}) => {
  let bg = 'bg-slate-800/80 border-slate-700 text-slate-300';
  let dotBg = 'bg-slate-400';
  let displayLabel = label || status;

  switch (status) {
    case 'bonded':
      bg = 'bg-emerald-950/50 border-emerald-500/30 text-emerald-400';
      dotBg = 'bg-emerald-400';
      displayLabel = label || 'Bonded & Active';
      break;
    case 'failover_active':
      bg = 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300';
      dotBg = 'bg-cyan-400';
      displayLabel = label || 'Failover Active';
      break;
    case 'standby':
      bg = 'bg-slate-900 border-slate-700 text-slate-300';
      dotBg = 'bg-amber-400';
      displayLabel = label || 'Hot Standby';
      break;
    case 'connected':
    case 'online':
      bg = 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300';
      dotBg = 'bg-cyan-400';
      displayLabel = label || 'Connected';
      break;
    case 'simulated':
      bg = 'bg-sky-950/60 border-sky-400/40 text-sky-300';
      dotBg = 'bg-sky-400';
      displayLabel = label || 'Simulated (Demo Mode)';
      break;
    case 'degraded':
      bg = 'bg-amber-950/50 border-amber-500/40 text-amber-300';
      dotBg = 'bg-amber-400';
      displayLabel = label || 'Degraded (Single Path)';
      break;
    case 'connecting':
      bg = 'bg-blue-950/50 border-blue-500/40 text-blue-300';
      dotBg = 'bg-blue-400';
      displayLabel = label || 'Connecting...';
      break;
    case 'disconnected':
    case 'offline':
    case 'error':
      bg = 'bg-rose-950/50 border-rose-500/30 text-rose-400';
      dotBg = 'bg-rose-500';
      displayLabel = label || 'Disconnected';
      break;
  }

  const sizeClasses = size === 'sm' 
    ? 'text-xs px-2 py-0.5 space-x-1.5' 
    : 'text-xs font-medium px-2.5 py-1 space-x-2';

  return (
    <span className={`inline-flex items-center rounded-full border shadow-sm backdrop-blur-sm transition-all duration-300 ${sizeClasses} ${bg}`}>
      <span className="relative flex h-2 w-2">
        {pulse && (status === 'bonded' || status === 'simulated' || status === 'connected') && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotBg}`}></span>
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dotBg}`}></span>
      </span>
      <span className="capitalize tracking-wide">{displayLabel}</span>
    </span>
  );
};

