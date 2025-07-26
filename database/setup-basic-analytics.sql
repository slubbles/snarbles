-- Create Analytics Events Table and Basic Functions
-- Run this in your Supabase SQL Editor

-- Create analytics_events table
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    event_name TEXT NOT NULL,
    wallet_address TEXT,
    user_id UUID,
    event_properties JSONB DEFAULT '{}',
    session_id TEXT,
    user_agent TEXT,
    ip_address INET,
    page_url TEXT,
    referrer TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON public.analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_wallet_address ON public.analytics_events(wallet_address);
CREATE INDEX IF NOT EXISTS idx_analytics_events_properties ON public.analytics_events USING GIN (event_properties);

-- Enable Row Level Security
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Create policy to allow inserts and selects
CREATE POLICY IF NOT EXISTS "Allow analytics operations" ON public.analytics_events
    FOR ALL TO authenticated, anon
    USING (true)
    WITH CHECK (true);

-- Create a simple function to get basic analytics
CREATE OR REPLACE FUNCTION get_basic_analytics(time_period text DEFAULT '7d')
RETURNS JSON 
LANGUAGE plpgsql
AS $$
DECLARE
  days_count integer;
  result JSON;
BEGIN
  -- Parse time period
  days_count := CASE 
    WHEN time_period = '24h' THEN 1
    WHEN time_period = '7d' THEN 7
    WHEN time_period = '30d' THEN 30
    WHEN time_period = '90d' THEN 90
    ELSE 7
  END;

  WITH stats AS (
    SELECT 
      COUNT(*) as total_events,
      COUNT(DISTINCT wallet_address) as unique_users,
      COUNT(DISTINCT event_name) as unique_events,
      COUNT(*) FILTER (WHERE event_name = 'token_created') as tokens_created,
      COUNT(*) FILTER (WHERE event_name = 'wallet_connected') as wallet_connections
    FROM analytics_events
    WHERE created_at >= NOW() - INTERVAL '1 day' * days_count
  )
  SELECT json_build_object(
    'total_events', total_events,
    'unique_users', unique_users,
    'unique_events', unique_events,
    'tokens_created', tokens_created,
    'wallet_connections', wallet_connections,
    'time_period', time_period
  ) INTO result
  FROM stats;

  RETURN COALESCE(result, '{"error": "No data available"}'::json);
END;
$$;

-- Test the basic analytics function
SELECT get_basic_analytics('7d');

-- Insert a test event
INSERT INTO public.analytics_events (event_name, wallet_address, event_properties)
VALUES ('mcp_integration_test', 'test_wallet', '{"source": "mcp_setup", "timestamp": "' || NOW() || '"}');

-- Verify the test event was inserted
SELECT * FROM public.analytics_events WHERE event_name = 'mcp_integration_test' ORDER BY created_at DESC LIMIT 1;
