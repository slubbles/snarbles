-- Fix Credit Transactions Schema for ALGO Purchases
-- This migration adds missing columns to support ALGO credit purchases

-- Add missing columns to credit_transactions table
ALTER TABLE credit_transactions 
ADD COLUMN IF NOT EXISTS credits_received INTEGER,
ADD COLUMN IF NOT EXISTS transaction_hash TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'algo',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed';

-- Create user_credits table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_credits (
  wallet_address TEXT PRIMARY KEY,
  credits_balance NUMERIC DEFAULT 0 NOT NULL CHECK (credits_balance >= 0),
  total_purchased NUMERIC DEFAULT 0 NOT NULL,
  last_purchase_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS on user_credits
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_credits
DROP POLICY IF EXISTS "Allow users to view their own credits" ON user_credits;
DROP POLICY IF EXISTS "Allow users to update their own credits" ON user_credits;

CREATE POLICY "Allow public read access to user credits"
  ON user_credits FOR SELECT
  USING (true);

CREATE POLICY "Allow service role full access to user credits"
  ON user_credits FOR ALL
  USING (true);

-- Update credit_transactions RLS policies to be more permissive
DROP POLICY IF EXISTS "Anyone can view credit transactions for transparency" ON credit_transactions;
DROP POLICY IF EXISTS "Allow credit transaction tracking" ON credit_transactions;

CREATE POLICY "Allow public read access to credit transactions"
  ON credit_transactions FOR SELECT
  USING (true);

CREATE POLICY "Allow service role full access to credit transactions"
  ON credit_transactions FOR ALL
  USING (true);

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_credit_transactions_hash ON credit_transactions(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_status ON credit_transactions(status);
CREATE INDEX IF NOT EXISTS idx_user_credits_wallet ON user_credits(wallet_address);

-- Create function to update user credits balance
CREATE OR REPLACE FUNCTION update_user_credits_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update user_credits when a credit transaction is inserted
    INSERT INTO user_credits (wallet_address, credits_balance, total_purchased, last_purchase_at)
    VALUES (
        NEW.wallet_address, 
        COALESCE(NEW.credits_received, NEW.amount, 0),
        COALESCE(NEW.amount, 0),
        NEW.timestamp
    )
    ON CONFLICT (wallet_address) 
    DO UPDATE SET 
        credits_balance = user_credits.credits_balance + COALESCE(NEW.credits_received, NEW.amount, 0),
        total_purchased = user_credits.total_purchased + COALESCE(NEW.amount, 0),
        last_purchase_at = NEW.timestamp,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update user credits
DROP TRIGGER IF EXISTS update_credits_balance ON credit_transactions;
CREATE TRIGGER update_credits_balance
    AFTER INSERT ON credit_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_credits_balance();

-- Add update trigger to user_credits
DROP TRIGGER IF EXISTS update_user_credits_updated_at ON user_credits;
CREATE TRIGGER update_user_credits_updated_at
    BEFORE UPDATE ON user_credits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert any missing wallet profiles for existing credit transactions
INSERT INTO user_profiles (wallet_address, wallet_type, network, credits_balance)
SELECT DISTINCT 
    ct.wallet_address,
    'algorand' as wallet_type,
    COALESCE(ct.network, 'mainnet') as network,
    0 as credits_balance
FROM credit_transactions ct
LEFT JOIN user_profiles up ON ct.wallet_address = up.wallet_address
WHERE up.wallet_address IS NULL
ON CONFLICT (wallet_address) DO NOTHING;

-- Disable RLS temporarily for testing if needed
-- Uncomment the lines below if you want to disable RLS for easier debugging
-- ALTER TABLE credit_transactions DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_credits DISABLE ROW LEVEL SECURITY;

-- Add comments
COMMENT ON COLUMN credit_transactions.credits_received IS 'Number of credits received from this transaction';
COMMENT ON COLUMN credit_transactions.transaction_hash IS 'Blockchain transaction hash';
COMMENT ON COLUMN credit_transactions.payment_method IS 'Payment method used (algo, usdt, etc.)';
COMMENT ON COLUMN credit_transactions.status IS 'Transaction status (pending, completed, failed)';

COMMENT ON TABLE user_credits IS 'User credit balances and purchase history';
COMMENT ON COLUMN user_credits.credits_balance IS 'Current available credits';
COMMENT ON COLUMN user_credits.total_purchased IS 'Total amount spent on credits';
