// Test Valid Types for Credit Transactions
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function testValidTypes() {
  console.log('🧪 Testing valid types for credit_transactions...');

  const testWallet = `type_test_${Date.now()}`;
  
  // Create profile first
  await supabase.from('user_profiles').upsert({
    wallet_address: testWallet,
    wallet_type: 'algorand'
  });

  const validTypes = ['initial', 'usage', 'refund', 'bonus'];
  
  for (const type of validTypes) {
    console.log(`\n🔍 Testing type: "${type}"`);
    
    const testData = {
      wallet_address: testWallet,
      type: type,
      amount: 10.5,
      description: `Test transaction with type: ${type}`,
      transaction_reference: `test_${type}_${Date.now()}`
    };

    const { data, error } = await supabase
      .from('credit_transactions')
      .insert(testData)
      .select();

    if (error) {
      console.log(`❌ Type "${type}" failed:`, error.message);
    } else {
      console.log(`✅ Type "${type}" worked:`, data[0].id);
      // Clean up
      await supabase.from('credit_transactions').delete().eq('id', data[0].id);
    }
  }

  // Clean up profile
  await supabase.from('user_profiles').delete().eq('wallet_address', testWallet);
}

testValidTypes();
