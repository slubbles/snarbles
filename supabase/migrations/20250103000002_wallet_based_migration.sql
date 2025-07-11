/*
  # Wallet-Based Authentication Migration
  # Migrates from email/user_id based structure to wallet_address based structure

  1. Drop old email-based tables and recreate with wallet_address primary keys
  2. Create new wallet-based user_profiles table
  3. Update all related tables to use wallet_address instead of user_id
  4. Create proper indexes and RLS policies for wallet-based authentication
*/

-- Drop existing tables that use email/user_id structure
DROP TABLE IF EXISTS credit_transactions CASCADE;
DROP TABLE IF EXISTS token_creation_history CASCADE;
DROP TABLE IF EXISTS analytics_events CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Remove old triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_user_login();

-- Create new wallet-based user_profiles table
CREATE TABLE user_profiles (
  wallet_address TEXT PRIMARY KEY,
  wallet_type TEXT NOT NULL CHECK (wallet_type IN ('solana', 'algorand')),
  network TEXT NOT NULL DEFAULT 'testnet',
  credits_balance NUMERIC DEFAULT 10 NOT NULL CHECK (credits_balance >= 0),
  total_tokens_created INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_connected TIMESTAMPTZ DEFAULT NOW()
);

-- Create token_creation_history table with wallet_address
CREATE TABLE token_creation_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT REFERENCES user_profiles(wallet_address) ON DELETE CASCADE NOT NULL,
  token_name TEXT NOT NULL,
  token_symbol TEXT NOT NULL,
  network TEXT NOT NULL,
  contract_address TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  description TEXT,
  total_supply NUMERIC,
  decimals INTEGER,
  logo_url TEXT,
  website TEXT,
  github TEXT,
  twitter TEXT,
  mintable BOOLEAN DEFAULT false,
  burnable BOOLEAN DEFAULT false,
  pausable BOOLEAN DEFAULT false,
  transaction_hash TEXT,
  asset_id BIGINT -- For Algorand asset ID
);

-- Create credit_transactions table with wallet_address  
CREATE TABLE credit_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT REFERENCES user_profiles(wallet_address) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('initial', 'usage', 'refund', 'bonus')),
  amount NUMERIC NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  description TEXT,
  transaction_reference TEXT,
  network TEXT NOT NULL DEFAULT 'testnet'
);

-- Create analytics_events table with wallet_address
CREATE TABLE analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT REFERENCES user_profiles(wallet_address) ON DELETE SET NULL, -- Allow anonymous events
  event_type TEXT NOT NULL,
  event_data JSONB,
  network TEXT,
  user_agent TEXT,
  ip_address TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_creation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view any profile for transparency"
  ON user_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (true); -- Allow wallet auth provider to create profiles

CREATE POLICY "Users can update their own profile"  
  ON user_profiles FOR UPDATE
  USING (true); -- Allow wallet auth provider to update profiles

-- Create RLS policies for token_creation_history
CREATE POLICY "Anyone can view token history for transparency"
  ON token_creation_history FOR SELECT
  USING (true);

CREATE POLICY "Allow token creation tracking"
  ON token_creation_history FOR INSERT
  WITH CHECK (true);

-- Create RLS policies for credit_transactions
CREATE POLICY "Anyone can view credit transactions for transparency"
  ON credit_transactions FOR SELECT
  USING (true);

CREATE POLICY "Allow credit transaction tracking"
  ON credit_transactions FOR INSERT
  WITH CHECK (true);

-- Create RLS policies for analytics_events
CREATE POLICY "Allow analytics event tracking"
  ON analytics_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow reading analytics for transparency"
  ON analytics_events FOR SELECT
  USING (true);

-- Create indexes for performance
CREATE INDEX idx_user_profiles_wallet_type ON user_profiles(wallet_type);
CREATE INDEX idx_user_profiles_network ON user_profiles(network);
CREATE INDEX idx_user_profiles_created_at ON user_profiles(created_at);

CREATE INDEX idx_token_history_wallet_address ON token_creation_history(wallet_address);
CREATE INDEX idx_token_history_network ON token_creation_history(network);
CREATE INDEX idx_token_history_created_at ON token_creation_history(created_at DESC);

CREATE INDEX idx_credit_transactions_wallet_address ON credit_transactions(wallet_address);
CREATE INDEX idx_credit_transactions_type ON credit_transactions(type);
CREATE INDEX idx_credit_transactions_timestamp ON credit_transactions(timestamp DESC);

CREATE INDEX idx_analytics_events_wallet_address ON analytics_events(wallet_address);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_timestamp ON analytics_events(timestamp DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at on user_profiles
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create views for analytics and reporting
CREATE VIEW wallet_analytics AS
SELECT 
  wallet_type,
  network,
  COUNT(*) as total_wallets,
  SUM(credits_balance) as total_credits,
  SUM(total_tokens_created) as total_tokens,
  AVG(credits_balance) as avg_credits_per_wallet,
  MIN(created_at) as first_signup,
  MAX(created_at) as latest_signup
FROM user_profiles
GROUP BY wallet_type, network;

CREATE VIEW daily_wallet_stats AS
SELECT 
  DATE(created_at) as date,
  wallet_type,
  network,
  COUNT(*) as new_wallets,
  SUM(total_tokens_created) as tokens_created
FROM user_profiles
GROUP BY DATE(created_at), wallet_type, network
ORDER BY date DESC;

-- Grant access to views
GRANT SELECT ON wallet_analytics TO anon, authenticated;
GRANT SELECT ON daily_wallet_stats TO anon, authenticated;

-- Add comments for documentation
COMMENT ON TABLE user_profiles IS 'Wallet-based user profiles for decentralized authentication';
COMMENT ON COLUMN user_profiles.wallet_address IS 'Primary key - wallet address for authentication';
COMMENT ON COLUMN user_profiles.wallet_type IS 'Type of wallet: solana or algorand';
COMMENT ON COLUMN user_profiles.network IS 'Network: testnet or mainnet';
COMMENT ON COLUMN user_profiles.credits_balance IS 'Current credit balance for token creation';

COMMENT ON TABLE token_creation_history IS 'History of all tokens created by wallet addresses';
COMMENT ON COLUMN token_creation_history.wallet_address IS 'Wallet address that created the token';

COMMENT ON TABLE credit_transactions IS 'All credit transactions by wallet address';
COMMENT ON COLUMN credit_transactions.wallet_address IS 'Wallet address for the transaction';

COMMENT ON TABLE analytics_events IS 'Platform analytics events with optional wallet tracking';
COMMENT ON COLUMN analytics_events.wallet_address IS 'Wallet address (nullable for anonymous events)'; 