// Test script to check actual table schema
const { createClient } = require('@supabase/supabase-js');

async function testActualSchema() {
  console.log('🧪 Testing actual database schema...');
  
  const supabaseUrl = 'https://gsrzxzrpxtyjddqkperq.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzcnp4enJweHR5amRkcWtwZXJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwMjA0MjQsImV4cCI6MjA1NzU5NjQyNH0.hRXbfLbDtkC2Hbh6ZlVJzT-RsgbogZZ_YGeX6FOcYPI';
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // Test with minimal fields first
    console.log('🔍 Testing with minimal fields...');
    const minimalTransaction = {
      wallet_address: 'PJEIDDKUOONTJOIV3BLZS7SZSAHCVKNNHTLKMASI6RTYSOZNSDY7MWGZ3M',
      type: 'initial',
      amount: 20,
      description: 'Test credit purchase'
    };
    
    console.log('📋 Minimal transaction data:', minimalTransaction);
    
    const { data: minimal, error: minimalError } = await supabase
      .from('credit_transactions')
      .insert([minimalTransaction])
      .select()
      .single();
    
    if (minimalError) {
      console.log('❌ Minimal insert error:', minimalError.message);
    } else {
      console.log('✅ Minimal insert successful:', minimal);
      
      // Try with transaction_reference
      console.log('🔍 Testing with transaction_reference...');
      const withRefTransaction = {
        wallet_address: 'PJEIDDKUOONTJOIV3BLZS7SZSAHCVKNNHTLKMASI6RTYSOZNSDY7MWGZ3M',
        type: 'initial',
        amount: 25,
        description: 'Test with reference',
        transaction_reference: 'test-ref-456'
      };
      
      const { data: withRef, error: refError } = await supabase
        .from('credit_transactions')
        .insert([withRefTransaction])
        .select()
        .single();
      
      if (refError) {
        console.log('❌ With reference error:', refError.message);
      } else {
        console.log('✅ With reference successful:', withRef);
      }
    }
    
  } catch (err) {
    console.log('❌ Unexpected error:', err.message);
  }
}

testActualSchema();
