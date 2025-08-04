/**
 * Multi-Wallet USDT Payment System for Credit Top-Up
 * 
 * Supports USDT payments from multiple blockchain networks and wallets:
 * - Solana USDT via Phantom wallet
 * - Algorand USDT via Pera wallet  
 * - EVM USDT via MetaMask/WalletConnect (existing networks)
 * 
 * All payments go to designated receiving addresses per network
 */

import { supabase, isSupabaseAvailable } from './supabase-client';
import { getCreditsBalance, addCreditTransaction, updateCreditsBalance } from './credit-system';

// USDT pricing configuration - consistent across all networks
export const USDT_PRICING = {
  // 1 USDT = 1 credit (simple 1:1 ratio)
  USDT_TO_CREDITS_RATE: 1,
  
  // Minimum and maximum payment amounts
  MIN_USDT_AMOUNT: 1,
  MAX_USDT_AMOUNT: 1000,
  
  // Payment amounts for quick selection
  QUICK_AMOUNTS: [5, 10, 25, 50, 100]
};

// Wallet type enum
export type WalletType = 'phantom' | 'pera' | 'metamask' | 'walletconnect';

// Network interface for all supported networks
export interface USDTNetwork {
  id: string;
  name: string;
  displayName: string;
  walletType: WalletType;
  chainId?: number;
  contractAddress: string;
  receiverAddress: string;
  explorerUrl: string;
  rpcUrl?: string;
  nativeCurrency?: {
    name: string;
    symbol: string;
    decimals: number;
  };
  decimals: number;
  isTestnet?: boolean;
}

// Comprehensive network configuration
export const SUPPORTED_USDT_NETWORKS: USDTNetwork[] = [
  // Solana Networks (Phantom)
  {
    id: 'solana-mainnet',
    name: 'solana',
    displayName: 'Solana',
    walletType: 'phantom',
    contractAddress: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // SPL-USDT
    receiverAddress: '9ca8362c35db2649614cd4029ab0067d285660ef', // Convert to Solana address
    explorerUrl: 'https://explorer.solana.com',
    decimals: 6,
    isTestnet: false
  },
  {
    id: 'solana-devnet',
    name: 'solana-devnet',
    displayName: 'Solana Devnet',
    walletType: 'phantom',
    contractAddress: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // SPL-USDT (same address)
    receiverAddress: '9ca8362c35db2649614cd4029ab0067d285660ef', // Convert to Solana address
    explorerUrl: 'https://explorer.solana.com',
    decimals: 6,
    isTestnet: true
  },
  
  // Algorand Networks (Pera)
  {
    id: 'algorand-mainnet',
    name: 'algorand',
    displayName: 'Algorand',
    walletType: 'pera',
    contractAddress: '312769', // USDt Asset ID on Algorand
    receiverAddress: 'SNARBLES_ALGO_RECEIVER_ADDRESS_HERE', // Will be provided
    explorerUrl: 'https://algoexplorer.io',
    decimals: 6,
    isTestnet: false
  },
  {
    id: 'algorand-testnet',
    name: 'algorand-testnet',
    displayName: 'Algorand Testnet',
    walletType: 'pera',
    contractAddress: '10458941', // USDt Asset ID on Testnet
    receiverAddress: 'SNARBLES_ALGO_TEST_RECEIVER_ADDRESS_HERE', // Will be provided
    explorerUrl: 'https://testnet.explorer.perawallet.app',
    decimals: 6,
    isTestnet: true
  },
  
  // EVM Networks (MetaMask/WalletConnect) - existing networks
  {
    id: 'polygon',
    name: 'polygon',
    displayName: 'Polygon (MATIC)',
    walletType: 'metamask',
    chainId: 137,
    contractAddress: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    receiverAddress: '0x9ca8362c35db2649614cd4029ab0067d285660ef',
    explorerUrl: 'https://polygonscan.com',
    rpcUrl: 'https://polygon-rpc.com',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    },
    decimals: 6
  },
  {
    id: 'bsc',
    name: 'bsc',
    displayName: 'BNB Smart Chain',
    walletType: 'metamask',
    chainId: 56,
    contractAddress: '0x55d398326f99059fF775485246999027B3197955',
    receiverAddress: '0x9ca8362c35db2649614cd4029ab0067d285660ef',
    explorerUrl: 'https://bscscan.com',
    rpcUrl: 'https://bsc-dataseed1.binance.org',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18
    },
    decimals: 18
  },
  {
    id: 'ethereum',
    name: 'ethereum',
    displayName: 'Ethereum',
    walletType: 'metamask',
    chainId: 1,
    contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    receiverAddress: '0x9ca8362c35db2649614cd4029ab0067d285660ef',
    explorerUrl: 'https://etherscan.io',
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    decimals: 6
  },
  {
    id: 'arbitrum',
    name: 'arbitrum',
    displayName: 'Arbitrum One',
    walletType: 'metamask',
    chainId: 42161,
    contractAddress: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    receiverAddress: '0x9ca8362c35db2649614cd4029ab0067d285660ef',
    explorerUrl: 'https://arbiscan.io',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    decimals: 6
  },
  {
    id: 'avalanche',
    name: 'avalanche',
    displayName: 'Avalanche C-Chain',
    walletType: 'metamask',
    chainId: 43114,
    contractAddress: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
    receiverAddress: '0x9ca8362c35db2649614cd4029ab0067d285660ef',
    explorerUrl: 'https://snowtrace.io',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    nativeCurrency: {
      name: 'Avalanche',
      symbol: 'AVAX',
      decimals: 18
    },
    decimals: 6
  },
  {
    id: 'optimism',
    name: 'optimism',
    displayName: 'Optimism',
    walletType: 'metamask',
    chainId: 10,
    contractAddress: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
    receiverAddress: '0x9ca8362c35db2649614cd4029ab0067d285660ef',
    explorerUrl: 'https://optimistic.etherscan.io',
    rpcUrl: 'https://mainnet.optimism.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    decimals: 6
  }
];

// Payment transaction interface
export interface USDTPaymentTransaction {
  id: string;
  userAddress: string;
  networkId: string;
  walletType: WalletType;
  usdtAmount: number;
  creditsAwarded: number;
  transactionHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  createdAt: string;
  confirmedAt?: string;
  explorerUrl: string;
}

// Helper functions
export function calculateCreditsFromUSDT(usdtAmount: number): number {
  return Math.floor(usdtAmount * USDT_PRICING.USDT_TO_CREDITS_RATE);
}

export function calculateUSDTFromCredits(credits: number): number {
  return credits / USDT_PRICING.USDT_TO_CREDITS_RATE;
}

// Get available networks for a specific wallet type
export function getNetworksByWalletType(walletType: WalletType): USDTNetwork[] {
  return SUPPORTED_USDT_NETWORKS.filter(network => network.walletType === walletType);
}

// Get available networks based on connected wallets
export function getAvailableNetworks(connectedWallets: {
  phantom?: boolean;
  pera?: boolean;
  metamask?: boolean;
}): USDTNetwork[] {
  const availableNetworks: USDTNetwork[] = [];
  
  if (connectedWallets.phantom) {
    availableNetworks.push(...getNetworksByWalletType('phantom'));
  }
  
  if (connectedWallets.pera) {
    availableNetworks.push(...getNetworksByWalletType('pera'));
  }
  
  if (connectedWallets.metamask) {
    availableNetworks.push(...getNetworksByWalletType('metamask'));
  }
  
  return availableNetworks;
}

// Generate payment instructions for manual payments (EVM networks)
export function generatePaymentInstructions(network: USDTNetwork, usdtAmount: number): {
  receiverAddress: string;
  amount: string;
  contractAddress: string;
  explorerUrl: string;
  qrCodeData: string;
} {
  const amount = usdtAmount.toFixed(network.decimals);
  
  return {
    receiverAddress: network.receiverAddress,
    amount,
    contractAddress: network.contractAddress,
    explorerUrl: network.explorerUrl,
    qrCodeData: `${network.receiverAddress}?amount=${amount}&contract=${network.contractAddress}`
  };
}

// Main payment initiation function
export async function initiateUSDTPayment(
  userAddress: string,
  networkId: string,
  usdtAmount: number,
  walletInterface: any // Wallet-specific interface
): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
  try {
    const network = SUPPORTED_USDT_NETWORKS.find(n => n.id === networkId);
    if (!network) {
      throw new Error('Unsupported network');
    }

    // Route to appropriate payment handler
    switch (network.walletType) {
      case 'phantom':
        return await initiateSolanaUSDTPayment(userAddress, network, usdtAmount, walletInterface);
      
      case 'pera':
        return await initiateAlgorandUSDTPayment(userAddress, network, usdtAmount, walletInterface);
      
      case 'metamask':
        return await initiateEVMUSDTPayment(userAddress, network, usdtAmount, walletInterface);
      
      default:
        throw new Error(`Unsupported wallet type: ${network.walletType}`);
    }
  } catch (error) {
    console.error('Payment initiation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown payment error'
    };
  }
}

// Solana USDT payment handler
async function initiateSolanaUSDTPayment(
  userAddress: string,
  network: USDTNetwork,
  usdtAmount: number,
  walletInterface: any
): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
  try {
    // Import Solana dependencies dynamically
    const { PublicKey, Transaction, SystemProgram } = await import('@solana/web3.js');
    const { TOKEN_PROGRAM_ID, createTransferInstruction, getAssociatedTokenAddress } = await import('@solana/spl-token');

    const connection = new (await import('@solana/web3.js')).Connection(
      network.isTestnet ? 'https://api.devnet.solana.com' : 'https://api.mainnet-beta.solana.com'
    );

    const fromPubkey = new PublicKey(userAddress);
    const toPubkey = new PublicKey(network.receiverAddress);
    const mintPubkey = new PublicKey(network.contractAddress);
    
    // Get associated token accounts
    const fromTokenAccount = await getAssociatedTokenAddress(mintPubkey, fromPubkey);
    const toTokenAccount = await getAssociatedTokenAddress(mintPubkey, toPubkey);
    
    // Calculate amount in smallest units
    const amount = BigInt(usdtAmount * Math.pow(10, network.decimals));
    
    // Create transfer instruction
    const transferInstruction = createTransferInstruction(
      fromTokenAccount,
      toTokenAccount,
      fromPubkey,
      amount,
      [],
      TOKEN_PROGRAM_ID
    );
    
    // Create transaction
    const transaction = new Transaction().add(transferInstruction);
    transaction.feePayer = fromPubkey;
    
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    
    // Sign and send transaction
    const signedTransaction = await walletInterface.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signedTransaction.serialize());
    
    // Confirm transaction
    await connection.confirmTransaction(signature);
    
    // Record payment
    await recordPayment(userAddress, network.id, network.walletType, usdtAmount, signature);
    
    return {
      success: true,
      transactionHash: signature
    };
  } catch (error) {
    console.error('Solana payment error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Solana payment failed'
    };
  }
}

// Algorand USDT payment handler
async function initiateAlgorandUSDTPayment(
  userAddress: string,
  network: USDTNetwork,
  usdtAmount: number,
  walletInterface: any
): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
  try {
    // Import Algorand SDK dynamically
    const algosdk = await import('algosdk');
    
    const algodToken = '';
    const algodServer = network.isTestnet 
      ? 'https://testnet-api.algonode.cloud'
      : 'https://mainnet-api.algonode.cloud';
    const algodPort = '';
    
    const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);
    
    // Get suggested params
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Calculate amount in smallest units
    const amount = Math.floor(usdtAmount * Math.pow(10, network.decimals));
    
    // Create asset transfer transaction
    // Create asset transfer transaction
    const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      sender: userAddress,
      receiver: network.receiverAddress,
      amount,
      assetIndex: parseInt(network.contractAddress),
      suggestedParams
    });
    
    // Sign transaction using wallet
    const signedTxn = await walletInterface.signTransaction(txn);
    
    // Submit transaction
    const result = await algodClient.sendRawTransaction(signedTxn).do();
    const txId = result.txid;
    
    // Wait for confirmation
    await algosdk.waitForConfirmation(algodClient, txId, 3);
    
    // Record payment
    await recordPayment(userAddress, network.id, network.walletType, usdtAmount, txId);
    
    return {
      success: true,
      transactionHash: txId
    };
  } catch (error) {
    console.error('Algorand payment error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Algorand payment failed'
    };
  }
}

// EVM USDT payment handler (existing functionality)
async function initiateEVMUSDTPayment(
  userAddress: string,
  network: USDTNetwork,
  usdtAmount: number,
  walletInterface: any
): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
  try {
    // Use existing EVM wallet integration
    // For EVM networks, use the existing EVM integration (simplified)
    // This would be implemented using the existing EVM wallet functions
    // For now, return a placeholder that indicates manual payment needed
    return {
      success: false,
      error: 'EVM payments require manual implementation via existing wallet integration'
    };
  } catch (error) {
    console.error('EVM payment error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'EVM payment failed'
    };
  }
}

// Record payment in database and award credits
async function recordPayment(
  userAddress: string,
  networkId: string,
  walletType: WalletType,
  usdtAmount: number,
  transactionHash: string
): Promise<void> {
  try {
    const creditsAwarded = calculateCreditsFromUSDT(usdtAmount);
    const network = SUPPORTED_USDT_NETWORKS.find(n => n.id === networkId)!;
    
    const payment: Partial<USDTPaymentTransaction> = {
      userAddress,
      networkId,
      walletType,
      usdtAmount,
      creditsAwarded,
      transactionHash,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      confirmedAt: new Date().toISOString(),
      explorerUrl: `${network.explorerUrl}/tx/${transactionHash}`
    };
    
    // Save to database if available
    if (isSupabaseAvailable()) {
      await supabase.from('usdt_payments').insert(payment);
    }
    
    // Award credits
    await addCreditTransaction(
      userAddress,
      'purchase',
      creditsAwarded,
      `USDT payment on ${network.displayName}`,
      {
        referenceId: transactionHash,
        paymentMethod: 'usdt',
        transactionHash,
        status: 'completed',
        metadata: {
          networkId,
          usdtAmount
        }
      }
    );
    
    console.log(`Payment recorded: ${usdtAmount} USDT = ${creditsAwarded} credits`);
  } catch (error) {
    console.error('Error recording payment:', error);
    // Don't throw - payment was successful even if recording failed
  }
}

// Get payment history
export async function getUSDTPaymentHistory(userAddress: string): Promise<USDTPaymentTransaction[]> {
  try {
    if (!isSupabaseAvailable()) {
      return [];
    }
    
    const { data, error } = await supabase
      .from('usdt_payments')
      .select('*')
      .eq('userAddress', userAddress)
      .order('createdAt', { ascending: false });
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return [];
  }
}

// Get payment options based on connected wallets
export async function getUSDTPaymentOptions(connectedWallets: {
  phantom?: boolean;
  pera?: boolean;
  metamask?: boolean;
}): Promise<USDTNetwork[]> {
  return getAvailableNetworks(connectedWallets);
}
