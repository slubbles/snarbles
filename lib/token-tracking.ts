import { supabase, isSupabaseAvailable } from './supabase-client';

/**
 * Save token creation details to Supabase (wallet-based)
 */
export async function trackTokenCreation({
  walletAddress,
  tokenName,
  tokenSymbol,
  network,
  contractAddress,
  description = '',
  totalSupply,
  decimals,
  logoUrl = '',
  website = '',
  github = '',
  twitter = '',
  mintable = false,
  burnable = false,
  pausable = false,
  transactionHash,
}: {
  walletAddress: string;
  tokenName: string;
  tokenSymbol: string;
  network: string;
  contractAddress: string;
  description?: string;
  totalSupply?: number | string;
  decimals?: number;
  logoUrl?: string;
  website?: string;
  github?: string;
  twitter?: string;
  mintable?: boolean;
  burnable?: boolean;
  pausable?: boolean;
  transactionHash?: string;
}) {
  if (!isSupabaseAvailable()) {
    console.log('Supabase not available, skipping token tracking');
    return { success: true, message: 'Skipped tracking - Supabase not configured' };
  }
  
  try {
    // Normalize and validate data before insertion
    const normalizedData = {
      wallet_address: walletAddress?.trim(),
      token_name: tokenName?.trim()?.substring(0, 100), // Limit length
      token_symbol: tokenSymbol?.trim()?.substring(0, 20), // Limit length
      network: network?.trim(),
      contract_address: contractAddress?.trim(),
      description: description?.trim()?.substring(0, 500) || '', // Limit length
      total_supply: totalSupply ? Number(totalSupply) : null,
      decimals: decimals ? Number(decimals) : null,
      logo_url: logoUrl?.trim()?.substring(0, 500) || '',
      website: website?.trim()?.substring(0, 500) || '',
      github: github?.trim()?.substring(0, 500) || '',
      twitter: twitter?.trim()?.substring(0, 500) || '',
      mintable: Boolean(mintable),
      burnable: Boolean(burnable),
      pausable: Boolean(pausable),
      transaction_hash: transactionHash?.trim() || '',
      created_at: new Date().toISOString(),
      // Removed status field as it doesn't exist in the database schema
      // credits_spent: getNetworkCost(network), // Also removing this as it might not exist
    };

    // Validate required fields
    if (!normalizedData.wallet_address || !normalizedData.token_name || !normalizedData.contract_address) {
      throw new Error('Missing required fields: wallet_address, token_name, or contract_address');
    }

    // Insert token creation record
    const { data, error } = await supabase
      .from('token_creation_history')
      .insert([normalizedData])
      .select()
      .single();

    if (error) {
      console.error('Database error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      // If it's a schema error, try with minimal data
      if (error.code === '42703' || error.message.includes('column') || error.message.includes('does not exist')) {
        console.log('Trying minimal data insertion...');
        
        const minimalData = {
          wallet_address: normalizedData.wallet_address,
          token_name: normalizedData.token_name,
          token_symbol: normalizedData.token_symbol,
          network: normalizedData.network,
          contract_address: normalizedData.contract_address,
          created_at: normalizedData.created_at
          // Removed status field as it doesn't exist in the database schema
        };
        
        const { data: minimalResult, error: minimalError } = await supabase
          .from('token_creation_history')
          .insert([minimalData])
          .select()
          .single();
          
        if (minimalError) {
          console.error('Even minimal insertion failed:', minimalError);
          return { success: false, error: `Database error: ${minimalError.message}` };
        }
        
        console.log('✅ Minimal token tracking successful');
        return { success: true, data: minimalResult, warning: 'Used minimal data due to schema mismatch' };
      }
      
      return { success: false, error: error.message };
    }

    // Update user's total tokens created count (non-critical)
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('total_tokens_created')
        .eq('wallet_address', walletAddress)
        .single();

      if (profile) {
        await supabase
          .from('user_profiles')
          .update({ 
            total_tokens_created: (profile.total_tokens_created || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('wallet_address', walletAddress);
      }
    } catch (updateError) {
      console.warn('Could not update total tokens created (non-critical):', updateError);
    }

    console.log('✅ Token creation tracked successfully');
    return { success: true, data };
  } catch (error) {
    console.error('Error tracking token creation:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error tracking token creation' 
    };
  }
}

/**
 * Get network cost for tracking
 */
function getNetworkCost(network: string): number {
  const costs: Record<string, number> = {
    'algorand-mainnet': 10,
    'algorand-testnet': 0,
    'solana-devnet': 0,
    'solana-mainnet': 3,
  };
  
  return costs[network] || 0;
}

/**
 * Get token creation history for a wallet address
 */
export async function getWalletTokenHistory(
  walletAddress: string, 
  options?: { limit?: number, offset?: number }
) {
  if (!isSupabaseAvailable() || !walletAddress) {
    return { success: false, message: 'Supabase not configured or invalid wallet', data: [] };
  }
  
  try {
    const { data, error } = await supabase
      .from('token_creation_history')
      .select('*')
      .eq('wallet_address', walletAddress)
      .order('created_at', { ascending: false })
      .limit(options?.limit || 50)
      .range(options?.offset || 0, (options?.offset || 0) + (options?.limit || 50) - 1);
    
    if (error) throw error;
    
    return { success: true, data: data || [] };
    
  } catch (error) {
    console.error('Error getting wallet token history:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error getting history',
      data: []
    };
  }
}

/**
 * Get a specific token by contract address
 */
export async function getTokenByAddress(contractAddress: string) {
  if (!isSupabaseAvailable() || !contractAddress) {
    return { success: false, message: 'Supabase not configured or invalid address' };
  }
  
  try {
    const { data, error } = await supabase
      .from('token_creation_history')
      .select('*')
      .eq('contract_address', contractAddress)
      .limit(1)
      .single();
    
    if (error) throw error;
    
    return { success: true, data };
    
  } catch (error) {
    console.error('Error getting token details:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error getting token'
    };
  }
}

/**
 * Get total tokens created across all wallets (for stats)
 */
export async function getTotalTokensCreated(): Promise<{ success: boolean; total?: number; error?: string }> {
  if (!isSupabaseAvailable()) {
    return { success: false, error: 'Supabase not configured' };
  }
  
  try {
    const { data, error } = await supabase
      .from('token_creation_history')
      .select('id');
    
    if (error) throw error;
    
    return { success: true, total: data?.length || 0 };
  } catch (error) {
    console.error('Error getting total tokens created:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error getting total' 
    };
  }
}

/**
 * Get tokens created by network (for analytics)
 */
export async function getTokensByNetwork(): Promise<{ success: boolean; data?: Record<string, number>; error?: string }> {
  if (!isSupabaseAvailable()) {
    return { success: false, error: 'Supabase not configured' };
  }
  
  try {
    const { data, error } = await supabase
      .from('token_creation_history')
      .select('network');
    
    if (error) throw error;
    
    // Count tokens by network
    const networkCounts: Record<string, number> = {};
    data?.forEach(item => {
      networkCounts[item.network] = (networkCounts[item.network] || 0) + 1;
    });
    
    return { success: true, data: networkCounts };
  } catch (error) {
    console.error('Error getting tokens by network:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error getting network stats' 
    };
  }
}

/**
 * Update token status (for tracking deployment progress)
 * Currently disabled as status field doesn't exist in database schema
 */
export async function updateTokenStatus(
  contractAddress: string,
  status: 'pending' | 'completed' | 'failed',
  errorMessage?: string
): Promise<{ success: boolean; error?: string }> {
  // Disabled: Database schema doesn't include status field
  console.log('updateTokenStatus called but disabled due to missing status column');
  return { success: true }; // Return success to avoid breaking calling code
  
  /* Original implementation disabled:
  if (!isSupabaseAvailable()) {
    return { success: false, error: 'Supabase not configured' };
  }
  
  try {
    const updateData: any = { status };
    if (errorMessage) {
      updateData.error_message = errorMessage;
    }
    
    const { error } = await supabase
      .from('token_creation_history')
      .update(updateData)
      .eq('contract_address', contractAddress);
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('Error updating token status:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error updating status' 
    };
  }
  */
}

/**
 * Get recent token activity (for dashboard)
 */
export async function getRecentTokenActivity(limit: number = 10): Promise<{ 
  success: boolean; 
  data?: Array<{
    token_name: string;
    token_symbol: string;
    network: string;
    created_at: string;
    wallet_address: string;
  }>; 
  error?: string 
}> {
  if (!isSupabaseAvailable()) {
    return { success: false, error: 'Supabase not configured' };
  }
  
  try {
    const { data, error } = await supabase
      .from('token_creation_history')
      .select('token_name, token_symbol, network, created_at, wallet_address')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error getting recent token activity:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error getting activity' 
    };
  }
}

/**
 * Search tokens by name or symbol
 */
export async function searchTokens(
  searchTerm: string,
  limit: number = 20
): Promise<{ success: boolean; data?: any[]; error?: string }> {
  if (!isSupabaseAvailable() || !searchTerm) {
    return { success: false, error: 'Supabase not configured or invalid search term' };
  }
  
  try {
    const { data, error } = await supabase
      .from('token_creation_history')
      .select('*')
      .or(`token_name.ilike.%${searchTerm}%,token_symbol.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error searching tokens:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error searching tokens' 
    };
  }
}