/**
 * Multi-Network USDT Payment System for Credit Top-Up
 * 
 * Supports USDT payments from multiple blockchain networks
 * Funds go to: 0x9ca8362c35db2649614cd4029ab0067d285660ef
 */

import { supabase, isSupabaseAvailable } from './supabase-client';
import { getCreditsBalance, addCreditTransaction, updateCreditsBalance } from './credit-system';

// Receiving wallet address for all USDT payments
export const USDT_RECEIVER_ADDRESS = '0x9ca8362c35db2649614cd4029ab0067d285660ef';

// USDT pricing configuration
export const USDT_PRICING = {
  // 1 USDT = 1 credit (simple 1:1 ratio)
  USDT_TO_CREDITS_RATE: 1,
  
  // Minimum and maximum payment amounts
  MIN_USDT_AMOUNT: 1,
  MAX_USDT_AMOUNT: 1000,
  
  // Payment amounts for quick selection
  QUICK_AMOUNTS: [5, 10, 25, 50, 100]
};

// USDT Network interface
export interface USDTNetwork {
  name: string;
  displayName: string;
  chainId: number;
  contractAddress: string;
  explorerUrl: string;
  rpcUrl?: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

// Supported USDT networks and their contract addresses
export const SUPPORTED_USDT_NETWORKS: USDTNetwork[] = [
  {
    name: 'polygon',
    displayName: 'Polygon (MATIC)',
    chainId: 137,
    contractAddress: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    explorerUrl: 'https://polygonscan.com',
    rpcUrl: 'https://polygon-rpc.com',
    nativeCurrency: { name: 'Polygon', symbol: 'MATIC', decimals: 18 }
  },
  {
    name: 'bsc',
    displayName: 'BNB Smart Chain',
    chainId: 56,
    contractAddress: '0x55d398326f99059fF775485246999027B3197955',
    explorerUrl: 'https://bscscan.com',
    rpcUrl: 'https://bsc-dataseed.binance.org',
    nativeCurrency: { name: 'BNB Smart Chain', symbol: 'BNB', decimals: 18 }
  },
  {
    name: 'ethereum',
    displayName: 'Ethereum Mainnet',
    chainId: 1,
    contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    explorerUrl: 'https://etherscan.io',
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_KEY_HERE',
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 }
  },
  {
    name: 'arbitrum',
    displayName: 'Arbitrum One',
    chainId: 42161,
    contractAddress: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    explorerUrl: 'https://arbiscan.io',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    nativeCurrency: { name: 'Arbitrum', symbol: 'ETH', decimals: 18 }
  },
  {
    name: 'avalanche',
    displayName: 'Avalanche C-Chain',
    chainId: 43114,
    contractAddress: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
    explorerUrl: 'https://snowtrace.io',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 }
  },
  {
    name: 'optimism',
    displayName: 'Optimism',
    chainId: 10,
    contractAddress: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
    explorerUrl: 'https://optimistic.etherscan.io',
    rpcUrl: 'https://mainnet.optimism.io',
    nativeCurrency: { name: 'Optimism', symbol: 'ETH', decimals: 18 }
  }
];

// Payment status tracking
export interface USDTPaymentRecord {
  id: string;
  userId: string;
  networkName: string;
  transactionHash: string;
  fromAddress: string;
  toAddress: string;
  amount: number;
  creditsAwarded: number;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  confirmations: number;
  createdAt: Date;
  confirmedAt?: Date;
}

// Type alias for compatibility
export type USDTPaymentTransaction = USDTPaymentRecord;

/**
 * Get network configuration by name
 */
export function getNetworkByName(networkName: string): USDTNetwork | null {
  return SUPPORTED_USDT_NETWORKS.find(network => network.name === networkName) || null;
}

/**
 * Get network configuration by chain ID
 */
export function getNetworkByChainId(chainId: number): USDTNetwork | null {
  return SUPPORTED_USDT_NETWORKS.find(network => network.chainId === chainId) || null;
}

/**
 * Calculate credits from USDT amount
 */
export function calculateCreditsFromUSDT(usdtAmount: number): number {
  return Math.floor(usdtAmount * USDT_PRICING.USDT_TO_CREDITS_RATE);
}

/**
 * Calculate USDT amount from credits
 */
export function calculateUSDTFromCredits(credits: number): number {
  return credits / USDT_PRICING.USDT_TO_CREDITS_RATE;
}

/**
 * Validate USDT payment amount
 */
export function validateUSDTAmount(amount: number): { valid: boolean; error?: string } {
  if (amount < USDT_PRICING.MIN_USDT_AMOUNT) {
    return {
      valid: false,
      error: `Minimum payment amount is ${USDT_PRICING.MIN_USDT_AMOUNT} USDT`
    };
  }
  
  if (amount > USDT_PRICING.MAX_USDT_AMOUNT) {
    return {
      valid: false,
      error: `Maximum payment amount is ${USDT_PRICING.MAX_USDT_AMOUNT} USDT`
    };
  }
  
  return { valid: true };
}

/**
 * Generate payment instructions for manual payment
 */
export function generatePaymentInstructions(
  network: USDTNetwork,
  amount: number
): {
  title: string;
  steps: string[];
  warning: string;
  explorerLink: string;
} {
  const credits = calculateCreditsFromUSDT(amount);
  
  return {
    title: `Send ${amount} USDT on ${network.displayName}`,
    steps: [
      `Open your wallet app (MetaMask, Trust Wallet, etc.)`,
      `Make sure you're connected to ${network.displayName}`,
      `Send exactly ${amount} USDT to: ${USDT_RECEIVER_ADDRESS}`,
      `Save the transaction hash for verification`,
      `Wait for transaction confirmation`,
      `Your account will be credited with ${credits} credits automatically`
    ],
    warning: `⚠️ Important: Send exactly ${amount} USDT to the correct address on ${network.displayName}. Incorrect amounts or wrong networks may result in loss of funds.`,
    explorerLink: `${network.explorerUrl}/address/${USDT_RECEIVER_ADDRESS}`
  };
}

/**
 * Save USDT payment record to database
 */
export async function saveUSDTPaymentRecord(payment: Omit<USDTPaymentRecord, 'id' | 'createdAt'>): Promise<string | null> {
  if (!isSupabaseAvailable()) {
    console.warn('Supabase not available, payment record not saved');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('usdt_payments')
      .insert({
        ...payment,
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to save USDT payment record:', error);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error('Failed to save USDT payment record:', error);
    return null;
  }
}

/**
 * Update USDT payment status
 */
export async function updateUSDTPaymentStatus(
  paymentId: string,
  status: USDTPaymentRecord['status'],
  blockNumber?: number,
  confirmations?: number
): Promise<boolean> {
  if (!isSupabaseAvailable()) {
    console.warn('Supabase not available, payment status not updated');
    return false;
  }

  try {
    const updateData: any = {
      status,
      confirmations: confirmations || 0
    };

    if (status === 'confirmed') {
      updateData.confirmed_at = new Date().toISOString();
    }

    if (blockNumber) {
      updateData.block_number = blockNumber;
    }

    const { error } = await supabase
      .from('usdt_payments')
      .update(updateData)
      .eq('id', paymentId);

    if (error) {
      console.error('Failed to update payment status:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to update payment status:', error);
    return false;
  }
}

/**
 * Get user's USDT payment history
 */
export async function getUserUSDTPayments(userId: string): Promise<USDTPaymentRecord[]> {
  if (!isSupabaseAvailable()) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('usdt_payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to get user USDT payments:', error);
      return [];
    }

    return data.map(payment => ({
      id: payment.id,
      userId: payment.user_id,
      networkName: payment.network_name,
      transactionHash: payment.transaction_hash,
      fromAddress: payment.from_address,
      toAddress: payment.to_address,
      amount: payment.amount,
      creditsAwarded: payment.credits_awarded,
      status: payment.status,
      blockNumber: payment.block_number,
      confirmations: payment.confirmations,
      createdAt: new Date(payment.created_at),
      confirmedAt: payment.confirmed_at ? new Date(payment.confirmed_at) : undefined
    }));
  } catch (error) {
    console.error('Failed to get user USDT payments:', error);
    return [];
  }
}

/**
 * Process confirmed USDT payment (award credits)
 */
export async function processConfirmedUSDTPayment(
  userId: string,
  paymentId: string,
  amount: number,
  transactionHash: string,
  networkName: string
): Promise<boolean> {
  try {
    const credits = calculateCreditsFromUSDT(amount);
    
    // Add credit transaction
    const result = await addCreditTransaction(
      userId,
      'purchase',
      credits,
      `USDT payment: ${amount} USDT via ${networkName}`,
      {
        referenceId: paymentId,
        paymentMethod: 'usdt',
        transactionHash,
        status: 'completed',
        metadata: {
          networkName,
          usdtAmount: amount
        }
      }
    );

    if (result.success) {
      // Update payment status to confirmed
      await updateUSDTPaymentStatus(paymentId, 'confirmed');
      console.log(`Awarded ${credits} credits for USDT payment: ${transactionHash}`);
    }

    return result.success;
  } catch (error) {
    console.error('Failed to process confirmed USDT payment:', error);
    return false;
  }
}

/**
 * Get USDT payment options for UI
 */
export function getUSDTPaymentOptions() {
  return {
    success: true,
    options: {
      networks: SUPPORTED_USDT_NETWORKS.map(network => ({
        id: network.name,
        ...network
      })),
      pricing: USDT_PRICING,
      receiverAddress: USDT_RECEIVER_ADDRESS,
      quickAmounts: USDT_PRICING.QUICK_AMOUNTS
    }
  };
}

/**
 * Get USDT payment history (alias for getUserUSDTPayments)
 */
export async function getUSDTPaymentHistory(userId: string): Promise<{ success: boolean; payments: USDTPaymentRecord[] }> {
  try {
    const payments = await getUserUSDTPayments(userId);
    return { success: true, payments };
  } catch (error) {
    console.error('Failed to get USDT payment history:', error);
    return { success: false, payments: [] };
  }
}

/**
 * Initiate a USDT payment (creates a payment record)
 */
export async function initiateUSDTPayment(
  userId: string,
  networkName: string,
  amount: number,
  fromAddress: string
): Promise<{ success: boolean; paymentId?: string; paymentDetails?: any; error?: string }> {
  try {
    // Validate amount
    const validation = validateUSDTAmount(amount);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Get network info
    const network = getNetworkByName(networkName);
    if (!network) {
      return { success: false, error: 'Invalid network' };
    }

    // Create payment record
    const paymentRecord: Omit<USDTPaymentRecord, 'id' | 'createdAt'> = {
      userId,
      networkName,
      transactionHash: '', // Will be filled when transaction is sent
      fromAddress,
      toAddress: USDT_RECEIVER_ADDRESS,
      amount,
      creditsAwarded: calculateCreditsFromUSDT(amount),
      status: 'pending',
      confirmations: 0
    };

    const paymentId = await saveUSDTPaymentRecord(paymentRecord);
    
    if (paymentId) {
      const paymentDetails = {
        paymentId,
        network,
        amount,
        credits: calculateCreditsFromUSDT(amount),
        toAddress: USDT_RECEIVER_ADDRESS,
        instructions: generatePaymentInstructions(network, amount)
      };
      
      return { success: true, paymentId, paymentDetails };
    } else {
      return { success: false, error: 'Failed to create payment record' };
    }
  } catch (error) {
    console.error('Failed to initiate USDT payment:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}
