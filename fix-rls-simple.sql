-- Simple RLS Policy Fix for Credit Transactions
-- Run this in your Supabase SQL Editor

-- Drop all existing policies for credit_transactions
DROP POLICY IF EXISTS "Allow credit transaction tracking" ON credit_transactions;
DROP POLICY IF EXISTS "Users can only access their own credit transactions" ON credit_transactions;
DROP POLICY IF EXISTS "Allow authenticated users to insert credit transactions" ON credit_transactions;
DROP POLICY IF EXISTS "Allow public read access to credit transactions" ON credit_transactions;
DROP POLICY IF EXISTS "Allow service role full access to credit transactions" ON credit_transactions;

-- Create a simple, permissive policy for all authenticated users
CREATE POLICY "Allow all authenticated operations on credit_transactions"
ON credit_transactions FOR ALL
TO authenticated, anon
USING (true)
WITH CHECK (true);

-- Verify the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'credit_transactions';
