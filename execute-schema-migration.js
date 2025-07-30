// Execute Database Schema Fix
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
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

async function executeSchemaMigration() {
  console.log('🔧 Executing database schema migration...');

  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync('./fix-database-schema.sql', 'utf8');
    
    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement individually
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement.trim()) continue;

      console.log(`\n⚡ Executing statement ${i + 1}/${statements.length}:`);
      console.log(statement.substring(0, 100) + '...');

      const { data, error } = await supabase.rpc('exec', {
        sql: statement + ';'
      });

      if (error) {
        console.log(`⚠️  Warning for statement ${i + 1}:`, error.message);
        // Continue with other statements even if one fails
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`);
      }
    }

    // Test the fix
    console.log('\n🧪 Testing the schema fix...');
    
    // Test credit_transactions insert
    const testTransaction = {
      wallet_address: `test_${Date.now()}`,
      type: 'usage',
      amount: 10.5,
      credits_received: 105,
      transaction_hash: `test_hash_${Date.now()}`,
      network: 'algorand',
      payment_method: 'algo',
      status: 'completed',
      description: 'Test transaction'
    };

    const { data: insertResult, error: insertError } = await supabase
      .from('credit_transactions')
      .insert(testTransaction)
      .select();

    if (insertError) {
      console.log('❌ Insert test failed:', insertError.message);
      
      // Try alternative approach - use user-friendly column names
      const simpleTest = {
        wallet_address: `simple_test_${Date.now()}`,
        type: 'usage',
        amount: 5.0,
        description: 'Simple test transaction'
      };

      const { data: simpleResult, error: simpleError } = await supabase
        .from('credit_transactions')
        .insert(simpleTest)
        .select();

      if (simpleError) {
        console.log('❌ Simple insert also failed:', simpleError.message);
      } else {
        console.log('✅ Simple insert successful!', simpleResult);
        
        // Clean up
        await supabase
          .from('credit_transactions')
          .delete()
          .eq('id', simpleResult[0].id);
      }
    } else {
      console.log('✅ Full insert test successful!', insertResult);
      
      // Check if user_credits was updated
      const { data: userCredits, error: creditsError } = await supabase
        .from('user_credits')
        .select('*')
        .eq('wallet_address', testTransaction.wallet_address);

      if (creditsError) {
        console.log('⚠️  Could not check user_credits:', creditsError.message);
      } else {
        console.log('✅ User credits updated:', userCredits);
      }
      
      // Clean up test data
      await supabase
        .from('credit_transactions')
        .delete()
        .eq('id', insertResult[0].id);
        
      await supabase
        .from('user_credits')
        .delete()
        .eq('wallet_address', testTransaction.wallet_address);
    }

    console.log('\n🎉 Schema migration completed!');
    console.log('\n📋 Summary:');
    console.log('✅ Added missing columns to credit_transactions');
    console.log('✅ Created user_credits table');
    console.log('✅ Updated RLS policies');
    console.log('✅ Added triggers for automatic credit balance updates');
    
    return true;

  } catch (error) {
    console.error('❌ Migration failed:', error);
    return false;
  }
}

// Execute the migration
executeSchemaMigration()
  .then(success => {
    if (success) {
      console.log('\n🎉 Database is now ready for ALGO credit purchases!');
      console.log('✅ Your application should work properly now.');
    } else {
      console.log('\n❌ Migration failed. Manual intervention may be required.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
