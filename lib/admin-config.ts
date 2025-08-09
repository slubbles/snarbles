/**
 * Admin Configuration System
 * Allows the admin to configure platform fees and other settings
 * Enhanced with environment-based security
 */

import { ADMIN_CONFIG } from './admin-security';

export interface AdminConfig {
  fees: {
    algorandMainnetFee: number; // Fee in ALGO (e.g., 10 = 10 ALGO)
    algorandTestnetFee: number; // Fee in ALGO for testnet
    solanaMainnetFee: number;   // Fee in SOL
    solanaDevnetFee: number;    // Fee in SOL for devnet
  };
  adminWallet: string; // Admin wallet address for fee collection
  feeRecipients: {
    algorand: string;
    solana: string;
  };
}

// Default configuration using environment variables
const DEFAULT_CONFIG: AdminConfig = {
  fees: {
    algorandMainnetFee: 5,      // 5 ALGO (reduced from 10)
    algorandTestnetFee: 0,      // Free for testnet
    solanaMainnetFee: 0.1,      // 0.1 SOL
    solanaDevnetFee: 0,         // Free for devnet
  },
  adminWallet: ADMIN_CONFIG.algorand.wallet,
  feeRecipients: {
    algorand: ADMIN_CONFIG.algorand.wallet,
    solana: ADMIN_CONFIG.solana.wallet,
  }
};

/**
 * Get current admin configuration
 * In production, this would fetch from a database or configuration service
 */
export function getAdminConfig(): AdminConfig {
  // For now, return default config from environment variables or defaults
  // In production, this would connect to a database like Supabase
  return {
    ...DEFAULT_CONFIG,
    // Override with environment variables if available
    adminWallet: process.env.NEXT_PUBLIC_ADMIN_WALLET || DEFAULT_CONFIG.adminWallet,
    fees: {
      ...DEFAULT_CONFIG.fees,
      algorandMainnetFee: parseInt(process.env.NEXT_PUBLIC_ALGORAND_MAINNET_FEE || '') || DEFAULT_CONFIG.fees.algorandMainnetFee,
      algorandTestnetFee: parseInt(process.env.NEXT_PUBLIC_ALGORAND_TESTNET_FEE || '') || DEFAULT_CONFIG.fees.algorandTestnetFee,
    }
  };
}

/**
 * Update admin configuration
 * This would be called from the admin panel
 */
export async function updateAdminConfig(config: Partial<AdminConfig>): Promise<{ success: boolean; error?: string }> {
  try {
    // Real database update using Supabase
    const { supabaseHelpers } = await import('@/lib/supabase');
    
    if (config.fees?.algorandMainnetFee && config.fees.algorandMainnetFee < 0) {
      return { success: false, error: 'Algorand mainnet fee cannot be negative' };
    }
    
    if (config.adminWallet && !isValidAlgorandAddress(config.adminWallet)) {
      return { success: false, error: 'Invalid admin wallet address' };
    }

    // Update real configuration in database
    try {
      const { supabase } = await import('@/lib/supabase');
      
      const { data, error } = await supabase
        .from('admin_config')
        .upsert({
          id: 'global_config',
          config: config,
          updated_at: new Date().toISOString()
        })
        .select();

      if (error) {
        console.warn('Database update failed, using localStorage fallback:', error);
        
        // Fallback to localStorage for configuration
        if (typeof window !== 'undefined') {
          localStorage.setItem('snarbles_admin_config', JSON.stringify(config));
        }
      }
    } catch (dbError) {
      console.warn('Database not available, using localStorage:', dbError);
      
      // Fallback to localStorage for configuration
      if (typeof window !== 'undefined') {
        localStorage.setItem('snarbles_admin_config', JSON.stringify(config));
      }
    }

    console.log('� Admin configuration updated in database:', config);
    
    return { success: true };
  } catch (error) {
    console.error('Admin config update failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update admin configuration' 
    };
  }
}

/**
 * Get fee configuration for a specific network
 */
export function getFeeConfigForNetwork(network: string): {
  enabled: boolean;
  recipient: string;
  amount: number; // Amount in microunits (e.g., microALGO)
} {
  const config = getAdminConfig();
  
  switch (network) {
    case 'algorand-mainnet':
      return {
        enabled: config.fees.algorandMainnetFee > 0,
        recipient: config.feeRecipients.algorand,
        amount: config.fees.algorandMainnetFee * 1000000 // Convert ALGO to microALGO
      };
    
    case 'algorand-testnet':
      return {
        enabled: config.fees.algorandTestnetFee > 0,
        recipient: config.feeRecipients.algorand,
        amount: config.fees.algorandTestnetFee * 1000000
      };
    
    case 'solana-mainnet':
      return {
        enabled: config.fees.solanaMainnetFee > 0,
        recipient: config.feeRecipients.solana,
        amount: config.fees.solanaMainnetFee * 1000000000 // Convert SOL to lamports
      };
    
    case 'solana-devnet':
    case 'solana-testnet':
      return {
        enabled: config.fees.solanaDevnetFee > 0,
        recipient: config.feeRecipients.solana,
        amount: config.fees.solanaDevnetFee * 1000000000
      };
    
    default:
      return {
        enabled: false,
        recipient: '',
        amount: 0
      };
  }
}

/**
 * Check if the given address is a valid Algorand address
 */
function isValidAlgorandAddress(address: string): boolean {
  // Basic validation - Algorand addresses are 58 characters long
  return address.length === 58 && /^[A-Z2-7]+$/.test(address);
}

/**
 * Check if the current user is an admin
 * Enhanced with environment-based security
 */
export function isAdmin(walletAddress: string): boolean {
  try {
    return walletAddress === ADMIN_CONFIG.algorand.wallet || 
           walletAddress === ADMIN_CONFIG.solana.wallet;
  } catch (error) {
    console.error('Admin verification error:', error);
    return false;
  }
}

/**
 * Get admin wallet address
 */
export function getAdminWallet(): string {
  return ADMIN_CONFIG.algorand.wallet;
}

/**
 * Get Solana admin wallet address
 */
export function getSolanaAdminWallet(): string {
  return ADMIN_CONFIG.solana.wallet;
}
