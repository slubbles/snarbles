/*
  # Dynamic Pricing System Migration
  # Enables configurable pricing for token creation across different networks
  # Supports wallet destination management and pricing tier configuration
*/

-- Create pricing configuration table
CREATE TABLE platform_pricing_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    network VARCHAR(50) NOT NULL, -- 'algorand-mainnet', 'algorand-testnet', etc.
    network_display_name VARCHAR(100) NOT NULL,
    pricing_enabled BOOLEAN DEFAULT true,
    base_fee_amount BIGINT DEFAULT 0, -- Amount in smallest unit (microAlgos for Algorand)
    base_fee_currency VARCHAR(10) DEFAULT 'ALGO',
    fee_destination_wallet VARCHAR(100), -- Wallet address to receive fees
    fee_destination_name VARCHAR(100), -- Human readable name for the wallet
    pricing_tier VARCHAR(50) DEFAULT 'standard', -- 'standard', 'premium', 'enterprise'
    minimum_balance_required BIGINT DEFAULT 100000, -- Minimum balance check in microAlgos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by VARCHAR(100), -- Wallet address of admin who created/updated
    notes TEXT, -- Admin notes about pricing configuration
    is_active BOOLEAN DEFAULT true,
    
    -- Ensure unique configuration per network
    UNIQUE(network)
);

-- Create pricing history table for audit trail
CREATE TABLE platform_pricing_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    config_id UUID REFERENCES platform_pricing_config(id) ON DELETE CASCADE,
    network VARCHAR(50) NOT NULL,
    old_fee_amount BIGINT,
    new_fee_amount BIGINT,
    old_destination_wallet VARCHAR(100),
    new_destination_wallet VARCHAR(100),
    change_reason TEXT,
    changed_by VARCHAR(100) NOT NULL, -- Admin wallet address
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create fee collection tracking table
CREATE TABLE platform_fee_collections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_hash VARCHAR(100) NOT NULL UNIQUE,
    network VARCHAR(50) NOT NULL,
    payer_wallet VARCHAR(100) NOT NULL,
    fee_amount BIGINT NOT NULL,
    fee_currency VARCHAR(10) NOT NULL,
    destination_wallet VARCHAR(100) NOT NULL,
    token_symbol VARCHAR(20),
    token_name VARCHAR(100),
    collection_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'confirmed', 'failed'
    block_height BIGINT,
    collected_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB -- Additional transaction metadata
);

-- Insert default pricing configurations
INSERT INTO platform_pricing_config (
    network, 
    network_display_name, 
    pricing_enabled, 
    base_fee_amount, 
    base_fee_currency,
    fee_destination_wallet,
    fee_destination_name,
    pricing_tier,
    minimum_balance_required,
    created_by,
    notes
) VALUES 
(
    'algorand-mainnet',
    'Algorand Mainnet',
    true,
    10000000, -- 10 ALGO in microAlgos
    'ALGO',
    'H7QBKFGRN4QHQLKQXZ6RZ5ZJ3WNQXFN6CZ6H3TGAXZ7KX4VF3T6XQYV2HI', -- Default destination (replace with actual)
    'Platform Fee Collection Wallet',
    'standard',
    200000, -- 0.2 ALGO minimum balance
    'admin',
    'Initial configuration - 10 ALGO fee for mainnet token creation'
),
(
    'algorand-testnet',
    'Algorand Testnet',
    false, -- Free for testing
    0,
    'ALGO',
    NULL,
    'Testnet - No Fees',
    'testing',
    100000, -- 0.1 ALGO minimum balance
    'admin',
    'Testnet configuration - free token creation for testing'
);

-- Create indexes for performance
CREATE INDEX idx_pricing_config_network ON platform_pricing_config(network);
CREATE INDEX idx_pricing_config_active ON platform_pricing_config(is_active);
CREATE INDEX idx_pricing_history_config ON platform_pricing_history(config_id);
CREATE INDEX idx_pricing_history_network ON platform_pricing_history(network);
CREATE INDEX idx_fee_collections_network ON platform_fee_collections(network);
CREATE INDEX idx_fee_collections_payer ON platform_fee_collections(payer_wallet);
CREATE INDEX idx_fee_collections_status ON platform_fee_collections(collection_status);
CREATE INDEX idx_fee_collections_date ON platform_fee_collections(collected_at);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pricing_config_updated_at 
    BEFORE UPDATE ON platform_pricing_config 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to log pricing changes
CREATE OR REPLACE FUNCTION log_pricing_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert into history when fee amount or destination changes
    IF OLD.base_fee_amount != NEW.base_fee_amount OR 
       OLD.fee_destination_wallet != NEW.fee_destination_wallet THEN
        INSERT INTO platform_pricing_history (
            config_id,
            network,
            old_fee_amount,
            new_fee_amount,
            old_destination_wallet,
            new_destination_wallet,
            change_reason,
            changed_by
        ) VALUES (
            NEW.id,
            NEW.network,
            OLD.base_fee_amount,
            NEW.base_fee_amount,
            OLD.fee_destination_wallet,
            NEW.fee_destination_wallet,
            'Admin panel configuration update',
            NEW.created_by
        );
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER log_pricing_config_changes 
    AFTER UPDATE ON platform_pricing_config 
    FOR EACH ROW EXECUTE FUNCTION log_pricing_changes();

-- Enable RLS (Row Level Security)
ALTER TABLE platform_pricing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_pricing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_fee_collections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow public read for pricing config, admin write)
CREATE POLICY "Enable read access for pricing config" ON platform_pricing_config
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for fee collections" ON platform_fee_collections
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for pricing history" ON platform_pricing_history
    FOR SELECT USING (true);

-- Insert/Update policies can be added based on admin wallet verification
-- For now, allow all authenticated users (can be restricted later)
CREATE POLICY "Enable insert for authenticated users" ON platform_pricing_config
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON platform_pricing_config
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for fee collections" ON platform_fee_collections
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for pricing history" ON platform_pricing_history
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create views for easier data access
CREATE VIEW active_pricing_config AS
SELECT 
    network,
    network_display_name,
    pricing_enabled,
    base_fee_amount,
    base_fee_currency,
    fee_destination_wallet,
    fee_destination_name,
    pricing_tier,
    minimum_balance_required,
    created_at,
    updated_at,
    notes
FROM platform_pricing_config 
WHERE is_active = true;

CREATE VIEW fee_collection_summary AS
SELECT 
    network,
    fee_currency,
    COUNT(*) as total_collections,
    SUM(fee_amount) as total_fees_collected,
    SUM(CASE WHEN collection_status = 'confirmed' THEN fee_amount ELSE 0 END) as confirmed_fees,
    COUNT(CASE WHEN collection_status = 'confirmed' THEN 1 END) as confirmed_count,
    COUNT(CASE WHEN collection_status = 'pending' THEN 1 END) as pending_count,
    COUNT(CASE WHEN collection_status = 'failed' THEN 1 END) as failed_count,
    MIN(collected_at) as first_collection,
    MAX(collected_at) as last_collection
FROM platform_fee_collections 
GROUP BY network, fee_currency;

-- Grant access to views
GRANT SELECT ON active_pricing_config TO PUBLIC;
GRANT SELECT ON fee_collection_summary TO PUBLIC; 