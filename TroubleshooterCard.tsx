import React, { useState } from 'react';
import { 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Smartphone, 
  Wifi, 
  ShieldAlert, 
  Check, 
  ExternalLink,
  Wrench
} from 'lucide-react';

interface TroubleshooterItem {
  id: string;
  title: string;
  severity: 'high' | 'medium' | 'low';
  category: string;
  problem: string;
  solutionSteps: string[];
}

export const TroubleshooterCard: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>('issue-1');

  const issues: TroubleshooterItem[] = [
    {
      id: 'issue-1',
      title: 'Android USB Tethering not detected or showing as "MTP / Media Device"',
      severity: 'high',
      category: 'USB Hardware / Driver',
      problem: 'Windows recognizes the phone for file transfer but no "Remote NDIS based Internet Sharing Device" appears in Network Connections.',
      solutionSteps: [
        'On your Android phone, go to Settings > Network & internet > Hotspot & tethering.',
        'Toggle "USB tethering" ON (this switch only becomes active once the USB cable is firmly plugged into the laptop).',
        'Use a high-quality data-capable USB-C cable (some charging cables do not have data pins).',
        'If Windows still does not recognize the network adapter, open Device Manager > Other Devices > Right-click phone > Update driver > Browse my computer > Let me pick from a list > Network adapters > Microsoft > Remote NDIS Compatible Device.',
      ],
    },
    {
      id: 'issue-2',
      title: 'IP Subnet Collision between Wi-Fi Router and Phone Tethering',
      severity: 'medium',
      category: 'IP & Routing',
      problem: 'Both Wi-Fi (Home Router) and Android USB Tethering assign the same default subnet (e.g. 192.168.1.0/24), causing Windows route table flapping.',
      solutionSteps: [
        'Android natively assigns 192.168.42.0/24 or 192.168.43.0/24 for USB tethering, which avoids most home router 192.168.1.x collisions.',
        'If a collision occurs, change your home Wi-Fi DHCP pool to 10.0.0.0/24 or configure PLEXLINK Agent to bind with interface-specific socket binding (SO_BINDTODEVICE / IP_UNICAST_IF).',
        'PLEXLINK Agent automatically adjusts Windows interface route metrics so both gateways remain reachable simultaneously.',
      ],
    },
    {
      id: 'issue-3',
      title: 'Mobile Carrier Tethering Throttling or TTL Packet Drops',
      severity: 'medium',
      category: 'Cellular Carrier',
      problem: 'Certain cellular carriers detect tethered traffic by checking IP Time-To-Live (TTL) or APN headers and throttle speed after a quota.',
      solutionSteps: [
        'PLEXLINK encapsulates all laptop traffic inside WireGuard UDP multi-path packets. The cellular carrier only sees single encrypted UDP packets directed to your bonding VPS IP.',
        'In Settings, enable "Cellular Data Saver Cap" to set a safety limit on USB tethering megabytes.',
        'Verify your phone has active mobile data and 5G/LTE signal.',
      ],
    },
    {
      id: 'issue-4',
      title: 'MTU Clamping & TCP Packet Fragmentation',
      severity: 'low',
      category: 'Tunnel MTU',
      problem: 'Large packets exceed the MTU of cellular or Wi-Fi links when tunnel encryption headers are added.',
      solutionSteps: [
        'PLEXLINK automatically clamps path MTU to 1420 bytes with TCP MSS set to 1380.',
        'Run the diagnostic benchmark to ensure path MTU test shows "Pass".',
      ],
    },
  ];

  return (
    <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-6 backdrop-blur-md">
      <div className="flex items-center space-x-3 pb-5 border-b border-slate-800/60 mb-5">
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
          <Wrench className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white tracking-wide">Interactive Troubleshooting Assistant</h3>
          <p className="text-xs text-slate-400">Step-by-step resolution for common Wi-Fi + Android USB tethering challenges</p>
        </div>
      </div>

      <div className="space-y-3">
        {issues.map((issue) => {
          const isOpen = openId === issue.id;
          return (
            <div
              key={issue.id}
              className="rounded-xl border border-slate-800 bg-slate-950/50 overflow-hidden transition-colors"
            >
              <button
                onClick={() => setOpenId(isOpen ? null : issue.id)}
                className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-900/40 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                    issue.severity === 'high' 
                      ? 'bg-rose-500/10 text-rose-300 border-rose-500/30' 
                      : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  }`}>
                    {issue.category}
                  </span>
                  <span className="text-sm font-semibold text-slate-200">{issue.title}</span>
                </div>

                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 border-t border-slate-900 text-xs">
                  <div className="mb-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 text-slate-300">
                    <span className="font-bold text-cyan-300 block mb-0.5">Symptom:</span>
                    {issue.problem}
                  </div>

                  <span className="font-bold text-slate-300 block mb-2">Recommended Fix:</span>
                  <ul className="space-y-2">
                    {issue.solutionSteps.map((step, idx) => (
                      <li key={idx} className="flex items-start space-x-2 text-slate-400">
                        <span className="flex h-5 w-5 rounded-full bg-cyan-500/10 text-cyan-400 items-center justify-center text-[10px] font-mono shrink-0 font-bold border border-cyan-500/20">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

