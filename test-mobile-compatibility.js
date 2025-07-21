/**
 * Comprehensive Mobile BigInt Compatibility Test
 */

// Simulate the calculateTokenSupplyFallback function
function calculateTokenSupplyFallback(supply, decimals) {
  try {
    const supplyStr = Math.floor(supply).toString();
    const zerosToAdd = '0'.repeat(decimals);
    const resultStr = supplyStr + zerosToAdd;
    
    const algorandMaxStr = '18446744073709551615';
    
    if (resultStr.length > algorandMaxStr.length || 
        (resultStr.length === algorandMaxStr.length && resultStr > algorandMaxStr)) {
      return {
        success: false,
        error: `Total supply with ${decimals} decimals exceeds Algorand maximum`
      };
    }
    
    const resultNum = parseFloat(resultStr);
    if (!Number.isSafeInteger(resultNum)) {
      return {
        success: false,
        error: 'Total supply too large for safe processing'
      };
    }
    
    return {
      success: true,
      value: resultNum
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Calculation failed'
    };
  }
}

// Test function that mimics our actual implementation
function testMobileSafeTokenCalculation(supply, decimals) {
  console.log(`\n🧪 Testing supply: ${supply.toLocaleString()}, decimals: ${decimals}`);
  
  let totalSupplyForSDK;
  
  try {
    if (typeof BigInt !== 'undefined') {
      console.log('✅ Using BigInt method');
      const totalSupplyBigInt = BigInt(Math.floor(supply));
      const decimalsBigInt = BigInt(decimals);
      const multiplierBigInt = BigInt(10) ** decimalsBigInt;
      const totalWithDecimalsBigInt = totalSupplyBigInt * multiplierBigInt;
      
      const maxUint64 = BigInt('18446744073709551615');
      if (totalWithDecimalsBigInt > maxUint64) {
        throw new Error(`Total supply exceeds Algorand maximum`);
      }
      
      totalSupplyForSDK = Number(totalWithDecimalsBigInt);
      
    } else {
      console.log('⚠️ Using fallback method (BigInt not available)');
      const result = calculateTokenSupplyFallback(supply, decimals);
      if (!result.success || result.value === undefined) {
        throw new Error(result.error || 'Fallback calculation failed');
      }
      totalSupplyForSDK = result.value;
    }
    
    if (!Number.isSafeInteger(totalSupplyForSDK)) {
      throw new Error('Result is not a safe integer');
    }
    
    console.log(`✅ Success: ${totalSupplyForSDK.toLocaleString()}`);
    return { success: true, value: totalSupplyForSDK };
    
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Test cases
console.log('🔍 Mobile-Safe Token Creation Tests');
console.log('===================================');

// Test normal cases
testMobileSafeTokenCalculation(1000000, 9);      // 1M tokens, 9 decimals
testMobileSafeTokenCalculation(1000000000, 6);   // 1B tokens, 6 decimals
testMobileSafeTokenCalculation(100000, 18);      // 100K tokens, 18 decimals

// Test edge cases
testMobileSafeTokenCalculation(18446744073, 9);  // Near maximum for 9 decimals
testMobileSafeTokenCalculation(1844674407370, 6); // Near maximum for 6 decimals

// Test cases that should fail
testMobileSafeTokenCalculation(1000000000000000000, 9);  // Too large
testMobileSafeTokenCalculation(184467440737095516, 6);   // Just over limit

// Test BigInt availability simulation
console.log('\n🔍 Testing without BigInt (legacy mobile browsers)');
const originalBigInt = global.BigInt;
delete global.BigInt;

testMobileSafeTokenCalculation(1000000, 9);      // Should use fallback
testMobileSafeTokenCalculation(1000000000000000000, 9);  // Should fail in fallback

// Restore BigInt
global.BigInt = originalBigInt;

console.log('\n🎉 Mobile compatibility testing complete!');
