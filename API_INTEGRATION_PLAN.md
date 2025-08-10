# 🌐 API INTEGRATION & MARKET DATA PLAN

## 🎯 Current API Status:
✅ **Algorand Indexer**: Basic asset info working
✅ **Solana RPC**: Connection established  
❌ **Price Data**: No real market prices
❌ **Market Cap**: No market data calculations
❌ **Volume Data**: No trading volume tracking
❌ **Performance Metrics**: No 24h changes or trends

## 🛠️ Required API Integrations:

### 1. Cryptocurrency Price APIs

#### Primary Price Sources:
```typescript
// CoinGecko API (Free tier: 30 calls/min)
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

export const getAlgorandPrice = async (): Promise<number> => {
  try {
    const response = await fetch(`${COINGECKO_API}/simple/price?ids=algorand&vs_currencies=usd`);
    const data = await response.json();
    return data.algorand.usd;
  } catch (error) {
    console.error('Error fetching ALGO price:', error);
    return 0.175; // Fallback price
  }
};

export const getSolanaPrice = async (): Promise<number> => {
  try {
    const response = await fetch(`${COINGECKO_API}/simple/price?ids=solana&vs_currencies=usd`);
    const data = await response.json();
    return data.solana.usd;
  } catch (error) {
    console.error('Error fetching SOL price:', error);
    return 100; // Fallback price
  }
};

// Get historical price data for charts
export const getPriceHistory = async (coinId: string, days: number = 7) => {
  const response = await fetch(
    `${COINGECKO_API}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`
  );
  const data = await response.json();
  return data.prices; // Array of [timestamp, price]
};
```

#### Alternative Price Sources:
```typescript
// Jupiter API for Solana token prices
const JUPITER_API = 'https://price.jup.ag/v4';

export const getSolanaTokenPrice = async (mintAddress: string): Promise<number> => {
  try {
    const response = await fetch(`${JUPITER_API}/price?ids=${mintAddress}`);
    const data = await response.json();
    return data.data[mintAddress]?.price || 0;
  } catch (error) {
    console.error('Error fetching Solana token price:', error);
    return 0;
  }
};

// Birdeye API for comprehensive Solana data
const BIRDEYE_API = 'https://public-api.birdeye.so';

export const getBirdeyeTokenData = async (mintAddress: string) => {
  try {
    const response = await fetch(
      `${BIRDEYE_API}/defi/token_overview?address=${mintAddress}`,
      {
        headers: {
          'X-API-KEY': process.env.NEXT_PUBLIC_BIRDEYE_API_KEY || ''
        }
      }
    );
    const data = await response.json();
    return {
      price: data.data.price,
      marketCap: data.data.mc,
      volume24h: data.data.v24hUSD,
      change24h: data.data.price24hChangePercent
    };
  } catch (error) {
    console.error('Error fetching Birdeye data:', error);
    return null;
  }
};
```

### 2. Algorand-Specific APIs

#### Asset Holder Analytics:
```typescript
// AlgoExplorer API for detailed asset information
const ALGOEXPLORER_API = 'https://indexer.algoexplorerapi.io/v2';

export const getAssetHolderCount = async (assetId: string): Promise<number> => {
  try {
    // Get asset balances (holders)
    const response = await fetch(
      `${ALGOEXPLORER_API}/assets/${assetId}/balances?limit=1`
    );
    const data = await response.json();
    
    // The API returns total count in next token or we need to paginate
    // For now, estimate based on available data
    return data.balances?.length || 0;
  } catch (error) {
    console.error('Error fetching holder count:', error);
    return 0;
  }
};

// Get asset transaction history for volume calculation
export const getAssetTransactionHistory = async (assetId: string, limit: number = 100) => {
  try {
    const response = await fetch(
      `${ALGOEXPLORER_API}/transactions?asset-id=${assetId}&limit=${limit}`
    );
    const data = await response.json();
    return data.transactions;
  } catch (error) {
    console.error('Error fetching asset transactions:', error);
    return [];
  }
};
```

#### Algorand DEX Data:
```typescript
// Pact Finance API for Algorand DEX data
const PACT_API = 'https://api.pact.fi/api';

export const getAlgorandDEXData = async (assetId: string) => {
  try {
    // Get pool information if token is listed
    const response = await fetch(`${PACT_API}/pools`);
    const pools = await response.json();
    
    const tokenPool = pools.find((pool: any) => 
      pool.primary_asset_id === assetId || pool.secondary_asset_id === assetId
    );
    
    if (tokenPool) {
      return {
        poolId: tokenPool.pool_id,
        totalLiquidity: tokenPool.total_liquidity,
        volume24h: tokenPool.volume_24h,
        price: calculatePoolPrice(tokenPool)
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching Pact DEX data:', error);
    return null;
  }
};

// Vestige API for additional Algorand market data
export const getVestigeData = async (assetId: string) => {
  try {
    const response = await fetch(`https://free-api.vestige.fi/asset/${assetId}/price`);
    const data = await response.json();
    return {
      price: data.price,
      change24h: data.change_24h,
      volume24h: data.volume_24h
    };
  } catch (error) {
    console.error('Error fetching Vestige data:', error);
    return null;
  }
};
```

### 3. Solana-Specific APIs

#### SPL Token Market Data:
```typescript
// DexScreener API for comprehensive token data
const DEXSCREENER_API = 'https://api.dexscreener.com/latest/dex';

export const getDexScreenerData = async (mintAddress: string) => {
  try {
    const response = await fetch(`${DEXSCREENER_API}/tokens/${mintAddress}`);
    const data = await response.json();
    
    if (data.pairs && data.pairs.length > 0) {
      const pair = data.pairs[0]; // Get most liquid pair
      return {
        price: parseFloat(pair.priceUsd),
        marketCap: pair.fdv,
        volume24h: parseFloat(pair.volume.h24),
        change24h: parseFloat(pair.priceChange.h24),
        liquidity: parseFloat(pair.liquidity.usd)
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching DexScreener data:', error);
    return null;
  }
};

// Helius API for enhanced Solana data
export const getHeliusTokenData = async (mintAddress: string) => {
  try {
    const response = await fetch(
      `https://api.helius.xyz/v0/token-metadata?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mintAccounts: [mintAddress]
        })
      }
    );
    const data = await response.json();
    return data[0];
  } catch (error) {
    console.error('Error fetching Helius data:', error);
    return null;
  }
};
```

### 4. Real Portfolio Value Calculation

```typescript
// Comprehensive portfolio calculation
export const calculateRealPortfolioValue = async (
  walletAddress: string,
  network: 'algorand' | 'solana'
) => {
  if (network === 'algorand') {
    // 1. Get ALGO balance and current price
    const accountInfo = await getAlgorandAccountInfo(walletAddress, 'algorand-mainnet');
    const algoPrice = await getAlgorandPrice();
    const algoValueUSD = (accountInfo.balance || 0) * algoPrice;

    // 2. Get user's created tokens and their values
    const { data: createdTokens } = await supabase
      .from('token_creation_history')
      .select('*')
      .eq('wallet_address', walletAddress)
      .eq('network', 'algorand-mainnet');

    let createdTokensValue = 0;
    for (const token of createdTokens || []) {
      const dexData = await getAlgorandDEXData(token.contract_address);
      const vestigeData = await getVestigeData(token.contract_address);
      
      const price = dexData?.price || vestigeData?.price || 0;
      const supply = token.total_supply || 0;
      const marketCap = price * supply;
      
      createdTokensValue += marketCap;
    }

    // 3. Get held ASA tokens value
    const heldTokens = await getAlgorandEnhancedTokenInfo(walletAddress, 'algorand-mainnet');
    let heldTokensValue = 0;
    for (const token of heldTokens.data || []) {
      const dexData = await getAlgorandDEXData(token.assetId.toString());
      const price = dexData?.price || 0;
      heldTokensValue += token.uiBalance * price;
    }

    return {
      totalValue: algoValueUSD + createdTokensValue + heldTokensValue,
      nativeTokenValue: algoValueUSD,
      nativeTokenBalance: accountInfo.balance || 0,
      createdTokensValue,
      heldTokensValue,
      breakdown: {
        algo: algoValueUSD,
        createdTokens: createdTokensValue,
        heldTokens: heldTokensValue
      }
    };

  } else {
    // Solana implementation
    const publicKey = new PublicKey(walletAddress);
    
    // 1. Get SOL balance and price
    const solBalance = await connection.getBalance(publicKey);
    const solBalanceUI = solBalance / LAMPORTS_PER_SOL;
    const solPrice = await getSolanaPrice();
    const solValueUSD = solBalanceUI * solPrice;

    // 2. Get created tokens value
    const { data: createdTokens } = await supabase
      .from('token_creation_history')
      .select('*')
      .eq('wallet_address', walletAddress)
      .eq('network', 'solana-devnet');

    let createdTokensValue = 0;
    for (const token of createdTokens || []) {
      const dexData = await getDexScreenerData(token.contract_address);
      const jupiterPrice = await getSolanaTokenPrice(token.contract_address);
      
      const price = dexData?.price || jupiterPrice || 0;
      const supply = token.total_supply || 0;
      const marketCap = price * supply;
      
      createdTokensValue += marketCap;
    }

    // 3. Get held SPL tokens value
    const splTokens = await getRealSPLTokenBalances(walletAddress);
    let heldTokensValue = 0;
    for (const token of splTokens) {
      const price = await getSolanaTokenPrice(token.mintAddress);
      heldTokensValue += token.balance * price;
    }

    return {
      totalValue: solValueUSD + createdTokensValue + heldTokensValue,
      nativeTokenValue: solValueUSD,
      nativeTokenBalance: solBalanceUI,
      createdTokensValue,
      heldTokensValue,
      breakdown: {
        sol: solValueUSD,
        createdTokens: createdTokensValue,
        heldTokens: heldTokensValue
      }
    };
  }
};
```

### 5. API Rate Limiting & Caching

```typescript
// Implement caching to reduce API calls
export class PriceCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async getPrice(key: string, fetcher: () => Promise<any>) {
    const cached = this.cache.get(key);
    const now = Date.now();

    if (cached && now - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const data = await fetcher();
      this.cache.set(key, { data, timestamp: now });
      return data;
    } catch (error) {
      // Return cached data if available, even if stale
      return cached?.data || null;
    }
  }
}

export const priceCache = new PriceCache();

// Usage
export const getCachedAlgoPrice = () => 
  priceCache.getPrice('algo-price', getAlgorandPrice);

export const getCachedTokenPrice = (assetId: string) =>
  priceCache.getPrice(`token-${assetId}`, () => getVestigeData(assetId));
```

## 📋 Implementation Checklist:

### Week 1: Core Price Integration
- [ ] Integrate CoinGecko for ALGO/SOL prices
- [ ] Add Jupiter API for Solana token prices
- [ ] Implement Vestige API for Algorand token prices
- [ ] Create price caching system

### Week 2: Market Data Enhancement
- [ ] Add DexScreener integration for comprehensive data
- [ ] Implement holder count fetching
- [ ] Add volume and market cap calculations
- [ ] Create 24h change tracking

### Week 3: Advanced Analytics
- [ ] Add historical price charts
- [ ] Implement portfolio performance tracking
- [ ] Create market comparison metrics
- [ ] Add predictive analytics

## 🎯 Success Metrics:
- ✅ Real USD values for all portfolio assets
- ✅ Accurate market cap calculations for created tokens
- ✅ Live price updates with reasonable refresh rates
- ✅ Comprehensive market data (volume, changes, liquidity)
- ✅ Performance metrics and historical tracking
