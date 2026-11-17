import React from 'react';
import { useNetwork } from '../context/NetworkContext';
import { PingMatrix } from '../components/diagnostics/PingMatrix';
import { LogViewer } from '../components/diagnostics/LogViewer';
import { TroubleshooterCard } from '../components/diagnostics/TroubleshooterCard';

export const Diagnostics: React.FC = () => {
  const { 
    diagnostics, 
    logs, 
    runDiagnostics, 
    clearLogs 
  } = useNetwork();

  return (
    <div className="space-y-6">
      {/* Test Suite & Latency Matrix */}
      <PingMatrix
        diagnostics={diagnostics}
        onRunTest={runDiagnostics}
      />

      {/* Network Event Log Console */}
      <LogViewer
        logs={logs}
        onClear={clearLogs}
      />

      {/* Troubleshooting Assistant & Resolution Steps */}
      <TroubleshooterCard />
    </div>
  );
};

