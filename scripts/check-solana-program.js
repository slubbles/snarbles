#!/usr/bin/env node

/**
 * Solana Program Verification Script
 * This script checks if the Snarbles token program is properly deployed on devnet
 */

const { Connection, PublicKey } = require('@solana/web3.js');

const PROGRAM_ID = 'BKyaw9S5QkkSQ3dc3FdivbsYRWw2ADw9zN4bjnLStWbT';
const DEVNET_ENDPOINT = 'https://api.devnet.solana.com';

async function checkProgram() {
  console.log('🔍 Checking Solana Program Deployment...\n');
  
  const connection = new Connection(DEVNET_ENDPOINT, 'confirmed');
  const programPubkey = new PublicKey(PROGRAM_ID);
  
  try {
    // Check if program exists
    console.log(`Program ID: ${PROGRAM_ID}`);
    console.log(`Network: Devnet (${DEVNET_ENDPOINT})\n`);
    
    const accountInfo = await connection.getAccountInfo(programPubkey);
    
    if (!accountInfo) {
      console.log('❌ PROGRAM NOT FOUND');
      console.log('\nThe program is not deployed to devnet. You need to:');
      console.log('1. Deploy the Solana program using Anchor');
      console.log('2. Update the PROGRAM_ID in lib/solana.ts');
      console.log('3. Initialize the platform through the admin page');
      return;
    }
    
    if (!accountInfo.executable) {
      console.log('❌ ACCOUNT EXISTS BUT NOT EXECUTABLE');
      console.log('\nThe account exists but is not a program (not executable).');
      return;
    }
    
    console.log('✅ PROGRAM FOUND AND EXECUTABLE');
    console.log(`Owner: ${accountInfo.owner.toString()}`);
    console.log(`Data Length: ${accountInfo.data.length} bytes`);
    console.log(`Rent Epoch: ${accountInfo.rentEpoch}`);
    
    // Try to check for platform state PDAs
    console.log('\n🔍 Checking for Platform State...');
    
    const adminWalletBytes = new PublicKey('352YpA1YVHmN9Jirf5cDZdELWvsrP3DJVL7svAHJtmUj').toBuffer();
    
    const seeds = [
      [Buffer.from('platform_state')],
      [Buffer.from('state')],
      [adminWalletBytes]
    ];
    
    let foundPDA = false;
    
    for (let i = 0; i < seeds.length; i++) {
      try {
        const [pda] = PublicKey.findProgramAddressSync(seeds[i], programPubkey);
        const pdaAccount = await connection.getAccountInfo(pda);
        
        if (pdaAccount) {
          console.log(`✅ Platform state found at PDA: ${pda.toString()}`);
          console.log(`   Data length: ${pdaAccount.data.length} bytes`);
          foundPDA = true;
          break;
        } else {
          console.log(`   Checking PDA ${i + 1}: ${pda.toString()} - Not found`);
        }
      } catch (error) {
        console.log(`   PDA derivation ${i + 1} failed: ${error.message}`);
      }
    }
    
    if (!foundPDA) {
      console.log('\n⚠️ No platform state found');
      console.log('The program is deployed but not initialized.');
      console.log('Use the admin page to initialize the platform.');
    } else {
      console.log('\n✅ Platform appears to be initialized and ready!');
    }
    
  } catch (error) {
    console.log('❌ ERROR CHECKING PROGRAM');
    console.log(`Error: ${error.message}`);
  }
}

checkProgram().catch(console.error);
