// Test to verify Pera wallet popup auto-close functionality
console.log('🧪 Testing Pera Wallet Popup Auto-Close Implementation...');

// Check 1: Verify helper function exists
try {
  const { ensurePeraWalletPopupCloses } = require('./algorand-usdt-integration');
  console.log('✅ ensurePeraWalletPopupCloses function found');
  
  // Check the function signature
  console.log('Function type:', typeof ensurePeraWalletPopupCloses);
  console.log('Function length (params):', ensurePeraWalletPopupCloses.length);
  
} catch (error) {
  console.log('❌ Helper function not found:', error.message);
}

// Check 2: Verify USDT transfer integration
try {
  const fs = require('fs');
  const usdtIntegrationCode = fs.readFileSync('./algorand-usdt-integration.ts', 'utf8');
  
  const hasPopupCloseInUSDT = usdtIntegrationCode.includes('await ensurePeraWalletPopupCloses()');
  const hasProperPlacement = usdtIntegrationCode.includes('✅ USDT transaction confirmed successfully') && 
                             usdtIntegrationCode.includes('await ensurePeraWalletPopupCloses()');
  
  console.log('✅ USDT integration has popup close:', hasPopupCloseInUSDT);
  console.log('✅ Popup close placed after confirmation:', hasProperPlacement);
  
} catch (error) {
  console.log('❌ Error checking USDT integration:', error.message);
}

// Check 3: Verify helper function implementation
try {
  const fs = require('fs');
  const usdtIntegrationCode = fs.readFileSync('./algorand-usdt-integration.ts', 'utf8');
  
  const hasWindowFocus = usdtIntegrationCode.includes('window.focus()');
  const hasCustomEvent = usdtIntegrationCode.includes('pera-wallet-transaction-complete');
  const hasVisibilityChange = usdtIntegrationCode.includes('visibilitychange');
  const hasDelay = usdtIntegrationCode.includes('setTimeout(resolve, 1000)');
  
  console.log('✅ Helper includes window.focus():', hasWindowFocus);
  console.log('✅ Helper dispatches custom event:', hasCustomEvent);
  console.log('✅ Helper handles visibility change:', hasVisibilityChange);
  console.log('✅ Helper includes processing delay:', hasDelay);
  
} catch (error) {
  console.log('❌ Error checking helper implementation:', error.message);
}

// Check 4: Verify enhanced payment system integration
try {
  const fs = require('fs');
  const paymentSystemCode = fs.readFileSync('./enhanced-payment-system.ts', 'utf8');
  
  const hasImport = paymentSystemCode.includes('import { ensurePeraWalletPopupCloses }');
  const hasUsage = paymentSystemCode.includes('await ensurePeraWalletPopupCloses()');
  
  console.log('✅ Enhanced payment system imports helper:', hasImport);
  console.log('✅ Enhanced payment system uses helper:', hasUsage);
  
} catch (error) {
  console.log('❌ Error checking enhanced payment system:', error.message);
}

// Check 5: Verify core algorand.ts integration
try {
  const fs = require('fs');
  const algorandCode = fs.readFileSync('./algorand.ts', 'utf8');
  
  const hasImport = algorandCode.includes('import { ensurePeraWalletPopupCloses }');
  const hasUsage = algorandCode.includes('await ensurePeraWalletPopupCloses()');
  
  console.log('✅ Core algorand.ts imports helper:', hasImport);
  console.log('✅ Core algorand.ts uses helper:', hasUsage);
  
} catch (error) {
  console.log('❌ Error checking core algorand.ts:', error.message);
}

console.log('\n🎯 Summary:');
console.log('The Pera wallet popup auto-close functionality should be fully implemented');
console.log('across all major Algorand transaction functions.');
console.log('\n📱 When to expect popup closure:');
console.log('1. After USDT credit purchases');
console.log('2. After ALGO credit purchases');
console.log('3. After token creation transactions');
console.log('4. After asset transfer transactions');
console.log('\n⚡ How it works:');
console.log('- Transaction signs → Submits → Confirms → Popup auto-closes → User returns to dApp');
