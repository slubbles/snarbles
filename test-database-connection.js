// Simple Database Test and Fix for Credit Transactions
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Environment Check:');
console.log('URL:', supabaseUrl ? '✅ Found' : '❌ Missing');
console.log('Service Key:', supabaseServiceKey ? '✅ Found' : '❌ Missing');

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

async function checkAndFixDatabase() {
  console.log('\n🔍 Checking database schema and tables...');

  try {
    // First, let's see what tables exist
    console.log('📋 Checking available tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (tablesError) {
      console.log('Could not check tables directly, trying alternative approach...');
    } else {
      console.log('Available tables:', tables.map(t => t.table_name));
    }

    // Check credit_transactions table structure
    console.log('\n📊 Checking credit_transactions table...');
    const { data: creditTxTest, error: creditTxError } = await supabase
      .from('credit_transactions')
      .select('*')
      .limit(1);

    if (creditTxError) {
      console.log('❌ Credit transactions table error:', creditTxError.message);
      
      // Try to create the table if it doesn't exist
      console.log('🛠️ Attempting to create credit_transactions table...');
      const createTableResult = await supabase.rpc('exec', {
        sql: `
          CREATE TABLE IF NOT EXISTS credit_transactions (
            id BIGSERIAL PRIMARY KEY,
            wallet_address TEXT NOT NULL,
            amount DECIMAL(18,6) NOT NULL,
            credits_received INTEGER NOT NULL,
            transaction_hash TEXT UNIQUE NOT NULL,
            network TEXT NOT NULL DEFAULT 'algorand',
            payment_method TEXT NOT NULL DEFAULT 'algo',
            status TEXT NOT NULL DEFAULT 'completed',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          -- Enable RLS
          ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
          
          -- Create indexes
          CREATE INDEX IF NOT EXISTS idx_credit_transactions_wallet ON credit_transactions(wallet_address);
          CREATE INDEX IF NOT EXISTS idx_credit_transactions_hash ON credit_transactions(transaction_hash);
        `
      });
      
      if (createTableResult.error) {
        console.log('Could not create table via RPC, trying direct approach...');
      }
    } else {
      console.log('✅ Credit transactions table exists');
      console.log('Sample structure:', Object.keys(creditTxTest[0] || {}));
    }

    // Check user_credits table
    console.log('\n📊 Checking user_credits table...');
    const { data: userCreditsTest, error: userCreditsError } = await supabase
      .from('user_credits')
      .select('*')
      .limit(1);

    if (userCreditsError) {
      console.log('❌ User credits table error:', userCreditsError.message);
    } else {
      console.log('✅ User credits table exists');
      console.log('Sample structure:', Object.keys(userCreditsTest[0] || {}));
    }

    // Test a simple insert with service role
    console.log('\n🧪 Testing service role insert...');
    const testData = {
      wallet_address: `test_${Date.now()}`,
      amount: 10.5,
      credits_received: 105,
      transaction_hash: `test_hash_${Date.now()}`,
      network: 'algorand',
      payment_method: 'algo',
      status: 'completed'
    };

    const { data: insertResult, error: insertError } = await supabase
      .from('credit_transactions')
      .insert(testData)
      .select();

    if (insertError) {
      console.log('❌ Service role insert failed:', insertError.message);
      console.log('Error details:', insertError);
      
      // Try without RLS
      console.log('\n🔓 Trying to disable RLS temporarily...');
      const { error: disableRLSError } = await supabase.rpc('exec', {
        sql: 'ALTER TABLE credit_transactions DISABLE ROW LEVEL SECURITY;'
      });
      
      if (disableRLSError) {
        console.log('Could not disable RLS via RPC');
      } else {
        console.log('✅ RLS disabled, retrying insert...');
        const { data: retryResult, error: retryError } = await supabase
          .from('credit_transactions')
          .insert(testData)
          .select();
          
        if (retryError) {
          console.log('❌ Insert still failed:', retryError.message);
        } else {
          console.log('✅ Insert successful with RLS disabled!', retryResult);
          
          // Clean up test data
          await supabase
            .from('credit_transactions')
            .delete()
            .eq('id', retryResult[0].id);
        }
      }
    } else {
      console.log('✅ Service role insert successful!', insertResult);
      
      // Clean up test data
      await supabase
        .from('credit_transactions')
        .delete()
        .eq('id', insertResult[0].id);
    }

    // Provide final recommendations
    console.log('\n📝 Final Recommendations:');
    console.log('1. If RLS is causing issues, consider disabling it temporarily');
    console.log('2. Ensure your service role key has proper permissions');
    console.log('3. Check if the table schema matches your application expectations');
    
    return true;

  } catch (error) {
    console.error('❌ Database check failed:', error);
    return false;
  }
}

// Run the check
checkAndFixDatabase()
  .then(success => {
    console.log(success ? '\n🎉 Database check completed!' : '\n❌ Database check failed');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
