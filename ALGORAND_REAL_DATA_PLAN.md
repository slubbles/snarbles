# 🔧 ALGORAND REAL DATA IMPLEMENTATION PLAN

## 🎯 Current Issues to Fix:

### 1. TokenAssetTable - Replace Mock Data
**File**: `components/dashboard/tokens/TokenAssetTable.tsx`
**Problem**: Using fake portfolio data
**Solution**: Integrate with real Supabase `token_creation_history` table

### 2. Portfolio Overview - Real Balances
**File**: `components/dashboard/analytics/AnalyticsOverview.tsx`  
**Problem**: Mock $12,450 portfolio value
**Solution**: Calculate from real ALGO balance + token holdings

### 3. Transaction History - Real Blockchain Data
**File**: `lib/algorand-data.ts`
**Problem**: Limited transaction data
**Solution**: Enhance indexer integration for complete history

## 🛠️ Implementation Tasks:

### Task 1: Real Token Portfolio (HIGH PRIORITY)
```typescript
// Update TokenAssetTable to fetch user's created tokens from Supabase
const fetchUserTokens = async (walletAddress: string) => {
  const { data: tokens } = await supabase
    .from('token_creation_history')
    .select('*')
    .eq('wallet_address', walletAddress)
    .eq('network', 'algorand-mainnet');
    
  // For each token, fetch live data from Algorand indexer
  return Promise.all(tokens.map(async (token) => {
    const assetInfo = await getAlgorandAssetInfo(token.contract_address);
    return {
      ...token,
      currentSupply: assetInfo.total,
      holders: await getAssetHolderCount(token.contract_address),
      price: await getTokenPrice(token.contract_address), // Need market data API
      volume24h: await get24hVolume(token.contract_address)
    };
  }));
};
```

### Task 2: Real Portfolio Value Calculation
```typescript
// Calculate actual portfolio value from real data
const calculatePortfolioValue = async (walletAddress: string) => {
  // 1. Get ALGO balance (already working)
  const algoBalance = await getAlgorandAccountInfo(walletAddress);
  const algoValueUSD = algoBalance.balance * ALGO_PRICE; // Need price API
  
  // 2. Get user's created tokens value
  const userTokens = await fetchUserTokens(walletAddress);
  const tokenValues = userTokens.map(token => token.marketCap || 0);
  
  // 3. Get held token balances (ASAs in wallet)
  const heldTokens = await getAlgorandEnhancedTokenInfo(walletAddress);
  const heldValues = heldTokens.map(token => parseFloat(token.value || '0'));
  
  return {
    totalValue: algoValueUSD + tokenValues.reduce((a,b) => a+b, 0) + heldValues.reduce((a,b) => a+b, 0),
    algoValue: algoValueUSD,
    createdTokensValue: tokenValues.reduce((a,b) => a+b, 0),
    heldTokensValue: heldValues.reduce((a,b) => a+b, 0)
  };
};
```

### Task 3: Real Transaction History
```typescript
// Enhance transaction fetching to include:
// 1. Token creation transactions
// 2. Asset transfers
// 3. Metadata updates
// 4. Fee payments to Snarbles platform

const getRealTransactionHistory = async (walletAddress: string) => {
  // Get from Supabase: platform-specific transactions
  const { data: platformTxns } = await supabase
    .from('token_creation_history')
    .select('*, fee_collections(*)')
    .eq('wallet_address', walletAddress);
    
  // Get from Algorand indexer: all asset transactions
  const blockchainTxns = await getAlgorandTransactionHistory(walletAddress, 100);
  
  // Merge and categorize
  return mergeAndCategorizeTransactions(platformTxns, blockchainTxns);
};
```

### Task 4: Real Analytics Metrics
```typescript
// Replace mock analytics with real calculations
const getRealAnalytics = async (walletAddress: string) => {
  const tokens = await fetchUserTokens(walletAddress);
  
  return {
    totalTokensCreated: tokens.length,
    totalMarketCap: tokens.reduce((sum, token) => sum + (token.marketCap || 0), 0),
    totalHolders: tokens.reduce((sum, token) => sum + (token.holders || 0), 0),
    averageTokenPerformance: calculateAveragePerformance(tokens),
    successRate: calculateSuccessRate(tokens), // Based on holder count, volume
    topPerformingToken: tokens.sort((a,b) => (b.marketCap || 0) - (a.marketCap || 0))[0]
  };
};
```

## 🔗 External APIs Needed:

### 1. Algorand Market Data
- **CoinGecko API**: Real ALGO price
- **DeFiLlama**: Token TVL and volume data  
- **Algorand Indexer**: Enhanced asset statistics

### 2. Asset Analytics
- **AlgoExplorer API**: Holder counts and distribution
- **Vestige API**: Trading volume and price history
- **Pact API**: DEX trading data

## 📋 Implementation Checklist:

- [ ] Replace TokenAssetTable mock data with Supabase queries
- [ ] Integrate real ALGO balance fetching  
- [ ] Add market data APIs for price calculations
- [ ] Implement holder count fetching for each asset
- [ ] Calculate real portfolio values and changes
- [ ] Enhance transaction history with platform data
- [ ] Add real-time balance updates
- [ ] Implement performance analytics calculations
- [ ] Add error handling for API failures
- [ ] Create data caching to reduce API calls

## 🎯 Success Metrics:
- ✅ Portfolio shows actual ALGO balance in USD
- ✅ Created tokens list matches Supabase records  
- ✅ Transaction history includes platform fees
- ✅ Analytics reflect real token performance
- ✅ Real-time updates when wallet balance changes
