-- Advanced Analytics Functions for Supabase MCP Integration
-- These functions provide comprehensive analytics capabilities for the Snarbles platform

-- Function to get comprehensive platform overview
CREATE OR REPLACE FUNCTION get_platform_overview(time_period text DEFAULT '7d')
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

  WITH overview_stats AS (
    SELECT 
      COUNT(DISTINCT CASE WHEN event_name = 'token_created' THEN event_properties->>'token_id' END) as total_tokens,
      COUNT(DISTINCT wallet_address) as total_users,
      COUNT(DISTINCT CASE WHEN event_name = 'wallet_connected' THEN wallet_address END) as connected_wallets,
      COUNT(*) as total_events,
      COUNT(DISTINCT event_properties->>'network') as active_networks,
      COUNT(*) FILTER (WHERE event_name = 'token_created' AND event_properties->>'success' = 'true')::float / 
        NULLIF(COUNT(*) FILTER (WHERE event_name = 'token_created'), 0) as success_rate,
      -- Growth metrics
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 day')::float / 
        NULLIF(COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '2 day' AND created_at < NOW() - INTERVAL '1 day'), 0) - 1 as daily_growth,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 day')::float / 
        NULLIF(COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '14 day' AND created_at < NOW() - INTERVAL '7 day'), 0) - 1 as weekly_growth
    FROM analytics_events
    WHERE created_at >= NOW() - INTERVAL '1 day' * days_count
  ),
  network_stats AS (
    SELECT 
      json_agg(
        json_build_object(
          'network', COALESCE(event_properties->>'network', 'unknown'),
          'token_count', COUNT(DISTINCT CASE WHEN event_name = 'token_created' THEN event_properties->>'token_id' END),
          'user_count', COUNT(DISTINCT wallet_address)
        )
      ) as networks
    FROM analytics_events
    WHERE created_at >= NOW() - INTERVAL '1 day' * days_count
      AND event_properties->>'network' IS NOT NULL
    GROUP BY event_properties->>'network'
  )
  SELECT json_build_object(
    'total_tokens_created', COALESCE(os.total_tokens, 0),
    'total_users', COALESCE(os.total_users, 0),
    'connected_wallets', COALESCE(os.connected_wallets, 0),
    'total_events', COALESCE(os.total_events, 0),
    'active_networks', COALESCE(
      (SELECT json_agg(DISTINCT event_properties->>'network') 
       FROM analytics_events 
       WHERE created_at >= NOW() - INTERVAL '1 day' * days_count 
         AND event_properties->>'network' IS NOT NULL), 
      '[]'::json
    ),
    'success_rate', COALESCE(os.success_rate, 0),
    'growth_metrics', json_build_object(
      'daily_growth', COALESCE(os.daily_growth, 0),
      'weekly_growth', COALESCE(os.weekly_growth, 0)
    ),
    'network_breakdown', COALESCE(ns.networks, '[]'::json)
  ) INTO result
  FROM overview_stats os
  CROSS JOIN network_stats ns;

  RETURN COALESCE(result, '{"error": "No data available"}'::json);
END;
$$;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Function to get detailed token performance metrics
CREATE OR REPLACE FUNCTION get_token_performance(time_period text DEFAULT '7d')
RETURNS TABLE (
  token_id text,
  name text,
  symbol text,
  network text,
  created_at timestamp with time zone,
  creator_wallet text,
  holder_count integer,
  transaction_count bigint,
  total_volume numeric,
  performance_score numeric,
  performance_grade text
) 
LANGUAGE plpgsql
AS $$
DECLARE
  days_count integer;
BEGIN
  -- Parse time period
  days_count := CASE 
    WHEN time_period = '24h' THEN 1
    WHEN time_period = '7d' THEN 7
    WHEN time_period = '30d' THEN 30
    WHEN time_period = '90d' THEN 90
    ELSE 7
  END;

  RETURN QUERY
  WITH token_stats AS (
    SELECT 
      COALESCE((ae.event_properties->>'token_id'), 'unknown') as token_id,
      COALESCE((ae.event_properties->>'token_name'), 'Unknown Token') as name,
      COALESCE((ae.event_properties->>'token_symbol'), 'UNK') as symbol,
      COALESCE((ae.event_properties->>'network'), 'unknown') as network,
      MIN(ae.created_at) as created_at,
      COALESCE((ae.event_properties->>'wallet_address'), ae.wallet_address) as creator_wallet,
      COUNT(DISTINCT CASE WHEN ae.event_name = 'token_transfer' THEN ae.wallet_address END) as holder_count,
      COUNT(*) as transaction_count,
      COALESCE(SUM(CASE 
        WHEN ae.event_properties->>'amount' IS NOT NULL 
        THEN (ae.event_properties->>'amount')::numeric 
        ELSE 0 
      END), 0) as total_volume
    FROM analytics_events ae
    WHERE ae.created_at >= NOW() - INTERVAL '1 day' * days_count
      AND ae.event_name IN ('token_created', 'token_transfer', 'token_trade')
      AND ae.event_properties->>'token_id' IS NOT NULL
    GROUP BY 
      ae.event_properties->>'token_id',
      ae.event_properties->>'token_name',
      ae.event_properties->>'token_symbol',
      ae.event_properties->>'network',
      COALESCE((ae.event_properties->>'wallet_address'), ae.wallet_address)
  )
  SELECT 
    ts.token_id,
    ts.name,
    ts.symbol,
    ts.network,
    ts.created_at,
    ts.creator_wallet,
    COALESCE(ts.holder_count::integer, 0),
    ts.transaction_count,
    ts.total_volume,
    -- Performance score calculation
    (COALESCE(ts.holder_count, 0) * 0.3 + 
     COALESCE(ts.transaction_count, 0) * 0.4 + 
     COALESCE(ts.total_volume, 0) * 0.3) as performance_score,
    -- Performance grade
    CASE 
      WHEN (COALESCE(ts.holder_count, 0) * 0.3 + 
            COALESCE(ts.transaction_count, 0) * 0.4 + 
            COALESCE(ts.total_volume, 0) * 0.3) >= 80 THEN 'A'
      WHEN (COALESCE(ts.holder_count, 0) * 0.3 + 
            COALESCE(ts.transaction_count, 0) * 0.4 + 
            COALESCE(ts.total_volume, 0) * 0.3) >= 60 THEN 'B'
      WHEN (COALESCE(ts.holder_count, 0) * 0.3 + 
            COALESCE(ts.transaction_count, 0) * 0.4 + 
            COALESCE(ts.total_volume, 0) * 0.3) >= 40 THEN 'C'
      WHEN (COALESCE(ts.holder_count, 0) * 0.3 + 
            COALESCE(ts.transaction_count, 0) * 0.4 + 
            COALESCE(ts.total_volume, 0) * 0.3) >= 20 THEN 'D'
      ELSE 'F'
    END as performance_grade
  FROM token_stats ts
  ORDER BY performance_score DESC;
END;
$$;

-- Function to get user behavior analytics
CREATE OR REPLACE FUNCTION get_user_behavior_analytics(time_period text DEFAULT '7d')
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

  WITH user_stats AS (
    SELECT 
      wallet_address,
      COUNT(*) as total_events,
      COUNT(DISTINCT event_name) as unique_events,
      COUNT(DISTINCT DATE(created_at)) as active_days,
      MIN(created_at) as first_seen,
      MAX(created_at) as last_seen,
      SUM(CASE WHEN event_name = 'token_created' THEN 1 ELSE 0 END) as tokens_created,
      SUM(CASE WHEN event_name LIKE '%trade%' THEN 1 ELSE 0 END) as trades_made,
      EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at)))/3600 as session_duration_hours
    FROM analytics_events
    WHERE created_at >= NOW() - INTERVAL '1 day' * days_count
      AND wallet_address IS NOT NULL
    GROUP BY wallet_address
  ),
  user_segments AS (
    SELECT 
      CASE 
        WHEN tokens_created > 0 THEN 'creators'
        WHEN trades_made > 5 THEN 'traders'
        WHEN total_events > 10 THEN 'hodlers'
        ELSE 'inactive'
      END as segment,
      COUNT(*) as user_count
    FROM user_stats
    GROUP BY 
      CASE 
        WHEN tokens_created > 0 THEN 'creators'
        WHEN trades_made > 5 THEN 'traders'
        WHEN total_events > 10 THEN 'hodlers'
        ELSE 'inactive'
      END
  ),
  engagement_metrics AS (
    SELECT 
      COALESCE(AVG(session_duration_hours), 0) as avg_session_duration,
      COALESCE(AVG(unique_events), 0) as pages_per_session,
      COALESCE(COUNT(*) FILTER (WHERE active_days > 1)::float / NULLIF(COUNT(*), 0), 0) as retention_rate,
      COALESCE(COUNT(*) FILTER (WHERE total_events = 1)::float / NULLIF(COUNT(*), 0), 0) as bounce_rate
    FROM user_stats
  )
  SELECT json_build_object(
    'user_segments', (
      SELECT json_object_agg(segment, user_count)
      FROM user_segments
    ),
    'engagement_metrics', (
      SELECT json_build_object(
        'avg_session_duration', avg_session_duration,
        'pages_per_session', pages_per_session,
        'retention_rate', retention_rate,
        'bounce_rate', bounce_rate
      )
      FROM engagement_metrics
    ),
    'total_active_users', (SELECT COUNT(DISTINCT wallet_address) FROM analytics_events WHERE created_at >= NOW() - INTERVAL '1 day' * days_count),
    'new_users_count', (
      SELECT COUNT(DISTINCT wallet_address) 
      FROM analytics_events 
      WHERE created_at >= NOW() - INTERVAL '1 day' * days_count
        AND wallet_address NOT IN (
          SELECT DISTINCT wallet_address 
          FROM analytics_events 
          WHERE created_at < NOW() - INTERVAL '1 day' * days_count
        )
    )
  ) INTO result;

  RETURN result;
END;
$$;"daily_growth": 0, "weekly_growth": 0, "monthly_growth": 0}'::jsonb)
  );

  RETURN result;
END;
$$;

-- Function to analyze token performance
CREATE OR REPLACE FUNCTION analyze_token_performance(
  token_id_param text,
  analysis_period interval DEFAULT '30 days'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  holder_count integer;
  transaction_count integer;
  avg_transaction_size numeric;
  creation_date timestamp;
  creator_address text;
  performance_score numeric;
BEGIN
  -- Get token creation info
  SELECT created_at, wallet_address
  INTO creation_date, creator_address
  FROM analytics_events
  WHERE event_name = 'token_creation'
    AND event_properties->>'token_id' = token_id_param
  LIMIT 1;

  -- Count unique holders
  SELECT COUNT(DISTINCT wallet_address)
  INTO holder_count
  FROM analytics_events
  WHERE event_properties->>'token_id' = token_id_param
    AND wallet_address IS NOT NULL
    AND created_at >= COALESCE(creation_date, NOW() - analysis_period);

  -- Count transactions
  SELECT COUNT(*)
  INTO transaction_count
  FROM analytics_events
  WHERE event_properties->>'token_id' = token_id_param
    AND created_at >= COALESCE(creation_date, NOW() - analysis_period);

  -- Calculate average transaction size
  SELECT AVG((event_properties->>'amount')::numeric)
  INTO avg_transaction_size
  FROM analytics_events
  WHERE event_properties->>'token_id' = token_id_param
    AND event_properties->>'amount' IS NOT NULL
    AND created_at >= COALESCE(creation_date, NOW() - analysis_period);

  -- Calculate performance score (0-100)
  performance_score := LEAST(100, 
    (COALESCE(holder_count, 0) * 2) + 
    (COALESCE(transaction_count, 0) * 0.5) + 
    (COALESCE(avg_transaction_size, 0) * 0.1)
  );

  result := jsonb_build_object(
    'token_id', token_id_param,
    'creation_date', creation_date,
    'creator_address', creator_address,
    'holder_count', COALESCE(holder_count, 0),
    'transaction_count', COALESCE(transaction_count, 0),
    'avg_transaction_size', COALESCE(avg_transaction_size, 0),
    'performance_score', COALESCE(performance_score, 0),
    'analysis_period_days', EXTRACT(DAYS FROM analysis_period)
  );

  RETURN result;
END;
$$;

-- Function to get user engagement analytics
CREATE OR REPLACE FUNCTION get_user_engagement_analytics(
  analysis_period interval DEFAULT '30 days'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  total_users integer;
  active_users integer;
  avg_session_duration numeric;
  retention_rate numeric;
  feature_usage jsonb;
BEGIN
  -- Get total and active users
  SELECT 
    COUNT(DISTINCT wallet_address) as total,
    COUNT(DISTINCT wallet_address) FILTER (
      WHERE created_at >= NOW() - analysis_period
    ) as active
  INTO total_users, active_users
  FROM analytics_events
  WHERE wallet_address IS NOT NULL;

  -- Calculate average session duration (simplified)
  WITH user_sessions AS (
    SELECT 
      wallet_address,
      DATE(created_at) as session_date,
      MIN(created_at) as session_start,
      MAX(created_at) as session_end
    FROM analytics_events
    WHERE wallet_address IS NOT NULL
      AND created_at >= NOW() - analysis_period
    GROUP BY wallet_address, DATE(created_at)
  ),
  session_durations AS (
    SELECT 
      EXTRACT(EPOCH FROM (session_end - session_start)) / 60 as duration_minutes
    FROM user_sessions
    WHERE session_end > session_start
  )
  SELECT AVG(duration_minutes)
  INTO avg_session_duration
  FROM session_durations;

  -- Calculate retention rate (users who return after first visit)
  WITH first_visits AS (
    SELECT 
      wallet_address,
      MIN(created_at) as first_visit
    FROM analytics_events
    WHERE wallet_address IS NOT NULL
    GROUP BY wallet_address
  ),
  returning_users AS (
    SELECT COUNT(DISTINCT fv.wallet_address) as returning
    FROM first_visits fv
    JOIN analytics_events ae ON fv.wallet_address = ae.wallet_address
    WHERE ae.created_at > fv.first_visit + interval '1 day'
      AND fv.first_visit >= NOW() - analysis_period
  )
  SELECT 
    CASE 
      WHEN total_users > 0 
      THEN (returning::numeric / total_users::numeric) * 100
      ELSE 0
    END
  INTO retention_rate
  FROM returning_users, (SELECT COUNT(DISTINCT wallet_address) as total_users FROM first_visits) t;

  -- Get feature usage statistics
  WITH feature_stats AS (
    SELECT 
      event_name,
      COUNT(*) as usage_count,
      COUNT(DISTINCT wallet_address) as unique_users,
      COUNT(*) FILTER (WHERE event_properties->>'successful' = 'true')::numeric / 
        NULLIF(COUNT(*), 0) * 100 as success_rate
    FROM analytics_events
    WHERE created_at >= NOW() - analysis_period
    GROUP BY event_name
  )
  SELECT jsonb_object_agg(
    event_name,
    jsonb_build_object(
      'usage_count', usage_count,
      'unique_users', unique_users,
      'success_rate', COALESCE(success_rate, 0)
    )
  )
  INTO feature_usage
  FROM feature_stats;

  result := jsonb_build_object(
    'total_users', COALESCE(total_users, 0),
    'active_users', COALESCE(active_users, 0),
    'avg_session_duration_minutes', COALESCE(avg_session_duration, 0),
    'retention_rate_percent', COALESCE(retention_rate, 0),
    'feature_usage', COALESCE(feature_usage, '{}'::jsonb),
    'analysis_period_days', EXTRACT(DAYS FROM analysis_period)
  );

  RETURN result;
END;
$$;

-- Function to get revenue analytics
CREATE OR REPLACE FUNCTION get_revenue_analytics(
  analysis_period interval DEFAULT '30 days'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  total_revenue numeric;
  revenue_sources jsonb;
  revenue_trend jsonb;
BEGIN
  -- Calculate total revenue from multiple sources
  WITH fee_revenue AS (
    SELECT COALESCE(SUM((event_properties->>'amount')::numeric), 0) as fees
    FROM analytics_events
    WHERE event_name = 'fee_collection'
      AND created_at >= NOW() - analysis_period
      AND event_properties->>'amount' IS NOT NULL
  ),
  usdt_revenue AS (
    SELECT COALESCE(SUM(usdt_amount), 0) as usdt
    FROM usdt_payments
    WHERE status = 'confirmed'
      AND created_at >= NOW() - analysis_period
  )
  SELECT fr.fees + ur.usdt
  INTO total_revenue
  FROM fee_revenue fr, usdt_revenue ur;

  -- Get revenue sources breakdown
  WITH sources AS (
    SELECT 
      COALESCE(SUM((event_properties->>'amount')::numeric), 0) as token_fees
    FROM analytics_events
    WHERE event_name = 'fee_collection'
      AND created_at >= NOW() - analysis_period
  ),
  payments AS (
    SELECT 
      COALESCE(SUM(usdt_amount), 0) as usdt_payments
    FROM usdt_payments
    WHERE status = 'confirmed'
      AND created_at >= NOW() - analysis_period
  )
  SELECT jsonb_build_object(
    'token_creation_fees', s.token_fees,
    'usdt_payments', p.usdt_payments,
    'enterprise_subscriptions', 0
  )
  INTO revenue_sources
  FROM sources s, payments p;

  -- Get daily revenue trend
  WITH daily_revenue AS (
    SELECT 
      DATE(created_at) as revenue_date,
      SUM(CASE 
        WHEN event_name = 'fee_collection' 
        THEN (event_properties->>'amount')::numeric 
        ELSE 0 
      END) as daily_fees
    FROM analytics_events
    WHERE created_at >= NOW() - analysis_period
      AND (event_name = 'fee_collection' OR event_name = 'payment_received')
    GROUP BY DATE(created_at)
    
    UNION ALL
    
    SELECT 
      DATE(created_at) as revenue_date,
      SUM(usdt_amount) as daily_usdt
    FROM usdt_payments
    WHERE created_at >= NOW() - analysis_period
      AND status = 'confirmed'
    GROUP BY DATE(created_at)
  ),
  aggregated_daily AS (
    SELECT 
      revenue_date,
      SUM(daily_fees) as total_daily
    FROM daily_revenue
    GROUP BY revenue_date
    ORDER BY revenue_date
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'date', revenue_date,
      'amount', COALESCE(total_daily, 0)
    )
  )
  INTO revenue_trend
  FROM aggregated_daily;

  result := jsonb_build_object(
    'total_revenue', COALESCE(total_revenue, 0),
    'revenue_sources', COALESCE(revenue_sources, '{}'::jsonb),
    'daily_trend', COALESCE(revenue_trend, '[]'::jsonb),
    'analysis_period_days', EXTRACT(DAYS FROM analysis_period)
  );

  RETURN result;
END;
$$;

-- Function to predict user churn risk
CREATE OR REPLACE FUNCTION predict_user_churn_risk()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  high_risk_users jsonb;
  churn_indicators jsonb;
BEGIN
  -- Identify users at high risk of churn
  WITH user_activity AS (
    SELECT 
      wallet_address,
      COUNT(*) as total_events,
      MAX(created_at) as last_activity,
      MIN(created_at) as first_activity,
      COUNT(DISTINCT DATE(created_at)) as active_days
    FROM analytics_events
    WHERE wallet_address IS NOT NULL
      AND created_at >= NOW() - interval '90 days'
    GROUP BY wallet_address
  ),
  risk_assessment AS (
    SELECT 
      wallet_address,
      total_events,
      last_activity,
      EXTRACT(DAYS FROM (NOW() - last_activity)) as days_since_last_activity,
      active_days,
      CASE 
        WHEN EXTRACT(DAYS FROM (NOW() - last_activity)) > 14 THEN 'high'
        WHEN EXTRACT(DAYS FROM (NOW() - last_activity)) > 7 THEN 'medium'
        ELSE 'low'
      END as risk_level
    FROM user_activity
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'wallet_address', wallet_address,
      'risk_level', risk_level,
      'days_since_last_activity', days_since_last_activity,
      'total_events', total_events,
      'active_days', active_days
    )
  )
  INTO high_risk_users
  FROM risk_assessment
  WHERE risk_level IN ('high', 'medium')
  ORDER BY days_since_last_activity DESC
  LIMIT 50;

  -- Calculate churn indicators
  WITH churn_stats AS (
    SELECT 
      COUNT(*) FILTER (WHERE risk_level = 'high') as high_risk_count,
      COUNT(*) FILTER (WHERE risk_level = 'medium') as medium_risk_count,
      COUNT(*) FILTER (WHERE risk_level = 'low') as low_risk_count,
      COUNT(*) as total_users
    FROM (
      SELECT 
        wallet_address,
        CASE 
          WHEN EXTRACT(DAYS FROM (NOW() - MAX(created_at))) > 14 THEN 'high'
          WHEN EXTRACT(DAYS FROM (NOW() - MAX(created_at))) > 7 THEN 'medium'
          ELSE 'low'
        END as risk_level
      FROM analytics_events
      WHERE wallet_address IS NOT NULL
        AND created_at >= NOW() - interval '90 days'
      GROUP BY wallet_address
    ) risk_calc
  )
  SELECT jsonb_build_object(
    'high_risk_count', high_risk_count,
    'medium_risk_count', medium_risk_count,
    'low_risk_count', low_risk_count,
    'total_users', total_users,
    'high_risk_percentage', 
      CASE WHEN total_users > 0 
      THEN ROUND((high_risk_count::numeric / total_users::numeric) * 100, 2)
      ELSE 0 END
  )
  INTO churn_indicators
  FROM churn_stats;

  result := jsonb_build_object(
    'high_risk_users', COALESCE(high_risk_users, '[]'::jsonb),
    'churn_indicators', COALESCE(churn_indicators, '{}'::jsonb),
    'analysis_timestamp', NOW()
  );

  RETURN result;
END;
$$;

-- Function to analyze network performance comparison
CREATE OR REPLACE FUNCTION compare_network_performance(
  analysis_period interval DEFAULT '30 days'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  network_stats jsonb;
BEGIN
  WITH network_analysis AS (
    SELECT 
      event_properties->>'network' as network,
      COUNT(*) as total_events,
      COUNT(*) FILTER (WHERE event_name = 'token_creation') as tokens_created,
      COUNT(*) FILTER (WHERE event_name = 'token_creation' AND event_properties->>'successful' = 'true') as successful_creations,
      COUNT(DISTINCT wallet_address) as unique_users,
      AVG(CASE 
        WHEN event_properties->>'amount' IS NOT NULL 
        THEN (event_properties->>'amount')::numeric 
        ELSE NULL 
      END) as avg_transaction_value
    FROM analytics_events
    WHERE created_at >= NOW() - analysis_period
      AND event_properties->>'network' IS NOT NULL
    GROUP BY event_properties->>'network'
  ),
  network_performance AS (
    SELECT 
      network,
      total_events,
      tokens_created,
      successful_creations,
      unique_users,
      avg_transaction_value,
      CASE 
        WHEN tokens_created > 0 
        THEN ROUND((successful_creations::numeric / tokens_created::numeric) * 100, 2)
        ELSE 0 
      END as success_rate,
      CASE 
        WHEN total_events > 0 
        THEN ROUND(unique_users::numeric / total_events::numeric * 100, 2)
        ELSE 0 
      END as user_engagement_rate
    FROM network_analysis
  )
  SELECT jsonb_object_agg(
    network,
    jsonb_build_object(
      'total_events', total_events,
      'tokens_created', tokens_created,
      'successful_creations', successful_creations,
      'unique_users', unique_users,
      'success_rate_percent', success_rate,
      'user_engagement_rate_percent', user_engagement_rate,
      'avg_transaction_value', COALESCE(avg_transaction_value, 0)
    )
  )
  INTO network_stats
  FROM network_performance;

  result := jsonb_build_object(
    'network_comparison', COALESCE(network_stats, '{}'::jsonb),
    'analysis_period_days', EXTRACT(DAYS FROM analysis_period),
    'analysis_timestamp', NOW()
  );

  RETURN result;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_platform_overview(timestamp with time zone, timestamp with time zone) TO authenticated;
GRANT EXECUTE ON FUNCTION analyze_token_performance(text, interval) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_engagement_analytics(interval) TO authenticated;
GRANT EXECUTE ON FUNCTION get_revenue_analytics(interval) TO authenticated;
GRANT EXECUTE ON FUNCTION predict_user_churn_risk() TO authenticated;
GRANT EXECUTE ON FUNCTION compare_network_performance(interval) TO authenticated;
