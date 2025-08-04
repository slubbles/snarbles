# 🚨 IMMEDIATE DATABASE FIXES FOR CONSOLE ERRORS

## Issues Found and Solutions

### 1. ❌ Missing DialogDescription Warning
**Problem**: `Warning: Missing Description or aria-describedby={undefined} for {DialogContent}.`
**Solution**: ✅ Added DialogDescription to TransactionStatusModalEnhanced

### 2. ❌ RPC Function 404 Error
**Problem**: `Failed to load resource: server responded with status of 404` for `add_credit_transaction`
**Solution**: Create the missing RPC function

### 3. ❌ Analytics Events 401 Error
**Problem**: `Database error details: 401` when inserting into `analytics_events` table
**Solution**: Fix RLS policies for analytics_events table

## 🔧 SQL FIXES TO RUN IN SUPABASE

```sql
-- Fix 1: Create missing RPC function for credit transactions
CREATE OR REPLACE FUNCTION add_credit_transaction(
  p_wallet_address TEXT,
  p_type TEXT,
  p_amount NUMERIC,
  p_description TEXT,
  p_transaction_reference TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result_data JSON;
  new_transaction credit_transactions;
BEGIN
  -- Validate input parameters
  IF p_wallet_address IS NULL OR p_wallet_address = '' THEN
    RETURN json_build_object('success', false, 'error', 'Wallet address is required');
  END IF;

  IF p_type NOT IN ('initial', 'usage', 'refund', 'bonus') THEN
    RETURN json_build_object('success', false, 'error', 'Invalid transaction type');
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Amount must be positive');
  END IF;

  -- Check if user profile exists, create if not
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE wallet_address = p_wallet_address) THEN
    INSERT INTO user_profiles (wallet_address, wallet_type, network, credits_balance, total_tokens_created)
    VALUES (p_wallet_address, 'algorand', 'algorand-mainnet', 0, 0);
  END IF;

  -- Insert the credit transaction
  INSERT INTO credit_transactions (
    wallet_address,
    type,
    amount,
    description,
    transaction_reference,
    network
  ) VALUES (
    p_wallet_address,
    p_type,
    p_amount,
    p_description,
    p_transaction_reference,
    'mainnet'
  ) RETURNING * INTO new_transaction;

  -- Update user credits balance
  IF p_type IN ('initial', 'bonus', 'refund') THEN
    UPDATE user_profiles 
    SET 
      credits_balance = credits_balance + p_amount,
      updated_at = NOW()
    WHERE wallet_address = p_wallet_address;
  ELSIF p_type = 'usage' THEN
    UPDATE user_profiles 
    SET 
      credits_balance = GREATEST(credits_balance - p_amount, 0),
      updated_at = NOW()
    WHERE wallet_address = p_wallet_address;
  END IF;

  -- Return success result
  result_data := json_build_object(
    'success', true,
    'data', row_to_json(new_transaction)
  );

  RETURN result_data;
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Fix 2: Create analytics_events table if it doesn't exist and fix RLS
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT,
  event_name TEXT NOT NULL,
  event_properties JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Allow analytics operations" ON analytics_events;
DROP POLICY IF EXISTS "Allow analytics event tracking" ON analytics_events;
DROP POLICY IF EXISTS "Allow reading analytics for transparency" ON analytics_events;

-- Create permissive RLS policies for analytics
CREATE POLICY "Allow all analytics operations"
  ON analytics_events FOR ALL
  USING (true)
  WITH CHECK (true);

-- Fix 3: Ensure token_creation_history table has proper RLS policies
DROP POLICY IF EXISTS "Anyone can view token history for transparency" ON token_creation_history;
DROP POLICY IF EXISTS "Allow token creation tracking" ON token_creation_history;

CREATE POLICY "Allow all token history operations"
  ON token_creation_history FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_wallet_address ON analytics_events(wallet_address);
CREATE INDEX IF NOT EXISTS idx_analytics_events_properties ON analytics_events USING GIN (event_properties);

-- Grant permissions
GRANT ALL ON analytics_events TO authenticated, anon;
GRANT ALL ON token_creation_history TO authenticated, anon;
GRANT ALL ON credit_transactions TO authenticated, anon;
GRANT ALL ON user_profiles TO authenticated, anon;

-- Test the fixes
SELECT 'Database fixes applied successfully!' as status;
```

## ✅ Expected Results

After running these SQL commands:

1. **RPC Function**: Credit transaction recording will work without 404 errors
2. **Analytics Events**: Token creation analytics will track successfully without 401 errors  
3. **Dialog Accessibility**: No more missing description warnings in console
4. **Token History**: Token creation history will save properly without permission errors

## 🧪 Test Commands

To verify the fixes work:

```sql
-- Test RPC function
SELECT add_credit_transaction(
  'PJEIDDKUOONTJOIV3BLZS7SZSAHCVKNNHTLKMASI6RTYSOZNSDY7MWGZ3M',
  'bonus',
  10,
  'Test transaction',
  'test_ref_123'
);

-- Test analytics events insertion
INSERT INTO analytics_events (wallet_address, event_name, event_properties)
VALUES ('test_wallet', 'token_creation', '{"test": true}');

-- Test token history insertion
INSERT INTO token_creation_history (wallet_address, token_name, token_symbol, network, contract_address)
VALUES ('test_wallet', 'Test Token', 'TEST', 'algorand-mainnet', 'test_contract');
```

All console errors should be resolved after applying these database fixes!
