// Quick test script to debug the database setup
const { createClient } = require('@supabase/supabase-js');

async function testDatabaseSetup() {
  console.log('🧪 Testing database setup...');
  
  const supabaseUrl = 'https://gsrzxzrpxtyjddqkperq.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzcnp4enJweHR5amRkcWtwZXJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwMjA0MjQsImV4cCI6MjA1NzU5NjQyNH0.hRXbfLbDtkC2Hbh6ZlVJzT-RsgbogZZ_YGeX6FOcYPI';
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // Check if user_profiles table exists and has the wallet address
    console.log('🔍 Checking user_profiles table...');
    const { data: userProfiles, error: userError } = await supabase
      .from('user_profiles')
      .select('wallet_address')
      .eq('wallet_address', 'PJEIDDKUOONTJOIV3BLZS7SZSAHCVKNNHTLKMASI6RTYSOZNSDY7MWGZ3M')
      .single();
    
    if (userError) {
      console.log('❌ User profile error:', userError.message);
      
      // Try to create the user profile first
      console.log('🔧 Attempting to create user profile...');
      const { data: newUser, error: createError } = await supabase
        .from('user_profiles')
        .insert([{
          wallet_address: 'PJEIDDKUOONTJOIV3BLZS7SZSAHCVKNNHTLKMASI6RTYSOZNSDY7MWGZ3M',
          wallet_type: 'algorand',
          network: 'algorand-mainnet',
          credits_balance: 0,
          total_tokens_created: 0
        }])
        .select()
        .single();
      
      if (createError) {
        console.log('❌ Failed to create user profile:', createError.message);
        return;
      } else {
        console.log('✅ User profile created:', newUser);
      }
    } else {
      console.log('✅ User profile exists:', userProfiles);
    }
    
    // Now try the credit transaction
    console.log('🔍 Testing credit transaction...');
    const testTransaction = {
      wallet_address: 'PJEIDDKUOONTJOIV3BLZS7SZSAHCVKNNHTLKMASI6RTYSOZNSDY7MWGZ3M',
      type: 'initial',
      amount: 20,
      description: 'Test credit purchase',
      transaction_reference: 'test-ref-123',
      network: 'mainnet'
    };
    
    const { data, error } = await supabase
      .from('credit_transactions')
      .insert([testTransaction])
      .select()
      .single();
    
    if (error) {
      console.log('❌ Credit transaction error:', error.message);
      console.log('Full error:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ Credit transaction successful:', data);
    }
    
  } catch (err) {
    console.log('❌ Unexpected error:', err.message);
  }
}

testDatabaseSetup();
