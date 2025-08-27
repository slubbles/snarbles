/**
 * Test Script for ASA Verification Accuracy
 * 
 * This script tests the accuracy of the ASA verification system
 * with known asset IDs to ensure 100% accurate data display.
 */

import { verifyASAEnhanced } from './lib/algorand-asa-verification.js';

async function testVerificationAccuracy() {
  console.log('🧪 Testing ASA Verification Accuracy...\n');
  
  // Test assets with known properties
  const testAssets = [
    {
      id: 3182277509,
      expectedName: 'Snarbles',
      expectedSymbol: 'SNRB',
      description: 'Snarbles token - test asset'
    },
    {
      id: 312769, 
      expectedName: 'USD Coin',
      expectedSymbol: 'USDC',
      description: 'USDC - major stablecoin'
    },
    {
      id: 31566704,
      expectedName: 'USDT',
      expectedSymbol: 'USDT', 
      description: 'Tether USD - stablecoin'
    }
  ];
  
  for (const asset of testAssets) {
    console.log(`\n🔍 Testing Asset ID: ${asset.id} (${asset.description})`);
    console.log('=' .repeat(60));
    
    try {
      const result = await verifyASAEnhanced(asset.id, 'mainnet', {
        includeDistributionAnalysis: true,
        validateMetadata: true,
        checkCrossNetwork: false, // Skip cross-network for faster testing
        timeout: 30000 // Extended timeout for thorough testing
      });
      
      // Verify basic info accuracy
      console.log(`📊 Verification Results:`);
      console.log(`  Name: ${result.basicInfo.name} ${result.basicInfo.name === asset.expectedName ? '✅' : '❌'}`);
      console.log(`  Symbol: ${result.basicInfo.unitName} ${result.basicInfo.unitName === asset.expectedSymbol ? '✅' : '❌'}`);
      console.log(`  Total Supply: ${result.basicInfo.totalSupply.toLocaleString()}`);
      console.log(`  Decimals: ${result.basicInfo.decimals}`);
      console.log(`  Creator: ${result.basicInfo.creator}`);
      
      // Verify roles accuracy
      console.log(`\n🔐 Management Roles:`);
      console.log(`  Manager: ${result.roles.manager || 'None'}`);
      console.log(`  Reserve: ${result.roles.reserve || 'None'}`);
      console.log(`  Freeze: ${result.roles.freeze || 'None'}`);
      console.log(`  Clawback: ${result.roles.clawback || 'None'}`);
      console.log(`  Is Immutable: ${result.roles.isImmutable ? '✅' : '❌'}`);
      
      // Verify distribution data
      console.log(`\n📈 Distribution Analysis:`);
      console.log(`  Holder Count: ${result.distribution.holderCount || 'Unknown'}`);
      console.log(`  Top Holder %: ${result.distribution.topHolderPercentage?.toFixed(2) || 'Unknown'}%`);
      console.log(`  Distribution Health: ${result.distribution.distributionHealth}`);
      
      // Verify standards compliance
      console.log(`\n📋 Standards Compliance:`);
      console.log(`  ARC-3 Compliant: ${result.standards.arc3Compliant ? '✅' : '❌'}`);
      console.log(`  ARC-19 Compliant: ${result.standards.arc19Compliant ? '✅' : '❌'}`);
      console.log(`  Metadata Accessible: ${result.standards.metadataAccessible ? '✅' : '❌'}`);
      
      // Verify security assessment
      console.log(`\n🛡️ Security Assessment:`);
      console.log(`  Overall Score: ${result.score}/100`);
      console.log(`  Status: ${result.status.toUpperCase()}`);
      console.log(`  Risk Factors: ${result.security.riskFactors.length}`);
      console.log(`  Warnings: ${result.security.warnings.length}`);
      
      // Data quality check
      const dataQuality = calculateDataQuality(result);
      console.log(`\n📊 Data Quality Score: ${dataQuality.score}/100 (${dataQuality.grade})`);
      console.log(`  Missing Fields: ${dataQuality.missingFields.join(', ') || 'None'}`);
      
    } catch (error) {
      console.error(`❌ Verification failed for ${asset.id}:`, error);
    }
  }
  
  console.log('\n🎯 Verification accuracy testing completed!');
}

function calculateDataQuality(result) {
  let score = 100;
  const missingFields = [];
  
  // Check basic info completeness
  if (!result.basicInfo.name) { score -= 10; missingFields.push('name'); }
  if (!result.basicInfo.unitName) { score -= 10; missingFields.push('symbol'); }
  if (result.basicInfo.totalSupply === undefined) { score -= 5; missingFields.push('totalSupply'); }
  if (!result.basicInfo.creator) { score -= 5; missingFields.push('creator'); }
  
  // Check distribution data
  if (!result.distribution.holderCount) { score -= 15; missingFields.push('holderCount'); }
  if (!result.distribution.topHolderPercentage) { score -= 10; missingFields.push('topHolderPercentage'); }
  
  // Check metadata availability
  if (!result.standards.metadataAccessible) { score -= 10; missingFields.push('metadata'); }
  
  // Check security analysis
  if (result.security.riskFactors.length === 0 && result.security.warnings.length === 0) {
    score -= 5; // Suspicious if no risks identified
  }
  
  let grade = 'F';
  if (score >= 90) grade = 'A+';
  else if (score >= 85) grade = 'A';
  else if (score >= 80) grade = 'B+';
  else if (score >= 75) grade = 'B';
  else if (score >= 70) grade = 'C+';
  else if (score >= 65) grade = 'C';
  else if (score >= 60) grade = 'D';
  
  return { score: Math.max(0, score), grade, missingFields };
}

// Run the test
testVerificationAccuracy().catch(console.error);
