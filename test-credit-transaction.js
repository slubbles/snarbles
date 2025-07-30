// Quick test script to debug the credit transaction issue
const { createClient } = require('@supabase/supabase-js');

async function testCreditTransaction() {
  console.log('🧪 Testing credit transaction insertion...');
  
  const supabaseUrl = 'https://gsrzxzrpxtyjddqkperq.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzcnp4enJweHR5amRkcWtwZXJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwMjA0MjQsImV4cCI6MjA1NzU5NjQyNH0.hRXbfLbDtkC2Hbh6ZlVJzT-RsgbogZZ_YGeX6FOcYPI';
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // First, let's check the table structure
    console.log('🔍 Checking table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('credit_transactions')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.log('❌ Table access error:', tableError);
      return;
    } else {
      console.log('✅ Table accessible');
    }
    
    // Test data that matches the schema exactly
    const testTransaction = {
      wallet_address: 'PJEIDDKUOONTJOIV3BLZS7SZSAHCVKNNHTLKMASI6RTYSOZNSDY7MWGZ3M',
      type: 'initial',
      amount: 20,
      description: 'Test credit purchase',
      transaction_reference: 'test-ref-123',
      network: 'mainnet'
    };
    
    console.log('📋 Test transaction data:', testTransaction);
    
    // Try to insert
    const { data, error } = await supabase
      .from('credit_transactions')
      .insert([testTransaction])
      .select()
      .single();
    
    if (error) {
      console.log('❌ Insert error:', error);
      console.log('Error details:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ Transaction inserted successfully:', data);
    }
    
  } catch (err) {
    console.log('❌ Unexpected error:', err);
  }
}

testCreditTransaction();
