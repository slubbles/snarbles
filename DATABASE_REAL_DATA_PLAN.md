# 🗄️ DATABASE REAL DATA INTEGRATION PLAN

## 🎯 Current Database Status:
✅ **Tables Created**: `user_profiles`, `token_creation_history`, `credit_transactions`, `analytics_events`
✅ **RLS Policies**: Properly configured for wallet-based auth
✅ **Functions**: `add_credit_transaction()` working
❌ **Real-Time Sync**: Dashboard not reading from database
❌ **Live Updates**: No real-time subscription to data changes

## 🛠️ Implementation Tasks:

### Task 1: Real Token Portfolio from Database
```typescript
// File: components/dashboard/tokens/TokenAssetTable.tsx
// Replace mock data with real Supabase queries

const useRealTokenData = (walletAddress: string, network: 'algorand' | 'solana') => {
  const [tokens, setTokens] = useState<UserToken[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchRealTokens = async () => {
      if (!walletAddress) return;
      
      // Get user's created tokens from Supabase
      const { data: dbTokens, error } = await supabase
        .from('token_creation_history')
        .select(`
          *,
          user_profiles!inner(wallet_address, credits_balance)
        `)
        .eq('wallet_address', walletAddress)
        .eq('network', network === 'algorand' ? 'algorand-mainnet' : 'solana-devnet')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tokens:', error);
        return;
      }

      // Enhance with live blockchain data
      const enhancedTokens = await Promise.all(
        dbTokens.map(async (token) => {
          if (network === 'algorand') {
            const assetInfo = await getAlgorandAssetInfo(token.contract_address, network);
            return {
              id: token.id,
              name: token.token_name,
              symbol: token.token_symbol,
              network: 'algorand' as const,
              icon: token.logo_url,
              totalSupply: token.total_supply || 0,
              circulatingSupply: assetInfo?.total || 0,
              holders: await getAssetHolderCount(token.contract_address),
              price: await getTokenPrice(token.contract_address),
              marketCap: 0, // Calculate based on price * supply
              change24h: 0, // Get from price history
              volume24h: 0, // Get from DEX data
              status: assetInfo?.manager ? 'active' : 'frozen',
              createdAt: token.created_at,
              contractAddress: token.contract_address,
              explorerUrl: `https://algoexplorer.io/asset/${token.contract_address}`
            };
          } else {
            // Solana implementation
            const mintInfo = await getMint(connection, new PublicKey(token.contract_address));
            const metadata = await getTokenMetadata(token.contract_address);
            return {
              id: token.id,
              name: token.token_name,
              symbol: token.token_symbol,
              network: 'solana' as const,
              icon: metadata?.image || token.logo_url,
              totalSupply: Number(mintInfo.supply) / Math.pow(10, mintInfo.decimals),
              circulatingSupply: Number(mintInfo.supply) / Math.pow(10, mintInfo.decimals),
              holders: await getTokenHolderCount(new PublicKey(token.contract_address)),
              price: 0, // Get from Jupiter API
              marketCap: 0,
              change24h: 0,
              volume24h: 0,
              status: mintInfo.mintAuthority ? 'active' : 'frozen',
              createdAt: token.created_at,
              contractAddress: token.contract_address,
              explorerUrl: `https://solscan.io/token/${token.contract_address}`
            };
          }
        })
      );

      setTokens(enhancedTokens);
      setLoading(false);
    };

    fetchRealTokens();
  }, [walletAddress, network]);

  return { tokens, loading, refetch: fetchRealTokens };
};
```

### Task 2: Real Analytics from Database
```typescript
// File: components/dashboard/analytics/AnalyticsOverview.tsx
// Replace mock analytics with real calculations

const useRealAnalytics = (walletAddress: string, network: 'algorand' | 'solana') => {
  const [analytics, setAnalytics] = useState(null);
  
  useEffect(() => {
    const fetchRealAnalytics = async () => {
      // 1. Get user profile and credit info
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();

      // 2. Get token creation history with stats
      const { data: tokens } = await supabase
        .from('token_creation_history')
        .select('*')
        .eq('wallet_address', walletAddress)
        .eq('network', network === 'algorand' ? 'algorand-mainnet' : 'solana-devnet');

      // 3. Get credit transaction history
      const { data: creditTxns } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('wallet_address', walletAddress)
        .eq('network', network === 'algorand' ? 'mainnet' : 'devnet');

      // 4. Calculate real metrics
      const totalSpent = creditTxns
        ?.filter(tx => tx.type === 'usage')
        .reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;

      const totalEarned = await calculateTokenValues(tokens, network);
      
      const successRate = calculateSuccessRate(tokens);
      
      setAnalytics({
        portfolioValue: totalEarned,
        totalTokens: tokens?.length || 0,
        totalTransactions: creditTxns?.length || 0,
        creditsBalance: profile?.credits_balance || 0,
        totalSpent,
        successRate,
        avgTokenPerformance: calculateAvgPerformance(tokens),
        topToken: findTopPerformingToken(tokens)
      });
    };

    fetchRealAnalytics();
  }, [walletAddress, network]);

  return analytics;
};
```

### Task 3: Real-Time Data Subscriptions
```typescript
// Add real-time subscriptions for live updates
const useRealTimeUpdates = (walletAddress: string) => {
  useEffect(() => {
    // Subscribe to token creation events
    const tokenSubscription = supabase
      .channel('token_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'token_creation_history',
        filter: `wallet_address=eq.${walletAddress}`
      }, (payload) => {
        console.log('Token update:', payload);
        // Trigger data refresh
        window.dispatchEvent(new CustomEvent('tokenDataUpdate'));
      })
      .subscribe();

    // Subscribe to credit transaction events
    const creditSubscription = supabase
      .channel('credit_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'credit_transactions',
        filter: `wallet_address=eq.${walletAddress}`
      }, (payload) => {
        console.log('Credit update:', payload);
        window.dispatchEvent(new CustomEvent('creditDataUpdate'));
      })
      .subscribe();

    return () => {
      tokenSubscription.unsubscribe();
      creditSubscription.unsubscribe();
    };
  }, [walletAddress]);
};
```

### Task 4: Enhanced Database Queries
```typescript
// Add advanced analytics queries
const getAdvancedAnalytics = async (walletAddress: string) => {
  // 1. Token performance over time
  const { data: tokenPerformance } = await supabase
    .rpc('get_token_performance_history', {
      wallet_addr: walletAddress,
      days_back: 30
    });

  // 2. Credit usage patterns
  const { data: creditPattern } = await supabase
    .rpc('get_credit_usage_pattern', {
      wallet_addr: walletAddress
    });

  // 3. Comparative analytics (vs other users)
  const { data: comparison } = await supabase
    .rpc('get_user_ranking', {
      wallet_addr: walletAddress
    });

  return {
    tokenPerformance,
    creditPattern,
    comparison
  };
};
```

### Task 5: Database Functions for Complex Queries
```sql
-- Create custom RPC functions in Supabase for advanced analytics

-- Function to get token performance history
CREATE OR REPLACE FUNCTION get_token_performance_history(
  wallet_addr TEXT,
  days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
  date DATE,
  tokens_created INTEGER,
  total_supply_created NUMERIC,
  credits_spent NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(tch.created_at) as date,
    COUNT(*)::INTEGER as tokens_created,
    COALESCE(SUM(tch.total_supply), 0) as total_supply_created,
    COALESCE(SUM(ct.amount), 0) as credits_spent
  FROM token_creation_history tch
  LEFT JOIN credit_transactions ct ON ct.wallet_address = tch.wallet_address 
    AND DATE(ct.timestamp) = DATE(tch.created_at)
    AND ct.type = 'usage'
  WHERE tch.wallet_address = wallet_addr
    AND tch.created_at >= NOW() - INTERVAL '1 day' * days_back
  GROUP BY DATE(tch.created_at)
  ORDER BY date DESC;
END;
$$;

-- Function to get user ranking
CREATE OR REPLACE FUNCTION get_user_ranking(wallet_addr TEXT)
RETURNS TABLE (
  user_rank INTEGER,
  total_users INTEGER,
  percentile NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH user_stats AS (
    SELECT 
      wallet_address,
      total_tokens_created,
      RANK() OVER (ORDER BY total_tokens_created DESC) as rank
    FROM user_profiles
  ),
  user_count AS (
    SELECT COUNT(*) as total FROM user_profiles
  )
  SELECT 
    us.rank::INTEGER,
    uc.total::INTEGER,
    (us.rank::NUMERIC / uc.total::NUMERIC * 100)::NUMERIC as percentile
  FROM user_stats us, user_count uc
  WHERE us.wallet_address = wallet_addr;
END;
$$;
```

## 📋 Implementation Priority:

### HIGH PRIORITY (Week 1):
- [ ] Replace TokenAssetTable mock data with Supabase queries
- [ ] Implement real portfolio value calculations  
- [ ] Add real credit balance display
- [ ] Connect transaction history to database

### MEDIUM PRIORITY (Week 2):
- [ ] Add real-time subscriptions for live updates
- [ ] Implement advanced analytics queries
- [ ] Add comparative analytics (user rankings)
- [ ] Create performance tracking over time

### LOW PRIORITY (Week 3):
- [ ] Add data caching for performance
- [ ] Implement offline mode fallbacks
- [ ] Add export functionality for user data
- [ ] Create advanced filtering and search

## 🎯 Success Metrics:
- ✅ All dashboard data comes from Supabase (no mock data)
- ✅ Real-time updates when wallet balance changes
- ✅ Accurate credit balance and transaction history
- ✅ Portfolio values reflect actual token performance
- ✅ Analytics show real user activity and success rates
