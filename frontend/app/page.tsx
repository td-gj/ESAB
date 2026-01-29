'use client';

import { useState, useEffect, FC } from 'react';
import Head from 'next/head';
import { useVault } from '@/context/VaultContext';
import { OwnerDashboard } from '@/components/OwnerDashboard';
import { HeirDashboard } from '@/components/HeirDashboard';

const Home: FC = () => {
  const { connected, account, isOwner, loading, connect } = useVault();
  const [checkedRole, setCheckedRole] = useState(false);
  const [viewMode, setViewMode] = useState<'owner' | 'heir'>('owner');

  useEffect(() => {
    if (connected && account) {
      setCheckedRole(true);
      setViewMode(isOwner ? 'owner' : 'heir');
    }
  }, [connected, account, isOwner]);

  if (!connected) {
    return (
      <>
        <Head>
          <meta name="base:app_id" content="697b0fdd7a620235c741a888" />
        </Head>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="card max-w-md text-center w-full">
            <div className="mb-6">
              <img src="/logo.png" alt="LegacyVault" className="w-24 h-24 mx-auto mb-4 rounded-2xl" />
              <h1 className="text-3xl md:text-4xl font-bold mb-3 text-white">LegacyVault</h1>
              <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                Secure inheritance management through smart contracts on Base Network
              </p>
            </div>
          
          <div className="space-y-3 mb-6">
            <div className="bg-gray-700 bg-opacity-30 backdrop-blur-sm p-4 rounded-xl text-left border border-gray-600 border-opacity-30">
              <h3 className="font-bold text-white mb-1 flex items-center gap-2">
                <span className="text-xl">🔐</span> Secure
              </h3>
              <p className="text-sm text-gray-300">Non-custodial inheritance with blockchain security</p>
            </div>
            <div className="bg-gray-700 bg-opacity-30 backdrop-blur-sm p-4 rounded-xl text-left border border-gray-600 border-opacity-30">
              <h3 className="font-bold text-white mb-1 flex items-center gap-2">
                <span className="text-xl">⏰</span> Transparent
              </h3>
              <p className="text-sm text-gray-300">Automatic claim activation after inactivity period</p>
            </div>
            <div className="bg-gray-700 bg-opacity-30 backdrop-blur-sm p-4 rounded-xl text-left border border-gray-600 border-opacity-30">
              <h3 className="font-bold text-white mb-1 flex items-center gap-2">
                <span className="text-xl">💰</span> Flexible
              </h3>
              <p className="text-sm text-gray-300">Support for ETH and any ERC20 tokens</p>
            </div>
          </div>
          
          <button onClick={connect} disabled={loading} className="btn-primary w-full text-base md:text-lg">
            {loading ? '⏳ Connecting...' : '🦊 Connect Wallet'}
          </button>
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-xs text-gray-400">Base Mainnet</p>
          </div>
        </div>
      </div>
      </>
    );
  }

  if (!checkedRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center card">
          <div className="loading-spinner text-5xl mb-4">⚙️</div>
          <p className="text-gray-300 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <meta name="base:app_id" content="697b0fdd7a620235c741a888" />
      </Head>
      {/* Mode Switcher */}
      <div className="fixed top-20 right-4 z-40">
        <div className="bg-gray-800 rounded-lg p-1 flex gap-1 border border-gray-700 shadow-lg">
          <button
            onClick={() => setViewMode('owner')}
            className={`px-3 py-1.5 rounded-md font-medium text-xs transition-all ${
              viewMode === 'owner' 
                ? 'bg-gray-700 text-white' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Owner
          </button>
          <button
            onClick={() => setViewMode('heir')}
            className={`px-3 py-1.5 rounded-md font-medium text-xs transition-all ${
              viewMode === 'heir' 
                ? 'bg-gray-700 text-white' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Heir
          </button>
        </div>
      </div>

      {/* Dashboard Content */}
      {viewMode === 'owner' ? <OwnerDashboard /> : <HeirDashboard />}
    </>
  );
};

export default Home;
