import React from 'react';
import { useNetwork } from '../context/NetworkContext';
import { BondingTopologyVisualizer } from '../components/bonding/BondingTopologyVisualizer';
import { TrafficDistributionSlider } from '../components/bonding/TrafficDistributionSlider';
import { TunnelStatusCard } from '../components/dashboard/TunnelStatusCard';
import { FailoverControlCard } from '../components/dashboard/FailoverControlCard';
import { VpsRelaySetupCard } from '../components/bonding/VpsRelaySetupCard';
import { Layers, Repeat, Zap, ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

export const Bonding: React.FC = () => {
  const {
    bondingStatus,
    adapters,
    setBondingMode,
    setTrafficRatio,
    stage,
    setStage
  } = useNetwork();

  if (!bondingStatus) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 font-mono text-sm">
        Loading bonding topology status...
      </div>
    );
  }

  const isStage1 = stage === 'stage1_failover';

  return (
    <div className="space-y-6">
      {/* Stage Explainer Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900 to-cyan-950/30 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            {isStage1 ? <Repeat className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-white tracking-wide">
                {isStage1 ? 'Stage 1: Real-Time Monitoring & Automatic Failover' : 'Stage 2: True Internet Channel Bonding'}
              </h2>
              <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${isStage1 ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                }`}>
                {isStage1 ? 'LOCAL NATIVE (NO VPS)' : 'MULTI-PATH TUNNEL'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isStage1
                ? 'Monitors Wi-Fi & Android USB links; instantly redirects outbound traffic if the active path drops.'
                : 'Stripes packets across both interfaces concurrently and reassembles them at your remote VPS relay.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setStage(isStage1 ? 'stage2_bonding' : 'stage1_failover')}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 flex items-center space-x-2 transition-all shrink-0"
        >
          <span>{isStage1 ? 'Switch to Stage 2 (Bonding)' : 'Switch to Stage 1 (Failover)'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Stage 1 Section */}
      {isStage1 ? (
        <div className="space-y-6">
          <FailoverControlCard />
          <BondingTopologyVisualizer
            bonding={bondingStatus}
            adapters={adapters}
          />
        </div>
      ) : (
        /* Stage 2 Section */
        <div className="space-y-6">
          {/* Dual Path Verification Checklist */}
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${bondingStatus.dualPathVerified
              ? 'bg-emerald-950/30 border-emerald-500/40'
              : 'bg-amber-950/30 border-amber-500/40'
            }`}>
            <div className="flex items-center space-x-3">
              <div className={`p-2.5 rounded-xl ${bondingStatus.dualPathVerified ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                {bondingStatus.dualPathVerified ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              </div>
              <div>
                <span className="text-sm font-bold text-white block">
                  {bondingStatus.dualPathVerified
                    ? 'Dual Path Link Verification Confirmed'
                    : 'Degraded Mode: Only One Physical Interface Active'}
                </span>
                <p className="text-xs text-slate-400">
                  {bondingStatus.dualPathVerified
                    ? 'Subflow 0 (Wi-Fi 6) and Subflow 1 (Android 5G USB) are passing keepalive probes concurrently.'
                    : 'Ensure both laptop Wi-Fi and phone USB tethering are enabled to achieve multi-path bonding speedup.'}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${bondingStatus.dualPathVerified
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}>
                {bondingStatus.dualPathVerified ? '2 / 2 SUBFLOWS ACTIVE' : '1 / 2 SUBFLOWS ACTIVE'}
              </span>
            </div>
          </div>

          {/* Interactive Topology Visualizer */}
          <BondingTopologyVisualizer
            bonding={bondingStatus}
            adapters={adapters}
          />

          {/* Traffic Distribution Controls & Mode Switcher */}
          <TrafficDistributionSlider
            bonding={bondingStatus}
            onSetMode={setBondingMode}
            onSetRatio={setTrafficRatio}
          />

          {/* VPS Relay Setup Card */}
          <VpsRelaySetupCard />

          {/* Tunnel Relay Card */}
          <TunnelStatusCard bonding={bondingStatus} />
        </div>
      )}
    </div>
  );
};
