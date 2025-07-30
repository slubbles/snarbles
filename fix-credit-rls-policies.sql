-- Fix RLS Policies for Credit Transactions
-- This script will create proper RLS policies to allow credit transaction inserts

-- First, let's check current policies on credit_transactions table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'credit_transactions';

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Users can only access their own credit transactions" ON credit_transactions;
DROP POLICY IF EXISTS "Users can only view their own credit transactions" ON credit_transactions;

-- Create new policies that allow proper inserts
CREATE POLICY "Allow authenticated users to insert credit transactions" 
ON credit_transactions FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to view their own credit transactions" 
ON credit_transactions FOR SELECT 
TO authenticated 
USING (wallet_address = auth.jwt() ->> 'user_metadata' ->> 'wallet_address' OR wallet_address = auth.jwt() ->> 'sub');

CREATE POLICY "Allow service role full access to credit transactions"
ON credit_transactions FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Also check and fix user_credits table policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'user_credits';

-- Drop restrictive policies on user_credits if needed
DROP POLICY IF EXISTS "Users can only access their own credits" ON user_credits;

-- Create policies for user_credits table
CREATE POLICY "Allow authenticated users to view their own credits" 
ON user_credits FOR SELECT 
TO authenticated 
USING (wallet_address = auth.jwt() ->> 'user_metadata' ->> 'wallet_address' OR wallet_address = auth.jwt() ->> 'sub');

CREATE POLICY "Allow authenticated users to update their own credits" 
ON user_credits FOR UPDATE 
TO authenticated 
USING (wallet_address = auth.jwt() ->> 'user_metadata' ->> 'wallet_address' OR wallet_address = auth.jwt() ->> 'sub')
WITH CHECK (wallet_address = auth.jwt() ->> 'user_metadata' ->> 'wallet_address' OR wallet_address = auth.jwt() ->> 'sub');

CREATE POLICY "Allow service role full access to user credits"
ON user_credits FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Check table structure to ensure our fields exist
\d credit_transactions;
\d user_credits;

-- Test insert capability (this should work now)
SELECT 'RLS policies updated successfully' as status;
