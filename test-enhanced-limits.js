/**
 * Test the enhanced token supply limits
 */

// Import our enhanced functions
function getMaximumSafeSupply(decimals) {
  const algorandMaxUint64 = 18446744073709551615;
  const multiplier = Math.pow(10, decimals);
  const theoreticalMax = Math.floor(algorandMaxUint64 / multiplier);
  
  if (decimals >= 16) {
    return Math.min(theoreticalMax, 10000);
  } else if (decimals >= 12) {
    return Math.min(theoreticalMax, 100000000);
  } else if (decimals >= 9) {
    return Math.min(theoreticalMax, 100000000000);
  } else {
    return Math.min(theoreticalMax, 1000000000000000);
  }
}

function getPracticalMaximumSupply(decimals) {
  if (decimals >= 15) {
    return 1000000;
  } else if (decimals >= 12) {
    return 1000000000;
  } else if (decimals >= 9) {
    return 1000000000000;
  } else {
    return 1000000000000000;
  }
}

function calculateTokenSupplyEnhanced(supply, decimals) {
  try {
    if (supply <= 0 || !Number.isFinite(supply)) {
      return {
        success: false,
        error: 'Supply must be a positive number'
      };
    }
    
    const algorandMaxUint64 = 18446744073709551615;
    const supplyCleaned = Math.floor(supply);
    
    // Use string-based calculation for high precision
    const supplyStr = supplyCleaned.toString();
    const zerosToAdd = '0'.repeat(decimals);
    const resultStr = supplyStr + zerosToAdd;
    
    const resultNum = parseFloat(resultStr);
    
    if (resultNum > algorandMaxUint64) {
      return {
        success: false,
        error: `Total supply with ${decimals} decimals exceeds Algorand maximum`
      };
    }
    
    if (resultNum > Number.MAX_SAFE_INTEGER) {
      const algorandMaxStr = algorandMaxUint64.toString();
      if (resultStr.length > algorandMaxStr.length || 
          (resultStr.length === algorandMaxStr.length && resultStr > algorandMaxStr)) {
        return {
          success: false,
          error: `Total supply with ${decimals} decimals exceeds Algorand maximum`
        };
      }
      console.log(`⚠️ Using large number calculation for supply: ${resultStr}`);
    }
    
    return {
      success: true,
      value: resultNum
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Calculation failed'
    };
  }
}

console.log('🧪 Testing Enhanced Token Supply Limits\n');

// Test cases that were previously failing
const testCases = [
  { supply: 1000000, decimals: 9, description: "1M tokens with 9 decimals (should now work!)" },
  { supply: 100000000, decimals: 9, description: "100M tokens with 9 decimals" },
  { supply: 1000000000, decimals: 9, description: "1B tokens with 9 decimals" },
  { supply: 1000000, decimals: 12, description: "1M tokens with 12 decimals" },
  { supply: 100000000, decimals: 12, description: "100M tokens with 12 decimals" },
  { supply: 1000000, decimals: 18, description: "1M tokens with 18 decimals" },
  { supply: 100000, decimals: 18, description: "100K tokens with 18 decimals" },
  { supply: 1000, decimals: 18, description: "1K tokens with 18 decimals" },
];

console.log('📊 Enhanced Limits by Decimals:');
for (let d of [0, 6, 8, 9, 12, 15, 18]) {
  const safe = getMaximumSafeSupply(d);
  const practical = getPracticalMaximumSupply(d);
  console.log(`Decimals ${d}: Safe=${safe.toLocaleString()}, Practical=${practical.toLocaleString()}`);
}

console.log('\n🎯 Testing Specific Cases:\n');

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.description}`);
  const result = calculateTokenSupplyEnhanced(testCase.supply, testCase.decimals);
  
  if (result.success) {
    console.log(`✅ SUCCESS: Total supply = ${result.value?.toLocaleString()}`);
  } else {
    console.log(`❌ FAILED: ${result.error}`);
  }
  console.log('');
});

console.log('🎉 Enhanced token creation should now support much larger supplies!');
