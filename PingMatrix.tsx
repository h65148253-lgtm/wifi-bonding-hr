import React from 'react';
import { DiagnosticsResult } from '../../types';
import { 
  Play, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Activity, 
  Gauge, 
  ShieldCheck, 
  Wifi, 
  Smartphone,
  Server
} from 'lucide-react';
import { formatLatency } from '../../utils/formatters';

interface PingMatrixProps {
  diagnostics: DiagnosticsResult | null;
  onRunTest: () => void;
}

export const PingMatrix: React.FC<PingMatrixProps> = ({ diagnostics, onRunTest }) => {
  const isRunning = diagnostics?.running;

  return (
    <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-6 backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-800/60 gap-3">
        <div>
          <h3 className="text-base font-bold text-white tracking-wide">Multi-Path Diagnostic Benchmark</h3>
          <p className="text-xs text-slate-400">Measure round-trip time, jitter, bufferbloat and MTU integrity</p>
        </div>

        <button
          onClick={onRunTest}
          disabled={isRunning}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 active:scale-95 transition-all shadow-[0_0_15px_rgba(6,182,212,0.25)] disabled:opacity-50"
        >
          {isRunning ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4 fill-white" />
          )}
          <span>{isRunning ? 'Running Diagnostic Sweep...' : 'Run Diagnostics'}</span>
        </button>
      </div>

      {/* Latency Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
        {/* Wi-Fi Path Ping */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-emerald-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium flex items-center space-x-1.5">
              <Wifi className="w-4 h-4 text-emerald-400" />
              <span>Wi-Fi 6 RTT</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Subflow 0</span>
          </div>
          <div className="flex items-baseline space-x-1 font-mono">
            <span className="text-2xl font-bold text-white">
              {diagnostics ? (diagnostics.wifiPing < 999 ? diagnostics.wifiPing.toFixed(1) : 'Offline') : '19.4'}
            </span>
            <span className="text-xs text-slate-400">ms</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">Target: Cloudflare DNS (1.1.1.1)</span>
        </div>

        {/* USB Tether Path Ping */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-cyan-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium flex items-center space-x-1.5">
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <span>Android 5G USB RTT</span>
            </span>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">Subflow 1</span>
          </div>
          <div className="flex items-baseline space-x-1 font-mono">
            <span className="text-2xl font-bold text-white">
              {diagnostics ? (diagnostics.usbPing < 999 ? diagnostics.usbPing.toFixed(1) : 'Offline') : '31.8'}
            </span>
            <span className="text-xs text-slate-400">ms</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">Target: Google DNS (8.8.8.8)</span>
        </div>

        {/* Bonded Aggregated Path Ping */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-950/40 to-blue-950/30 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-cyan-300 font-bold flex items-center space-x-1.5">
              <Server className="w-4 h-4 text-cyan-400" />
              <span>Bonded Tunnel Egress</span>
            </span>
            <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded font-bold">Fastest Path</span>
          </div>
          <div className="flex items-baseline space-x-1 font-mono">
            <span className="text-2xl font-black text-white">
              {diagnostics ? diagnostics.bondedPing.toFixed(1) : '18.2'}
            </span>
            <span className="text-xs text-cyan-300">ms</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">Target: VPS Bonding Relay</span>
        </div>
      </div>

      {/* Advanced Telemetry Scores */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800">
          <span className="text-[10px] uppercase text-slate-400 block mb-0.5">Bufferbloat Rating</span>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-lg font-bold font-mono text-emerald-400">
              {diagnostics ? diagnostics.bufferbloatGrade : 'A+'}
            </span>
            <span className="text-[10px] text-slate-400">(&lt; 5ms bloat)</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800">
          <span className="text-[10px] uppercase text-slate-400 block mb-0.5">Jitter Variance</span>
          <span className="text-lg font-bold font-mono text-cyan-300">
            {diagnostics ? `${diagnostics.jitterMs} ms` : '1.8 ms'}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800">
          <span className="text-[10px] uppercase text-slate-400 block mb-0.5">Packet Loss (FEC)</span>
          <span className="text-lg font-bold font-mono text-emerald-400">
            {diagnostics ? `${diagnostics.packetLossPct.toFixed(2)}%` : '0.00%'}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800">
          <span className="text-[10px] uppercase text-slate-400 block mb-0.5">DNS Resolution</span>
          <span className="text-lg font-bold font-mono text-slate-200">
            {diagnostics ? `${diagnostics.dnsResolutionMs.toFixed(1)} ms` : '14.2 ms'}
          </span>
        </div>
      </div>

      {/* Path MTU Status */}
      <div className="mt-4 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-slate-300">
            Path MTU: <strong className="text-white">{diagnostics ? diagnostics.mtuTestResult : 'Pass (1500 bytes unfragmented, WireGuard payload clamped to 1420)'}</strong>
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">MSS: 1380</span>
      </div>
    </div>
  );
};

