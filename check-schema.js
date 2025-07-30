// Check Exact Database Schema
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkExactSchema() {
  console.log('🔍 Checking exact database schema...');

  try {
    // Test minimal insert to see what's required
    const testWallet = `minimal_test_${Date.now()}`;
    
    // Create user profile first
    await supabase
      .from('user_profiles')
      .upsert({
        wallet_address: testWallet,
        wallet_type: 'algorand'
      });

    // Test minimal credit transaction
    const minimalData = {
      wallet_address: testWallet,
      type: 'usage',
      amount: 10.5
    };

    console.log('Testing minimal insert:', minimalData);
    const { data: result, error } = await supabase
      .from('credit_transactions')
      .insert(minimalData)
      .select();

    if (error) {
      console.log('❌ Minimal insert failed:', error.message);
    } else {
      console.log('✅ Minimal insert successful!');
      console.log('Available columns:', Object.keys(result[0]));
      console.log('Full result:', result[0]);
      
      // Clean up
      await supabase.from('credit_transactions').delete().eq('id', result[0].id);
    }
    
    // Clean up user profile
    await supabase.from('user_profiles').delete().eq('wallet_address', testWallet);

  } catch (error) {
    console.error('Schema check failed:', error);
  }
}

checkExactSchema();
