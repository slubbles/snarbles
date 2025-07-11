import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with environment variables
const supabaseUrl = 'https://gsrzxzrpxtyjddqkperq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzcnp4enJweHR5amRkcWtwZXJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwMjA0MjQsImV4cCI6MjA1NzU5NjQyNH0.hRXbfLbDtkC2Hbh6ZlVJzT-RsgbogZZ_YGeX6FOcYPI';

// Update isSupabaseConfigured to check for non-placeholder values
const isSupabaseConfigured = 
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.trim() !== '' &&
  supabaseAnonKey.trim() !== '' &&
  !supabaseUrl.includes('placeholder') && 
  !supabaseAnonKey.includes('placeholder');

// Create Supabase client with proper error handling
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl! : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey! : 'placeholder-anon-key'
);

export const isSupabaseAvailable = () => isSupabaseConfigured;

// Wallet-based authentication functions (replacing email/password auth)

/**
 * Get user profile by wallet address
 */
export async function getUserProfileByWallet(walletAddress: string) {
  if (!isSupabaseConfigured) return { error: 'Supabase is not configured' };
  
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error getting user profile:', error);
    return { error: error.message || 'An error occurred while getting user profile' };
  }
}

/**
 * Create a new user profile for a wallet address
 */
export async function createUserProfile(
  walletAddress: string,
  walletType: 'solana' | 'algorand',
  network: string = 'testnet'
) {
  if (!isSupabaseConfigured) return { error: 'Supabase is not configured' };
  
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert([{
        wallet_address: walletAddress,
        wallet_type: walletType,
        network: network,
        credits_balance: 10, // Default credits
        total_tokens_created: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error creating user profile:', error);
    return { error: error.message || 'An error occurred while creating user profile' };
  }
}

/**
 * Update user profile by wallet address
 */
export async function updateUserProfile(
  walletAddress: string,
  updates: {
    network?: string;
    credits_balance?: number;
    total_tokens_created?: number;
  }
) {
  if (!isSupabaseConfigured) return { error: 'Supabase is not configured' };
  
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('wallet_address', walletAddress)
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    return { error: error.message || 'An error occurred while updating user profile' };
  }
}

/**
 * Get or create user profile (main function for wallet authentication)
 */
export async function getOrCreateUserProfile(
  walletAddress: string,
  walletType: 'solana' | 'algorand',
  network: string = 'testnet'
) {
  if (!isSupabaseConfigured) {
    // Return a mock profile for development
    return {
      data: {
        wallet_address: walletAddress,
        wallet_type: walletType,
        network: network,
        credits_balance: 10,
        total_tokens_created: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      error: null
    };
  }
  
  try {
    // First try to get existing profile
    const { data: existingProfile, error: fetchError } = await getUserProfileByWallet(walletAddress);
    
    if (existingProfile && !fetchError) {
      // Update last connected timestamp
      await updateUserProfile(walletAddress, {});
      return { data: existingProfile, error: null };
    }
    
    // Profile doesn't exist, create new one
    const { data: newProfile, error: createError } = await createUserProfile(walletAddress, walletType, network);
    
    if (createError) {
      return { data: null, error: createError };
    }
    
    return { data: newProfile, error: null };
  } catch (error: any) {
    console.error('Error in getOrCreateUserProfile:', error);
    return { error: error.message || 'An error occurred' };
  }
}

/**
 * Update credits balance for a wallet
 */
export async function updateWalletCredits(walletAddress: string, newBalance: number) {
  if (!isSupabaseConfigured) return { error: 'Supabase is not configured' };
  
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ 
        credits_balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('wallet_address', walletAddress)
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error updating wallet credits:', error);
    return { error: error.message || 'An error occurred while updating credits' };
  }
}

/**
 * Increment total tokens created for a wallet
 */
export async function incrementTokensCreated(walletAddress: string) {
  if (!isSupabaseConfigured) return { error: 'Supabase is not configured' };
  
  try {
    // Get current count first
    const { data: profile } = await getUserProfileByWallet(walletAddress);
    const currentCount = profile?.total_tokens_created || 0;
    
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ 
        total_tokens_created: currentCount + 1,
        updated_at: new Date().toISOString()
      })
      .eq('wallet_address', walletAddress)
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error incrementing tokens created:', error);
    return { error: error.message || 'An error occurred while updating token count' };
  }
}

/**
 * Set the current wallet context for RLS policies
 */
export async function setWalletContext(walletAddress: string) {
  if (!isSupabaseConfigured) return;
  
  try {
    // This would be used for RLS policies if needed
    await supabase.rpc('set_current_wallet', { wallet_addr: walletAddress });
  } catch (error) {
    console.warn('Could not set wallet context:', error);
    // Non-critical error, continue without it
  }
}

// Storage functions (keeping these as they're not auth-related)
export async function uploadFile(file: File, path: string) {
  if (!isSupabaseConfigured) return { error: 'Supabase is not configured' };
  
  try {
    const { data, error } = await supabase.storage
      .from('public')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) throw error;
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('public')
      .getPublicUrl(path);
    
    return { data: { ...data, publicUrl }, error: null };
  } catch (error: any) {
    console.error('Error uploading file:', error);
    return { error: error.message || 'An error occurred while uploading file' };
  }
}

export async function deleteFile(path: string) {
  if (!isSupabaseConfigured) return { error: 'Supabase is not configured' };
  
  try {
    const { data, error } = await supabase.storage
      .from('public')
      .remove([path]);
    
    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error deleting file:', error);
    return { error: error.message || 'An error occurred while deleting file' };
  }
}