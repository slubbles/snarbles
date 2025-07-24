-- Create USDT payments table for multi-network credit top-ups
-- This table stores USDT payment records for credit purchases

CREATE TABLE IF NOT EXISTS usdt_payments (
    id VARCHAR(255) PRIMARY KEY,
    wallet_address VARCHAR(255) NOT NULL,
    usdt_amount DECIMAL(18, 6) NOT NULL,
    credits_received INTEGER NOT NULL,
    network VARCHAR(50) NOT NULL, -- 'ethereum', 'polygon', 'bsc', 'arbitrum', 'optimism', 'avalanche'
    contract_address VARCHAR(255) NOT NULL, -- USDT contract address for the network
    transaction_hash VARCHAR(255), -- Blockchain transaction hash (null until confirmed)
    from_address VARCHAR(255), -- Sender's wallet address
    to_address VARCHAR(255) NOT NULL, -- Receiver address (0x9ca8362c35db2649614cd4029ab0067d285660ef)
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'failed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    block_number BIGINT,
    gas_used BIGINT,
    gas_price VARCHAR(50),
    
    -- Add indexes for better query performance
    INDEX idx_wallet_address (wallet_address),
    INDEX idx_status (status),
    INDEX idx_network (network),
    INDEX idx_transaction_hash (transaction_hash),
    INDEX idx_created_at (created_at)
);

-- Add comments for documentation
COMMENT ON TABLE usdt_payments IS 'Stores USDT payment records for credit top-ups from multiple networks';
COMMENT ON COLUMN usdt_payments.id IS 'Unique payment identifier';
COMMENT ON COLUMN usdt_payments.wallet_address IS 'User wallet address receiving credits';
COMMENT ON COLUMN usdt_payments.usdt_amount IS 'Amount of USDT sent by user';
COMMENT ON COLUMN usdt_payments.credits_received IS 'Number of credits user will receive (1 USDT = 1 credit)';
COMMENT ON COLUMN usdt_payments.network IS 'Blockchain network used for payment';
COMMENT ON COLUMN usdt_payments.contract_address IS 'USDT token contract address on the network';
COMMENT ON COLUMN usdt_payments.transaction_hash IS 'Blockchain transaction hash (filled after confirmation)';
COMMENT ON COLUMN usdt_payments.from_address IS 'Sender wallet address';
COMMENT ON COLUMN usdt_payments.to_address IS 'Receiver address (0x9ca8362c35db2649614cd4029ab0067d285660ef)';
COMMENT ON COLUMN usdt_payments.status IS 'Payment status: pending, confirmed, or failed';

-- Create a view for easy reporting
CREATE OR REPLACE VIEW usdt_payment_summary AS
SELECT 
    network,
    COUNT(*) as total_payments,
    COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_payments,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_payments,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_payments,
    SUM(CASE WHEN status = 'confirmed' THEN usdt_amount ELSE 0 END) as total_usdt_received,
    SUM(CASE WHEN status = 'confirmed' THEN credits_received ELSE 0 END) as total_credits_issued,
    MIN(created_at) as first_payment,
    MAX(created_at) as latest_payment
FROM usdt_payments
GROUP BY network
ORDER BY total_usdt_received DESC;

-- Example of how to query recent payments
-- SELECT * FROM usdt_payments WHERE wallet_address = '0x...' ORDER BY created_at DESC LIMIT 10;

-- Example of how to check pending payments (for admin monitoring)
-- SELECT * FROM usdt_payments WHERE status = 'pending' AND created_at < NOW() - INTERVAL '1 hour';
