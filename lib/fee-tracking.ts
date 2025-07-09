/**
 * Fee Tracking System for Snarbles Platform
 * Handles database operations for fee collection analytics
 */

import { supabase } from '@/lib/supabase-client';

// Type definitions
export interface FeeCollectionRecord {
  id?: string;
  group_id: string;
  amount_microalgos: number;
  network: string;
  user_address: string;
  fee_transaction_id?: string;
  token_transaction_id?: string;
  asset_id?: number;
  timestamp?: string;
  status: 'pending' | 'confirmed' | 'failed';
}

export interface FeeAnalytics {
  network: string;
  status: string;
  transaction_count: number;
  total_microalgos: number;
  total_algos: number;
  average_fee_algos: number;
  first_transaction: string;
  last_transaction: string;
}

export interface DailyFeeStats {
  date: string;
  network: string;
  status: string;
  transaction_count: number;
  total_algos: number;
}

export interface UserFeeHistory {
  user_address: string;
  network: string;
  total_transactions: number;
  total_fees_paid: number;
  successful_transactions: number;
  failed_transactions: number;
  first_transaction: string;
  last_transaction: string;
}

/**
 * Track a new fee collection
 */
export async function trackFeeCollection(feeData: FeeCollectionRecord): Promise<{
  success: boolean;
  data?: FeeCollectionRecord;
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('fee_collections')
      .insert([{
        group_id: feeData.group_id,
        amount_microalgos: feeData.amount_microalgos,
        network: feeData.network,
        user_address: feeData.user_address,
        fee_transaction_id: feeData.fee_transaction_id,
        token_transaction_id: feeData.token_transaction_id,
        asset_id: feeData.asset_id,
        status: feeData.status,
        timestamp: feeData.timestamp || new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Error tracking fee collection:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Fee collection tracked:', data.group_id);
    return { success: true, data };
  } catch (error) {
    console.error('Error tracking fee collection:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to track fee collection' 
    };
  }
}

/**
 * Update fee collection status
 */
export async function updateFeeStatus(
  groupId: string, 
  status: 'confirmed' | 'failed',
  additionalData?: {
    fee_transaction_id?: string;
    token_transaction_id?: string;
    asset_id?: number;
  }
): Promise<{
  success: boolean;
  data?: FeeCollectionRecord;
  error?: string;
}> {
  try {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    // Add additional data if provided
    if (additionalData?.fee_transaction_id) {
      updateData.fee_transaction_id = additionalData.fee_transaction_id;
    }
    if (additionalData?.token_transaction_id) {
      updateData.token_transaction_id = additionalData.token_transaction_id;
    }
    if (additionalData?.asset_id) {
      updateData.asset_id = additionalData.asset_id;
    }

    const { data, error } = await supabase
      .from('fee_collections')
      .update(updateData)
      .eq('group_id', groupId)
      .select()
      .single();

    if (error) {
      console.error('Error updating fee status:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Fee status updated to ${status}:`, groupId);
    return { success: true, data };
  } catch (error) {
    console.error('Error updating fee status:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update fee status' 
    };
  }
}

/**
 * Get fee analytics
 */
export async function getFeeAnalytics(): Promise<{
  success: boolean;
  data?: FeeAnalytics[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('fee_analytics')
      .select('*');

    if (error) {
      console.error('Error fetching fee analytics:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error fetching fee analytics:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch fee analytics' 
    };
  }
}

/**
 * Get daily fee statistics
 */
export async function getDailyFeeStats(limit: number = 30): Promise<{
  success: boolean;
  data?: DailyFeeStats[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('daily_fee_stats')
      .select('*')
      .limit(limit);

    if (error) {
      console.error('Error fetching daily fee stats:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error fetching daily fee stats:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch daily fee stats' 
    };
  }
}

/**
 * Get user fee history
 */
export async function getUserFeeHistory(userAddress?: string): Promise<{
  success: boolean;
  data?: UserFeeHistory[];
  error?: string;
}> {
  try {
    let query = supabase.from('user_fee_history').select('*');
    
    if (userAddress) {
      query = query.eq('user_address', userAddress);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching user fee history:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error fetching user fee history:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch user fee history' 
    };
  }
}

/**
 * Get total platform revenue
 */
export async function getPlatformRevenue(): Promise<{
  success: boolean;
  data?: {
    totalAlgo: number;
    totalTransactions: number;
    confirmedTransactions: number;
    mainnetRevenue: number;
    testnetRevenue: number;
  };
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('fee_analytics')
      .select('*');

    if (error) {
      return { success: false, error: error.message };
    }

    // Calculate totals
    const totals = data.reduce((acc, record) => {
      if (record.status === 'confirmed') {
        acc.totalAlgo += record.total_algos || 0;
        acc.confirmedTransactions += record.transaction_count || 0;
        
        if (record.network === 'algorand-mainnet') {
          acc.mainnetRevenue += record.total_algos || 0;
        } else if (record.network === 'algorand-testnet') {
          acc.testnetRevenue += record.total_algos || 0;
        }
      }
      
      acc.totalTransactions += record.transaction_count || 0;
      return acc;
    }, {
      totalAlgo: 0,
      totalTransactions: 0,
      confirmedTransactions: 0,
      mainnetRevenue: 0,
      testnetRevenue: 0
    });

    return { success: true, data: totals };
  } catch (error) {
    console.error('Error calculating platform revenue:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to calculate platform revenue' 
    };
  }
}

/**
 * Helper function to create fee tracking record from token creation result
 */
export function createFeeTrackingRecord(
  groupId: string,
  feeAmount: number,
  network: string,
  userAddress: string,
  status: 'pending' | 'confirmed' | 'failed' = 'pending'
): FeeCollectionRecord {
  return {
    group_id: groupId,
    amount_microalgos: feeAmount,
    network: network,
    user_address: userAddress,
    status: status,
    timestamp: new Date().toISOString()
  };
} 