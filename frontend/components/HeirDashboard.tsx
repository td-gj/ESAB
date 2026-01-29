'use client';

import { useState, useEffect, FC, useCallback } from 'react';
import { useVault } from '@/context/VaultContext';
import { ethers } from 'ethers';

export const HeirDashboard: FC = () => {
  const { contract, account } = useVault();
  const [claimableETH, setClaimableETH] = useState('0');
  const [isInactive, setIsInactive] = useState(false);
  const [timeUntilInactive, setTimeUntilInactive] = useState(0);
  const [loading, setLoading] = useState(false);
  const [claimed, setClaimed] = useState(false);

  const fetchHeirData = useCallback(async () => {
    if (!contract || !account) return;
    try {
      setLoading(true);
      const [claimable, inactive, timeLeft, heirInfo] = await Promise.all([
        contract.getClaimableETH(account),
        contract.isOwnerInactive(),
        contract.getTimeUntilInactive(),
        contract.getHeirInfo(account),
      ]);
      
      setClaimableETH(ethers.formatEther(claimable));
      setIsInactive(inactive);
      setTimeUntilInactive(Number(timeLeft));
      setClaimed(heirInfo.claimed);
    } catch (error) {
      console.error('Error fetching heir data:', error);
    } finally {
      setLoading(false);
    }
  }, [contract, account]);

  useEffect(() => {
    if (contract && account) {
      fetchHeirData();
      const interval = setInterval(fetchHeirData, 5000);
      return () => clearInterval(interval);
    }
  }, [contract, account]);

  const handleClaim = useCallback(async () => {
    if (!contract) return;
    try {
      setLoading(true);
      const tx = await contract.claimETH();
      await tx.wait();
      alert('Claim successful!');
      fetchHeirData();
    } catch (error) {
      console.error('Claim failed:', error);
      alert('Claim failed: ' + (error as any).message);
    } finally {
      setLoading(false);
    }
  }, [contract, fetchHeirData]);

  const formatTime = useCallback((seconds: number) => {
    if (seconds <= 0) return '0';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}d ${hours}h`;
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-cyan-500 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="card mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Heir Dashboard</h1>
          <p className="text-gray-600">Account: {account?.slice(0, 6)}...{account?.slice(-4)}</p>
        </div>

        {/* Status Card */}
        <div className="card mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-4 rounded-lg ${isInactive ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className="text-gray-600 text-sm">Owner Status</p>
              <p className={`text-lg font-bold ${isInactive ? 'text-green-600' : 'text-red-600'}`}>
                {isInactive ? '✅ Inactive' : '❌ Active'}
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-gray-600 text-sm">Time Until Claim</p>
              <p className="text-lg font-bold text-orange-600">{formatTime(timeUntilInactive)}</p>
            </div>
          </div>
        </div>

        {/* Claimable Amount */}
        <div className="card mb-6">
          <h2 className="text-xl font-bold mb-4">Your Inheritance</h2>
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-6 rounded-lg text-center mb-4">
            <p className="text-gray-600 mb-2">Claimable ETH</p>
            <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
              {claimableETH}
            </p>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span>Status</span>
              <span className={claimed ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>
                {claimed ? 'Already Claimed' : 'Not Claimed'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Eligible to Claim</span>
              <span className={isInactive ? 'text-green-600 font-bold' : 'text-orange-600 font-bold'}>
                {isInactive ? '✅ Yes' : '⏳ Not Yet'}
              </span>
            </div>
          </div>

          <button
            onClick={handleClaim}
            disabled={!isInactive || claimed || loading || claimableETH === '0'}
            className="btn-primary w-full"
          >
            {loading ? 'Processing...' : claimed ? 'Already Claimed' : isInactive ? 'Claim Inheritance' : 'Waiting for Owner Inactivity'}
          </button>
        </div>

        {/* Info */}
        <div className="card text-sm text-gray-600">
          <p className="mb-2">💡 <strong>How it works:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Owner sets an inactivity period (30-365 days)</li>
            <li>You can claim your share once owner becomes inactive</li>
            <li>Each heir can only claim once</li>
            <li>Your share is proportional to your points</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
