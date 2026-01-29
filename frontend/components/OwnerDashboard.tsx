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
}

export const OwnerDashboard: FC = () => {
  const { contract, account, isOwner } = useVault();
  const [vaultData, setVaultData] = useState<VaultData>({
    initialized: false,
    ethBalance: '0',
    inactivityPeriod: 0,
    heirs: [],
  });
  const [loading, setLoading] = useState(false);
  const [pingLoading, setPingLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'deposit' | 'withdraw' | 'heirs' | 'settings'>('overview');

  const handlePing = useCallback(async () => {
    if (!contract) return;
    try {
      setPingLoading(true);
      const tx = await contract.ping();
      await tx.wait();
      alert('✅ Vault pinged! Activity timer reset.');
      fetchVaultData();
    } catch (error: any) {
      console.error('Ping failed:', error);
      alert('Ping failed: ' + (error.reason || error.message || 'Unknown error'));
    } finally {
      setPingLoading(false);
    }
  }, [contract]);

  const fetchVaultData = useCallback(async () => {
    if (!contract) return;
    try {
      setLoading(true);
      const [initialized, ethBalance, inactivityPeriod, heirsCount] = await Promise.all([
        contract.initialized(),
        contract.ethBalance(),
        contract.inactivityPeriod(),
        contract.getHeirsCount(),
      ]);

      const heirs: HeirData[] = [];
      for (let i = 0; i < heirsCount; i++) {
        const heir = await contract.getHeirAt(i);
        const info = await contract.getHeirInfo(heir);
        heirs.push({ address: heir, points: info.points.toString(), claimed: info.claimed });
      }

      setVaultData({
        initialized,
        ethBalance: ethers.formatEther(ethBalance),
        inactivityPeriod,
        heirs,
      });
    } catch (error) {
      console.error('Error fetching vault data:', error);
    } finally {
      setLoading(false);
    }
  }, [contract]);

  useEffect(() => {
    if (contract && isOwner) {
      fetchVaultData();
    }
  }, [contract, isOwner]);

  if (!isOwner) {
    return <div className="p-4 text-center text-red-500">Only vault owner can access this</div>;
  }

  // Show initialization required message
  if (!vaultData.initialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="card">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">⚠️ Initialize Vault First</h1>
            <p className="text-gray-600 mb-6">
              Your vault is not initialized yet. You must set an inactivity period (30-365 days) before you can use any features.
            </p>
            <VaultSettings contract={contract} initialized={vaultData.initialized} onSuccess={fetchVaultData} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="card mb-6">
          <div className="flex justify-between items-start gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">LegacyVault Owner</h1>
              <p className="text-gray-600">Account: {account?.slice(0, 6)}...{account?.slice(-4)}</p>
              <p className="text-sm text-gray-500 mt-2">
                Status: {vaultData.initialized ? '✅ Initialized' : '❌ Not Initialized'}
              </p>
            </div>
            {vaultData.initialized && (
              <button
                onClick={handlePing}
                className="btn-primary whitespace-nowrap"
                disabled={pingLoading}
                title="Reset inactivity timer (Dead Man's Switch ping)"
              >
                {pingLoading ? '🔄 Pinging...' : '📍 Ping Now'}
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="card mb-6">
          <div className="flex gap-2 flex-wrap">
            {(['overview', 'deposit', 'withdraw', 'heirs', 'settings'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
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
            <h2 className="text-xl font-bold mb-4">Vault Overview</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-gray-600 text-sm">ETH Balance</p>
                <p className="text-2xl font-bold text-blue-600">{vaultData.ethBalance}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Total Heirs</p>
                <p className="text-2xl font-bold text-green-600">{vaultData.heirs.length}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg col-span-2">
                <p className="text-gray-600 text-sm">Inactivity Period</p>
                <p className="text-xl font-bold text-orange-600">
                  {(Number(vaultData.inactivityPeriod) / (24 * 3600)).toFixed(0)} days
                </p>
              </div>
            </div>
            <button onClick={fetchVaultData} className="btn-primary mt-4 w-full" disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        )}

        {activeTab === 'deposit' && <DepositSection contract={contract} onSuccess={fetchVaultData} />}
        {activeTab === 'withdraw' && <WithdrawSection contract={contract} ethBalance={vaultData.ethBalance} onSuccess={fetchVaultData} />}
        {activeTab === 'heirs' && <HeirsManagement contract={contract} heirs={vaultData.heirs} onSuccess={fetchVaultData} />}
        {activeTab === 'settings' && <VaultSettings contract={contract} initialized={vaultData.initialized} onSuccess={fetchVaultData} />}
      </div>
    </div>
  );
};

const DepositSection = memo(({ contract, onSuccess }: { contract: any; onSuccess: () => void }) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [depositType, setDepositType] = useState<'eth' | 'erc20'>('eth');
  const [tokenAddress, setTokenAddress] = useState('');
  const [tokenInfo, setTokenInfo] = useState<{ name: string; symbol: string; decimals: number } | null>(null);
  const [tokenLoading, setTokenLoading] = useState(false);

  const handleDepositETH = async () => {
    if (!contract || !amount) return;
    try {
      setLoading(true);
      const tx = await contract.depositETH({ value: ethers.parseEther(amount) });
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

  const fetchTokenInfo = useCallback(async (tokenAddr: string) => {
    if (!ethers.isAddress(tokenAddr)) {
      setTokenInfo(null);
      return;
    }
    try {
      setTokenLoading(true);
      const erc20ABI = [
        'function name() public view returns (string)',
        'function symbol() public view returns (string)',
        'function decimals() public view returns (uint8)',
      ];
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const token = new ethers.Contract(tokenAddr, erc20ABI, provider);
      
      const [name, symbol, decimals] = await Promise.all([
        token.name(),
        token.symbol(),
        token.decimals(),
      ]);
      
      setTokenInfo({ name, symbol, decimals: Number(decimals) });
    } catch (error) {
      setTokenInfo(null);
    } finally {
      setTokenLoading(false);
    }
  }, []);

  const handleDepositERC20 = async () => {
    if (!contract || !amount || !tokenAddress || !tokenInfo) return;
    try {
      setLoading(true);
      const tokenAmount = ethers.parseUnits(amount, tokenInfo.decimals);
      const tx = await contract.depositERC20(tokenAddress, tokenAmount);
      await tx.wait();
      setAmount('');
      setTokenAddress('');
      setTokenInfo(null);
      alert('Token deposit successful!');
      onSuccess();
    } catch (error: any) {
      console.error('Deposit failed:', error);
      // Better error messages
      let errorMsg = 'Deposit failed';
      if (error.reason) {
        errorMsg += ': ' + error.reason;
      } else if (error.message) {
        errorMsg += ': ' + error.message;
      }
      alert(errorMsg + '\n\nMake sure you approved the token first!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-4">Deposit Assets</h2>
      
      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => {
            setDepositType('eth');
            setTokenInfo(null);
          }}
          className={`px-4 py-2 rounded-lg font-semibold ${
            depositType === 'eth' ? 'btn-primary' : 'btn-secondary'
          }`}
        >
          ETH
        </button>
        <button
          onClick={() => setDepositType('erc20')}
          className={`px-4 py-2 rounded-lg font-semibold ${
            depositType === 'erc20' ? 'btn-primary' : 'btn-secondary'
          }`}
        >
          ERC20 Token
        </button>
      </div>

      {depositType === 'eth' ? (
        <>
          <input
            type="number"
            placeholder="Amount (ETH)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input-field mb-4"
            step="0.001"
          />
          <button onClick={handleDepositETH} className="btn-primary w-full" disabled={loading || !amount}>
            {loading ? 'Processing...' : 'Deposit ETH'}
          </button>
        </>
      ) : (
        <>
          {/* Token Address Input */}
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Token Contract Address</label>
            <input
              type="text"
              placeholder="0x..."
              value={tokenAddress}
              onChange={(e) => {
                setTokenAddress(e.target.value);
                if (e.target.value.length > 0) {
                  fetchTokenInfo(e.target.value);
                } else {
                  setTokenInfo(null);
                }
              }}
              className="input-field"
            />
          </div>

          {/* Token Info Display */}
          {tokenLoading && (
            <div className="bg-blue-50 p-3 rounded-lg mb-4 text-center text-sm text-blue-600">
              Loading token info...
            </div>
          )}

          {tokenInfo && (
            <div className="bg-green-50 p-4 rounded-lg mb-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-gray-800">{tokenInfo.name}</p>
                  <p className="text-sm text-gray-600">Symbol: {tokenInfo.symbol}</p>
                  <p className="text-xs text-gray-500">Decimals: {tokenInfo.decimals}</p>
                </div>
                <span className="text-2xl">✅</span>
              </div>
            </div>
          )}

          {/* Amount Input */}
          {tokenInfo && (
            <>
              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">
                  Amount ({tokenInfo.symbol})
                </label>
                <input
                  type="number"
                  placeholder={`Enter amount (${tokenInfo.decimals} decimals)`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input-field"
                  step="0.000001"
                />
              </div>

              <button
                onClick={handleDepositERC20}
                className="btn-primary w-full mb-3"
                disabled={loading || !amount || !tokenInfo}
              >
                {loading ? 'Processing...' : `Deposit ${tokenInfo.symbol}`}
              </button>
            </>
          )}

          {!tokenInfo && tokenAddress.length > 0 && !tokenLoading && (
            <div className="bg-red-50 p-3 rounded-lg text-sm text-red-600 mb-4">
              Invalid token address or token not found
            </div>
          )}

          <div className="bg-yellow-50 p-3 rounded-lg text-xs text-yellow-800">
            ⚠️ <strong>Important:</strong> Before depositing, you must approve this contract to spend your tokens.
            Use your token's contract or a DEX interface to approve.
          </div>
        </>
      )}
    </div>
  );
});

const WithdrawSection = memo(({ contract, ethBalance, onSuccess }: { contract: any; ethBalance: string; onSuccess: () => void }) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [withdrawType, setWithdrawType] = useState<'eth' | 'erc20'>('eth');
  const [tokenAddress, setTokenAddress] = useState('');
  const [tokenInfo, setTokenInfo] = useState<{ name: string; symbol: string; decimals: number; balance: string } | null>(null);
  const [tokenLoading, setTokenLoading] = useState(false);

  const fetchTokenInfo = useCallback(async () => {
    if (!contract || !tokenAddress || !ethers.isAddress(tokenAddress)) return;

    try {
      setTokenLoading(true);
      const erc20 = new ethers.Contract(
        tokenAddress,
        ['function name() view returns (string)', 'function symbol() view returns (string)', 'function decimals() view returns (uint8)'],
        contract.runner
      );

      const [name, symbol, decimals] = await Promise.all([
        erc20.name(),
        erc20.symbol(),
        erc20.decimals(),
      ]);

      const balance = await contract.tokenBalances(tokenAddress);
      setTokenInfo({ name, symbol, decimals, balance: ethers.formatUnits(balance, decimals) });
    } catch (error) {
      setTokenInfo(null);
    } finally {
      setTokenLoading(false);
    }
  }, [contract, tokenAddress]);

  useEffect(() => {
    if (tokenAddress.length > 0) {
      fetchTokenInfo();
    }
  }, [tokenAddress, fetchTokenInfo]);

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

  const handleWithdrawERC20 = async () => {
    if (!contract || !amount || !tokenAddress || !tokenInfo) return;
    try {
      setLoading(true);
      const tokenAmount = ethers.parseUnits(amount, tokenInfo.decimals);
      const tx = await contract.withdrawERC20(tokenAddress, tokenAmount);
      await tx.wait();
      setAmount('');
      setTokenAddress('');
      setTokenInfo(null);
      alert('Token withdrawal successful!');
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
      <h2 className="text-xl font-bold mb-4">Withdraw Assets</h2>
      
      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => {
            setWithdrawType('eth');
            setTokenInfo(null);
          }}
          className={`px-4 py-2 rounded-lg font-semibold ${
            withdrawType === 'eth' ? 'btn-primary' : 'btn-secondary'
          }`}
        >
          ETH
        </button>
        <button
          onClick={() => setWithdrawType('erc20')}
          className={`px-4 py-2 rounded-lg font-semibold ${
            withdrawType === 'erc20' ? 'btn-primary' : 'btn-secondary'
          }`}
        >
          ERC20
        </button>
      </div>

      {withdrawType === 'eth' && (
        <>
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Available Balance</label>
            <p className="text-lg font-bold text-green-600 mb-4">{ethBalance} ETH</p>
            
            <label className="block text-gray-700 font-semibold mb-2">Withdrawal Amount (ETH)</label>
            <input
              type="number"
              placeholder="Amount in ETH"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-field mb-2"
              step="0.000001"
              max={ethBalance}
            />
          </div>

          <button onClick={handleWithdrawETH} className="btn-primary w-full" disabled={loading || !amount}>
            {loading ? 'Processing...' : 'Withdraw ETH'}
          </button>
        </>
      )}

      {withdrawType === 'erc20' && (
        <>
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Token Address</label>
            <input
              type="text"
              placeholder="0x..."
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              className="input-field mb-2"
            />
          </div>

          {tokenLoading && <p className="text-gray-600 mb-4">Loading token info...</p>}

          {tokenInfo && (
            <>
              <div className="bg-blue-50 p-3 rounded-lg mb-4">
                <p className="text-sm text-gray-700">
                  <strong>{tokenInfo.name}</strong> ({tokenInfo.symbol})
                </p>
                <p className="text-sm text-gray-600">Balance: {tokenInfo.balance} {tokenInfo.symbol}</p>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">Withdrawal Amount</label>
                <input
                  type="number"
                  placeholder={`Amount in ${tokenInfo.symbol}`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input-field"
                  step="0.000001"
                  max={tokenInfo.balance}
                />
              </div>

              <button
                onClick={handleWithdrawERC20}
                className="btn-primary w-full"
                disabled={loading || !amount || !tokenInfo}
              >
                {loading ? 'Processing...' : `Withdraw ${tokenInfo.symbol}`}
              </button>
            </>
          )}

          {!tokenInfo && tokenAddress.length > 0 && !tokenLoading && (
            <div className="bg-red-50 p-3 rounded-lg text-sm text-red-600 mb-4">
              Invalid token address or token not found
            </div>
          )}
        </>
      )}
    </div>
  );
});

const HeirsManagement = memo(({ contract, heirs, onSuccess }: { contract: any; heirs: any[]; onSuccess: () => void }) => {
  const [heirAddress, setHeirAddress] = useState('');
  const [points, setPoints] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddHeir = async () => {
    if (!contract || !heirAddress || !points) return;
    try {
      setLoading(true);
      const tx = await contract.addHeir(heirAddress, ethers.parseUnits(points, 0));
      await tx.wait();
      setHeirAddress('');
      setPoints('');
      alert('Heir added successfully!');
      onSuccess();
    } catch (error) {
      console.error('Add heir failed:', error);
      alert('Add heir failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-4">Manage Heirs</h2>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Heir address"
          value={heirAddress}
          onChange={(e) => setHeirAddress(e.target.value)}
          className="input-field mb-2"
        />
        <input
          type="number"
          placeholder="Points"
          value={points}
          onChange={(e) => setPoints(e.target.value)}
          className="input-field mb-2"
        />
        <button onClick={handleAddHeir} className="btn-primary w-full" disabled={loading || !heirAddress || !points}>
          {loading ? 'Adding...' : 'Add Heir'}
        </button>
      </div>

      <div>
        <h3 className="font-bold mb-2">Current Heirs ({heirs.length})</h3>
        <div className="space-y-2">
          {heirs.map((heir) => (
            <div key={heir.address} className="bg-gray-100 p-3 rounded flex justify-between items-center">
              <div>
                <p className="font-mono text-sm">{heir.address.slice(0, 6)}...{heir.address.slice(-4)}</p>
                <p className="text-xs text-gray-600">Points: {heir.points}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${heir.claimed ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {heir.claimed ? 'Claimed' : 'Active'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

const VaultSettings = memo(({ contract, initialized, onSuccess }: { contract: any; initialized: boolean; onSuccess: () => void }) => {
  const [days, setDays] = useState('30');
  const [loading, setLoading] = useState(false);

  const handleInitialize = async () => {
    if (!contract || !days) return;
    try {
      setLoading(true);
      const seconds = BigInt(days) * BigInt(24) * BigInt(3600);
      const tx = await contract.initialize(seconds);
      await tx.wait();
      alert('Vault initialized successfully!');
      onSuccess();
    } catch (error) {
      console.error('Initialize failed:', error);
      alert('Initialize failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-4">Vault Settings</h2>
      {!initialized && (
        <div className="bg-yellow-50 p-4 rounded-lg mb-4">
          <p className="text-sm text-yellow-800">⚠️ Vault not initialized. Set inactivity period first.</p>
        </div>
      )}
      <div className="space-y-2 mb-4">
        <label className="block text-gray-700 font-semibold">Inactivity Period (days)</label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="30"
            max="365"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="flex-1"
            disabled={initialized}
          />
          <input
            type="number"
            placeholder="Days"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="input-field w-20"
            min="30"
            max="365"
            disabled={initialized}
          />
        </div>
        <p className="text-xs text-gray-500">
          Set how long the vault owner must be inactive before heirs can claim their inheritance (30-365 days)
        </p>
      </div>
      <button
        onClick={handleInitialize}
        className="btn-primary w-full"
        disabled={loading || initialized || !days}
      >
        {loading ? 'Processing...' : initialized ? '✅ Vault Initialized' : 'Initialize Vault'}
      </button>
    </div>
  );
});
