-- Fee tracking migration for Snarbles platform
-- Tracks platform fee collections and analytics

-- Create fee_collections table
CREATE TABLE fee_collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id TEXT NOT NULL UNIQUE,
  amount_microalgos BIGINT NOT NULL,
  network TEXT NOT NULL CHECK (network IN ('algorand-mainnet', 'algorand-testnet')),
  user_address TEXT NOT NULL,
  fee_transaction_id TEXT,
  token_transaction_id TEXT,
  asset_id BIGINT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_fee_collections_network ON fee_collections(network);
CREATE INDEX idx_fee_collections_user_address ON fee_collections(user_address);
CREATE INDEX idx_fee_collections_status ON fee_collections(status);
CREATE INDEX idx_fee_collections_timestamp ON fee_collections(timestamp);
CREATE INDEX idx_fee_collections_asset_id ON fee_collections(asset_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_fee_collections_updated_at
    BEFORE UPDATE ON fee_collections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create view for fee analytics
CREATE VIEW fee_analytics AS
SELECT 
  network,
  status,
  COUNT(*) as transaction_count,
  SUM(amount_microalgos) as total_microalgos,
  SUM(amount_microalgos) / 1000000.0 as total_algos,
  AVG(amount_microalgos) / 1000000.0 as average_fee_algos,
  MIN(timestamp) as first_transaction,
  MAX(timestamp) as last_transaction
FROM fee_collections
GROUP BY network, status;

-- Create view for daily fee statistics
CREATE VIEW daily_fee_stats AS
SELECT 
  DATE(timestamp) as date,
  network,
  status,
  COUNT(*) as transaction_count,
  SUM(amount_microalgos) / 1000000.0 as total_algos
FROM fee_collections
GROUP BY DATE(timestamp), network, status
ORDER BY date DESC;

-- Create view for user fee history
CREATE VIEW user_fee_history AS
SELECT 
  user_address,
  network,
  COUNT(*) as total_transactions,
  SUM(amount_microalgos) / 1000000.0 as total_fees_paid,
  COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as successful_transactions,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_transactions,
  MIN(timestamp) as first_transaction,
  MAX(timestamp) as last_transaction
FROM fee_collections
GROUP BY user_address, network;

-- Enable RLS (Row Level Security)
ALTER TABLE fee_collections ENABLE ROW LEVEL SECURITY;

-- Create policies for fee_collections
-- Allow anyone to read fee analytics (for transparency)
CREATE POLICY "Allow public read access for analytics"
  ON fee_collections FOR SELECT
  USING (true);

-- Allow inserts for tracking new fees
CREATE POLICY "Allow insert for fee tracking"
  ON fee_collections FOR INSERT
  WITH CHECK (true);

-- Allow updates for status changes
CREATE POLICY "Allow update for status changes"
  ON fee_collections FOR UPDATE
  USING (true);

-- Grant access to the views
GRANT SELECT ON fee_analytics TO anon, authenticated;
GRANT SELECT ON daily_fee_stats TO anon, authenticated;
GRANT SELECT ON user_fee_history TO anon, authenticated;

-- Comment on table and columns
COMMENT ON TABLE fee_collections IS 'Tracks platform fee collections for token creation';
COMMENT ON COLUMN fee_collections.group_id IS 'Atomic transaction group ID from Algorand';
COMMENT ON COLUMN fee_collections.amount_microalgos IS 'Fee amount in microAlgos (1 ALGO = 1,000,000 microAlgos)';
COMMENT ON COLUMN fee_collections.network IS 'Algorand network where the fee was paid';
COMMENT ON COLUMN fee_collections.user_address IS 'Algorand address that paid the fee';
COMMENT ON COLUMN fee_collections.fee_transaction_id IS 'Transaction ID of the fee payment';
COMMENT ON COLUMN fee_collections.token_transaction_id IS 'Transaction ID of the token creation';
COMMENT ON COLUMN fee_collections.asset_id IS 'Created asset ID (if successful)';
COMMENT ON COLUMN fee_collections.status IS 'Status of the fee payment transaction'; 