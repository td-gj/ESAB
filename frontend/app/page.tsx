'use client';

import { useState, useEffect, FC } from 'react';
import { useVault } from '@/context/VaultContext';
import { OwnerDashboard } from '@/components/OwnerDashboard';
import { HeirDashboard } from '@/components/HeirDashboard';

const Home: FC = () => {
  const { connected, account, isOwner, loading, connect } = useVault();
  const [checkedRole, setCheckedRole] = useState(false);

  useEffect(() => {
    if (connected && account) {
      setCheckedRole(true);
    }
  }, [connected, account]);

  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 flex items-center justify-center p-4">
        <div className="card max-w-md text-center">
          <h1 className="text-4xl font-bold mb-4 text-gray-800">LegacyVault</h1>
          <p className="text-gray-600 mb-6">
            Secure inheritance management through smart contracts. Connect your wallet to manage your legacy.
          </p>
          <div className="space-y-4 mb-6">
            <div className="text-left">
              <h3 className="font-bold text-gray-800 mb-2">🔐 Secure</h3>
              <p className="text-sm text-gray-600">Non-custodial inheritance with blockchain security</p>
            </div>
            <div className="text-left">
              <h3 className="font-bold text-gray-800 mb-2">⏰ Transparent</h3>
              <p className="text-sm text-gray-600">Automatic claim activation after inactivity period</p>
            </div>
            <div className="text-left">
              <h3 className="font-bold text-gray-800 mb-2">💰 Flexible</h3>
              <p className="text-sm text-gray-600">Support for ETH and any ERC20 tokens</p>
            </div>
          </div>
          <button onClick={connect} disabled={loading} className="btn-primary w-full text-lg py-3">
            {loading ? 'Connecting...' : 'Connect MetaMask'}
          </button>
          <p className="text-xs text-gray-500 mt-4">Network: Base Mainnet (Layer 2)</p>
        </div>
      </div>
    );
  }

  if (!checkedRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner text-4xl mb-4">⚙️</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return isOwner ? <OwnerDashboard /> : <HeirDashboard />;
};

export default Home;
