-- Fix the credit_transactions table and RLS policies
-- Run this in your Supabase SQL Editor: https://gsrzxzrpxtyjddqkperq.supabase.co/project/gsrzxzrpxtyjddqkperq/sql

-- First, let's check the current table structure
\d credit_transactions;

-- Add the missing network column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='credit_transactions' AND column_name='network') THEN
        ALTER TABLE credit_transactions ADD COLUMN network TEXT NOT NULL DEFAULT 'mainnet';
    END IF;
END $$;

-- Update RLS policies to be more permissive for credit transactions
DROP POLICY IF EXISTS "Allow credit transaction tracking" ON credit_transactions;

CREATE POLICY "Allow all credit transaction operations"
  ON credit_transactions FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create the RPC function to handle credit transactions securely
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

EXCEPTION
  WHEN others THEN
    RETURN json_build_object(
      'success', false, 
      'error', SQLERRM
    );
END;
$$;

-- Test the function
SELECT add_credit_transaction(
  'PJEIDDKUOONTJOIV3BLZS7SZSAHCVKNNHTLKMASI6RTYSOZNSDY7MWGZ3M',
  'initial',
  20,
  'Test credit purchase - SQL Editor',
  'sql-test-123'
);
