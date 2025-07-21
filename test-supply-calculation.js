/**
 * Test script to verify our token supply calculation fixes
 */

// Import our functions (simplified for testing)
function getMaximumSafeSupply(decimals) {
  const multiplier = Math.pow(10, decimals);
  const maxFromJavaScript = Math.floor(Number.MAX_SAFE_INTEGER / multiplier);
  const maxFromAlgorand = Math.floor(18446744073709551615 / multiplier);
  
  return Math.min(maxFromJavaScript, maxFromAlgorand);
}

function calculateSafeSupply(totalSupplyNum, decimals) {
  try {
    // First, validate that the input supply and decimals won't exceed safe integer limits
    const maxSafeSupply = Math.floor(Number.MAX_SAFE_INTEGER / Math.pow(10, decimals));
    
    if (totalSupplyNum > maxSafeSupply) {
      throw new Error(`Token supply of ${totalSupplyNum.toLocaleString()} with ${decimals} decimals would exceed JavaScript safe integer limits. Maximum safe supply for ${decimals} decimals is ${maxSafeSupply.toLocaleString()}`);
    }
    
    // Use standard math for safe calculations
    const multiplier = Math.pow(10, decimals);
    const totalWithDecimals = Math.floor(totalSupplyNum) * multiplier;
    
    // Validate against Algorand's uint64 maximum
    const algorandMaxUint64 = 18446744073709551615;
    if (totalWithDecimals > algorandMaxUint64) {
      throw new Error(`Total supply with ${decimals} decimals (${totalWithDecimals.toLocaleString()}) exceeds Algorand maximum (${algorandMaxUint64.toLocaleString()})`);
    }
    
    // Final safety check
    if (!Number.isSafeInteger(totalWithDecimals)) {
      throw new Error('Total supply calculation resulted in unsafe integer - please reduce your token supply');
    }
    
    return {
      success: true,
      totalWithDecimals,
      message: `✅ Safe calculation: ${totalWithDecimals.toLocaleString()}`
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Test cases
console.log('🧪 Testing Token Supply Calculation Fix\n');

const testCases = [
  { supply: 1000000, decimals: 18, description: "1M tokens with 18 decimals (was failing)" },
  { supply: 100000, decimals: 18, description: "100K tokens with 18 decimals" },
  { supply: 10000, decimals: 18, description: "10K tokens with 18 decimals" },
  { supply: 1000, decimals: 18, description: "1K tokens with 18 decimals" },
  { supply: 1000000000, decimals: 9, description: "1B tokens with 9 decimals" },
  { supply: 1000000000, decimals: 6, description: "1B tokens with 6 decimals" },
  { supply: 21000000, decimals: 8, description: "21M tokens with 8 decimals (Bitcoin-like)" },
];

console.log('Maximum safe supplies by decimals:');
for (let decimals = 0; decimals <= 18; decimals++) {
  const maxSafe = getMaximumSafeSupply(decimals);
  console.log(`Decimals ${decimals}: ${maxSafe.toLocaleString()} tokens max`);
}

console.log('\n📊 Testing specific cases:\n');

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.description}`);
  const result = calculateSafeSupply(testCase.supply, testCase.decimals);
  
  if (result.success) {
    console.log(`✅ ${result.message}`);
  } else {
    console.log(`❌ ${result.error}`);
  }
  console.log('');
});

console.log('🎯 Test completed!');
