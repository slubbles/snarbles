# 🚀 SUPABASE REAL DATA IMPLEMENTATION PLAN

## 🎯 GOAL: Replace ALL mock data with real Supabase queries

### 📊 CURRENT MOCK DATA TO REPLACE:

#### 1. TokenAssetTable - FAKE TOKEN LIST
**Current**: Generating mock tokens with random data
**Replace with**: Real user tokens from `token_creation_history` table

#### 2. AnalyticsOverview - FAKE PORTFOLIO VALUES  
**Current**: Hardcoded `$12,450` portfolio value
**Replace with**: Real calculations from user data + basic blockchain balance

#### 3. User Dashboard Stats - FAKE METRICS
**Current**: Mock token counts, transaction counts
**Replace with**: Real counts from Supabase tables

#### 4. Transaction History - LIMITED DATA
**Current**: Basic data without platform integration
**Replace with**: Combined platform + blockchain data

---

## 🛠️ IMPLEMENTATION STEPS:

### STEP 1: Real Token Portfolio (HIGH PRIORITY)
Replace TokenAssetTable mock data with real Supabase queries

**Files to modify:**
- `components/dashboard/tokens/TokenAssetTable.tsx`
- `components/dashboard/tokens/TokenManagementPage.tsx`

**Implementation:**
```typescript
// Replace the mock data generation with real Supabase query
const fetchUserTokens = async (walletAddress: string, network: string) => {
  const { data: tokens, error } = await supabase
    .from('token_creation_history')
    .select(`
      id,
      token_name,
      token_symbol,
      network,
      contract_address,
      created_at,
      description,
      total_supply,
      decimals,
      logo_url,
      website,
      github,
      twitter,
      transaction_hash
    `)
    .eq('wallet_address', walletAddress)
    .eq('network', network === 'algorand' ? 'algorand-mainnet' : 'solana-devnet')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tokens:', error);
    return [];
  }

  // Transform to match UserToken interface
  return tokens.map(token => ({
    id: token.id,
    name: token.token_name,
    symbol: token.token_symbol,
    network: network,
    icon: token.logo_url,
    totalSupply: Number(token.total_supply || 0),
    circulatingSupply: Number(token.total_supply || 0), // Same as total for now
    holders: 1, // Start with 1 (creator), can be enhanced later
    price: 0, // No external APIs yet
    marketCap: 0, // Will calculate when we have price
    change24h: 0, // No price history yet
    volume24h: 0, // No trading data yet
    status: 'active' as const,
    createdAt: token.created_at,
    contractAddress: token.contract_address,
    explorerUrl: network === 'algorand' 
      ? `https://algoexplorer.io/asset/${token.contract_address}`
      : `https://solscan.io/token/${token.contract_address}`
  }));
};
```

### STEP 2: Real Portfolio Value Calculations
Replace hardcoded portfolio values with real calculations

**Files to modify:**
- `components/dashboard/analytics/AnalyticsOverview.tsx`

**Implementation:**
```typescript
const calculateRealPortfolioValue = async (walletAddress: string, network: string) => {
  // 1. Get user profile with credits
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('credits_balance, total_tokens_created')
    .eq('wallet_address', walletAddress)
    .single();

  // 2. Get created tokens count
  const { data: tokens } = await supabase
    .from('token_creation_history')
    .select('id')
    .eq('wallet_address', walletAddress)
    .eq('network', network === 'algorand' ? 'algorand-mainnet' : 'solana-devnet');

  // 3. Get total transactions
  const { data: transactions } = await supabase
    .from('credit_transactions')
    .select('id')
    .eq('wallet_address', walletAddress);

  // 4. Basic blockchain balance (keeping existing logic)
  let nativeBalance = 0;
  if (network === 'algorand') {
    const accountInfo = await getAlgorandAccountInfo(walletAddress, 'algorand-mainnet');
    nativeBalance = accountInfo.balance || 0;
  } else {
    // Get SOL balance
    const connection = getSolanaConnection();
    const publicKey = new PublicKey(walletAddress);
    const balance = await connection.getBalance(publicKey);
    nativeBalance = balance / LAMPORTS_PER_SOL;
  }

  // 5. Calculate basic portfolio value (native token only for now)
  const basicPortfolioValue = nativeBalance * 0.18; // Rough estimate for demo

  return {
    portfolioValue: basicPortfolioValue,
    nativeBalance,
    totalTokens: tokens?.length || 0,
    totalTransactions: transactions?.length || 0,
    creditsBalance: Number(profile?.credits_balance || 0)
  };
};
```

### STEP 3: Real User Statistics
Replace mock analytics with real database calculations

**Files to modify:**
- `components/dashboard/analytics/AnalyticsOverview.tsx`

**Implementation:**
```typescript
const getRealAnalytics = async (walletAddress: string, network: string) => {
  // Get user's token creation history with success metrics
  const { data: tokens } = await supabase
    .from('token_creation_history')
    .select('*')
    .eq('wallet_address', walletAddress)
    .eq('network', network === 'algorand' ? 'algorand-mainnet' : 'solana-devnet');

  // Get credit transaction history  
  const { data: creditTxns } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('wallet_address', walletAddress)
    .order('timestamp', { ascending: false });

  // Calculate real metrics
  const totalSpent = creditTxns
    ?.filter(tx => tx.type === 'usage')
    .reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;

  const recentTokens = tokens?.filter(token => {
    const created = new Date(token.created_at);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return created > thirtyDaysAgo;
  }) || [];

  return {
    totalTokensCreated: tokens?.length || 0,
    tokensCreatedThisMonth: recentTokens.length,
    totalCreditsSpent: totalSpent,
    averageTokensPerMonth: calculateMonthlyAverage(tokens),
    successRate: calculateBasicSuccessRate(tokens),
    mostRecentToken: tokens?.[0] || null
  };
};
```

### STEP 4: Real Transaction History
Combine platform and blockchain transaction data

**Files to modify:**
- `components/dashboard/analytics/AnalyticsOverview.tsx`
- Create new `lib/transaction-history.ts`

**Implementation:**
```typescript
const getRealTransactionHistory = async (walletAddress: string, network: string) => {
  // 1. Get platform transactions (token creations)
  const { data: tokenCreations } = await supabase
    .from('token_creation_history')
    .select(`
      id,
      token_name,
      token_symbol,
      created_at,
      transaction_hash,
      contract_address
    `)
    .eq('wallet_address', walletAddress)
    .eq('network', network === 'algorand' ? 'algorand-mainnet' : 'solana-devnet')
    .order('created_at', { ascending: false })
    .limit(20);

  // 2. Get credit transactions
  const { data: creditTxns } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('wallet_address', walletAddress)
    .order('timestamp', { ascending: false })
    .limit(20);

  // 3. Combine and format
  const platformTransactions = [
    // Token creation transactions
    ...(tokenCreations?.map(token => ({
      id: token.id,
      type: 'token_creation' as const,
      title: `Created ${token.token_name}`,
      subtitle: `Symbol: ${token.token_symbol}`,
      timestamp: token.created_at,
      status: 'confirmed' as const,
      amount: '1 Token',
      hash: token.transaction_hash,
      explorerUrl: network === 'algorand'
        ? `https://algoexplorer.io/asset/${token.contract_address}`
        : `https://solscan.io/token/${token.contract_address}`
    })) || []),
    
    // Credit transactions
    ...(creditTxns?.map(tx => ({
      id: tx.id,
      type: 'credit_transaction' as const,
      title: tx.type === 'usage' ? 'Credits Used' : 'Credits Purchased',
      subtitle: tx.description || `${tx.type} transaction`,
      timestamp: tx.timestamp,
      status: 'confirmed' as const,
      amount: `${tx.amount} Credits`,
      hash: tx.transaction_reference,
      explorerUrl: null
    })) || [])
  ];

  // Sort by timestamp
  return platformTransactions.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
};
```

### STEP 5: Real-Time Data Updates
Add Supabase real-time subscriptions for live updates

**Implementation:**
```typescript
const useRealTimeUpdates = (walletAddress: string) => {
  useEffect(() => {
    if (!walletAddress) return;

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
        window.dispatchEvent(new CustomEvent('refreshPortfolio'));
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
        window.dispatchEvent(new CustomEvent('refreshCredits'));
      })
      .subscribe();

    return () => {
      tokenSubscription.unsubscribe();
      creditSubscription.unsubscribe();
    };
  }, [walletAddress]);
};
```

---

## 🎯 SUCCESS METRICS:

After implementation:
- ✅ **Zero mock data** - everything from Supabase
- ✅ **Real token lists** - user's actual created tokens
- ✅ **Real portfolio values** - based on blockchain balance + database
- ✅ **Real transaction history** - platform + blockchain data
- ✅ **Real analytics** - calculated from actual user activity
- ✅ **Live updates** - real-time subscriptions when data changes

---

## 📋 IMPLEMENTATION CHECKLIST:

### Week 1 (Priority Tasks):
- [ ] Replace TokenAssetTable mock data with Supabase queries
- [ ] Fix AnalyticsOverview to use real portfolio calculations
- [ ] Connect user statistics to database
- [ ] Add real transaction history display

### Week 2 (Enhancement Tasks):
- [ ] Add real-time subscriptions for live updates
- [ ] Implement error handling and loading states
- [ ] Add data caching for performance
- [ ] Create comprehensive analytics calculations

---

## 🚨 NO EXTERNAL APIS NEEDED:

This plan focuses on **Supabase data only**:
- ✅ User's created tokens from database
- ✅ Real credit balances and transactions
- ✅ Actual token creation history
- ✅ Platform activity analytics
- ✅ Basic blockchain balance (using existing code)

The only "external" calls are to blockchain nodes (Algorand/Solana) for wallet balances, which we already have working.
