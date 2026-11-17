import React, { useState } from 'react';
import { NetworkLog, LogLevel, LogSource } from '../../types';
import { 
  Terminal, 
  Search, 
  Trash2, 
  Download, 
  Filter, 
  AlertCircle, 
  CheckCircle, 
  Info, 
  AlertTriangle 
} from 'lucide-react';

interface LogViewerProps {
  logs: NetworkLog[];
  onClear: () => void;
}

export const LogViewer: React.FC<LogViewerProps> = ({ logs, onClear }) => {
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredLogs = logs.filter((log) => {
    const matchesLevel = filterLevel === 'all' || log.level === filterLevel;
    const matchesQuery = searchQuery === '' || 
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.details && log.details.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesLevel && matchesQuery;
  });

  const getLevelBadge = (level: LogLevel) => {
    switch (level) {
      case 'info':
        return <span className="text-cyan-400 font-mono text-[10px] bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">INFO</span>;
      case 'success':
        return <span className="text-emerald-400 font-mono text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">SUCCESS</span>;
      case 'warn':
        return <span className="text-amber-400 font-mono text-[10px] bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">WARN</span>;
      case 'error':
        return <span className="text-rose-400 font-mono text-[10px] bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">ERROR</span>;
    }
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `plexlink_logs_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-6 backdrop-blur-md">
      {/* Header with Search and Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-slate-800/60 gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">Network Event Log Stream</h3>
            <p className="text-xs text-slate-400">Diagnostic traces from Windows driver hook and MPTCP tunnel</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExport}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs flex items-center space-x-1.5 transition-colors"
            title="Export JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={onClear}
            className="p-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-500/30 text-xs flex items-center space-x-1.5 transition-colors"
            title="Clear Event Log"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 my-4">
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search log messages..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        {/* Level Filters */}
        <div className="flex items-center space-x-1 text-xs w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['all', 'info', 'success', 'warn', 'error'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterLevel(lvl)}
              className={`px-3 py-1 rounded-md uppercase font-mono text-[10px] font-semibold transition-all ${
                filterLevel === lvl
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Terminal Output Console */}
      <div className="h-80 overflow-y-auto rounded-xl bg-slate-950 border border-slate-800/90 p-4 font-mono text-xs space-y-2.5 shadow-inner">
        {filteredLogs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-xs">
            No log events matching current criteria
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="flex flex-col sm:flex-row sm:items-start space-y-1 sm:space-y-0 sm:space-x-3 pb-2 border-b border-slate-900/80 last:border-0 hover:bg-slate-900/30 px-2 py-1 rounded transition-colors">
              <span className="text-slate-400 text-[11px] shrink-0">{log.timestamp}</span>
              <div className="shrink-0 flex items-center space-x-2">
                {getLevelBadge(log.level)}
                <span className="text-[10px] text-slate-400 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                  {log.source}
                </span>
              </div>
              <div className="flex-1">
                <span className="text-slate-200 block">{log.message}</span>
                {log.details && (
                  <span className="text-slate-400 text-[11px] block mt-0.5">{log.details}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

