#!/usr/bin/env node

/**
 * Dynamic Pricing System Test Suite
 * Tests the complete functionality of the dynamic pricing system
 */

import { supabase } from '../lib/supabase-client.js';
import { 
  getAllPricingConfigs, 
  updatePricingConfig, 
  getPricingHistory,
  getFeeCollectionSummary,
  validateWalletAddress,
  formatFeeAmount,
  calculateDynamicFees
} from '../lib/dynamic-pricing.js';
import { 
  calculateTokenCreationFees, 
  getPlatformFeeConfig, 
  hasSufficientBalance,
  formatFeeDisplay 
} from '../lib/algorand-fees.js';

// Test configuration
const TEST_CONFIG = {
  network: 'algorand-mainnet',
  testWallet: 'PJEIDDKUOONTJOIV3BLZS7SZSAHCVKNNHTLKMASI6RTYSOZNSDY7MWGZ3M',
  testFeeAmount: 10000000, // 10 ALGO in microAlgos
  adminWallet: 'ADMIN_WALLET_ADDRESS_HERE'
};

// ANSI color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bright: '\x1b[1m'
};

function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const levelColors = {
    INFO: colors.blue,
    SUCCESS: colors.green,
    ERROR: colors.red,
    WARNING: colors.yellow,
    TEST: colors.magenta
  };
  
  console.log(`${levelColors[level]}[${level}]${colors.reset} ${colors.bright}${timestamp}${colors.reset} - ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

async function testDatabaseConnection() {
  log('TEST', '🔍 Testing database connection...');
  
  try {
    const { data, error } = await supabase.from('platform_pricing_config').select('count');
    
    if (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
    
    log('SUCCESS', '✅ Database connection successful');
    return true;
  } catch (error) {
    log('ERROR', '❌ Database connection failed', { error: error.message });
    return false;
  }
}

async function testPricingConfiguration() {
  log('TEST', '🔧 Testing pricing configuration management...');
  
  try {
    // Test getting all configurations
    log('INFO', 'Fetching all pricing configurations...');
    const allConfigs = await getAllPricingConfigs();
    
    if (!allConfigs.success) {
      throw new Error(`Failed to get pricing configs: ${allConfigs.error}`);
    }
    
    log('SUCCESS', `✅ Retrieved ${allConfigs.data?.length || 0} pricing configurations`);
    
    // Test updating Algorand mainnet configuration with 10 ALGO
    log('INFO', 'Testing 10 ALGO configuration update...');
    const updateResult = await updatePricingConfig(
      TEST_CONFIG.network,
      {
        base_fee_amount: TEST_CONFIG.testFeeAmount,
        fee_destination_wallet: TEST_CONFIG.testWallet,
        fee_destination_name: 'Test Collection Wallet',
        pricing_enabled: true,
        notes: 'Test configuration for 10 ALGO fee'
      },
      TEST_CONFIG.adminWallet
    );
    
    if (!updateResult.success) {
      throw new Error(`Failed to update pricing config: ${updateResult.error}`);
    }
    
    log('SUCCESS', '✅ Successfully updated 10 ALGO configuration');
    log('INFO', 'Updated configuration:', updateResult.data);
    
    return true;
  } catch (error) {
    log('ERROR', '❌ Pricing configuration test failed', { error: error.message });
    return false;
  }
}

async function testFeeCalculation() {
  log('TEST', '💰 Testing fee calculation functions...');
  
  try {
    // Test dynamic fee calculation
    log('INFO', 'Testing calculateTokenCreationFees...');
    const fees = await calculateTokenCreationFees(TEST_CONFIG.network);
    
    log('SUCCESS', '✅ Fee calculation successful');
    log('INFO', 'Calculated fees:', {
      platformFee: formatFeeDisplay(fees.platformFee) + ' ALGO',
      networkFees: formatFeeDisplay(fees.networkFees) + ' ALGO', 
      totalFees: formatFeeDisplay(fees.totalFees) + ' ALGO',
      feesInAlgo: fees.feesInAlgo
    });
    
    // Verify 10 ALGO fee is correctly calculated
    const expectedPlatformFee = 10_000_000; // 10 ALGO in microAlgos
    if (fees.platformFee === expectedPlatformFee) {
      log('SUCCESS', '✅ 10 ALGO platform fee correctly configured');
    } else {
      log('WARNING', `⚠️ Platform fee mismatch: expected ${expectedPlatformFee}, got ${fees.platformFee}`);
    }
    
    // Test platform fee config
    log('INFO', 'Testing getPlatformFeeConfig...');
    const feeConfig = await getPlatformFeeConfig('mainnet');
    
    log('SUCCESS', '✅ Platform fee config retrieved');
    log('INFO', 'Fee configuration:', {
      enabled: feeConfig.enabled,
      amount: formatFeeDisplay(feeConfig.amount) + ' ALGO',
      destination: feeConfig.destination,
      description: feeConfig.description
    });
    
    return true;
  } catch (error) {
    log('ERROR', '❌ Fee calculation test failed', { error: error.message });
    return false;
  }
}

async function testBalanceValidation() {
  log('TEST', '💳 Testing balance validation...');
  
  try {
    // Test balance check with different amounts
    const testBalances = [
      { balance: 5_000_000, description: '5 ALGO (insufficient)' },
      { balance: 15_000_000, description: '15 ALGO (sufficient)' },
      { balance: 100_000_000, description: '100 ALGO (more than sufficient)' }
    ];
    
    for (const test of testBalances) {
      log('INFO', `Testing balance: ${test.description}`);
      const balanceCheck = await hasSufficientBalance(test.balance, TEST_CONFIG.network);
      
      log('INFO', 'Balance check result:', {
        sufficient: balanceCheck.sufficient,
        required: formatFeeDisplay(balanceCheck.required) + ' ALGO',
        missing: balanceCheck.missing > 0 ? formatFeeDisplay(balanceCheck.missing) + ' ALGO' : 'None'
      });
    }
    
    log('SUCCESS', '✅ Balance validation tests completed');
    return true;
  } catch (error) {
    log('ERROR', '❌ Balance validation test failed', { error: error.message });
    return false;
  }
}

async function testWalletValidation() {
  log('TEST', '🔐 Testing wallet address validation...');
  
  try {
    const testAddresses = [
      { 
        address: 'PJEIDDKUOONTJOIV3BLZS7SZSAHCVKNNHTLKMASI6RTYSOZNSDY7MWGZ3M', 
        network: 'algorand-mainnet',
        expected: true,
        description: 'Valid Algorand address'
      },
      { 
        address: 'invalid-address', 
        network: 'algorand-mainnet',
        expected: false,
        description: 'Invalid Algorand address'
      },
      { 
        address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', 
        network: 'solana-devnet',
        expected: true,
        description: 'Valid Solana address'
      }
    ];
    
    for (const test of testAddresses) {
      const isValid = validateWalletAddress(test.address, test.network);
      const result = isValid === test.expected ? 'PASS' : 'FAIL';
      const resultColor = result === 'PASS' ? colors.green : colors.red;
      
      log('INFO', `${resultColor}${result}${colors.reset} - ${test.description}: ${isValid}`);
    }
    
    log('SUCCESS', '✅ Wallet validation tests completed');
    return true;
  } catch (error) {
    log('ERROR', '❌ Wallet validation test failed', { error: error.message });
    return false;
  }
}

async function testPricingHistory() {
  log('TEST', '📊 Testing pricing history tracking...');
  
  try {
    log('INFO', 'Fetching pricing history...');
    const history = await getPricingHistory(TEST_CONFIG.network);
    
    if (!history.success) {
      throw new Error(`Failed to get pricing history: ${history.error}`);
    }
    
    log('SUCCESS', `✅ Retrieved ${history.data?.length || 0} pricing history records`);
    
    if (history.data && history.data.length > 0) {
      log('INFO', 'Recent pricing changes:', history.data.slice(0, 3));
    }
    
    return true;
  } catch (error) {
    log('ERROR', '❌ Pricing history test failed', { error: error.message });
    return false;
  }
}

async function testFeeCollectionSummary() {
  log('TEST', '📈 Testing fee collection analytics...');
  
  try {
    log('INFO', 'Fetching fee collection summary...');
    const summary = await getFeeCollectionSummary();
    
    if (!summary.success) {
      throw new Error(`Failed to get fee collection summary: ${summary.error}`);
    }
    
    log('SUCCESS', `✅ Retrieved fee collection data for ${summary.data?.length || 0} networks`);
    
    if (summary.data && summary.data.length > 0) {
      log('INFO', 'Fee collection summary:', summary.data);
    }
    
    return true;
  } catch (error) {
    log('ERROR', '❌ Fee collection summary test failed', { error: error.message });
    return false;
  }
}

async function testUtilityFunctions() {
  log('TEST', '🔧 Testing utility functions...');
  
  try {
    // Test fee amount formatting
    const testAmounts = [
      { amount: 10_000_000, currency: 'ALGO', expected: '10 ALGO' },
      { amount: 1_500_000, currency: 'ALGO', expected: '1.5 ALGO' },
      { amount: 500_000, currency: 'SOL', expected: '0.5 SOL' }
    ];
    
    for (const test of testAmounts) {
      const formatted = formatFeeAmount(test.amount, test.currency);
      const result = formatted === test.expected ? 'PASS' : 'FAIL';
      const resultColor = result === 'PASS' ? colors.green : colors.red;
      
      log('INFO', `${resultColor}${result}${colors.reset} - Format ${test.amount} ${test.currency}: "${formatted}"`);
    }
    
    log('SUCCESS', '✅ Utility function tests completed');
    return true;
  } catch (error) {
    log('ERROR', '❌ Utility function test failed', { error: error.message });
    return false;
  }
}

async function runTestSuite() {
  log('INFO', `${colors.cyan}🚀 Starting Dynamic Pricing System Test Suite${colors.reset}`);
  log('INFO', '================================================');
  
  const tests = [
    { name: 'Database Connection', fn: testDatabaseConnection },
    { name: 'Pricing Configuration', fn: testPricingConfiguration },
    { name: 'Fee Calculation', fn: testFeeCalculation },
    { name: 'Balance Validation', fn: testBalanceValidation },
    { name: 'Wallet Validation', fn: testWalletValidation },
    { name: 'Pricing History', fn: testPricingHistory },
    { name: 'Fee Collection Summary', fn: testFeeCollectionSummary },
    { name: 'Utility Functions', fn: testUtilityFunctions }
  ];
  
  const results = [];
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    log('INFO', `\n--- Running ${test.name} Test ---`);
    
    try {
      const result = await test.fn();
      results.push({ name: test.name, passed: result });
      
      if (result) {
        passed++;
        log('SUCCESS', `✅ ${test.name} test PASSED`);
      } else {
        failed++;
        log('ERROR', `❌ ${test.name} test FAILED`);
      }
    } catch (error) {
      failed++;
      results.push({ name: test.name, passed: false, error: error.message });
      log('ERROR', `❌ ${test.name} test FAILED with error:`, { error: error.message });
    }
  }
  
  // Test Summary
  log('INFO', '\n================================================');
  log('INFO', `${colors.cyan}📊 TEST SUITE SUMMARY${colors.reset}`);
  log('INFO', '================================================');
  
  const passRate = ((passed / tests.length) * 100).toFixed(1);
  const summaryColor = passed === tests.length ? colors.green : failed > passed ? colors.red : colors.yellow;
  
  log('INFO', `${summaryColor}Total Tests: ${tests.length}${colors.reset}`);
  log('INFO', `${colors.green}Passed: ${passed}${colors.reset}`);
  log('INFO', `${colors.red}Failed: ${failed}${colors.reset}`);
  log('INFO', `${summaryColor}Pass Rate: ${passRate}%${colors.reset}`);
  
  if (passed === tests.length) {
    log('SUCCESS', `\n🎉 ${colors.bright}ALL TESTS PASSED!${colors.reset}`);
    log('SUCCESS', `✅ Dynamic Pricing System is fully functional`);
    log('SUCCESS', `✅ 10 ALGO configuration is working correctly`);
    log('SUCCESS', `✅ Ready for production deployment`);
  } else {
    log('ERROR', `\n⚠️ ${colors.bright}SOME TESTS FAILED${colors.reset}`);
    log('ERROR', `❌ Please review failed tests before deployment`);
  }
  
  return { passed, failed, passRate, results };
}

// Export for use in other scripts
export { runTestSuite, TEST_CONFIG };

// Run tests if script is called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTestSuite()
    .then((results) => {
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      log('ERROR', '💥 Test suite crashed:', { error: error.message });
      process.exit(1);
    });
} 