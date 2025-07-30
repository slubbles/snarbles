// Test the RPC function approach for credit transactions
const { createClient } = require('@supabase/supabase-js');

async function testRPCFunction() {
  console.log('🧪 Testing RPC function for credit transactions...');
  
  const supabaseUrl = 'https://gsrzxzrpxtyjddqkperq.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzcnp4enJweHR5amRkcWtwZXJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwMjA0MjQsImV4cCI6MjA1NzU5NjQyNH0.hRXbfLbDtkC2Hbh6ZlVJzT-RsgbogZZ_YGeX6FOcYPI';
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // Test the RPC function
    console.log('🔍 Calling add_credit_transaction RPC function...');
    
    const { data, error } = await supabase.rpc('add_credit_transaction', {
      p_wallet_address: 'PJEIDDKUOONTJOIV3BLZS7SZSAHCVKNNHTLKMASI6RTYSOZNSDY7MWGZ3M',
      p_type: 'initial',
      p_amount: 20,
      p_description: 'Test RPC credit purchase',
      p_transaction_reference: 'rpc-test-123'
    });
    
    if (error) {
      console.log('❌ RPC function error:', error.message);
      console.log('Error details:', JSON.stringify(error, null, 2));
      
      // Check if function exists
      console.log('🔍 Checking if function exists...');
      const { data: functions, error: fnError } = await supabase.rpc('add_credit_transaction');
      if (fnError && fnError.message.includes('does not exist')) {
        console.log('❌ Function does not exist. Need to create it in Supabase SQL Editor.');
        console.log('📝 Please run the SQL from: supabase-credit-function.sql');
      }
    } else {
      console.log('✅ RPC function successful:', data);
      
      // Parse result if it's a string
      const result = typeof data === 'string' ? JSON.parse(data) : data;
      console.log('📊 Parsed result:', result);
    }
    
  } catch (err) {
    console.log('❌ Unexpected error:', err.message);
  }
}

testRPCFunction();
