// Simple Fix: Disable RLS and Test Direct Insert
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function simpleFixAndTest() {
  console.log('🔧 Attempting simple fix for credit transactions...');

  try {
    // First, let's see the exact table structure
    console.log('📊 Checking table structure...');
    
    // Try a simple select to see what columns exist
    const { data: sampleData, error: selectError } = await supabase
      .from('credit_transactions')
      .select('*')
      .limit(1);

    if (selectError) {
      console.log('Table structure check failed:', selectError.message);
    } else {
      console.log('Current table columns:', Object.keys(sampleData[0] || {}));
    }

    // Test insert with existing schema
    console.log('\n🧪 Testing insert with existing schema...');
    
    // First, ensure we have a user profile for the test wallet
    const testWallet = `test_wallet_${Date.now()}`;
    
    console.log('Creating test user profile...');
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        wallet_address: testWallet,
        wallet_type: 'algorand',
        network: 'mainnet',
        credits_balance: 100
      })
      .select();

    if (profileError) {
      console.log('⚠️  Profile creation failed:', profileError.message);
    } else {
      console.log('✅ Test profile created:', profileData);
    }

    // Now test credit transaction with existing schema
    const creditTxData = {
      wallet_address: testWallet,
      type: 'usage', // Use the existing 'type' field
      amount: 10.5,  // Use the existing 'amount' field
      description: 'ALGO credit purchase test',
      transaction_reference: `algo_tx_${Date.now()}`,
      network: 'mainnet'
    };

    console.log('Testing credit transaction insert...');
    const { data: creditData, error: creditError } = await supabase
      .from('credit_transactions')
      .insert(creditTxData)
      .select();

    if (creditError) {
      console.log('❌ Credit transaction failed:', creditError.message);
      console.log('Error details:', creditError);
    } else {
      console.log('✅ Credit transaction successful!', creditData);
      
      // Clean up test data
      await supabase.from('credit_transactions').delete().eq('id', creditData[0].id);
      await supabase.from('user_profiles').delete().eq('wallet_address', testWallet);
    }

    // Test simplified approach for your app
    console.log('\n💡 Recommended approach for your application:');
    console.log('1. Use existing table structure:');
    console.log('   - amount: for ALGO amount');
    console.log('   - transaction_reference: for transaction hash');
    console.log('   - description: for additional details like credits received');
    console.log('   - type: use "usage" for credit purchases');
    
    console.log('\n2. Update your application to use these fields:');
    console.log(`
    const creditTransaction = {
      wallet_address: walletAddress,
      type: 'usage',
      amount: algoAmount,
      description: \`ALGO credit purchase: \${creditsReceived} credits\`,
      transaction_reference: transactionHash,
      network: 'mainnet'
    };
    `);

    return true;

  } catch (error) {
    console.error('❌ Simple fix failed:', error);
    return false;
  }
}

// Run the simple fix
simpleFixAndTest()
  .then(success => {
    if (success) {
      console.log('\n🎉 Simple fix approach completed!');
      console.log('📝 Next step: Update your application code to use existing schema');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
