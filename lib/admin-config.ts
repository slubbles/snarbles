/**
 * Admin Configuration System
 * Allows the admin to configure platform fees and other settings
 */

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

// Default configuration
const DEFAULT_CONFIG: AdminConfig = {
  fees: {
    algorandMainnetFee: 10,     // 10 ALGO
    algorandTestnetFee: 0,      // Free for testnet
    solanaMainnetFee: 0.1,      // 0.1 SOL
    solanaDevnetFee: 0,         // Free for devnet
  },
  adminWallet: 'PJEIDDKUOONTJOIV3BLZS7SZSAHCVKNNHTLKMASI6RTYSOZNSDY7MWGZ3M',
  feeRecipients: {
    algorand: 'PJEIDDKUOONTJOIV3BLZS7SZSAHCVKNNHTLKMASI6RTYSOZNSDY7MWGZ3M',
    solana: '', // Add Solana address when needed
  }
};

/**
 * Get current admin configuration
 * In production, this would fetch from a database or configuration service
 */
export function getAdminConfig(): AdminConfig {
  // For now, return default config
  // TODO: Implement database storage and retrieval
  return DEFAULT_CONFIG;
}

/**
 * Update admin configuration
 * This would be called from the admin panel
 */
export async function updateAdminConfig(config: Partial<AdminConfig>): Promise<{ success: boolean; error?: string }> {
  try {
    // TODO: Implement database update
    // For now, just validate the configuration
    
    if (config.fees?.algorandMainnetFee && config.fees.algorandMainnetFee < 0) {
      return { success: false, error: 'Algorand mainnet fee cannot be negative' };
    }
    
    if (config.adminWallet && !isValidAlgorandAddress(config.adminWallet)) {
      return { success: false, error: 'Invalid admin wallet address' };
    }
    
    console.log('Admin config update requested:', config);
    
    // In production, save to database here
    return { success: true };
    
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Configuration update failed' 
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
 * Supports both Algorand and Solana wallet addresses
 */
export function isAdmin(walletAddress: string): boolean {
  const config = getAdminConfig();
  // Support both Algorand admin wallet and Solana admin wallet for now
  const SOLANA_ADMIN = 'Add_Your_Solana_Admin_Address_Here'; // TODO: Set your Solana admin address
  return walletAddress === config.adminWallet || walletAddress === SOLANA_ADMIN;
}

/**
 * Get admin wallet address
 */
export function getAdminWallet(): string {
  const config = getAdminConfig();
  return config.adminWallet;
}
