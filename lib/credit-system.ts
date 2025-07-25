import { supabase, isSupabaseAvailable } from './supabase-client';

// User profile interface (updated for wallet-based auth)
export interface UserProfile {
  wallet_address: string;  // Primary key (was user_id)
  wallet_type: 'solana' | 'algorand';
  network: string;
  created_at: string;
  updated_at: string;
  credits_balance: number;
  total_tokens_created: number;
}

// Credit transaction types
export type CreditTransactionType = 'purchase' | 'spend' | 'refund' | 'bonus' | 'adjustment' | 'initial' | 'usage';

// Credit transaction interface (updated for wallet-based auth)
export interface CreditTransaction {
  id: string;
  wallet_address: string;
  type: CreditTransactionType;
  amount: number;
  timestamp: string;
  description?: string;
  transaction_reference?: string;
  network: string;
}

// Token creation history interface (updated for wallet-based auth)
export interface TokenCreationRecord {
  id: string;
  wallet_address: string;  // Foreign key (was user_id)
  token_name: string;
  token_symbol: string;
  network: string;
  contract_address: string;
  created_at: string;
  description?: string;
  total_supply?: number;
  decimals?: number;
  logo_url?: string;
  website?: string;
  github?: string;
  twitter?: string;
  telegram?: string;
  mintable: boolean;
  burnable: boolean;
  pausable: boolean;
  transaction_hash?: string;
  credits_spent: number;
  status: 'pending' | 'completed' | 'failed';
  error_message?: string;
}

/**
 * Get user profile with credits information by wallet address
 */
export async function getUserProfile(walletAddress: string): Promise<{ success: boolean; data?: UserProfile; error?: string }> {
  if (!isSupabaseAvailable()) {
    return { success: false, error: 'Supabase is not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: 'Profile not found for this wallet address' };
      }
      
      console.error('Error fetching user profile:', error);
      return { success: false, error: 'Failed to fetch user profile' };
    }

    return { success: true, data: data as UserProfile };
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Create a new user profile for wallet address
 */
export async function createUserProfile(
  walletAddress: string,
  walletType: 'solana' | 'algorand',
  network: string = 'testnet'
): Promise<{ success: boolean; data?: UserProfile; error?: string }> {
  if (!isSupabaseAvailable()) {
    return { success: false, error: 'Supabase is not configured' };
  }

  try {
    const newProfile: Partial<UserProfile> = {
      wallet_address: walletAddress,
      wallet_type: walletType,
      network: network,
      credits_balance: 10, // Default free credits
      total_tokens_created: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: createdProfile, error: createError } = await supabase
      .from('user_profiles')
      .insert([newProfile])
      .select()
      .single();

    if (createError) {
      console.error('Error creating user profile:', createError);
      return { success: false, error: 'Failed to create user profile' };
    }

    return { success: true, data: createdProfile as UserProfile };
  } catch (error) {
    console.error('Error in createUserProfile:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  walletAddress: string,
  updates: Partial<UserProfile>
): Promise<{ success: boolean; data?: UserProfile; error?: string }> {
  if (!isSupabaseAvailable()) {
    return { success: false, error: 'Supabase is not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('wallet_address', walletAddress)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile:', error);
      return { success: false, error: 'Failed to update user profile' };
    }

    return { success: true, data: data as UserProfile };
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Add a credit transaction
 */
export async function addCreditTransaction(
  walletAddress: string,
  type: CreditTransactionType,
  amount: number,
  description: string,
  options: {
    referenceId?: string;
    paymentMethod?: string;
    paymentAddress?: string;
    transactionHash?: string;
    status?: 'pending' | 'completed' | 'failed' | 'refunded';
    metadata?: any;
  } = {}
): Promise<{ success: boolean; data?: CreditTransaction; error?: string }> {
  if (!isSupabaseAvailable()) {
    return { success: false, error: 'Supabase is not configured' };
  }

  try {
    const transaction: Partial<CreditTransaction> = {
      wallet_address: walletAddress,
      type: type === 'purchase' ? 'initial' : type === 'spend' ? 'usage' : type, // Map to schema values
      amount,
      description,
      transaction_reference: options.transactionHash || options.referenceId,
      network: 'mainnet', // Default to mainnet for real transactions
      timestamp: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('credit_transactions')
      .insert([transaction])
      .select()
      .single();

    if (error) {
      console.error('Error adding credit transaction:', error);
      return { success: false, error: 'Failed to add credit transaction' };
    }

    return { success: true, data: data as CreditTransaction };
  } catch (error) {
    console.error('Error in addCreditTransaction:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Get credits balance for wallet
 */
export async function getCreditsBalance(walletAddress: string): Promise<{ success: boolean; balance?: number; error?: string }> {
  if (!isSupabaseAvailable()) {
    return { success: false, error: 'Supabase is not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('credits_balance')
      .eq('wallet_address', walletAddress)
      .single();

    if (error) {
      console.error('Error getting credits balance:', error);
      return { success: false, error: 'Failed to get credits balance' };
    }

    return { success: true, balance: data?.credits_balance || 0 };
  } catch (error) {
    console.error('Error in getCreditsBalance:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Update credits balance
 */
export async function updateCreditsBalance(
  walletAddress: string,
  newBalance: number
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseAvailable()) {
    return { success: false, error: 'Supabase is not configured' };
  }

  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({ 
        credits_balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('wallet_address', walletAddress);

    if (error) {
      console.error('Error updating credits balance:', error);
      return { success: false, error: 'Failed to update credits balance' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in updateCreditsBalance:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Check if wallet has sufficient credits
 */
export async function hasEnoughCredits(
  walletAddress: string,
  requiredCredits: number
): Promise<{ success: boolean; hasEnough?: boolean; currentBalance?: number; error?: string }> {
  const balanceResult = await getCreditsBalance(walletAddress);
  
  if (!balanceResult.success) {
    return { success: false, error: balanceResult.error };
  }

  const currentBalance = balanceResult.balance || 0;
  return {
    success: true,
    hasEnough: currentBalance >= requiredCredits,
    currentBalance
  };
}

/**
 * Spend credits for token creation (atomic operation)
 */
export async function spendCreditsForTokenCreation(
  walletAddress: string,
  creditsToSpend: number,
  description: string
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  if (!isSupabaseAvailable()) {
    return { success: false, error: 'Supabase is not configured' };
  }

  try {
    // First check if wallet has enough credits
    const balanceCheck = await hasEnoughCredits(walletAddress, creditsToSpend);
    
    if (!balanceCheck.success) {
      return { success: false, error: balanceCheck.error };
    }

    if (!balanceCheck.hasEnough) {
      return { 
        success: false, 
        error: `Insufficient credits. Need ${creditsToSpend}, have ${balanceCheck.currentBalance}` 
      };
    }

    const newBalance = (balanceCheck.currentBalance || 0) - creditsToSpend;

    // Update balance
    const updateResult = await updateCreditsBalance(walletAddress, newBalance);
    
    if (!updateResult.success) {
      return { success: false, error: updateResult.error };
    }

    // Record the transaction
    await addCreditTransaction(
      walletAddress,
      'spend',
      -creditsToSpend, // Negative amount for spending
      description
    );

    return { success: true, newBalance };
  } catch (error) {
    console.error('Error in spendCreditsForTokenCreation:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Add token creation record to history
 */
export async function addTokenCreationRecord(
  walletAddress: string,
  record: Omit<TokenCreationRecord, 'id' | 'created_at' | 'wallet_address'>
): Promise<{ success: boolean; data?: TokenCreationRecord; error?: string }> {
  if (!isSupabaseAvailable()) {
    return { success: false, error: 'Supabase is not configured' };
  }

  try {
    const tokenRecord: Partial<TokenCreationRecord> = {
      wallet_address: walletAddress,
      token_name: record.token_name,
      token_symbol: record.token_symbol,
      network: record.network,
      contract_address: record.contract_address,
      description: record.description,
      total_supply: record.total_supply,
      decimals: record.decimals,
      logo_url: record.logo_url,
      website: record.website,
      github: record.github,
      twitter: record.twitter,
      telegram: record.telegram,
      mintable: record.mintable,
      burnable: record.burnable,
      pausable: record.pausable,
      transaction_hash: record.transaction_hash,
      credits_spent: record.credits_spent,
      status: record.status,
      error_message: record.error_message,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('token_creation_history')
      .insert([tokenRecord])
      .select()
      .single();

    if (error) {
      console.error('Error adding token creation record:', error);
      return { success: false, error: 'Failed to add token creation record' };
    }

    // Also increment the total tokens created count
    const profile = await getUserProfile(walletAddress);
    if (profile.success && profile.data) {
      await updateUserProfile(walletAddress, {
        total_tokens_created: (profile.data.total_tokens_created || 0) + 1
      });
    }

    return { success: true, data: data as TokenCreationRecord };
  } catch (error) {
    console.error('Error in addTokenCreationRecord:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Get token creation history for wallet
 */
export async function getTokenHistory(
  walletAddress: string,
  limit: number = 50
): Promise<{ success: boolean; data?: TokenCreationRecord[]; error?: string }> {
  if (!isSupabaseAvailable()) {
    return { success: false, error: 'Supabase is not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('token_creation_history')
      .select('*')
      .eq('wallet_address', walletAddress)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error getting token history:', error);
      return { success: false, error: 'Failed to get token history' };
    }

    return { success: true, data: data as TokenCreationRecord[] || [] };
  } catch (error) {
    console.error('Error in getTokenHistory:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Get credit transaction history for wallet
 */
export async function getCreditHistory(
  walletAddress: string,
  limit: number = 50
): Promise<{ success: boolean; data?: CreditTransaction[]; error?: string }> {
  if (!isSupabaseAvailable()) {
    return { success: false, error: 'Supabase is not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('wallet_address', walletAddress)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error getting credit history:', error);
      return { success: false, error: 'Failed to get credit history' };
    }

    return { success: true, data: data as CreditTransaction[] || [] };
  } catch (error) {
    console.error('Error in getCreditHistory:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Get network cost for token creation
 */
export function getNetworkCost(network: string): number {
  const costs: Record<string, number> = {
    'algorand-mainnet': 5,
    'algorand-testnet': 0,
    'solana-devnet': 0,
    'solana-mainnet': 3,
  };
  
  return costs[network] || 0;
}

/**
 * Format credits amount for display
 */
export function formatCredits(amount: number): string {
  return `${amount.toLocaleString()} credit${amount !== 1 ? 's' : ''}`;
}

/**
 * Format network name for display
 */
export function formatNetworkName(network: string): string {
  const networkMap: { [key: string]: string } = {
    'algorand-mainnet': 'Algorand Mainnet',
    'algorand-testnet': 'Algorand Testnet',
    'solana-mainnet': 'Solana Mainnet',
    'solana-devnet': 'Solana Devnet',
    'solana-testnet': 'Solana Testnet',
  };
  
  return networkMap[network] || network;
} 