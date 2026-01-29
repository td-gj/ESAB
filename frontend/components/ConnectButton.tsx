'use client';

import { memo, FC } from 'react';
import { useVault } from '@/context/VaultContext';

const ConnectButtonComponent: FC = () => {
  const { connected, account, connect, disconnect, loading } = useVault();

  return (
    <button
      onClick={connected ? disconnect : connect}
      disabled={loading}
      className={`px-6 py-2 rounded-lg font-semibold transition ${
        connected
          ? 'bg-red-500 hover:bg-red-600 text-white'
          : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-lg text-white'
      } disabled:opacity-50`}
    >
      {loading ? 'Loading...' : connected ? `${account?.slice(0, 6)}...${account?.slice(-4)}` : 'Connect Wallet'}
    </button>
  );
};

export const ConnectButton = memo(ConnectButtonComponent);
