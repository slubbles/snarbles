#!/usr/bin/env node

/**
 * Test script to verify Algorand USDT integration configuration
 */

import { getAlgorandUSDTBalance, isOptedInToUSDT, estimateAlgorandUSDTFee } from './lib/algorand-usdt-integration.js';

const TEST_ADDRESS = 'PJEIDDKUOONTJOIV3BLZS7SZSAHCVKNNHTLKMASI6RTYSOZNSDY7MWGZ3M';

async function testConfiguration() {
  console.log('🧪 Testing Algorand USDT Integration Configuration...\n');

  // Test mainnet configuration
  console.log('🌐 Testing Mainnet Configuration:');
  try {
    const balanceResult = await getAlgorandUSDTBalance(TEST_ADDRESS, false);
    console.log('✅ Balance check:', balanceResult.success ? 'Success' : 'Failed');
    if (!balanceResult.success) {
      console.log('   Error:', balanceResult.error);
    }

    const optInResult = await isOptedInToUSDT(TEST_ADDRESS, false);
    console.log('✅ Opt-in check:', optInResult.success ? 'Success' : 'Failed');

    const feeResult = await estimateAlgorandUSDTFee(false);
    console.log('✅ Fee estimation:', feeResult.success ? 'Success' : 'Failed');
    if (feeResult.success) {
      console.log('   Estimated fee:', feeResult.fee, 'microAlgos');
    }
  } catch (error) {
    console.log('❌ Mainnet test failed:', error.message);
  }

  console.log('\n🧪 Testing Testnet Configuration:');
  try {
    const balanceResult = await getAlgorandUSDTBalance(TEST_ADDRESS, true);
    console.log('✅ Balance check:', balanceResult.success ? 'Success' : 'Failed');

    const optInResult = await isOptedInToUSDT(TEST_ADDRESS, true);
    console.log('✅ Opt-in check:', optInResult.success ? 'Success' : 'Failed');

    const feeResult = await estimateAlgorandUSDTFee(true);
    console.log('✅ Fee estimation:', feeResult.success ? 'Success' : 'Failed');
    if (feeResult.success) {
      console.log('   Estimated fee:', feeResult.fee, 'microAlgos');
    }
  } catch (error) {
    console.log('❌ Testnet test failed:', error.message);
  }

  console.log('\n🎉 Configuration test complete!');
}

testConfiguration().catch(console.error);
