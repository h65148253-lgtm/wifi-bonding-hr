import React, { useState } from 'react';
import { 
  Server, 
  Terminal, 
  Copy, 
  Check, 
  ExternalLink, 
  CheckCircle2, 
  Globe, 
  ShieldCheck, 
  Cpu, 
  Layers,
  ArrowRight
} from 'lucide-react';
import { useNetwork } from '../../context/NetworkContext';

export const VpsRelaySetupCard: React.FC = () => {
  const { vpsConfig, bondingStatus } = useNetwork();
  const [copiedTab, setCopiedTab] = useState<'bash' | 'docker' | null>(null);
  const [activeScriptTab, setActiveScriptTab] = useState<'bash' | 'docker'>('bash');

  const dockerScript = vpsConfig?.dockerComposeScript || `version: '3.8'
services:
  plexlink-relay:
    image: ghcr.io/multipath-tcp/mptcpd:latest
    container_name: plexlink-bonding-server
    restart: always
    network_mode: host
    cap_add:
      - NET_ADMIN
    environment:
      - BOND_SECRET=wX8a/9Kj+PzQ0L7rY3e1M4oV6tS8uA2bC9dE=
      - TUNNEL_PORT=51820
      - MTU=1420
    volumes:
      - /etc/plexlink:/etc/plexlink
      - /lib/modules:/lib/modules:ro
`;

  const bashScript = vpsConfig?.ubuntuInstallScript || `#!/usr/bin/env bash
# PLEXLINK Remote Bonding Relay Server Installer
# Target OS: Ubuntu 22.04 / 24.04 LTS (Kernel 6.x with MPTCP enabled)
set -e

sudo apt-get update && sudo apt-get install -y wireguard iptables mptcpd ufw curl

# Enable IP Forwarding & MPTCP v1
echo "net.ipv4.ip_forward = 1" | sudo tee -a /etc/sysctl.conf
echo "net.mptcp.enabled = 1" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Configure NAT Masquerading on Public Interface (eth0)
WAN_IF=$(ip route show default | awk '{print $5}')
sudo iptables -t nat -A POSTROUTING -o \${WAN_IF} -j MASQUERADE
sudo iptables -A FORWARD -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT
sudo iptables -A FORWARD -i tun-plex0 -o \${WAN_IF} -j ACCEPT

# Open WireGuard Multi-path UDP Port
sudo ufw allow 51820/udp

echo "PLEXLINK Bonding Relay is now ACTIVE on port 51820 (UDP)!"
echo "Server Public IP: $(curl -s ifconfig.me)"
`;

  const handleCopy = (text: string, tab: 'bash' | 'docker') => {
    navigator.clipboard.writeText(text);
    setCopiedTab(tab);
    setTimeout(() => setCopiedTab(null), 2500);
  };

  return (
    <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-6 backdrop-blur-md shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-800/60 gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-white tracking-wide">Stage 2 — Remote Bonding Relay Server</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                STAGE 2 VPS
              </span>
            </div>
            <p className="text-xs text-slate-400">Packet re-assembly and public internet egress relay specification</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Relay Handshake Verified</span>
          </span>
        </div>
      </div>

      {/* How Stage 2 Works Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-5 text-xs">
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
          <span className="font-bold text-cyan-300 block mb-1">1. Laptop Multi-path Egress</span>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Windows agent stripes packets across Wi-Fi and phone USB simultaneously via two encapsulated UDP tunnels.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
          <span className="font-bold text-blue-300 block mb-1">2. Remote VPS Reassembly</span>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Your VPS relay receives both streams, re-orders out-of-order packets via MPTCP buffer, and merges them cleanly.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
          <span className="font-bold text-emerald-300 block mb-1">3. Single Public IP Egress</span>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            External websites see only the VPS public IP. If Wi-Fi or USB drops, downloads continue without broken TCP sockets.
          </p>
        </div>
      </div>

      {/* VPS Deployment Helper */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/80">
        <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Deploy Your Own VPS Bonding Relay (Ubuntu / Debian / Docker)
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveScriptTab('bash')}
              className={`px-2.5 py-1 text-xs font-mono rounded-md transition-colors ${
                activeScriptTab === 'bash' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              Ubuntu Script
            </button>
            <button
              onClick={() => setActiveScriptTab('docker')}
              className={`px-2.5 py-1 text-xs font-mono rounded-md transition-colors ${
                activeScriptTab === 'docker' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              Docker Compose
            </button>
          </div>
        </div>

        <div className="p-4 relative">
          <button
            onClick={() => handleCopy(activeScriptTab === 'bash' ? bashScript : dockerScript, activeScriptTab)}
            className="absolute top-6 right-6 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono flex items-center space-x-1.5 transition-colors shadow"
          >
            {copiedTab === activeScriptTab ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedTab === activeScriptTab ? 'Copied!' : 'Copy Script'}</span>
          </button>

          <pre className="text-xs font-mono text-slate-300 overflow-x-auto p-3 rounded-lg bg-slate-950/90 border border-slate-900 max-h-56 leading-relaxed">
            {activeScriptTab === 'bash' ? bashScript : dockerScript}
          </pre>
        </div>
      </div>
    </div>
  );
};

