export const LEGACY_VAULT_CONTRACT = '0xB6516d6C6d00f4Aa851C8179a0b1EFc09652E308';

export const LEGACY_VAULT_ABI = [
  {
    inputs: [{ internalType: 'uint256', name: '_inactivityPeriod', type: 'uint256' }],
    name: 'createVault',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_vaultOwner', type: 'address' }],
    name: 'depositETH',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'amount', type: 'uint256' }],
    name: 'withdrawETH',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '_vaultOwner', type: 'address' },
      { internalType: 'address', name: 'heir', type: 'address' },
      { internalType: 'uint256', name: 'points', type: 'uint256' },
    ],
    name: 'addHeir',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '_vaultOwner', type: 'address' },
      { internalType: 'address', name: 'heir', type: 'address' },
    ],
    name: 'removeHeir',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '_vaultOwner', type: 'address' },
      { internalType: 'address', name: 'heir', type: 'address' },
      { internalType: 'uint256', name: 'newPoints', type: 'uint256' },
    ],
    name: 'updateHeirPoints',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '_vaultOwner', type: 'address' },
      { internalType: 'uint256', name: '_newPeriod', type: 'uint256' },
    ],
    name: 'updateInactivityPeriod',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_vaultOwner', type: 'address' }],
    name: 'ping',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_vaultOwner', type: 'address' }],
    name: 'claimETH',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_owner', type: 'address' }],
    name: 'getVault',
    outputs: [
      { internalType: 'uint256', name: 'inactivityPeriod', type: 'uint256' },
      { internalType: 'uint256', name: 'lastActivity', type: 'uint256' },
      { internalType: 'bool', name: 'initialized', type: 'bool' },
      { internalType: 'uint256', name: 'ethBalance', type: 'uint256' },
      { internalType: 'uint256', name: 'totalPoints', type: 'uint256' },
      { internalType: 'uint256', name: 'heirsCount', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_owner', type: 'address' }],
    name: 'getHeirsCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '_owner', type: 'address' },
      { internalType: 'uint256', name: 'index', type: 'uint256' },
    ],
    name: 'getHeirAt',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '_owner', type: 'address' },
      { internalType: 'address', name: 'heir', type: 'address' },
    ],
    name: 'getHeirInfo',
    outputs: [
      { internalType: 'uint256', name: 'points', type: 'uint256' },
      { internalType: 'bool', name: 'claimed', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];

export const BASE_CHAIN_ID = 8453;
export const BASE_RPC_URL = 'https://mainnet.base.org';
