import React from 'react';
import { 
  LayoutDashboard, 
  Network, 
  Layers, 
  Activity, 
  Settings, 
  Zap, 
  Wifi, 
  Smartphone,
  ShieldCheck,
  Radio,
  X
} from 'lucide-react';
import { useNetwork } from '../../context/NetworkContext';

export type NavTab = 'dashboard' | 'connections' | 'bonding' | 'diagnostics' | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile,
}) => {
  const { adapters, bondingStatus, agentOnline, stage } = useNetwork();

  const wifiAdapter = adapters.find(a => a.type === 'wifi');
  const usbAdapter = adapters.find(a => a.type === 'usb_tether');
  const isStage1 = stage === 'stage1_failover';

  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'connections' as NavTab, label: 'Connections', icon: Network, badge: adapters.filter(a => a.enabled).length },
    { 
      id: 'bonding' as NavTab, 
      label: isStage1 ? 'Failover Engine' : 'Link Bonding', 
      icon: isStage1 ? Radio : Layers, 
      badge: isStage1 ? 'STG 1' : (bondingStatus?.state === 'simulated' ? 'SIM' : 'STG 2') 
    },
    { id: 'diagnostics' as NavTab, label: 'Diagnostics & Logs', icon: Activity, badge: null },
    { id: 'settings' as NavTab, label: 'Configuration', icon: Settings, badge: null },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#090e1a]/95 backdrop-blur-xl border-r border-slate-800/80
        flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800/80">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onSelectTab('dashboard')}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-lg font-black tracking-wider text-white font-mono">PLEX</span>
                <span className="text-lg font-black tracking-wider text-cyan-400 font-mono">LINK</span>
              </div>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className={`h-1.5 w-1.5 rounded-full ${isStage1 ? 'bg-cyan-400' : 'bg-blue-400'} animate-pulse`} />
                <span className="text-[10px] font-mono tracking-wider font-bold text-slate-300">
                  {isStage1 ? 'STG 1: FAILOVER' : 'STG 2: BONDING'}
                </span>
              </div>
            </div>
          </div>

          <button 
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            onClick={onCloseMobile}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Control Center
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`
                  w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 group
                  ${isActive 
                    ? 'bg-gradient-to-r from-cyan-500/15 via-blue-500/10 to-transparent text-cyan-300 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                  }
                `}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                    isActive ? 'bg-cyan-500/30 text-cyan-200' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* System & Hardware Health Widget */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 m-3 rounded-xl border">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
            <span>Hardware Paths</span>
            <span className="flex items-center space-x-1 text-[10px] text-cyan-400">
              <Radio className="w-3 h-3 animate-pulse" />
              <span>LIVE</span>
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {/* Wi-Fi Interface Status */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800">
              <div className="flex items-center space-x-2">
                <Wifi className={`w-3.5 h-3.5 ${wifiAdapter?.enabled ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span className="text-slate-300 font-medium">Laptop Wi-Fi 6</span>
              </div>
              <span className={`h-2 w-2 rounded-full ${wifiAdapter?.enabled ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-slate-600'}`} />
            </div>

            {/* Android USB Tethering Status */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800">
              <div className="flex items-center space-x-2">
                <Smartphone className={`w-3.5 h-3.5 ${usbAdapter?.enabled ? 'text-blue-400' : 'text-slate-400'}`} />
                <span className="text-slate-300 font-medium">Android USB RNDIS</span>
              </div>
              <span className={`h-2 w-2 rounded-full ${usbAdapter?.enabled ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]' : 'bg-slate-600'}`} />
            </div>
          </div>

          {/* Windows Agent Status */}
          <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Local Agent:</span>
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className={`w-3.5 h-3.5 ${agentOnline ? 'text-emerald-400' : 'text-amber-400'}`} />
              <span className={`font-mono text-[10px] ${agentOnline ? 'text-emerald-400 font-semibold' : 'text-amber-400'}`}>
                {agentOnline ? 'Connected' : 'Simulated RPC'}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

