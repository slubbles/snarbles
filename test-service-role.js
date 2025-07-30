// Test with service role to bypass RLS
const { createClient } = require('@supabase/supabase-js');

async function testWithServiceRole() {
  console.log('🧪 Testing with service role...');
  
  const supabaseUrl = 'https://gsrzxzrpxtyjddqkperq.supabase.co';
  const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzcnp4enJweHR5amRkcWtwZXJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjAyMDQyNCwiZXhwIjoyMDU3NTk2NDI0fQ.jb8hTGYhC3LbLjKhiUEkpeCvjGUw7pjNJj7hVqT4PDA'; // Service role key
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Test transaction with service role
    const testTransaction = {
      wallet_address: 'PJEIDDKUOONTJOIV3BLZS7SZSAHCVKNNHTLKMASI6RTYSOZNSDY7MWGZ3M',
      type: 'initial',
      amount: 20,
      description: 'Test credit purchase with service role',
      transaction_reference: 'test-service-123'
    };
    
    console.log('📋 Transaction data:', testTransaction);
    
    const { data, error } = await supabase
      .from('credit_transactions')
      .insert([testTransaction])
      .select()
      .single();
    
    if (error) {
      console.log('❌ Service role error:', error.message);
      console.log('Full error:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ Service role insert successful:', data);
    }
    
  } catch (err) {
    console.log('❌ Unexpected error:', err.message);
  }
}

testWithServiceRole();
