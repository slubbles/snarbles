const { Connection, PublicKey } = require('@solana/web3.js');

// Solana testnet configuration
const TESTNET_RPC = 'https://api.testnet.solana.com';
const PROGRAM_ID = '9oidC5V2vgYrDmnFWeatttrmageCjyS78Mv5VdpVXUp';

// Helper function to derive Platform State PDA
function getPlatformStatePDA(programId) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('platform_state')],
    programId
  );
}

async function checkSolanaInitialization() {
  console.log('🔍 Checking Solana Testnet Platform Initialization...\n');
  
  try {
    // Connect to testnet
    const connection = new Connection(TESTNET_RPC, 'confirmed');
    const programId = new PublicKey(PROGRAM_ID);
    
    console.log(`📡 Network: Solana Testnet`);
    console.log(`🏗️  Program ID: ${PROGRAM_ID}`);
    console.log(`🌐 RPC Endpoint: ${TESTNET_RPC}\n`);
    
    // Check if program exists
    console.log('1️⃣ Checking if program is deployed...');
    const programAccount = await connection.getAccountInfo(programId);
    
    if (!programAccount) {
      console.log('❌ Program not found on testnet');
      return;
    }
    
    console.log('✅ Program is deployed on testnet');
    console.log(`   Owner: ${programAccount.owner.toString()}`);
    console.log(`   Executable: ${programAccount.executable}`);
    console.log(`   Data length: ${programAccount.data.length} bytes\n`);
    
    // Check platform state
    console.log('2️⃣ Checking platform initialization...');
    const [platformStatePDA, bump] = getPlatformStatePDA(programId);
    console.log(`   Platform State PDA: ${platformStatePDA.toString()}`);
    console.log(`   Bump: ${bump}`);
    
    const platformAccount = await connection.getAccountInfo(platformStatePDA);
    
    if (!platformAccount) {
      console.log('⚠️  Platform State account not found');
      console.log('   This means the platform has NOT been initialized yet');
      console.log('   The program is deployed but initialize() has not been called\n');
      
      console.log('📋 To initialize the platform:');
      console.log('   1. Connect with the upgrade authority wallet');
      console.log('   2. Call the initialize() function');
      console.log('   3. Set the creation fee (e.g., 0.01 SOL)\n');
      
      console.log('💡 Current Status: PROGRAM DEPLOYED but NOT INITIALIZED');
      return false;
    }
    
    console.log('✅ Platform State account exists');
    console.log(`   Owner: ${platformAccount.owner.toString()}`);
    console.log(`   Data length: ${platformAccount.data.length} bytes`);
    console.log('   Platform is INITIALIZED and ready for token creation\n');
    
    console.log('🎉 Status: FULLY INITIALIZED AND READY');
    return true;
    
  } catch (error) {
    console.error('❌ Error checking initialization:', error.message);
    return false;
  }
}

// Run the check
checkSolanaInitialization()
  .then((isInitialized) => {
    console.log('\n' + '='.repeat(60));
    if (isInitialized) {
      console.log('🟢 RESULT: Platform is ready for token creation');
    } else {
      console.log('🟡 RESULT: Platform needs initialization');
    }
    console.log('='.repeat(60));
  })
  .catch(console.error); 