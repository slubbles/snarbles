// Test the hybrid approach for credit transactions
const { createClient } = require('@supabase/supabase-js');

async function testHybridApproach() {
  console.log('🧪 Testing hybrid approach for credit transactions...');
  
  const supabaseUrl = 'https://gsrzxzrpxtyjddqkperq.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzcnp4enJweHR5amRkcWtwZXJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwMjA0MjQsImV4cCI6MjA1NzU5NjQyNH0.hRXbfLbDtkC2Hbh6ZlVJzT-RsgbogZZ_YGeX6FOcYPI';
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // Test direct insert with minimal data
    console.log('🔍 Testing direct insert with minimal data...');
    
    const minimalTransaction = {
      wallet_address: 'PJEIDDKUOONTJOIV3BLZS7SZSAHCVKNNHTLKMASI6RTYSOZNSDY7MWGZ3M',
      type: 'initial',
      amount: 20,
      description: 'Test minimal credit purchase'
    };
    
    console.log('📝 Minimal transaction:', minimalTransaction);
    
    const { data, error } = await supabase
      .from('credit_transactions')
      .insert([minimalTransaction])
      .select()
      .single();
    
    if (error) {
      console.log('❌ Minimal insert error:', error.message);
      console.log('Error code:', error.code);
      console.log('Full error:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ Minimal insert successful:', data);
    }
    
  } catch (err) {
    console.log('❌ Unexpected error:', err.message);
  }
}

testHybridApproach();
