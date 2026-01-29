'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode, FC } from 'react';
import { ethers } from 'ethers';
import { LEGACY_VAULT_CONTRACT, LEGACY_VAULT_ABI, BASE_CHAIN_ID } from '@/config/contract';

interface VaultContextType {
  account: string | null;
  connected: boolean;
  contract: ethers.Contract | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  isOwner: boolean;
  loading: boolean;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export const VaultProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(false);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      alert('MetaMask is not installed');
      return;
    }

    try {
      setLoading(true);
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const selectedAccount = accounts[0];
      setAccount(selectedAccount);

      // Check network
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (parseInt(chainId, 16) !== BASE_CHAIN_ID) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x' + BASE_CHAIN_ID.toString(16) }],
          });
        } catch (err: any) {
          if (err.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0x' + BASE_CHAIN_ID.toString(16),
                  chainName: 'Base',
                  rpcUrls: ['https://mainnet.base.org'],
                  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                  blockExplorerUrls: ['https://basescan.org'],
                },
              ],
            });
          }
        }
      }

      const newProvider = new ethers.BrowserProvider(window.ethereum);
      const newSigner = await newProvider.getSigner();
      const newContract = new ethers.Contract(LEGACY_VAULT_CONTRACT, LEGACY_VAULT_ABI, newSigner);

      setProvider(newProvider);
      setSigner(newSigner);
      setContract(newContract);
      setConnected(true);

      // Check if user has a vault
      const vaultData = await newContract.getVault(selectedAccount);
      setIsOwner(vaultData.initialized);
    } catch (error) {
      console.error('Connection error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAccount(null);
    setConnected(false);
    setContract(null);
    setProvider(null);
    setSigner(null);
    setIsOwner(false);
  }, []);

  const contextValue = useMemo(
    () => ({ account, connected, contract, provider, signer, connect, disconnect, isOwner, loading }),
    [account, connected, contract, provider, signer, connect, disconnect, isOwner, loading]
  );

  // Auto-reconnect on mount if previously connected
  useEffect(() => {
    const autoConnect = async () => {
      if (!window.ethereum) return;

      try {
        setLoading(true);
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        
        if (accounts.length > 0) {
          const selectedAccount = accounts[0];
          setAccount(selectedAccount);

          // Check network
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          if (parseInt(chainId, 16) !== BASE_CHAIN_ID) {
            try {
              await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x' + BASE_CHAIN_ID.toString(16) }],
              });
            } catch (err: any) {
              if (err.code === 4902) {
                await window.ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [
                    {
                      chainId: '0x' + BASE_CHAIN_ID.toString(16),
                      chainName: 'Base',
                      rpcUrls: ['https://mainnet.base.org'],
                      nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                      blockExplorerUrls: ['https://basescan.org'],
                    },
                  ],
                });
              }
            }
          }

          const newProvider = new ethers.BrowserProvider(window.ethereum);
          const newSigner = await newProvider.getSigner();
          const newContract = new ethers.Contract(LEGACY_VAULT_CONTRACT, LEGACY_VAULT_ABI, newSigner);

          setProvider(newProvider);
          setSigner(newSigner);
          setContract(newContract);
          setConnected(true);

          // Check if user has a vault
          const vaultData = await newContract.getVault(selectedAccount);
          setIsOwner(vaultData.initialized);
        }
      } catch (error) {
        console.error('Auto-connect error:', error);
      } finally {
        setLoading(false);
      }
    };

    autoConnect();
  }, []);

  useEffect(() => {
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAccount(accounts[0]);
      }
    };

    const handleChainChanged = () => {
      // Reload page when chain changes to ensure everything is in sync
      window.location.reload();
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [disconnect]);

  return (
    <VaultContext.Provider value={contextValue}>
      {children}
    </VaultContext.Provider>
  );
};

export const useVault = () => {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error('useVault must be used within VaultProvider');
  }
  return context;
};
