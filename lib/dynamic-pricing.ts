import { supabase, isSupabaseAvailable } from './supabase-client';

// Types for pricing configuration
export interface PricingConfig {
  id?: string;
  network: string;
  network_display_name: string;
  pricing_enabled: boolean;
  base_fee_amount: number; // In smallest unit (microAlgos)
  base_fee_currency: string;
  fee_destination_wallet: string | null;
  fee_destination_name: string | null;
  pricing_tier: string;
  minimum_balance_required: number;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  notes?: string;
  is_active: boolean;
}

export interface PricingHistory {
  id: string;
  config_id: string;
  network: string;
  old_fee_amount: number | null;
  new_fee_amount: number | null;
  old_destination_wallet: string | null;
  new_destination_wallet: string | null;
  change_reason: string | null;
  changed_by: string;
  changed_at: string;
}

export interface FeeCollection {
  id: string;
  transaction_hash: string;
  network: string;
  payer_wallet: string;
  fee_amount: number;
  fee_currency: string;
  destination_wallet: string;
  token_symbol?: string;
  token_name?: string;
  collection_status: 'pending' | 'confirmed' | 'failed';
  block_height?: number;
  collected_at: string;
  confirmed_at?: string;
  metadata?: any;
}

export interface FeeCollectionSummary {
  network: string;
  fee_currency: string;
  total_collections: number;
  total_fees_collected: number;
  confirmed_fees: number;
  confirmed_count: number;
  pending_count: number;
  failed_count: number;
  first_collection: string;
  last_collection: string;
}

// Default fallback pricing (same as current hardcoded values)
const FALLBACK_PRICING: Record<string, PricingConfig> = {
  'algorand-mainnet': {
    network: 'algorand-mainnet',
    network_display_name: 'Algorand Mainnet',
    pricing_enabled: true,
    base_fee_amount: 10_000_000, // 10 ALGO
    base_fee_currency: 'ALGO',
    fee_destination_wallet: 'H7QBKFGRN4QHQLKQXZ6RZ5ZJ3WNQXFN6CZ6H3TGAXZ7KX4VF3T6XQYV2HI',
    fee_destination_name: 'Platform Fee Collection Wallet',
    pricing_tier: 'standard',
    minimum_balance_required: 200_000, // 0.2 ALGO
    notes: 'Fallback configuration',
    is_active: true
  },
  'algorand-testnet': {
    network: 'algorand-testnet',
    network_display_name: 'Algorand Testnet',
    pricing_enabled: false,
    base_fee_amount: 0,
    base_fee_currency: 'ALGO',
    fee_destination_wallet: null,
    fee_destination_name: 'Testnet - No Fees',
    pricing_tier: 'testing',
    minimum_balance_required: 100_000, // 0.1 ALGO
    notes: 'Free testnet configuration',
    is_active: true
  }
};

/**
 * Get pricing configuration for a specific network
 */
export async function getPricingConfig(network: string): Promise<{
  success: boolean;
  data?: PricingConfig;
  error?: string;
}> {
  if (!isSupabaseAvailable()) {
    console.warn('⚠️ Supabase not available, using fallback pricing');
    return {
      success: true,
      data: FALLBACK_PRICING[network] || FALLBACK_PRICING['algorand-mainnet']
    };
  }

  try {
    const { data, error } = await supabase
      .from('platform_pricing_config')
      .select('*')
      .eq('network', network)
      .eq('is_active', true)
      .single();

    if (error) {
      console.warn(`⚠️ Database pricing lookup failed for ${network}, using fallback:`, error);
      return {
        success: true,
        data: FALLBACK_PRICING[network] || FALLBACK_PRICING['algorand-mainnet']
      };
    }

    return {
      success: true,
      data: data as PricingConfig
    };
  } catch (error) {
    console.warn('⚠️ Error fetching pricing config, using fallback:', error);
    return {
      success: true,
      data: FALLBACK_PRICING[network] || FALLBACK_PRICING['algorand-mainnet']
    };
  }
}

/**
 * Get all active pricing configurations
 */
export async function getAllPricingConfigs(): Promise<{
  success: boolean;
  data?: PricingConfig[];
  error?: string;
}> {
  if (!isSupabaseAvailable()) {
    return {
      success: true,
      data: Object.values(FALLBACK_PRICING)
    };
  }

  try {
    const { data, error } = await supabase
      .from('platform_pricing_config')
      .select('*')
      .eq('is_active', true)
      .order('network');

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      data: data as PricingConfig[]
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Update pricing configuration (admin only)
 */
export async function updatePricingConfig(
  network: string,
  updates: Partial<PricingConfig>,
  adminWallet: string
): Promise<{
  success: boolean;
  data?: PricingConfig;
  error?: string;
}> {
  if (!isSupabaseAvailable()) {
    return {
      success: false,
      error: 'Database not available - cannot update pricing configuration'
    };
  }

  try {
    // Add admin wallet to the update
    const updateData = {
      ...updates,
      created_by: adminWallet,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('platform_pricing_config')
      .update(updateData)
      .eq('network', network)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      data: data as PricingConfig
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Create new pricing configuration
 */
export async function createPricingConfig(
  config: Omit<PricingConfig, 'id' | 'created_at' | 'updated_at'>,
  adminWallet: string
): Promise<{
  success: boolean;
  data?: PricingConfig;
  error?: string;
}> {
  if (!isSupabaseAvailable()) {
    return {
      success: false,
      error: 'Database not available - cannot create pricing configuration'
    };
  }

  try {
    const { data, error } = await supabase
      .from('platform_pricing_config')
      .insert({
        ...config,
        created_by: adminWallet
      })
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      data: data as PricingConfig
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get pricing history for a network
 */
export async function getPricingHistory(network: string): Promise<{
  success: boolean;
  data?: PricingHistory[];
  error?: string;
}> {
  if (!isSupabaseAvailable()) {
    return {
      success: true,
      data: []
    };
  }

  try {
    const { data, error } = await supabase
      .from('platform_pricing_history')
      .select('*')
      .eq('network', network)
      .order('changed_at', { ascending: false });

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      data: data as PricingHistory[]
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Track fee collection
 */
export async function trackFeeCollection(
  collection: Omit<FeeCollection, 'id' | 'collected_at'>
): Promise<{
  success: boolean;
  data?: FeeCollection;
  error?: string;
}> {
  if (!isSupabaseAvailable()) {
    console.warn('⚠️ Database not available - fee collection tracking skipped');
    return {
      success: true,
      data: undefined
    };
  }

  try {
    const { data, error } = await supabase
      .from('platform_fee_collections')
      .insert(collection)
      .select()
      .single();

    if (error) {
      console.warn('⚠️ Fee collection tracking failed (non-critical):', error);
      return {
        success: true, // Don't fail token creation for tracking issues
        data: undefined
      };
    }

    return {
      success: true,
      data: data as FeeCollection
    };
  } catch (error) {
    console.warn('⚠️ Fee collection tracking error (non-critical):', error);
    return {
      success: true, // Don't fail token creation for tracking issues
      data: undefined
    };
  }
}

/**
 * Update fee collection status
 */
export async function updateFeeCollectionStatus(
  transactionHash: string,
  status: 'confirmed' | 'failed',
  blockHeight?: number
): Promise<{
  success: boolean;
  error?: string;
}> {
  if (!isSupabaseAvailable()) {
    return { success: true };
  }

  try {
    const updateData: any = {
      collection_status: status
    };

    if (status === 'confirmed') {
      updateData.confirmed_at = new Date().toISOString();
      if (blockHeight) {
        updateData.block_height = blockHeight;
      }
    }

    const { error } = await supabase
      .from('platform_fee_collections')
      .update(updateData)
      .eq('transaction_hash', transactionHash);

    if (error) {
      console.warn('⚠️ Fee collection status update failed (non-critical):', error);
    }

    return { success: true };
  } catch (error) {
    console.warn('⚠️ Fee collection status update error (non-critical):', error);
    return { success: true };
  }
}

/**
 * Get fee collection summary
 */
export async function getFeeCollectionSummary(): Promise<{
  success: boolean;
  data?: FeeCollectionSummary[];
  error?: string;
}> {
  if (!isSupabaseAvailable()) {
    return {
      success: true,
      data: []
    };
  }

  try {
    const { data, error } = await supabase
      .from('fee_collection_summary')
      .select('*')
      .order('network');

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      data: data as FeeCollectionSummary[]
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Calculate fees for token creation using dynamic pricing
 */
export async function calculateDynamicFees(network: string): Promise<{
  platformFee: number;
  networkFees: number;
  totalFees: number;
  currency: string;
  destination: string | null;
  enabled: boolean;
}> {
  const config = await getPricingConfig(network);
  
  if (!config.success || !config.data) {
    // Fallback to default
    const fallback = FALLBACK_PRICING[network] || FALLBACK_PRICING['algorand-mainnet'];
    return {
      platformFee: fallback.base_fee_amount,
      networkFees: 1000, // Standard Algorand transaction fee
      totalFees: fallback.base_fee_amount + 1000,
      currency: fallback.base_fee_currency,
      destination: fallback.fee_destination_wallet,
      enabled: fallback.pricing_enabled
    };
  }

  const pricing = config.data;
  const networkFees = 1000; // Standard Algorand transaction fee
  
  return {
    platformFee: pricing.pricing_enabled ? pricing.base_fee_amount : 0,
    networkFees: networkFees,
    totalFees: (pricing.pricing_enabled ? pricing.base_fee_amount : 0) + networkFees,
    currency: pricing.base_fee_currency,
    destination: pricing.fee_destination_wallet,
    enabled: pricing.pricing_enabled
  };
}

/**
 * Validate wallet address format (basic validation)
 */
export function validateWalletAddress(address: string, network: string): boolean {
  if (!address || address.trim().length === 0) {
    return false;
  }

  // Algorand addresses are 58 characters and start with specific patterns
  if (network.includes('algorand')) {
    return address.length === 58 && /^[A-Z2-7]+$/.test(address);
  }

  // Add other network validations as needed
  return true;
}

/**
 * Format fee amount for display
 */
export function formatFeeAmount(amount: number, currency: string): string {
  if (currency === 'ALGO') {
    return `${(amount / 1_000_000).toFixed(3)} ALGO`;
  }
  
  return `${amount} ${currency}`;
}

/**
 * Get network display name
 */
export function getNetworkDisplayName(network: string): string {
  const names: Record<string, string> = {
    'algorand-mainnet': 'Algorand Mainnet',
    'algorand-testnet': 'Algorand Testnet',
    'solana-mainnet': 'Solana Mainnet',
    'solana-devnet': 'Solana Devnet',
    'solana-testnet': 'Solana Testnet'
  };
  
  return names[network] || network;
} 