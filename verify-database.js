/**
 * Database verification script for Snarbles credit system
 */

import { supabase, isSupabaseAvailable } from './lib/supabase-client.js';

async function verifyDatabase() {
  console.log('🔍 Verifying Supabase database configuration...\n');

  if (!isSupabaseAvailable()) {
    console.log('❌ Supabase is not available');
    return;
  }

  console.log('✅ Supabase client is available');

  // Test 1: Check if user_profiles table exists
  console.log('\n📋 Testing user_profiles table...');
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('wallet_address, credits_balance')
      .limit(5);

    if (error) {
      console.log('❌ user_profiles table error:', error.message);
    } else {
      console.log('✅ user_profiles table accessible');
      console.log('📊 Sample data:', data);
    }
  } catch (error) {
    console.log('❌ user_profiles table error:', error.message);
  }

  // Test 2: Check if credit_transactions table exists
  console.log('\n💳 Testing credit_transactions table...');
  try {
    const { data, error } = await supabase
      .from('credit_transactions')
      .select('wallet_address, type, amount, timestamp')
      .limit(5);

    if (error) {
      console.log('❌ credit_transactions table error:', error.message);
    } else {
      console.log('✅ credit_transactions table accessible');
      console.log('📊 Sample data:', data);
    }
  } catch (error) {
    console.log('❌ credit_transactions table error:', error.message);
  }

  // Test 3: Check if add_credit_transaction RPC function exists
  console.log('\n⚙️ Testing add_credit_transaction RPC function...');
  try {
    const { data, error } = await supabase.rpc('add_credit_transaction', {
      p_wallet_address: 'TEST_ADDRESS',
      p_type: 'bonus',
      p_amount: 0,
      p_description: 'Database verification test',
      p_transaction_reference: 'TEST_REF'
    });

    if (error) {
      console.log('❌ add_credit_transaction RPC error:', error.message);
    } else {
      console.log('✅ add_credit_transaction RPC function accessible');
      console.log('📊 Response:', data);
    }
  } catch (error) {
    console.log('❌ add_credit_transaction RPC error:', error.message);
  }

  console.log('\n🎉 Database verification complete!');
}

verifyDatabase().catch(console.error);
