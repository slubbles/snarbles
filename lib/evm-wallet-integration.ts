/**
 * EVM Wallet Integration for Automated USDT Transactions
 * 
 * Supports MetaMask, WalletConnect, and mobile wallet apps
 * Enables direct USDT transaction signing for credit top-ups
 */

import { USDT_RECEIVER_ADDRESS, SUPPORTED_USDT_NETWORKS, USDTNetwork } from './usdt-payment-system';

// ERC-20 USDT contract ABI (minimal)
const USDT_ABI = [
  // Standard ERC-20 functions
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)'
];

// Function selectors for ERC-20 methods
const FUNCTION_SELECTORS = {
  transfer: '0xa9059cbb',
  balanceOf: '0x70a08231',
  decimals: '0x313ce567',
  symbol: '0x95d89b41'
};

export interface EVMWalletInterface {
  address: string;
  chainId: number;
  provider: any;
}

export interface USDTTransactionOptions {
  network: USDTNetwork;
  amount: number; // USDT amount (human readable)
  recipient: string;
  gasLimit?: number;
  gasPrice?: string;
}

export interface USDTTransactionResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
  estimatedGas?: number;
}

export class EVMWalletError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'EVMWalletError';
  }
}

/**
 * Detect and connect to EVM wallet (MetaMask, etc.)
 */
export async function connectEVMWallet(): Promise<EVMWalletInterface> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new EVMWalletError('No Ethereum wallet found. Please install MetaMask or another Web3 wallet.');
  }

  try {
    // Request account access
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    
    return {
      address: accounts[0],
      chainId: parseInt(chainId, 16),
      provider: window.ethereum
    };
  } catch (error) {
    throw new EVMWalletError(
      error instanceof Error ? error.message : 'Failed to connect wallet'
    );
  }
}

/**
 * Switch to a specific network
 */
export async function switchToNetwork(targetNetwork: USDTNetwork): Promise<void> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new EVMWalletError('No Ethereum wallet found');
  }

  try {
    // Try to switch to the network
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${targetNetwork.chainId.toString(16)}` }],
    });
  } catch (switchError: any) {
    // If network doesn't exist, try to add it
    if (switchError.code === 4902) {
      await addNetwork(targetNetwork);
    } else {
      throw new EVMWalletError(`Failed to switch to ${targetNetwork.displayName}: ${switchError.message}`);
    }
  }
}

/**
 * Add a network to the wallet
 */
async function addNetwork(network: USDTNetwork): Promise<void> {
  if (!network.rpcUrl || !network.nativeCurrency) {
    throw new EVMWalletError(`Network configuration incomplete for ${network.displayName}`);
  }

  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: `0x${network.chainId.toString(16)}`,
        chainName: network.displayName,
        nativeCurrency: network.nativeCurrency,
        rpcUrls: [network.rpcUrl],
        blockExplorerUrls: [network.explorerUrl],
      }],
    });
  } catch (error) {
    throw new EVMWalletError(
      `Failed to add ${network.displayName} network: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Encode ERC-20 transfer function call
 */
function encodeTransfer(recipient: string, amount: string): string {
  // Remove '0x' prefix if present and pad addresses/amounts
  const paddedRecipient = recipient.replace('0x', '').padStart(64, '0');
  const paddedAmount = amount.replace('0x', '').padStart(64, '0');
  
  return FUNCTION_SELECTORS.transfer + paddedRecipient + paddedAmount;
}

/**
 * Convert decimal amount to hex with proper decimals
 */
function parseUnits(amount: string, decimals: number): string {
  const multiplier = Math.pow(10, decimals);
  const bigIntAmount = BigInt(Math.floor(parseFloat(amount) * multiplier));
  return '0x' + bigIntAmount.toString(16);
}

/**
 * Format units from hex to decimal
 */
function formatUnits(value: string, decimals: number): string {
  const bigIntValue = BigInt(value);
  const divisor = BigInt(Math.pow(10, decimals));
  const quotient = bigIntValue / divisor;
  const remainder = bigIntValue % divisor;
  
  if (remainder === BigInt(0)) {
    return quotient.toString();
  } else {
    const remainderStr = remainder.toString().padStart(decimals, '0');
    return quotient.toString() + '.' + remainderStr.replace(/0+$/, '');
  }
}

/**
 * Get USDT balance for an address
 */
export async function getUSDTBalance(
  wallet: EVMWalletInterface,
  network: USDTNetwork
): Promise<{ balance: number; decimals: number }> {
  try {
    // Encode balanceOf call
    const paddedAddress = wallet.address.replace('0x', '').padStart(64, '0');
    const data = FUNCTION_SELECTORS.balanceOf + paddedAddress;
    
    // Call contract
    const balanceHex = await wallet.provider.request({
      method: 'eth_call',
      params: [{
        to: network.contractAddress,
        data: data
      }, 'latest']
    });
    
    // Get decimals
    const decimalsHex = await wallet.provider.request({
      method: 'eth_call',
      params: [{
        to: network.contractAddress,
        data: FUNCTION_SELECTORS.decimals
      }, 'latest']
    });
    
    const decimals = parseInt(decimalsHex, 16);
    const balance = parseFloat(formatUnits(balanceHex, decimals));
    
    return { balance, decimals };
  } catch (error) {
    throw new EVMWalletError(
      `Failed to get USDT balance: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Estimate gas for USDT transfer
 */
export async function estimateUSDTTransferGas(
  wallet: EVMWalletInterface,
  options: USDTTransactionOptions
): Promise<{
  gasLimit: number;
  gasPrice: string;
  estimatedCost: string; // In ETH
}> {
  try {
    // Get decimals first
    const { decimals } = await getUSDTBalance(wallet, options.network);
    
    // Encode transfer transaction
    const amount = parseUnits(options.amount.toString(), decimals);
    const data = encodeTransfer(options.recipient, amount);
    
    // Estimate gas limit
    const gasLimitHex = await wallet.provider.request({
      method: 'eth_estimateGas',
      params: [{
        from: wallet.address,
        to: options.network.contractAddress,
        data: data
      }]
    });
    
    // Get current gas price
    const gasPriceHex = await wallet.provider.request({
      method: 'eth_gasPrice',
      params: []
    });
    
    const gasLimit = parseInt(gasLimitHex, 16);
    const gasPrice = gasPriceHex;
    
    // Calculate estimated cost in ETH
    const gasCostWei = BigInt(gasLimit) * BigInt(gasPrice);
    const estimatedCost = formatUnits('0x' + gasCostWei.toString(16), 18);

    return {
      gasLimit,
      gasPrice,
      estimatedCost
    };
  } catch (error) {
    throw new EVMWalletError(
      `Failed to estimate gas: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Execute USDT transfer transaction
 */
export async function executeUSDTTransfer(
  wallet: EVMWalletInterface,
  options: USDTTransactionOptions,
  onProgress?: (stage: string, message: string) => void
): Promise<USDTTransactionResult> {
  try {
    onProgress?.('preparing', 'Preparing USDT transfer...');

    // Verify we're on the correct network
    const currentChainId = await wallet.provider.request({ method: 'eth_chainId' });
    if (parseInt(currentChainId, 16) !== options.network.chainId) {
      onProgress?.('switching', `Switching to ${options.network.displayName}...`);
      await switchToNetwork(options.network);
    }

    onProgress?.('checking', 'Checking USDT balance...');

    // Get balance and decimals
    const { balance, decimals } = await getUSDTBalance(wallet, options.network);
    
    if (balance < options.amount) {
      throw new EVMWalletError(
        `Insufficient USDT balance. Required: ${options.amount} USDT, Available: ${balance} USDT`
      );
    }

    onProgress?.('estimating', 'Estimating gas costs...');

    // Estimate gas if not provided
    let gasEstimate;
    if (options.gasLimit && options.gasPrice) {
      gasEstimate = {
        gasLimit: options.gasLimit,
        gasPrice: options.gasPrice,
        estimatedCost: '0'
      };
    } else {
      gasEstimate = await estimateUSDTTransferGas(wallet, options);
    }

    onProgress?.('signing', 'Please sign the transaction in your wallet...');

    // Prepare transaction
    const amount = parseUnits(options.amount.toString(), decimals);
    const data = encodeTransfer(options.recipient, amount);
    
    // Send transaction
    const txHash = await wallet.provider.request({
      method: 'eth_sendTransaction',
      params: [{
        from: wallet.address,
        to: options.network.contractAddress,
        data: data,
        gas: '0x' + gasEstimate.gasLimit.toString(16),
        gasPrice: gasEstimate.gasPrice
      }]
    });

    onProgress?.('confirming', `Transaction submitted. Hash: ${txHash}`);

    // Wait for confirmation (simple polling)
    let confirmed = false;
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes with 5s intervals
    
    while (!confirmed && attempts < maxAttempts) {
      try {
        const receipt = await wallet.provider.request({
          method: 'eth_getTransactionReceipt',
          params: [txHash]
        });
        
        if (receipt && receipt.status) {
          confirmed = true;
          onProgress?.('completed', `Transaction confirmed! Hash: ${txHash}`);
        } else if (receipt && receipt.status === '0x0') {
          throw new EVMWalletError('Transaction failed');
        }
      } catch (receiptError) {
        // Transaction not yet mined, continue waiting
      }
      
      if (!confirmed) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        attempts++;
      }
    }

    if (!confirmed) {
      onProgress?.('timeout', 'Transaction submitted but confirmation timeout. Check explorer.');
    }

    return {
      success: true,
      transactionHash: txHash,
      estimatedGas: gasEstimate.gasLimit
    };

  } catch (error) {
    console.error('USDT transfer error:', error);
    
    let errorMessage = 'Unknown error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    // Handle specific MetaMask errors
    if (errorMessage.includes('User denied transaction signature')) {
      errorMessage = 'Transaction was cancelled by user';
    } else if (errorMessage.includes('insufficient funds')) {
      errorMessage = 'Insufficient ETH for gas fees';
    }

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Validate EVM address format
 */
export function isValidEVMAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Get network info by chain ID
 */
export function getNetworkByChainId(chainId: number): USDTNetwork | null {
  return SUPPORTED_USDT_NETWORKS.find(network => network.chainId === chainId) || null;
}

/**
 * Format USDT amount for display
 */
export function formatUSDTAmount(amount: string, decimals: number = 6): string {
  try {
    return formatUnits(amount, decimals);
  } catch {
    return '0';
  }
}

// Global window interface extension for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}
