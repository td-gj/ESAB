'use client';

import { useState, useEffect, FC, useCallback } from 'react';
import { useVault } from '@/context/VaultContext';
import { ethers } from 'ethers';

interface VaultInfo {
  owner: string;
  vault: any;
  heirInfo: any;
  claimableETH: string;
}

export const HeirDashboard: FC = () => {
  const { contract, account } = useVault();
  const [vaults, setVaults] = useState<VaultInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);

  const scanForVaults = useCallback(async () => {
    if (!contract || !account) return;
    try {
      setScanning(true);
      console.log('Checking for vaults...');
      
      const vaultInfos: VaultInfo[] = [];
      
      // Method 1: Try to get HeirAdded events using eth_getLogs
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const currentBlock = await provider.getBlockNumber();
        const deploymentBlock = 41441564; // Contract deployment block
        const fromBlock = deploymentBlock;
        
        // HeirAdded(address indexed owner, address indexed heir, uint256 points, uint256 totalPoints)
        // Topic0 = keccak256("HeirAdded(address,address,uint256,uint256)")
        const heirAddedTopic = ethers.id("HeirAdded(address,address,uint256,uint256)");
        const heirAddressTopic = ethers.zeroPadValue(account, 32); // indexed heir parameter
        
        console.log(`Scanning events from block ${fromBlock} to ${currentBlock}`);
        console.log('Contract address:', contract.target);
        console.log('Your address topic:', heirAddressTopic);
        
        const logs = await provider.send('eth_getLogs', [{
          fromBlock: '0x' + fromBlock.toString(16),
          toBlock: '0x' + currentBlock.toString(16),
          address: contract.target,
          topics: [
            heirAddedTopic,
            null, // owner (any)
            heirAddressTopic // heir (your address)
          ]
        }]);
        
        console.log('Found HeirAdded events:', logs.length);
        
        const ownerAddresses = new Set<string>();
        for (const log of logs) {
          // Parse owner address from topic[1]
          const ownerAddress = '0x' + log.topics[1].slice(26);
          ownerAddresses.add(ethers.getAddress(ownerAddress));
        }
        
        console.log('Unique owners:', ownerAddresses.size);
        
        for (const owner of ownerAddresses) {
          try {
            const [vault, heirInfo] = await Promise.all([
              contract.getVault(owner),
              contract.getHeirInfo(owner, account),
            ]);
            
            console.log(`Vault ${owner}: points=${heirInfo.points.toString()}`);
            
            if (heirInfo.points > 0) {
              const currentTime = Math.floor(Date.now() / 1000);
              const isInactive = currentTime >= Number(vault.lastActivity) + Number(vault.inactivityPeriod);
              
              let claimableETH = '0';
              if (isInactive && !heirInfo.claimed && vault.totalPoints > 0) {
                const share = (BigInt(vault.ethBalance) * BigInt(heirInfo.points)) / BigInt(vault.totalPoints);
                claimableETH = ethers.formatEther(share);
              }
              
              vaultInfos.push({
                owner: owner as string,
                vault,
                heirInfo,
                claimableETH,
              });
              
              // Save to localStorage
              const savedOwners = localStorage.getItem(`heir_vaults_${account}`);
              const owners = savedOwners ? JSON.parse(savedOwners) : [];
              if (!owners.includes(owner)) {
                owners.push(owner);
                localStorage.setItem(`heir_vaults_${account}`, JSON.stringify(owners));
              }
            }
          } catch (error) {
            console.error('Error fetching vault for owner:', owner, error);
          }
        }
      } catch (eventError) {
        console.error('Error querying events:', eventError);
      }
      
      // Method 2: Load from localStorage
      const savedOwners = localStorage.getItem(`heir_vaults_${account}`);
      if (savedOwners) {
        const owners = JSON.parse(savedOwners);
        console.log('Checking saved vault owners:', owners);
        
        for (const owner of owners) {
          // Skip if already added from events
          if (vaultInfos.some(v => v.owner === owner)) continue;
          
          try {
            const [vault, heirInfo] = await Promise.all([
              contract.getVault(owner),
              contract.getHeirInfo(owner, account),
            ]);
            
            if (heirInfo.points > 0) {
              const currentTime = Math.floor(Date.now() / 1000);
              const isInactive = currentTime >= Number(vault.lastActivity) + Number(vault.inactivityPeriod);
              
              let claimableETH = '0';
              if (isInactive && !heirInfo.claimed && vault.totalPoints > 0) {
                const share = (BigInt(vault.ethBalance) * BigInt(heirInfo.points)) / BigInt(vault.totalPoints);
                claimableETH = ethers.formatEther(share);
              }
              
              vaultInfos.push({
                owner: owner as string,
                vault,
                heirInfo,
                claimableETH,
              });
            }
          } catch (error) {
            console.error('Error fetching saved vault for owner:', owner, error);
          }
        }
      }
      
      setVaults(vaultInfos);
      console.log('Total vaults found:', vaultInfos.length);
    } catch (error) {
      console.error('Error scanning for vaults:', error);
    } finally {
      setScanning(false);
    }
  }, [contract, account]);

  useEffect(() => {
    if (contract && account) {
      scanForVaults();
      const interval = setInterval(scanForVaults, 30000);
      return () => clearInterval(interval);
    }
  }, [contract, account, scanForVaults]);

  const handleClaim = useCallback(async (owner: string) => {
    if (!contract) return;
    try {
      setLoading(true);
      const tx = await contract.claimETH(owner);
      await tx.wait();
      alert('✅ Claim successful!');
      scanForVaults();
    } catch (error) {
      console.error('Claim failed:', error);
      alert('❌ Claim failed: ' + (error as any).message);
    } finally {
      setLoading(false);
    }
  }, [contract, scanForVaults]);

  const formatTime = useCallback((seconds: number) => {
    if (seconds <= 0) return 'Ready';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}d ${hours}h`;
  }, []);

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">👤</span>
              <h1 className="text-xl md:text-2xl font-bold text-white">Heir Dashboard</h1>
            </div>
            <button 
              onClick={scanForVaults} 
              className="btn-secondary text-xs px-3 py-1"
              disabled={scanning}
            >
              {scanning ? '⏳' : '🔄'} Refresh
            </button>
          </div>
          <p className="text-gray-400 text-xs md:text-sm font-mono">{account?.slice(0, 10)}...{account?.slice(-8)}</p>
          <p className="text-gray-400 text-xs mt-2">
            💡 Vaults are automatically detected from blockchain events
          </p>
        </div>

        {scanning ? (
          <div className="card text-center">
            <div className="loading-spinner text-4xl mb-3">⏳</div>
            <p className="text-gray-300">Scanning for vaults...</p>
          </div>
        ) : vaults.length === 0 ? (
          <div className="card text-center">
            <p className="text-gray-300 mb-3">No vaults found</p>
            <p className="text-gray-400 text-sm">Vaults will appear automatically when you are added as an heir</p>
          </div>
        ) : (
          <div className="space-y-4">
            {vaults.map((vaultInfo) => {
              const currentTime = Math.floor(Date.now() / 1000);
              const isInactive = currentTime >= Number(vaultInfo.vault.lastActivity) + Number(vaultInfo.vault.inactivityPeriod);
              const timeUntilInactive = Math.max(0, Number(vaultInfo.vault.lastActivity) + Number(vaultInfo.vault.inactivityPeriod) - currentTime);
              const claimed = vaultInfo.heirInfo.claimed;
              
              return (
                <div key={vaultInfo.owner} className="card">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-white text-sm">Vault Owner</h3>
                    <span className={`text-xs px-2 py-1 rounded-lg ${
                      isInactive ? 'bg-green-600 bg-opacity-40 text-green-200' : 'bg-orange-600 bg-opacity-40 text-orange-200'
                    }`}>
                      {isInactive ? '✓ Claimable' : '⏱️ Waiting'}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-gray-400 mb-4 break-all">{vaultInfo.owner}</p>
                  
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-700 bg-opacity-40 p-3 rounded-lg">
                      <p className="text-gray-400 text-xs mb-1">Your Points</p>
                      <p className="text-white font-bold">{vaultInfo.heirInfo.points.toString()}</p>
                    </div>
                    <div className="bg-gray-700 bg-opacity-40 p-3 rounded-lg">
                      <p className="text-gray-400 text-xs mb-1">Time Left</p>
                      <p className="text-white font-bold">{formatTime(timeUntilInactive)}</p>
                    </div>
                  </div>
                  
                  <div className="bg-purple-600 bg-opacity-20 p-4 rounded-lg mb-3 border border-purple-500 border-opacity-30">
                    <p className="text-gray-300 text-xs mb-1">Claimable Amount</p>
                    <p className="text-2xl font-bold text-white flex items-center gap-2">
                      <img src="/eth.svg" alt="ETH" className="w-5 h-5" />
                      {parseFloat(vaultInfo.claimableETH).toFixed(6)} ETH
                    </p>
                  </div>
                  
                  <button
                    onClick={() => handleClaim(vaultInfo.owner)}
                    disabled={!isInactive || claimed || loading || vaultInfo.claimableETH === '0'}
                    className="btn-primary w-full text-sm"
                  >
                    {loading ? '⏳ Processing...' : claimed ? '✓ Already Claimed' : isInactive ? (
                      <span className="flex items-center justify-center gap-2">
                        <img src="/eth.svg" alt="ETH" className="w-4 h-4" /> Claim Inheritance
                      </span>
                    ) : '⏳ Waiting for Owner Inactivity'}
                  </button>
                </div>
              );
            })}
            
            {/* Info */}
            <div className="card text-xs bg-gray-700 bg-opacity-30">
              <p className="mb-2 text-white font-semibold flex items-center gap-2">
                <span>💡</span> How it works
              </p>
              <ul className="space-y-1 text-gray-300">
                <li className="flex gap-2">
                  <span>•</span>
                  <span>Vaults automatically appear when someone adds you as heir</span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>You can claim once the owner becomes inactive</span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>Your share is proportional to your points</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
