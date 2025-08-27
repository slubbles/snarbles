/**
 * Production Dashboard Data Service
 * Connects blockchain data with Supabase for real dashboard analytics
 */

import { supabase } from './supabase-client';
import { getAlgorandEnhancedTokenInfo, getAlgorandWalletSummary } from './algorand-data';
import { getEnhancedTokenInfo, getWalletSummary } from './solana-data';

export interface DashboardMetrics {
  totalValue: number;
  totalTokens: number;
  recentTransactions: number;
  portfolioChange24h: number;
  nativeBalance: number;
  lastUpdated: Date;
}

export interface TokenAnalytics {
  tokenId: string;
  network: 'algorand' | 'solana';
  holders: number;
  marketCap?: number;
  volume24h?: number;
  priceChange24h?: number;
  totalSupply: number;
  circulatingSupply?: number;
}

export interface UserPortfolioData {
  walletAddress: string;
  walletType: 'algorand' | 'solana';
  network: string;
  metrics: DashboardMetrics;
  tokens: TokenAnalytics[];
  createdTokens: any[];
  transactionHistory: any[];
}

/**
 * Get comprehensive dashboard data for a wallet
 */
export async function getDashboardData(
  walletAddress: string, 
  network: 'algorand' | 'solana'
): Promise<{ success: boolean; data?: UserPortfolioData; error?: string }> {
  try {
    console.log(`📊 Fetching production dashboard data for ${walletAddress} on ${network}`);

    // 1. Get or create user profile
    const userProfile = await ensureUserProfile(walletAddress, network);
    
    // 2. Get real blockchain data
    const [blockchainData, tokensCreated, recentTransactions] = await Promise.all([
      getBlockchainPortfolioData(walletAddress, network),
      getUserCreatedTokens(walletAddress),
      getUserTransactionHistory(walletAddress, 20)
    ]);

    // 3. Calculate portfolio metrics
    const metrics = await calculatePortfolioMetrics(walletAddress, network, blockchainData);
    
    // 4. Get token analytics
    const tokenAnalytics = await getTokenAnalytics(blockchainData.tokens, network);

    // 5. Store analytics event
    await trackDashboardView(walletAddress, network, metrics);

    const portfolioData: UserPortfolioData = {
      walletAddress,
      walletType: network,
      network: network === 'algorand' ? 'algorand-testnet' : 'solana-devnet', // Adjust as needed
      metrics,
      tokens: tokenAnalytics,
      createdTokens: tokensCreated,
      transactionHistory: recentTransactions
    };

    return { success: true, data: portfolioData };

  } catch (error) {
    console.error('❌ Error fetching dashboard data:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch dashboard data' 
    };
  }
}

/**
 * Ensure user profile exists in Supabase
 */
async function ensureUserProfile(walletAddress: string, network: 'algorand' | 'solana') {
  const { data: existingProfile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('wallet_address', walletAddress)
    .single();

  if (!existingProfile) {
    const { data: newProfile, error } = await supabase
      .from('user_profiles')
      .insert({
        wallet_address: walletAddress,
        wallet_type: network,
        network: network === 'algorand' ? 'algorand-testnet' : 'solana-devnet',
        credits_balance: 10,
        total_tokens_created: 0
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user profile:', error);
    }
    return newProfile;
  }

  // Update last connected
  await supabase
    .from('user_profiles')
    .update({ last_connected: new Date().toISOString() })
    .eq('wallet_address', walletAddress);

  return existingProfile;
}

/**
 * Get real blockchain portfolio data
 */
async function getBlockchainPortfolioData(walletAddress: string, network: 'algorand' | 'solana') {
  if (network === 'algorand') {
    const [tokensResult, summaryResult] = await Promise.all([
      getAlgorandEnhancedTokenInfo(walletAddress, 'algorand-testnet'),
      getAlgorandWalletSummary(walletAddress, 'algorand-testnet')
    ]);

    return {
      tokens: tokensResult.success ? tokensResult.data || [] : [],
      summary: summaryResult.success ? summaryResult.data : null
    };
  } else {
    const [tokensResult, summaryResult] = await Promise.all([
      getEnhancedTokenInfo(walletAddress),
      getWalletSummary(walletAddress)
    ]);

    return {
      tokens: tokensResult.success ? tokensResult.data || [] : [],
      summary: summaryResult.success ? summaryResult.data : null
    };
  }
}

/**
 * Calculate real portfolio metrics
 */
async function calculatePortfolioMetrics(
  walletAddress: string, 
  network: 'algorand' | 'solana',
  blockchainData: any
): Promise<DashboardMetrics> {
  
  // Get historical data for 24h change calculation
  const historicalMetrics = await getHistoricalPortfolioValue(walletAddress, network);
  
  const currentValue = blockchainData.summary?.totalValue || 0;
  const previousValue = historicalMetrics?.totalValue || currentValue;
  const portfolioChange24h = previousValue > 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0;

  return {
    totalValue: currentValue,
    totalTokens: blockchainData.summary?.totalTokens || blockchainData.tokens.length || 0,
    recentTransactions: blockchainData.summary?.recentTransactions || 0,
    portfolioChange24h: Math.round(portfolioChange24h * 100) / 100, // Round to 2 decimals
    nativeBalance: blockchainData.summary?.algoBalance || blockchainData.summary?.solBalance || 0,
    lastUpdated: new Date()
  };
}

/**
 * Get historical portfolio value for change calculation
 */
async function getHistoricalPortfolioValue(walletAddress: string, network: 'algorand' | 'solana') {
  const { data } = await supabase
    .from('portfolio_snapshots')
    .select('*')
    .eq('wallet_address', walletAddress)
    .eq('network', network)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // 24 hours ago
    .order('created_at', { ascending: false })
    .limit(1);

  return data?.[0] || null;
}

/**
 * Store current portfolio snapshot for historical tracking
 */
export async function storePortfolioSnapshot(
  walletAddress: string,
  network: 'algorand' | 'solana',
  metrics: DashboardMetrics
) {
  await supabase
    .from('portfolio_snapshots')
    .insert({
      wallet_address: walletAddress,
      network,
      total_value: metrics.totalValue,
      total_tokens: metrics.totalTokens,
      native_balance: metrics.nativeBalance,
      snapshot_data: {
        recentTransactions: metrics.recentTransactions,
        lastUpdated: metrics.lastUpdated
      }
    });
}

/**
 * Get user's created tokens from Supabase
 */
async function getUserCreatedTokens(walletAddress: string) {
  const { data, error } = await supabase
    .from('token_creation_history')
    .select('*')
    .eq('wallet_address', walletAddress)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching created tokens:', error);
    return [];
  }

  return data || [];
}

/**
 * Get user's transaction history
 */
async function getUserTransactionHistory(walletAddress: string, limit: number = 20) {
  const { data, error } = await supabase
    .from('transaction_history')
    .select('*')
    .eq('wallet_address', walletAddress)
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching transaction history:', error);
    return [];
  }

  return data || [];
}

/**
 * Get real token analytics
 */
async function getTokenAnalytics(tokens: any[], network: 'algorand' | 'solana'): Promise<TokenAnalytics[]> {
  const analytics: TokenAnalytics[] = [];

  for (const token of tokens) {
    try {
      let holders = 0;
      let totalSupply = 0;
      let marketCap = 0;

      if (network === 'algorand') {
        // Get real Algorand asset statistics
        const assetStats = await getAlgorandAssetHolders(token.assetId);
        holders = assetStats?.holders || 0;
        totalSupply = token.totalSupply || 0;
      } else {
        // Get real Solana token statistics
        const tokenStats = await getSolanaTokenHolders(token.mint);
        holders = tokenStats?.holders || 0;
        totalSupply = token.totalSupply || 0;
      }

      analytics.push({
        tokenId: network === 'algorand' ? token.assetId.toString() : token.mint,
        network,
        holders,
        totalSupply,
        marketCap: totalSupply > 0 ? marketCap : undefined
      });
    } catch (error) {
      console.error(`Error getting analytics for token ${token.assetId || token.mint}:`, error);
    }
  }

  return analytics;
}

/**
 * Track dashboard view event
 */
async function trackDashboardView(
  walletAddress: string, 
  network: 'algorand' | 'solana', 
  metrics: DashboardMetrics
) {
  await supabase
    .from('analytics_events')
    .insert({
      wallet_address: walletAddress,
      event_type: 'dashboard_view',
      event_data: {
        network,
        portfolio_value: metrics.totalValue,
        token_count: metrics.totalTokens,
        timestamp: new Date().toISOString()
      },
      network
    });
}

/**
 * Get real Algorand asset holder count (placeholder - implement with indexer)
 */
async function getAlgorandAssetHolders(assetId: number) {
  // TODO: Implement with Algorand Indexer API
  // For now, return basic structure
  return { holders: Math.floor(Math.random() * 1000) + 50 }; // Remove this mock
}

/**
 * Get real Solana token holder count (placeholder - implement with RPC)
 */
async function getSolanaTokenHolders(mintAddress: string) {
  // TODO: Implement with Solana RPC calls
  // For now, return basic structure  
  return { holders: Math.floor(Math.random() * 500) + 25 }; // Remove this mock
}

/**
 * Real-time dashboard data refresh
 */
export async function refreshDashboardData(
  walletAddress: string,
  network: 'algorand' | 'solana'
): Promise<{ success: boolean; data?: UserPortfolioData; error?: string }> {
  // Get fresh data and store snapshot
  const result = await getDashboardData(walletAddress, network);
  
  if (result.success && result.data) {
    // Store snapshot for historical tracking
    await storePortfolioSnapshot(walletAddress, network, result.data.metrics);
  }
  
  return result;
}
