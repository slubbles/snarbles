-- Production Dashboard Enhancement Migration
-- Adds tables for real portfolio tracking and analytics

-- Create portfolio snapshots table for historical tracking
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    network TEXT NOT NULL,
    total_value NUMERIC NOT NULL DEFAULT 0,
    total_tokens INTEGER NOT NULL DEFAULT 0,
    native_balance NUMERIC NOT NULL DEFAULT 0,
    snapshot_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create transaction history table for real transaction tracking
CREATE TABLE IF NOT EXISTS transaction_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    transaction_hash TEXT UNIQUE NOT NULL,
    network TEXT NOT NULL,
    transaction_type TEXT NOT NULL, -- 'mint', 'burn', 'transfer', 'create'
    token_address TEXT, -- asset_id for Algorand, mint address for Solana
    token_symbol TEXT,
    amount NUMERIC,
    fee_amount NUMERIC,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'failed'
    block_height BIGINT,
    timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    transaction_data JSONB -- Additional transaction details
);

-- Create token analytics table for performance tracking
CREATE TABLE IF NOT EXISTS token_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    token_address TEXT NOT NULL, -- asset_id for Algorand, mint for Solana
    network TEXT NOT NULL,
    holder_count INTEGER DEFAULT 0,
    total_supply NUMERIC DEFAULT 0,
    circulating_supply NUMERIC DEFAULT 0,
    market_cap NUMERIC DEFAULT 0,
    volume_24h NUMERIC DEFAULT 0,
    price_change_24h NUMERIC DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    UNIQUE(token_address, network)
);

-- Create real-time dashboard metrics table
CREATE TABLE IF NOT EXISTS dashboard_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    network TEXT NOT NULL,
    metric_type TEXT NOT NULL, -- 'portfolio_value', 'token_count', 'transaction_count'
    metric_value NUMERIC NOT NULL,
    previous_value NUMERIC DEFAULT 0,
    percentage_change NUMERIC DEFAULT 0,
    time_period TEXT NOT NULL, -- '1h', '24h', '7d', '30d'
    recorded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    UNIQUE(wallet_address, network, metric_type, time_period)
);

-- Create holder analytics table for token distribution analysis
CREATE TABLE IF NOT EXISTS holder_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    token_address TEXT NOT NULL,
    network TEXT NOT NULL,
    holder_address TEXT NOT NULL,
    balance NUMERIC NOT NULL DEFAULT 0,
    percentage_ownership NUMERIC NOT NULL DEFAULT 0,
    holding_rank INTEGER,
    first_acquired TIMESTAMPTZ,
    last_transaction TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    UNIQUE(token_address, network, holder_address)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_wallet_time 
    ON portfolio_snapshots(wallet_address, network, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transaction_history_wallet_time 
    ON transaction_history(wallet_address, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_transaction_history_token 
    ON transaction_history(token_address, network);

CREATE INDEX IF NOT EXISTS idx_token_analytics_network 
    ON token_analytics(network, last_updated DESC);

CREATE INDEX IF NOT EXISTS idx_dashboard_metrics_wallet 
    ON dashboard_metrics(wallet_address, network, metric_type);

CREATE INDEX IF NOT EXISTS idx_holder_analytics_token 
    ON holder_analytics(token_address, network, holding_rank);

-- Enable RLS on new tables
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE holder_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for transparency and security
CREATE POLICY "Allow reading portfolio snapshots" 
    ON portfolio_snapshots FOR SELECT USING (true);

CREATE POLICY "Allow inserting portfolio snapshots" 
    ON portfolio_snapshots FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow reading transaction history" 
    ON transaction_history FOR SELECT USING (true);

CREATE POLICY "Allow inserting transaction history" 
    ON transaction_history FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow reading token analytics" 
    ON token_analytics FOR SELECT USING (true);

CREATE POLICY "Allow upserting token analytics" 
    ON token_analytics FOR ALL USING (true);

CREATE POLICY "Allow reading dashboard metrics" 
    ON dashboard_metrics FOR SELECT USING (true);

CREATE POLICY "Allow upserting dashboard metrics" 
    ON dashboard_metrics FOR ALL USING (true);

CREATE POLICY "Allow reading holder analytics" 
    ON holder_analytics FOR SELECT USING (true);

CREATE POLICY "Allow upserting holder analytics" 
    ON holder_analytics FOR ALL USING (true);

-- Create functions for real-time dashboard calculations

-- Function to get portfolio change percentage
CREATE OR REPLACE FUNCTION get_portfolio_change(
    p_wallet_address TEXT,
    p_network TEXT,
    p_hours INTEGER DEFAULT 24
) RETURNS NUMERIC AS $$
DECLARE
    current_value NUMERIC;
    previous_value NUMERIC;
    change_percentage NUMERIC;
BEGIN
    -- Get current portfolio value
    SELECT total_value INTO current_value
    FROM portfolio_snapshots
    WHERE wallet_address = p_wallet_address 
      AND network = p_network
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Get previous value from specified hours ago
    SELECT total_value INTO previous_value
    FROM portfolio_snapshots
    WHERE wallet_address = p_wallet_address 
      AND network = p_network
      AND created_at <= NOW() - INTERVAL '1 hour' * p_hours
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Calculate percentage change
    IF previous_value IS NULL OR previous_value = 0 THEN
        RETURN 0;
    END IF;
    
    change_percentage := ((current_value - previous_value) / previous_value) * 100;
    RETURN ROUND(change_percentage, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to update token analytics
CREATE OR REPLACE FUNCTION update_token_analytics(
    p_token_address TEXT,
    p_network TEXT,
    p_holder_count INTEGER,
    p_total_supply NUMERIC DEFAULT NULL,
    p_market_cap NUMERIC DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO token_analytics (
        token_address, 
        network, 
        holder_count, 
        total_supply, 
        market_cap,
        last_updated
    ) VALUES (
        p_token_address, 
        p_network, 
        p_holder_count, 
        COALESCE(p_total_supply, 0),
        COALESCE(p_market_cap, 0),
        NOW()
    )
    ON CONFLICT (token_address, network) 
    DO UPDATE SET
        holder_count = EXCLUDED.holder_count,
        total_supply = COALESCE(EXCLUDED.total_supply, token_analytics.total_supply),
        market_cap = COALESCE(EXCLUDED.market_cap, token_analytics.market_cap),
        last_updated = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get dashboard summary
CREATE OR REPLACE FUNCTION get_dashboard_summary(
    p_wallet_address TEXT,
    p_network TEXT
) RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    WITH latest_snapshot AS (
        SELECT *
        FROM portfolio_snapshots
        WHERE wallet_address = p_wallet_address 
          AND network = p_network
        ORDER BY created_at DESC
        LIMIT 1
    ),
    portfolio_change AS (
        SELECT get_portfolio_change(p_wallet_address, p_network, 24) as change_24h
    ),
    token_count AS (
        SELECT COUNT(*) as total_tokens
        FROM token_creation_history
        WHERE wallet_address = p_wallet_address
    ),
    recent_transactions AS (
        SELECT COUNT(*) as transaction_count
        FROM transaction_history
        WHERE wallet_address = p_wallet_address
          AND timestamp >= NOW() - INTERVAL '7 days'
    )
    SELECT json_build_object(
        'portfolio_value', COALESCE(ls.total_value, 0),
        'native_balance', COALESCE(ls.native_balance, 0),
        'total_tokens', COALESCE(tc.total_tokens, 0),
        'recent_transactions', COALESCE(rt.transaction_count, 0),
        'portfolio_change_24h', COALESCE(pc.change_24h, 0),
        'last_updated', COALESCE(ls.created_at, NOW())
    ) INTO result
    FROM latest_snapshot ls
    CROSS JOIN portfolio_change pc
    CROSS JOIN token_count tc
    CROSS JOIN recent_transactions rt;
    
    RETURN COALESCE(result, '{"portfolio_value": 0, "native_balance": 0, "total_tokens": 0, "recent_transactions": 0, "portfolio_change_24h": 0}'::json);
END;
$$ LANGUAGE plpgsql;

-- Function to record transaction
CREATE OR REPLACE FUNCTION record_transaction(
    p_wallet_address TEXT,
    p_transaction_hash TEXT,
    p_network TEXT,
    p_transaction_type TEXT,
    p_token_address TEXT DEFAULT NULL,
    p_token_symbol TEXT DEFAULT NULL,
    p_amount NUMERIC DEFAULT NULL,
    p_fee_amount NUMERIC DEFAULT NULL,
    p_transaction_data JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    transaction_id UUID;
BEGIN
    INSERT INTO transaction_history (
        wallet_address,
        transaction_hash,
        network,
        transaction_type,
        token_address,
        token_symbol,
        amount,
        fee_amount,
        status,
        transaction_data
    ) VALUES (
        p_wallet_address,
        p_transaction_hash,
        p_network,
        p_transaction_type,
        p_token_address,
        p_token_symbol,
        p_amount,
        p_fee_amount,
        'pending',
        p_transaction_data
    )
    ON CONFLICT (transaction_hash) DO UPDATE SET
        status = 'confirmed',
        transaction_data = EXCLUDED.transaction_data
    RETURNING id INTO transaction_id;
    
    RETURN transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Create views for analytics
CREATE OR REPLACE VIEW dashboard_analytics AS
SELECT 
    up.wallet_address,
    up.wallet_type,
    up.network,
    up.created_at as user_since,
    up.total_tokens_created,
    COALESCE(ps.total_value, 0) as current_portfolio_value,
    COALESCE(ps.total_tokens, 0) as current_token_count,
    get_portfolio_change(up.wallet_address, up.network, 24) as portfolio_change_24h,
    (
        SELECT COUNT(*)
        FROM transaction_history th
        WHERE th.wallet_address = up.wallet_address
          AND th.timestamp >= NOW() - INTERVAL '30 days'
    ) as transactions_30d
FROM user_profiles up
LEFT JOIN LATERAL (
    SELECT *
    FROM portfolio_snapshots ps
    WHERE ps.wallet_address = up.wallet_address
      AND ps.network = up.network
    ORDER BY ps.created_at DESC
    LIMIT 1
) ps ON true;

-- Grant access to views and functions
GRANT SELECT ON dashboard_analytics TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_portfolio_change TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_token_analytics TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_summary TO anon, authenticated;
GRANT EXECUTE ON FUNCTION record_transaction TO anon, authenticated;

-- Add comments for documentation
COMMENT ON TABLE portfolio_snapshots IS 'Historical portfolio value snapshots for tracking changes';
COMMENT ON TABLE transaction_history IS 'Complete transaction history for all wallet operations';
COMMENT ON TABLE token_analytics IS 'Real-time token performance and holder analytics';
COMMENT ON TABLE dashboard_metrics IS 'Aggregated dashboard metrics for performance tracking';
COMMENT ON TABLE holder_analytics IS 'Token holder distribution and ownership analysis';

COMMENT ON FUNCTION get_portfolio_change IS 'Calculate portfolio percentage change over specified time period';
COMMENT ON FUNCTION update_token_analytics IS 'Update token analytics with latest blockchain data';
COMMENT ON FUNCTION get_dashboard_summary IS 'Get comprehensive dashboard summary for a wallet';
COMMENT ON FUNCTION record_transaction IS 'Record a new transaction in the history';
