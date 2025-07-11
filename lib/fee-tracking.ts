/**
 * Fee Tracking System for Snarbles Platform
 * Handles database operations for fee collection analytics
 */

import { supabase, isSupabaseAvailable } from './supabase-client';

// Fee collection interface (updated for wallet-based auth)
export interface FeeCollection {
  id: string;
  wallet_address: string;  // Foreign key (was user_id)
  network: string;
  amount_collected: number;
  token_symbol: string;
  collection_type: 'token_creation' | 'transaction' | 'platform_fee' | 'gas_optimization';
  transaction_hash?: string;
  block_number?: number;
  collected_at: string;
  metadata?: any;
}

/**
 * Track fee collection for a wallet address
 */
export async function trackFeeCollection({
  walletAddress,
  network,
  amountCollected,
  tokenSymbol,
  collectionType,
  transactionHash,
  blockNumber,
  metadata = {}
}: {
  walletAddress: string;
  network: string;
  amountCollected: number;
  tokenSymbol: string;
  collectionType: 'token_creation' | 'transaction' | 'platform_fee' | 'gas_optimization';
  transactionHash?: string;
  blockNumber?: number;
  metadata?: any;
}): Promise<{ success: boolean; data?: FeeCollection; error?: string }> {
  if (!isSupabaseAvailable()) {
    console.log('Supabase not available, skipping fee tracking');
    return { success: true, error: 'Supabase not configured' };
  }

  try {
    const feeRecord: Partial<FeeCollection> = {
      wallet_address: walletAddress,
      network,
      amount_collected: amountCollected,
      token_symbol: tokenSymbol,
      collection_type: collectionType,
      transaction_hash: transactionHash,
      block_number: blockNumber,
      collected_at: new Date().toISOString(),
      metadata
    };

    const { data, error } = await supabase
      .from('fee_collections')
      .insert([feeRecord])
      .select()
      .single();

    if (error) {
      console.error('Error tracking fee collection:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Fee collection tracked: ${amountCollected} ${tokenSymbol} from ${walletAddress.slice(0, 8)}...`);
    return { success: true, data: data as FeeCollection };
  } catch (err) {
    console.error('Error in trackFeeCollection:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown error tracking fees' 
    };
  }
}

/**
 * Get fee collection history for a wallet address
 */
export async function getWalletFeeHistory(
  walletAddress: string,
  options: {
    limit?: number;
    offset?: number;
    network?: string;
    collectionType?: string;
  } = {}
): Promise<{ success: boolean; data?: FeeCollection[]; error?: string }> {
  if (!isSupabaseAvailable()) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    let query = supabase
      .from('fee_collections')
      .select('*')
      .eq('wallet_address', walletAddress)
      .order('collected_at', { ascending: false });

    if (options.network) {
      query = query.eq('network', options.network);
    }

    if (options.collectionType) {
      query = query.eq('collection_type', options.collectionType);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting wallet fee history:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as FeeCollection[] || [] };
  } catch (err) {
    console.error('Error in getWalletFeeHistory:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown error getting fee history' 
    };
  }
}

/**
 * Get total fees collected for a wallet address
 */
export async function getWalletTotalFees(
  walletAddress: string,
  network?: string
): Promise<{ success: boolean; total?: number; breakdown?: Record<string, number>; error?: string }> {
  if (!isSupabaseAvailable()) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    let query = supabase
      .from('fee_collections')
      .select('amount_collected, token_symbol, collection_type')
      .eq('wallet_address', walletAddress);

    if (network) {
      query = query.eq('network', network);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting wallet total fees:', error);
      return { success: false, error: error.message };
    }

    let total = 0;
    const breakdown: Record<string, number> = {};

    data?.forEach(record => {
      total += record.amount_collected;
      const key = `${record.token_symbol}_${record.collection_type}`;
      breakdown[key] = (breakdown[key] || 0) + record.amount_collected;
    });

    return { success: true, total, breakdown };
  } catch (err) {
    console.error('Error in getWalletTotalFees:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown error calculating total fees' 
    };
  }
}

/**
 * Get platform-wide fee analytics
 */
export async function getPlatformFeeAnalytics(): Promise<{ 
  success: boolean; 
  data?: {
    totalFeesCollected: number;
    feesByNetwork: Record<string, number>;
    feesByType: Record<string, number>;
    topCollectors: Array<{ wallet_address: string; total_fees: number }>;
  }; 
  error?: string 
}> {
  if (!isSupabaseAvailable()) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('fee_collections')
      .select('wallet_address, network, amount_collected, collection_type');

    if (error) {
      console.error('Error getting platform fee analytics:', error);
      return { success: false, error: error.message };
    }

    let totalFeesCollected = 0;
    const feesByNetwork: Record<string, number> = {};
    const feesByType: Record<string, number> = {};
    const walletTotals: Record<string, number> = {};

    data?.forEach(record => {
      totalFeesCollected += record.amount_collected;
      
      feesByNetwork[record.network] = (feesByNetwork[record.network] || 0) + record.amount_collected;
      feesByType[record.collection_type] = (feesByType[record.collection_type] || 0) + record.amount_collected;
      
      walletTotals[record.wallet_address] = (walletTotals[record.wallet_address] || 0) + record.amount_collected;
    });

    const topCollectors = Object.entries(walletTotals)
      .map(([wallet_address, total_fees]) => ({ wallet_address, total_fees }))
      .sort((a, b) => b.total_fees - a.total_fees)
      .slice(0, 10);

    return {
      success: true,
      data: {
        totalFeesCollected,
        feesByNetwork,
        feesByType,
        topCollectors
      }
    };
  } catch (err) {
    console.error('Error in getPlatformFeeAnalytics:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown error getting platform analytics' 
    };
  }
}

/**
 * Calculate estimated fees for a transaction
 */
export function calculateEstimatedFees(
  network: string,
  transactionType: 'token_creation' | 'transfer' | 'mint' | 'burn'
): { networkFee: number; platformFee: number; total: number; currency: string } {
  const feeSchedule: Record<string, Record<string, { networkFee: number; platformFee: number; currency: string }>> = {
    'algorand-mainnet': {
      token_creation: { networkFee: 0.1, platformFee: 0.05, currency: 'ALGO' },
      transfer: { networkFee: 0.001, platformFee: 0.001, currency: 'ALGO' },
      mint: { networkFee: 0.001, platformFee: 0.001, currency: 'ALGO' },
      burn: { networkFee: 0.001, platformFee: 0.001, currency: 'ALGO' }
    },
    'algorand-testnet': {
      token_creation: { networkFee: 0.1, platformFee: 0, currency: 'ALGO' },
      transfer: { networkFee: 0.001, platformFee: 0, currency: 'ALGO' },
      mint: { networkFee: 0.001, platformFee: 0, currency: 'ALGO' },
      burn: { networkFee: 0.001, platformFee: 0, currency: 'ALGO' }
    },
    'solana-mainnet': {
      token_creation: { networkFee: 0.01, platformFee: 0.005, currency: 'SOL' },
      transfer: { networkFee: 0.000005, platformFee: 0.000001, currency: 'SOL' },
      mint: { networkFee: 0.000005, platformFee: 0.000001, currency: 'SOL' },
      burn: { networkFee: 0.000005, platformFee: 0.000001, currency: 'SOL' }
    },
    'solana-devnet': {
      token_creation: { networkFee: 0.01, platformFee: 0, currency: 'SOL' },
      transfer: { networkFee: 0.000005, platformFee: 0, currency: 'SOL' },
      mint: { networkFee: 0.000005, platformFee: 0, currency: 'SOL' },
      burn: { networkFee: 0.000005, platformFee: 0, currency: 'SOL' }
    }
  };

  const fees = feeSchedule[network]?.[transactionType] || { networkFee: 0, platformFee: 0, currency: 'UNKNOWN' };
  
  return {
    networkFee: fees.networkFee,
    platformFee: fees.platformFee,
    total: fees.networkFee + fees.platformFee,
    currency: fees.currency
  };
}

/**
 * Track token creation fee
 */
export async function trackTokenCreationFee(
  walletAddress: string,
  network: string,
  tokenSymbol: string,
  transactionHash?: string
): Promise<{ success: boolean; error?: string }> {
  const feeEstimate = calculateEstimatedFees(network, 'token_creation');
  
  if (feeEstimate.platformFee > 0) {
    return await trackFeeCollection({
      walletAddress,
      network,
      amountCollected: feeEstimate.platformFee,
      tokenSymbol: feeEstimate.currency,
      collectionType: 'token_creation',
      transactionHash,
      metadata: {
        tokenSymbol,
        networkFee: feeEstimate.networkFee,
        platformFee: feeEstimate.platformFee
      }
    });
  }

  return { success: true }; // No platform fee to track
} 