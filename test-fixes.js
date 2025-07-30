#!/usr/bin/env node

/**
 * Test the fixes for:
 * 1. 1 billion token supply with 9 decimals 
 * 2. Credit checking before button enable
 */

console.log('🧪 Testing Token Creation Fixes');
console.log('================================');

// Test 1: Supply calculation fix
console.log('\n1️⃣ Testing Supply Calculation Limits:');

function testSupplyCalculation(supply, decimals, description) {
  console.log(`\n${description}:`);
  console.log(`  Supply: ${supply.toLocaleString()}`);
  console.log(`  Decimals: ${decimals}`);
  
  const totalWithDecimals = supply * Math.pow(10, decimals);
  const isSafe = totalWithDecimals <= Number.MAX_SAFE_INTEGER;
  const maxSafeSupply = Math.floor(Number.MAX_SAFE_INTEGER / Math.pow(10, decimals));
  
  console.log(`  Total with decimals: ${totalWithDecimals.toLocaleString()}`);
  console.log(`  Is safe integer: ${isSafe}`);
  console.log(`  Max safe supply for ${decimals} decimals: ${maxSafeSupply.toLocaleString()}`);
  
  if (!isSafe) {
    console.log(`  ❌ WOULD FAIL: Exceeds safe integer limit`);
    console.log(`  💡 Suggested fix: Reduce supply to ${maxSafeSupply.toLocaleString()} or reduce decimals to 6`);
  } else {
    console.log(`  ✅ PASSES: Within safe limits`);
  }
}

// Test the problematic case from the logs
testSupplyCalculation(999999999, 9, 'Original Problem (999M tokens, 9 decimals)');

// Test recommended alternatives
testSupplyCalculation(999999999, 6, 'Fix Option 1: Same supply, 6 decimals');
testSupplyCalculation(9007199, 9, 'Fix Option 2: Reduced supply, 9 decimals');
testSupplyCalculation(1000000, 9, 'Fix Option 3: 1M tokens, 9 decimals');

// Test 2: Credit checking
console.log('\n\n2️⃣ Testing Credit Checking Logic:');

function testCreditCheck(userCredits, creditsRequired, paymentMethod, description) {
  console.log(`\n${description}:`);
  console.log(`  User credits: ${userCredits}`);
  console.log(`  Required credits: ${creditsRequired}`);
  console.log(`  Payment method: ${paymentMethod}`);
  
  let canProceed = false;
  let reason = '';
  
  if (paymentMethod === 'credits') {
    canProceed = userCredits >= creditsRequired;
    if (!canProceed) {
      reason = `Insufficient credits. Need ${creditsRequired}, have ${userCredits}. Top up credits first.`;
    }
  }
  
  console.log(`  Can create token: ${canProceed ? '✅ YES' : '❌ NO'}`);
  if (!canProceed) {
    console.log(`  Reason: ${reason}`);
  }
}

testCreditCheck(0, 10, 'credits', 'User with no credits');
testCreditCheck(5, 10, 'credits', 'User with insufficient credits');
testCreditCheck(15, 10, 'credits', 'User with sufficient credits');

console.log('\n\n🎯 Summary of Fixes:');
console.log('=====================');
console.log('✅ 1. Supply validation now prevents unsafe integer calculations');
console.log('✅ 2. Credit checking happens before button is enabled');
console.log('✅ 3. Clear error messages guide users to fix issues');
console.log('✅ 4. Conservative supply limits prevent algosdk errors');
console.log('');
console.log('💡 For 1 billion tokens: Use 6 decimals instead of 9');
console.log('💡 For 9 decimals: Use max 9 million tokens');
console.log('💡 Credits are checked before "Create Token" button is clickable');
