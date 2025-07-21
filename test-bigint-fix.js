#!/usr/bin/env node

/**
 * Test script to verify BigInt handling for large token supplies
 */

console.log('🧪 Testing BigInt handling for token creation...');

// Test case 1: Normal token supply (should work)
const normalSupply = 1000000; // 1 million
const decimals = 9;

console.log('\n✅ Test Case 1: Normal supply');
console.log(`Supply: ${normalSupply.toLocaleString()}`);
console.log(`Decimals: ${decimals}`);

try {
  const totalSupplyBigInt = BigInt(Math.floor(normalSupply));
  const decimalsBigInt = BigInt(decimals);
  const multiplierBigInt = BigInt(10) ** decimalsBigInt;
  const totalWithDecimalsBigInt = totalSupplyBigInt * multiplierBigInt;
  
  console.log(`Total with decimals: ${totalWithDecimalsBigInt.toString()}`);
  console.log(`Fits in Number.MAX_SAFE_INTEGER: ${totalWithDecimalsBigInt <= BigInt(Number.MAX_SAFE_INTEGER)}`);
  console.log(`✅ Normal case: PASS`);
} catch (error) {
  console.log(`❌ Normal case: FAIL - ${error.message}`);
}

// Test case 2: Large supply that caused the original error
const largeSupply = 1000000000000000000; // 1 quintillion
console.log('\n⚠️ Test Case 2: Large supply (original problem)');
console.log(`Supply: ${largeSupply.toLocaleString()}`);
console.log(`Decimals: ${decimals}`);

try {
  const totalSupplyBigInt = BigInt(Math.floor(largeSupply));
  const decimalsBigInt = BigInt(decimals);
  const multiplierBigInt = BigInt(10) ** decimalsBigInt;
  const totalWithDecimalsBigInt = totalSupplyBigInt * multiplierBigInt;
  const maxUint64 = BigInt('18446744073709551615');
  
  console.log(`Total with decimals: ${totalWithDecimalsBigInt.toString()}`);
  console.log(`Algorand max uint64: ${maxUint64.toString()}`);
  console.log(`Exceeds Algorand max: ${totalWithDecimalsBigInt > maxUint64}`);
  
  if (totalWithDecimalsBigInt > maxUint64) {
    console.log(`❌ Large supply: Would be rejected (as expected)`);
  } else {
    console.log(`✅ Large supply: Within limits`);
  }
} catch (error) {
  console.log(`❌ Large supply: FAIL - ${error.message}`);
}

// Test case 3: Maximum safe supply for 9 decimals
console.log('\n📊 Test Case 3: Maximum safe supply calculation');
const maxUint64 = BigInt('18446744073709551615');
const multiplierFor9Decimals = BigInt(10) ** BigInt(9);
const maxSafeSupply = maxUint64 / multiplierFor9Decimals;

console.log(`Max safe supply with 9 decimals: ${maxSafeSupply.toString()}`);
console.log(`In human format: ${Number(maxSafeSupply).toLocaleString()}`);

// Test the old problematic calculation vs new safe calculation
console.log('\n🔥 Comparison: Old vs New calculation method');

const testSupply = 1000000000; // 1 billion
console.log(`Test supply: ${testSupply.toLocaleString()}`);

// Old method (would cause overflow with large numbers)
try {
  const oldResult = testSupply * Math.pow(10, decimals);
  console.log(`Old method result: ${oldResult}`);
  console.log(`Old method safe: ${Number.isSafeInteger(oldResult)}`);
} catch (error) {
  console.log(`Old method error: ${error.message}`);
}

// New method (BigInt)
try {
  const newTotalSupplyBigInt = BigInt(Math.floor(testSupply));
  const newDecimalsBigInt = BigInt(decimals);
  const newMultiplierBigInt = BigInt(10) ** newDecimalsBigInt;
  const newTotalWithDecimalsBigInt = newTotalSupplyBigInt * newMultiplierBigInt;
  const newResult = Number(newTotalWithDecimalsBigInt);
  
  console.log(`New method result: ${newTotalWithDecimalsBigInt.toString()}`);
  console.log(`New method as Number: ${newResult}`);
  console.log(`New method safe: ${Number.isSafeInteger(newResult)}`);
} catch (error) {
  console.log(`New method error: ${error.message}`);
}

console.log('\n🎉 BigInt fix testing complete!');
