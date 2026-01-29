'use client';

import { useState, FC, useEffect, useCallback, memo } from 'react';
import { useVault } from '@/context/VaultContext';
import { ethers } from 'ethers';

interface HeirData {
  address: string;
  points: string;
  claimed: boolean;
}

interface VaultData {
  initialized: boolean;
  ethBalance: string;
  inactivityPeriod: number | bigint;
  heirs: HeirData[];
  tokens: { address: string; balance: string; symbol: string; name: string; decimals: number }[];
}

export const OwnerDashboard: FC = () => {
  const { contract, account, isOwner } = useVault();
  const [vaultData, setVaultData] = useState<VaultData>({
    initialized: false,
    ethBalance: '0',
    inactivityPeriod: 0,
    heirs: [],
    tokens: [],
  });
  const [loading, setLoading] = useState(false);
  const [pingLoading, setPingLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'deposit' | 'withdraw' | 'heirs' | 'settings'>('overview');

  const handlePing = useCallback(async () => {
    if (!contract || !account) return;
    try {
      setPingLoading(true);
      const tx = await contract.ping(account);
      await tx.wait();
      alert('✅ Vault pinged! Activity timer reset.');
      fetchVaultData();
    } catch (error: any) {
      console.error('Ping failed:', error);
      alert('Ping failed: ' + (error.reason || error.message || 'Unknown error'));
    } finally {
      setPingLoading(false);
    }
  }, [contract, account]);

  const fetchVaultData = useCallback(async () => {
    if (!contract || !account) return;
    try {
      setLoading(true);
      const vault = await contract.getVault(account);
      const heirsCount = vault.heirsCount;

      const heirs: HeirData[] = [];
      for (let i = 0; i < heirsCount; i++) {
        const heirAddress = await contract.getHeirAt(account, i);
        const info = await contract.getHeirInfo(account, heirAddress);
        heirs.push({ address: heirAddress, points: info.points.toString(), claimed: info.claimed });
      }

      setVaultData({
        initialized: vault.initialized,
        ethBalance: ethers.formatEther(vault.ethBalance),
        inactivityPeriod: vault.inactivityPeriod,
        heirs,
        tokens: [],
      });
    } catch (error) {
      console.error('Error fetching vault data:', error);
    } finally {
      setLoading(false);
    }
  }, [contract, account]);

  useEffect(() => {
    if (contract && isOwner) {
      fetchVaultData();
    }
  }, [contract, isOwner]);

  // Show initialization required message
  if (!vaultData.initialized) {
    return (
      <div className="min-h-screen p-4 md:p-6">
        <div className="max-w-xl mx-auto">
          <div className="card">
            <div className="text-center mb-4">
              <div className="text-5xl mb-3">⚠️</div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">Create Your Vault</h1>
              <p className="text-gray-300 text-sm md:text-base">
                Set your inactivity period (30-365 days) to get started
              </p>
            </div>
            <VaultSettings contract={contract} account={account} initialized={vaultData.initialized} onSuccess={fetchVaultData} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="card mb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">👤</span>
                <h1 className="text-xl md:text-2xl font-bold text-white">Owner Dashboard</h1>
              </div>
              <p className="text-gray-400 text-xs md:text-sm font-mono">{account?.slice(0, 10)}...{account?.slice(-8)}</p>
              <div className="flex items-center gap-2 mt-2">
                {vaultData.initialized ? (
                  <span className="text-xs bg-green-600 bg-opacity-40 text-green-200 px-2 py-1 rounded-lg">✓ Active</span>
                ) : (
                  <span className="text-xs bg-red-600 bg-opacity-40 text-red-200 px-2 py-1 rounded-lg">⚠ Not Initialized</span>
                )}
              </div>
            </div>
            {vaultData.initialized && (
              <button
                onClick={handlePing}
                className="btn-primary whitespace-nowrap text-sm w-full md:w-auto"
                disabled={pingLoading}
                title="Reset inactivity timer"
              >
                {pingLoading ? '⏳ Pinging...' : '📡 Ping Vault'}
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="card mb-4 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {(['overview', 'deposit', 'withdraw', 'heirs', 'settings'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 rounded-xl font-semibold transition-all text-sm md:text-base whitespace-nowrap ${
                  activeTab === tab ? 'btn-primary' : 'btn-secondary'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="card">
            <h2 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
              <span>📊</span> Vault Overview
            </h2>
            
            {/* Explanation */}
            <div className="bg-gray-700 p-4 rounded-lg mb-4 border border-gray-600">
              <p className="text-sm text-gray-300 leading-relaxed">
                <span className="font-semibold text-white">LegacyVault</span> protects your assets and automatically distributes them to your heirs if you remain inactive for a set period. Regularly click "Ping Activity" to confirm you're still active.
              </p>
            </div>
            
            {/* ETH Balance */}
            <div className="bg-blue-600 p-4 rounded-lg mb-3 border border-blue-700">
              <p className="text-blue-100 text-sm mb-1 flex items-center gap-2">
                <img src="/eth.svg" alt="ETH" className="w-4 h-4" /> ETH Balance
              </p>
              <p className="text-2xl font-bold text-white">{parseFloat(vaultData.ethBalance).toFixed(6)} ETH</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-purple-600 p-4 rounded-lg border border-purple-700">
                <p className="text-purple-100 text-sm mb-1">👥 Total Heirs</p>
                <p className="text-xl font-bold text-white">{vaultData.heirs.length}</p>
              </div>
              <div className="bg-orange-600 p-4 rounded-lg border border-orange-700">
                <p className="text-orange-100 text-sm mb-1">⏱️ Inactivity</p>
                <p className="text-xl font-bold text-white">
                  {(Number(vaultData.inactivityPeriod) / (24 * 3600)).toFixed(0)}d
                </p>
              </div>
            </div>

            <button onClick={fetchVaultData} className="btn-primary mt-4 w-full" disabled={loading}>
              {loading ? '⏳ Refreshing...' : '🔄 Refresh Data'}
            </button>
          </div>
        )}

        {activeTab === 'deposit' && <DepositSection contract={contract} account={account} onSuccess={fetchVaultData} />}
        {activeTab === 'withdraw' && <WithdrawSection contract={contract} ethBalance={vaultData.ethBalance} onSuccess={fetchVaultData} />}
        {activeTab === 'heirs' && <HeirsManagement contract={contract} account={account} heirs={vaultData.heirs} onSuccess={fetchVaultData} />}
        {activeTab === 'settings' && <VaultSettings contract={contract} account={account} initialized={vaultData.initialized} onSuccess={fetchVaultData} />}
      </div>
    </div>
  );
};

const DepositSection = memo(({ contract, account, onSuccess }: { contract: any; account: string | null; onSuccess: () => void }) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDepositETH = async () => {
    if (!contract || !amount || !account) return;
    try {
      setLoading(true);
      const tx = await contract.depositETH(account, { value: ethers.parseEther(amount) });
      await tx.wait();
      setAmount('');
      alert('Deposit successful!');
      onSuccess();
    } catch (error) {
      console.error('Deposit failed:', error);
      alert('Deposit failed: ' + (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
        <span>💰</span> Deposit ETH
      </h2>

      <label className="block text-gray-300 text-sm font-semibold mb-2">Amount (ETH)</label>
      <input
        type="number"
        placeholder="0.00"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="input-field mb-4"
        step="0.001"
      />
      <button onClick={handleDepositETH} className="btn-primary w-full" disabled={loading || !amount}>
        {loading ? '⏳ Processing...' : (
          <span className="flex items-center justify-center gap-2">
            <img src="/eth.svg" alt="ETH" className="w-4 h-4" /> Deposit ETH
          </span>
        )}
      </button>
    </div>
  );
});

const WithdrawSection = memo(({ contract, ethBalance, onSuccess }: { contract: any; ethBalance: string; onSuccess: () => void }) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleWithdrawETH = async () => {
    if (!contract || !amount) return;
    try {
      setLoading(true);
      const withdrawAmount = ethers.parseEther(amount);
      const tx = await contract.withdrawETH(withdrawAmount);
      await tx.wait();
      setAmount('');
      alert('ETH withdrawal successful!');
      onSuccess();
    } catch (error: any) {
      console.error('Withdrawal failed:', error);
      alert('Withdrawal failed: ' + (error.reason || error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
        <span>💸</span> Withdraw ETH
      </h2>
      
      <div className="mb-4">
        <label className="block text-gray-300 text-sm font-semibold mb-2">Available Balance</label>
        <div className="bg-gray-700 p-4 rounded-lg mb-4 border border-gray-600">
          <p className="text-2xl font-bold text-white">{parseFloat(ethBalance).toFixed(6)} ETH</p>
        </div>
        
        <label className="block text-gray-300 text-sm font-semibold mb-2">Withdrawal Amount</label>
        <input
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="input-field mb-2"
          step="0.000001"
          max={ethBalance}
        />
      </div>

      <button onClick={handleWithdrawETH} className="btn-primary w-full" disabled={loading || !amount}>
        {loading ? '⏳ Processing...' : (
          <span className="flex items-center justify-center gap-2">
            <img src="/eth.svg" alt="ETH" className="w-4 h-4" /> Withdraw ETH
          </span>
        )}
      </button>
    </div>
  );
});

const HeirsManagement = memo(({ contract, account, heirs, onSuccess }: { contract: any; account: string | null; heirs: any[]; onSuccess: () => void }) => {
  const [heirAddress, setHeirAddress] = useState('');
  const [points, setPoints] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingHeir, setEditingHeir] = useState<string | null>(null);
  const [editPoints, setEditPoints] = useState('');

  const totalPoints = heirs.reduce((sum, heir) => sum + Number(heir.points), 0);

  const handleAddHeir = async () => {
    if (!contract || !heirAddress || !points || !account) return;
    try {
      setLoading(true);
      const tx = await contract.addHeir(account, heirAddress, ethers.parseUnits(points, 0));
      await tx.wait();
      setHeirAddress('');
      setPoints('');
      alert('✅ Heir added successfully!');
      onSuccess();
    } catch (error) {
      console.error('Add heir failed:', error);
      alert('❌ Add heir failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveHeir = async (heirAddr: string) => {
    if (!contract || !account) return;
    if (!confirm(`Are you sure you want to remove heir ${heirAddr}?`)) return;
    
    try {
      setLoading(true);
      const tx = await contract.removeHeir(account, heirAddr);
      await tx.wait();
      alert('✅ Heir removed successfully!');
      onSuccess();
    } catch (error) {
      console.error('Remove heir failed:', error);
      alert('❌ Remove heir failed');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePoints = async (heirAddr: string) => {
    if (!contract || !account || !editPoints) return;
    
    try {
      setLoading(true);
      const tx = await contract.updateHeirPoints(account, heirAddr, ethers.parseUnits(editPoints, 0));
      await tx.wait();
      setEditingHeir(null);
      setEditPoints('');
      alert('✅ Heir points updated successfully!');
      onSuccess();
    } catch (error) {
      console.error('Update points failed:', error);
      alert('❌ Update points failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
        <span>👥</span> Manage Heirs
      </h2>
      
      {/* Distribution Points Explanation */}
      <div className="bg-gray-700 p-4 rounded-lg mb-4 border border-gray-600">
        <p className="text-sm text-gray-300 leading-relaxed">
          <span className="font-semibold text-white">Distribution Points</span> determine the proportion of asset distribution. For example: if 2 heirs have 30 and 70 points, they will receive 30% and 70% of total assets.
        </p>
      </div>
      
      <div className="space-y-3 mb-4">
        <div>
          <label className="block text-gray-300 text-sm font-semibold mb-2">Heir Address</label>
          <input
            type="text"
            placeholder="0x..."
            value={heirAddress}
            onChange={(e) => setHeirAddress(e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-gray-300 text-sm font-semibold mb-2">Distribution Points</label>
          <input
            type="number"
            placeholder="e.g., 50"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            className="input-field"
          />
        </div>
        <button onClick={handleAddHeir} className="btn-primary w-full" disabled={loading || !heirAddress || !points}>
          {loading ? '⏳ Adding...' : '➕ Add Heir'}
        </button>
      </div>

      <div>
        <h3 className="font-bold mb-3 text-white flex items-center gap-2">
          <span>📋</span> Current Heirs ({heirs.length})
        </h3>
        {heirs.length === 0 ? (
          <div className="space-y-3">
            <div className="bg-gray-700 bg-opacity-30 backdrop-blur-sm p-4 rounded-xl text-center text-gray-300 text-sm border border-gray-600 border-opacity-30">
              No heirs added yet
            </div>
            <div className="bg-blue-600 bg-opacity-20 p-4 rounded-xl border border-blue-500 border-opacity-40">
              <p className="text-blue-200 text-sm leading-relaxed mb-3">
                💡 <span className="font-semibold">If you don't have an heir yet,</span> I can help you! I will make your assets useful.
              </p>
              <div className="bg-gray-800 bg-opacity-50 p-3 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">My wallet address:</p>
                <p className="font-mono text-sm text-blue-300 break-all">0xBe98454B86E30859c823F3556592a8e273666666</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {heirs.map((heir, idx) => {
              const percentage = totalPoints > 0 ? ((Number(heir.points) / totalPoints) * 100).toFixed(1) : '0';
              const isEditing = editingHeir === heir.address;
              
              return (
                <div key={heir.address} className="bg-gray-700 bg-opacity-40 backdrop-blur-sm p-4 rounded-xl border border-gray-600 border-opacity-30">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-semibold">#{idx + 1}</span>
                        <p className="font-mono text-xs md:text-sm text-gray-300 truncate">{heir.address}</p>
                      </div>
                      {isEditing ? (
                        <div className="flex gap-2 items-center mt-2">
                          <input
                            type="number"
                            value={editPoints}
                            onChange={(e) => setEditPoints(e.target.value)}
                            placeholder="New points"
                            className="input-field text-sm py-1 px-2"
                          />
                          <button
                            onClick={() => handleUpdatePoints(heir.address)}
                            disabled={loading || !editPoints}
                            className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-500"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => {
                              setEditingHeir(null);
                              setEditPoints('');
                            }}
                            className="px-3 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-500"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <p className="text-xs text-gray-400">🎯 Points: {heir.points}</p>
                          <p className="text-xs font-bold text-blue-300">📊 {percentage}%</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 items-start ml-2">
                      <span className={`text-xs px-2 py-1 rounded-lg whitespace-nowrap ${
                        heir.claimed 
                          ? 'bg-red-600 bg-opacity-40 text-red-200 border border-red-500 border-opacity-30' 
                          : 'bg-green-600 bg-opacity-40 text-green-200 border border-green-500 border-opacity-30'
                      }`}>
                        {heir.claimed ? '❌ Claimed' : '✓ Active'}
                      </span>
                    </div>
                  </div>
                  {!heir.claimed && !isEditing && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => {
                          setEditingHeir(heir.address);
                          setEditPoints(heir.points);
                        }}
                        disabled={loading}
                        className="flex-1 px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-500"
                      >
                        ✏️ Edit Points
                      </button>
                      <button
                        onClick={() => handleRemoveHeir(heir.address)}
                        disabled={loading}
                        className="flex-1 px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-500"
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

const VaultSettings = memo(({ contract, account, initialized, onSuccess }: { contract: any; account: string | null; initialized: boolean; onSuccess: () => void }) => {
  const [days, setDays] = useState('30');
  const [loading, setLoading] = useState(false);

  const handleInitialize = async () => {
    if (!contract || !days || !account) return;
    try {
      setLoading(true);
      const seconds = BigInt(days) * BigInt(24) * BigInt(3600);
      
      if (initialized) {
        // Update existing vault's inactivity period
        const tx = await contract.updateInactivityPeriod(account, seconds);
        await tx.wait();
        alert('✅ Inactivity period updated successfully!');
      } else {
        // Create new vault
        const tx = await contract.createVault(seconds);
        await tx.wait();
        alert('✅ Vault created successfully!');
      }
      
      onSuccess();
    } catch (error) {
      console.error('Vault operation failed:', error);
      alert('❌ Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
        <span>⚙️</span> Vault Settings
      </h2>
      <div className="space-y-3 mb-4">
        <label className="block text-gray-300 font-semibold">Inactivity Period</label>
        <div className="bg-gray-700 bg-opacity-40 backdrop-blur-sm p-4 rounded-xl border border-gray-600 border-opacity-30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white font-bold text-2xl">{days}</span>
            <span className="text-gray-300 text-sm">days</span>
          </div>
          <input
            type="range"
            min="30"
            max="365"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-gray-400"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>30</span>
            <span>180</span>
            <span>365</span>
          </div>
        </div>
        <p className="text-xs text-gray-400">
          🕒 Time the owner must be inactive before heirs can claim inheritance
        </p>
      </div>
      <button
        onClick={handleInitialize}
        className="btn-primary w-full"
        disabled={loading || !days}
      >
        {loading ? '⏳ Processing...' : initialized ? '🔄 Update Inactivity Period' : '🚀 Initialize Vault'}
      </button>
    </div>
  );
});
