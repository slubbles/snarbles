-- Run this in Supabase SQL Editor: https://gsrzxzrpxtyjddqkperq.supabase.co/project/gsrzxzrpxtyjddqkperq/sql

-- Fix RLS policy for credit_transactions
DROP POLICY IF EXISTS "Allow credit transaction tracking" ON credit_transactions;
DROP POLICY IF EXISTS "Anyone can view credit transactions for transparency" ON credit_transactions;

-- Create more permissive policies
CREATE POLICY "Allow all credit transaction operations"
  ON credit_transactions FOR ALL
  USING (true)
  WITH CHECK (true);

-- Verify the table structure and add missing columns if needed
DO $$ 
BEGIN
    -- Check if network column exists, add if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='credit_transactions' AND column_name='network') THEN
        ALTER TABLE credit_transactions ADD COLUMN network TEXT DEFAULT 'mainnet';
    END IF;
END $$;

-- Test insert to verify it works
INSERT INTO credit_transactions (wallet_address, type, amount, description, transaction_reference)
VALUES ('TEST_WALLET', 'initial', 1, 'Test transaction after RLS fix', 'test-123')
ON CONFLICT DO NOTHING;
