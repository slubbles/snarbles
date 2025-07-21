/**
 * Mobile BigInt Compatibility Test and Fallback
 * Tests BigInt support on mobile devices and provides fallbacks
 */

function testMobileBigIntSupport() {
  console.log('🔍 Testing BigInt support on this device...');
  
  // Check if BigInt is supported
  const hasBigIntSupport = typeof BigInt !== 'undefined';
  console.log(`BigInt support: ${hasBigIntSupport ? '✅ Yes' : '❌ No'}`);
  
  if (!hasBigIntSupport) {
    return {
      supported: false,
      error: 'BigInt is not supported on this device'
    };
  }
  
  try {
    // Test basic BigInt operations
    const testBigInt = BigInt('1000000');
    const decimals = BigInt(9);
    const multiplier = BigInt(10) ** decimals;
    const result = testBigInt * multiplier;
    
    console.log(`✅ BigInt test passed: ${result.toString()}`);
    
    // Test conversion back to Number
    const numberResult = Number(result);
    const isSafe = Number.isSafeInteger(numberResult);
    
    console.log(`Number conversion: ${numberResult}`);
    console.log(`Safe integer: ${isSafe}`);
    
    return {
      supported: true,
      testResult: result.toString(),
      canConvertToNumber: isSafe
    };
    
  } catch (error) {
    console.error('❌ BigInt test failed:', error);
    return {
      supported: false,
      error: error.message
    };
  }
}

// Mobile-safe BigInt alternative using string math
function safeBigIntFallback(supply, decimals) {
  console.log('🔄 Using fallback calculation method...');
  
  try {
    // Convert to strings and use manual calculation
    const supplyStr = Math.floor(supply).toString();
    const zerosToAdd = '0'.repeat(decimals);
    const resultStr = supplyStr + zerosToAdd;
    
    // Check against Algorand maximum
    const algorandMax = '18446744073709551615';
    
    console.log(`Supply with decimals: ${resultStr}`);
    console.log(`Algorand maximum: ${algorandMax}`);
    
    // Simple string length comparison for very large numbers
    if (resultStr.length > algorandMax.length || 
        (resultStr.length === algorandMax.length && resultStr > algorandMax)) {
      throw new Error(`Total supply exceeds Algorand maximum`);
    }
    
    // Convert back to number (with precision check)
    const resultNum = parseFloat(resultStr);
    if (!Number.isSafeInteger(resultNum)) {
      throw new Error('Result too large for safe integer processing');
    }
    
    return {
      success: true,
      result: resultNum,
      resultString: resultStr
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Test both methods
console.log('=== Mobile Compatibility Test ===');

const bigIntTest = testMobileBigIntSupport();
console.log('BigInt test result:', bigIntTest);

console.log('\n=== Fallback Method Test ===');
const fallbackTest = safeBigIntFallback(1000000, 9);
console.log('Fallback test result:', fallbackTest);

// Test with problematic large number
console.log('\n=== Large Number Test ===');
const largeTest = safeBigIntFallback(1000000000000000000, 9);
console.log('Large number test result:', largeTest);
