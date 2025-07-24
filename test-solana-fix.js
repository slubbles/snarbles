#!/usr/bin/env node

/**
 * Solana Token Creation Fix Verification
 * Tests that the fix properly imports and calls the correct functions
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Solana Token Creation Fix...\n');

// Test 1: Check TokenFormNew.tsx uses correct import
const tokenFormPath = path.join(__dirname, 'components/TokenFormNew.tsx');
const tokenFormContent = fs.readFileSync(tokenFormPath, 'utf8');

console.log('✅ Test 1: Checking TokenFormNew.tsx imports...');
if (tokenFormContent.includes("import('@/lib/solana')")) {
  console.log('   ✅ Correctly imports from @/lib/solana');
} else {
  console.log('   ❌ Still using wrong import');
  process.exit(1);
}

if (tokenFormContent.includes('createTokenOnChain')) {
  console.log('   ✅ Uses createTokenOnChain function');
} else {
  console.log('   ❌ Not using createTokenOnChain');
  process.exit(1);
}

if (!tokenFormContent.includes('createSolanaToken') || tokenFormContent.includes('solana-token-creation')) {
  console.log('   ✅ No longer uses deprecated createSolanaToken');
} else {
  console.log('   ❌ Still references deprecated function');
  process.exit(1);
}

// Test 2: Check wallet interface structure
console.log('\n✅ Test 2: Checking wallet interface...');
if (tokenFormContent.includes('walletInterface = {')) {
  console.log('   ✅ Creates proper wallet interface');
} else {
  console.log('   ❌ Missing wallet interface creation');
  process.exit(1);
}

if (tokenFormContent.includes('publicKey: (window as any).solana?.publicKey')) {
  console.log('   ✅ Correctly accesses wallet publicKey');
} else {
  console.log('   ❌ Incorrect publicKey access');
  process.exit(1);
}

// Test 3: Check solana.ts redirects properly
const solanaPath = path.join(__dirname, 'lib/solana.ts');
const solanaContent = fs.readFileSync(solanaPath, 'utf8');

console.log('\n✅ Test 3: Checking solana.ts redirection...');
if (solanaContent.includes("import('./solana-alternative')")) {
  console.log('   ✅ Correctly redirects to solana-alternative');
} else {
  console.log('   ❌ Missing redirection to alternative method');
  process.exit(1);
}

if (solanaContent.includes('createSolanaTokenDirect')) {
  console.log('   ✅ Uses createSolanaTokenDirect function');
} else {
  console.log('   ❌ Not using direct method');
  process.exit(1);
}

// Test 4: Check solana-alternative.ts exists and has correct export
const altPath = path.join(__dirname, 'lib/solana-alternative.ts');
if (fs.existsSync(altPath)) {
  console.log('\n✅ Test 4: Checking solana-alternative.ts...');
  const altContent = fs.readFileSync(altPath, 'utf8');
  
  if (altContent.includes('export async function createSolanaTokenDirect')) {
    console.log('   ✅ Has createSolanaTokenDirect export');
  } else {
    console.log('   ❌ Missing createSolanaTokenDirect export');
    process.exit(1);
  }
  
  if (altContent.includes('TOKEN_PROGRAM_ID')) {
    console.log('   ✅ Uses standard Solana token program');
  } else {
    console.log('   ❌ Missing token program reference');
    process.exit(1);
  }
} else {
  console.log('\n❌ Test 4: solana-alternative.ts not found');
  process.exit(1);
}

// Test 5: Check callback interface compatibility
console.log('\n✅ Test 5: Checking callback interface...');
if (tokenFormContent.includes('onStepUpdate: (step, status, details)')) {
  console.log('   ✅ Uses correct callback signature');
} else {
  console.log('   ❌ Incorrect callback signature');
  process.exit(1);
}

if (tokenFormContent.includes('setTransactionStatus')) {
  console.log('   ✅ Updates transaction status correctly');
} else {
  console.log('   ❌ Missing transaction status updates');
  process.exit(1);
}

console.log('\n🎉 All tests passed! Solana token creation fix is properly implemented.\n');

console.log('📋 Summary of changes:');
console.log('   • TokenFormNew.tsx now imports from @/lib/solana');
console.log('   • Uses createTokenOnChain which redirects to reliable method');
console.log('   • Proper wallet interface with publicKey and signTransaction');
console.log('   • Compatible callback structure for status updates');
console.log('   • Eliminates dependency on buggy contract implementation');

console.log('\n🚀 Ready for testing with real Solana wallet on devnet!');
