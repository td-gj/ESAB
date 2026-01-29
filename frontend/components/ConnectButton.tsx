'use client';

import { memo, FC } from 'react';
import { useVault } from '@/context/VaultContext';

const ConnectButtonComponent: FC = () => {
  const { connected, account, connect, disconnect, loading } = useVault();

  return (
    <button
      onClick={connected ? disconnect : connect}
      disabled={loading}
      className={`px-4 md:px-6 py-2 md:py-2.5 rounded-xl font-semibold transition-all duration-300 text-sm md:text-base ${
        connected
          ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-lg active:scale-95'
          : 'bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white shadow-lg active:scale-95'
      } disabled:opacity-50`}
    >
      {loading ? '⏳' : connected ? `${account?.slice(0, 4)}...${account?.slice(-3)}` : '🔗 Connect'}
    </button>
  );
};

export const ConnectButton = memo(ConnectButtonComponent);
