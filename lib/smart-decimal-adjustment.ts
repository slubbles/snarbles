/**
 * Smart decimal adjustment utility for Algorand tokens
 * Automatically adjusts decimals based on supply to stay within safe limits
 */

export interface DecimalAdjustmentResult {
  recommendedDecimals: number;
  maxPossibleDecimals: number;
  currentSafeSupply: number;
  explanation: string;
  precision: string;
}

/**
 * Calculate the optimal decimals for a given supply with improved logic
 * This ensures we stay within JavaScript's MAX_SAFE_INTEGER while maximizing precision
 */
export function calculateOptimalDecimals(supply: number): DecimalAdjustmentResult {
  const cleanSupply = Math.floor(supply);
  
  // Find the highest decimals that still work with this supply
  let maxDecimals = 0;
  let recommendedDecimals = 6; // Default to USDC standard
  
  for (let decimals = 0; decimals <= 18; decimals++) {
    const total = cleanSupply * Math.pow(10, decimals);
    
    if (total <= Number.MAX_SAFE_INTEGER) {
      maxDecimals = decimals;
    } else {
      break;
    }
  }
  
  // Improved recommended decimals based on supply ranges and common standards
  if (cleanSupply <= 1000) {
    recommendedDecimals = Math.min(18, maxDecimals); // Ultra-high precision for small supplies
  } else if (cleanSupply <= 100000) {
    recommendedDecimals = Math.min(15, maxDecimals); // Very high precision
  } else if (cleanSupply <= 10000000) { // 10M
    recommendedDecimals = Math.min(12, maxDecimals); // High precision
  } else if (cleanSupply <= 1000000000) { // 1B
    recommendedDecimals = Math.min(9, maxDecimals); // SOL/ETH standard
  } else if (cleanSupply <= 100000000000) { // 100B
    recommendedDecimals = Math.min(6, maxDecimals); // USDC/USDT standard
  } else {
    recommendedDecimals = Math.min(3, maxDecimals); // Large supply tokens
  }
  
  // Ensure we don't go below 0 or above what's mathematically possible
  recommendedDecimals = Math.max(0, Math.min(recommendedDecimals, maxDecimals));
  
  const precision = recommendedDecimals > 0 ? `0.${'0'.repeat(recommendedDecimals - 1)}1` : '1';
  
  let explanation = '';
  
  if (cleanSupply >= 1000000000000) { // 1 trillion+
    explanation = `Massive supply (${cleanSupply.toLocaleString()}) requires ${recommendedDecimals} decimals to stay within safe limits.`;
  } else if (cleanSupply >= 1000000000) { // 1 billion+
    explanation = `Large supply detected. Using ${recommendedDecimals} decimals (like major stablecoins) for optimal balance.`;
  } else if (cleanSupply >= 1000000) { // 1 million+
    explanation = `Million-scale supply allows ${recommendedDecimals} decimals for excellent precision and flexibility.`;
  } else if (cleanSupply >= 10000) { // 10k+
    explanation = `Moderate supply enables ${recommendedDecimals} decimals for high-precision transactions.`;
  } else {
    explanation = `Small supply allows ${recommendedDecimals} decimals for maximum precision and control.`;
  }
  
  return {
    recommendedDecimals,
    maxPossibleDecimals: maxDecimals,
    currentSafeSupply: cleanSupply,
    explanation,
    precision
  };
}

/**
 * Get decimal recommendations for different supply ranges
 */
export function getDecimalRecommendations(): Array<{
  range: string;
  supply: string;
  recommendedDecimals: number;
  example: string;
  useCase: string;
}> {
  return [
    {
      range: '1-999',
      supply: '< 1K',
      recommendedDecimals: 18,
      example: 'Ultra-precise governance tokens',
      useCase: 'DAO voting tokens, rare collectibles'
    },
    {
      range: '1,000-99,999',
      supply: '1K-99K',
      recommendedDecimals: 15,
      example: 'High-precision utility tokens',
      useCase: 'Premium gaming tokens, exclusive access'
    },
    {
      range: '100,000-999,999',
      supply: '100K-999K',
      recommendedDecimals: 12,
      example: 'Precise community tokens',
      useCase: 'Community rewards, loyalty points'
    },
    {
      range: '1,000,000-99,999,999',
      supply: '1M-99M',
      recommendedDecimals: 9,
      example: 'Standard crypto precision (like SOL)',
      useCase: 'Most cryptocurrencies, trading tokens'
    },
    {
      range: '100,000,000-9,999,999,999',
      supply: '100M-9.9B',
      recommendedDecimals: 6,
      example: 'Stablecoin precision (like USDC)',
      useCase: 'Stablecoins, large-scale currencies'
    },
    {
      range: '10,000,000,000+',
      supply: '10B+',
      recommendedDecimals: 3,
      example: 'Large-scale tokens',
      useCase: 'Mass distribution tokens, rewards systems'
    }
  ];
}

/**
 * Check if current decimals are optimal for the supply
 */
export function isDecimalOptimal(supply: number, currentDecimals: number): {
  isOptimal: boolean;
  suggestion?: DecimalAdjustmentResult;
  issue?: string;
} {
  const optimal = calculateOptimalDecimals(supply);
  
  // Check if we're within safe range
  const currentTotal = supply * Math.pow(10, currentDecimals);
  
  if (currentTotal > Number.MAX_SAFE_INTEGER) {
    return {
      isOptimal: false,
      suggestion: optimal,
      issue: `Current ${currentDecimals} decimals exceed safe limits. Maximum safe decimals: ${optimal.maxPossibleDecimals}`
    };
  }
  
  // Check if we can do better
  if (currentDecimals < optimal.recommendedDecimals) {
    return {
      isOptimal: false,
      suggestion: optimal,
      issue: `You can use higher precision! Try ${optimal.recommendedDecimals} decimals for better flexibility.`
    };
  }
  
  return {
    isOptimal: true
  };
}

/**
 * Format decimal precision for display
 */
export function formatPrecisionExample(decimals: number): string {
  if (decimals === 0) return '1 (whole numbers only)';
  
  const precision = '0.' + '0'.repeat(decimals - 1) + '1';
  return `${precision} (${decimals} decimal places)`;
}

/**
 * Get user-friendly decimal description
 */
export function getDecimalDescription(decimals: number): string {
  if (decimals >= 15) return 'Ultra-high precision (financial derivatives)';
  if (decimals >= 12) return 'Very high precision (DeFi protocols)';
  if (decimals >= 9) return 'High precision (like SOL, ETH)';
  if (decimals >= 6) return 'Standard precision (like USDC, USDT)';
  if (decimals >= 3) return 'Medium precision (loyalty points)';
  if (decimals >= 1) return 'Low precision (share tokens)';
  return 'Whole numbers only (vote counts)';
}
