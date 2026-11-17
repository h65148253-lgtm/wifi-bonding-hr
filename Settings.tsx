import React from 'react';
import { useNetwork } from '../context/NetworkContext';
import { ConfigForm } from '../components/settings/ConfigForm';

export const Settings: React.FC = () => {
  const { settings, updateSettings, resetSettings } = useNetwork();

  return (
    <div className="space-y-6">
      <ConfigForm
        settings={settings}
        onSave={updateSettings}
        onReset={resetSettings}
      />
    </div>
  );
};

