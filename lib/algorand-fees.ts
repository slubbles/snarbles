/**
 * Algorand Platform Fee Configuration
 * Manages creation fees for the Snarbles platform with dynamic pricing support
 */

import { getPricingConfig, calculateDynamicFees } from './dynamic-pricing';

// Default/fallback fee destination wallet for the platform
export const PLATFORM_FEE_DESTINATION = 'PJEIDDKUOONTJOIV3BLZS7SZSAHCVKNNHTLKMASI6RTYSOZNSDY7MWGZ3M';

// Fallback fee configuration by network (used when dynamic pricing is unavailable)
export const ALGORAND_FEE_CONFIG_FALLBACK = {
  MAINNET: {
    enabled: true,
    amount: 10_000_000, // 10 ALGO in microAlgos
    destination: PLATFORM_FEE_DESTINATION,
    description: 'Platform creation fee for Algorand Mainnet'
  },
  TESTNET: {
    enabled: false,
    amount: 0,
    destination: null,
    description: 'No fees on testnet for testing purposes'
  }
} as const;

// Network fee constants
export const ALGORAND_NETWORK_FEES = {
  TRANSACTION_FEE: 1000, // ~0.001 ALGO minimum transaction fee
  OPT_IN_FEE: 1000,      // ~0.001 ALGO for asset opt-in
} as const;

// Fee calculation types
export interface PlatformFeeConfig {
  enabled: boolean;
  amount: number;
  destination: string | null;
  description: string;
}

export interface FeeSummary {
  platformFee: number;
  networkFees: number;
  totalFees: number;
  feesInAlgo: {
    platformFee: number;
    networkFees: number;
    totalFees: number;
  };
}

/**
 * Get platform fee configuration for a specific network with dynamic pricing support
 */
export async function getPlatformFeeConfig(network: 'mainnet' | 'testnet'): Promise<PlatformFeeConfig> {
  try {
    // Try to get dynamic pricing configuration first
    const dynamicNetwork = network === 'mainnet' ? 'algorand-mainnet' : 'algorand-testnet';
    const dynamicConfig = await getPricingConfig(dynamicNetwork);
    
    if (dynamicConfig.success && dynamicConfig.data) {
      const config = dynamicConfig.data;
      return {
        enabled: config.pricing_enabled,
        amount: config.base_fee_amount,
        destination: config.fee_destination_wallet || PLATFORM_FEE_DESTINATION,
        description: `Dynamic pricing for ${config.network_display_name}`
      };
    }
  } catch (error) {
    console.log('Dynamic pricing unavailable, using fallback configuration');
  }
  
  // Fall back to static configuration
  const config = network === 'mainnet' ? ALGORAND_FEE_CONFIG_FALLBACK.MAINNET : ALGORAND_FEE_CONFIG_FALLBACK.TESTNET;
  return {
    enabled: config.enabled,
    amount: config.amount,
    destination: config.destination,
    description: config.description
  };
}

/**
 * Determine network type from network string
 */
export function getNetworkType(network: string): 'mainnet' | 'testnet' {
  return network.toLowerCase().includes('mainnet') ? 'mainnet' : 'testnet';
}

/**
 * Calculate total fees for token creation
 */
export async function calculateTokenCreationFees(network: string): Promise<FeeSummary> {
  const networkType = getNetworkType(network);
  const platformConfig = await getPlatformFeeConfig(networkType);
  
  const platformFee = platformConfig.enabled ? platformConfig.amount : 0;
  const networkFees = ALGORAND_NETWORK_FEES.TRANSACTION_FEE * (platformConfig.enabled ? 2 : 1); // Fee payment + token creation OR just token creation
  const totalFees = platformFee + networkFees;
  
  return {
    platformFee,
    networkFees,
    totalFees,
    feesInAlgo: {
      platformFee: platformFee / 1_000_000,
      networkFees: networkFees / 1_000_000,
      totalFees: totalFees / 1_000_000
    }
  };
}

/**
 * Check if user has sufficient balance for token creation
 */
export async function hasSufficientBalance(userBalanceMicroAlgos: number, network: string): Promise<{
  sufficient: boolean;
  required: number;
  missing: number;
}> {
  const fees = await calculateTokenCreationFees(network);
  const required = fees.totalFees;
  const sufficient = userBalanceMicroAlgos >= required;
  const missing = sufficient ? 0 : required - userBalanceMicroAlgos;
  
  return {
    sufficient,
    required,
    missing
  };
}

/**
 * Format fee amounts for display
 */
export function formatFeeDisplay(microAlgos: number): string {
  const algos = microAlgos / 1_000_000;
  return algos % 1 === 0 ? `${algos}` : algos.toFixed(6).replace(/\.?0+$/, '');
}

/**
 * Validate fee destination address
 */
export function isValidFeeDestination(address: string): boolean {
  // Basic Algorand address validation (58 characters, alphanumeric)
  const algorandAddressRegex = /^[A-Z2-7]{58}$/;
  return algorandAddressRegex.test(address);
}

/**
 * Generate unique fee transaction note
 */
export function generateFeeNote(): Uint8Array {
  const timestamp = Date.now();
  const note = `SNARBLES_FEE_${timestamp}`;
  return new Uint8Array(Buffer.from(note));
}

/**
 * Generate unique token creation note
 */
export function generateTokenNote(): Uint8Array {
  const timestamp = Date.now();
  const note = `SNARBLES_TOKEN_${timestamp}`;
  return new Uint8Array(Buffer.from(note));
} 