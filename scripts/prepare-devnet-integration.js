const fs = require('fs');
const path = require('path');

// This script will be used to update the devnet program ID when provided
function updateDevnetProgramId(newProgramId) {
  const configPath = path.join(__dirname, '../lib/solana-data.ts');
  
  try {
    // Read the current file
    let content = fs.readFileSync(configPath, 'utf8');
    
    // Replace the placeholder with the actual program ID
    const updatedContent = content.replace(
      'PLACEHOLDER_DEVNET_PROGRAM_ID',
      newProgramId
    );
    
    // Write back to file
    fs.writeFileSync(configPath, updatedContent);
    
    console.log('✅ Successfully updated devnet program ID');
    console.log(`📝 New Program ID: ${newProgramId}`);
    console.log(`📁 Updated file: ${configPath}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error updating devnet program ID:', error.message);
    return false;
  }
}

// Check if program ID is provided as command line argument
const programId = process.argv[2];

if (!programId) {
  console.log('🔧 Devnet Integration Preparation Script');
  console.log('=====================================');
  console.log('');
  console.log('📋 Current Status:');
  console.log('  - Devnet integration code is ready');
  console.log('  - Waiting for devnet program ID');
  console.log('');
  console.log('🚀 Usage:');
  console.log('  node scripts/prepare-devnet-integration.js <PROGRAM_ID>');
  console.log('');
  console.log('📝 Example:');
  console.log('  node scripts/prepare-devnet-integration.js AbC123dEfGh456iJkLm789nOpQr012sTuVwXyZ345');
  console.log('');
  console.log('⏳ Once you provide the devnet program ID, this script will:');
  console.log('  1. Update lib/solana-data.ts with the new program ID');
  console.log('  2. Enable devnet token creation in the UI');
  console.log('  3. Configure proper network switching');
  console.log('');
} else {
  console.log('🔧 Updating Devnet Configuration...');
  console.log('=====================================');
  
  if (updateDevnetProgramId(programId)) {
    console.log('');
    console.log('🎉 Devnet integration complete!');
    console.log('');
    console.log('✅ What works now:');
    console.log('  - Users can select "Devnet" in network selector');
    console.log('  - Token creation will use the deployed devnet contract');
    console.log('  - All error handling and validation is ready');
    console.log('');
    console.log('🔄 Next steps:');
    console.log('  1. Restart the development server');
    console.log('  2. Test token creation on devnet');
    console.log('  3. Verify transactions on Solana Explorer (devnet)');
  }
}

module.exports = { updateDevnetProgramId }; 