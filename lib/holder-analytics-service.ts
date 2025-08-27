/**
 * Real Holder Analytics Service
 * Replaces mock holder data with real blockchain queries
 */

import { getAlgorandIndexerClient } from './algorand';
import { Connection, PublicKey } from '@solana/web3.js';
import { supabase } from './supabase-client';

export interface TokenHolderData {
  address: string;
  balance: number;
  percentageOwnership: number;
  rank: number;
  firstAcquired?: Date;
  lastTransaction?: Date;
  isCreator: boolean;
  isManager: boolean;
}

export interface HolderAnalytics {
  totalHolders: number;
  topHolders: TokenHolderData[];
  distribution: {
    whales: number; // >5%
    large: number;  // 1-5%
    medium: number; // 0.1-1%
    small: number;  // <0.1%
  };
  concentration: {
    top10Percentage: number;
    top50Percentage: number;
    giniCoefficient: number;
  };
  averageHolding: number;
  medianHolding: number;
}

/**
 * Get real holder analytics for Algorand ASA
 */
export async function getAlgorandHolderAnalytics(
  assetId: number,
  network: string = 'algorand-testnet'
): Promise<{ success: boolean; data?: HolderAnalytics; error?: string }> {
  try {
    console.log(`🔍 Fetching real Algorand holder data for asset ${assetId}`);

    const indexerClient = getAlgorandIndexerClient(network);
    
    // Get asset information first
    const assetInfo = await indexerClient.lookupAssetByID(assetId).do();
    const totalSupply = assetInfo.asset.params.total;
    
    // Get account balances for this asset
    const balancesResponse = await indexerClient
      .lookupAssetBalances(assetId)
      .limit(1000) // Algorand indexer limit
      .do();

    const holders: TokenHolderData[] = [];
    let totalHolders = 0;

    for (const account of balancesResponse.balances) {
      if (account.amount && account.amount > 0) {
        const balance = Number(account.amount); // Convert BigInt to number
        const percentageOwnership = (balance / Number(totalSupply)) * 100; // Convert BigInt to number
        
        holders.push({
          address: account.address,
          balance: balance,
          percentageOwnership: percentageOwnership,
          rank: 0, // Will be set after sorting
          isCreator: account.address === assetInfo.asset.params.creator,
          isManager: account.address === assetInfo.asset.params.manager
        });
        totalHolders++;
      }
    }

    // Sort by balance and assign ranks
    holders.sort((a, b) => b.balance - a.balance);
    holders.forEach((holder, index) => {
      holder.rank = index + 1;
    });

    // Calculate distribution
    const distribution = calculateDistribution(holders);
    
    // Calculate concentration metrics
    const concentration = calculateConcentration(holders);
    
    // Calculate statistics
    const totalBalance = holders.reduce((sum, h) => sum + h.balance, 0);
    const averageHolding = totalBalance / totalHolders;
    const sortedBalances = holders.map(h => h.balance).sort((a, b) => a - b);
    const medianHolding = sortedBalances[Math.floor(sortedBalances.length / 2)];

    const analytics: HolderAnalytics = {
      totalHolders,
      topHolders: holders.slice(0, 100), // Top 100 holders
      distribution,
      concentration,
      averageHolding,
      medianHolding
    };

    // Store analytics in Supabase for caching
    await storeHolderAnalytics(assetId.toString(), 'algorand', analytics);

    return { success: true, data: analytics };

  } catch (error) {
    console.error('❌ Error fetching Algorand holder analytics:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch holder analytics' 
    };
  }
}

/**
 * Get real holder analytics for Solana SPL token
 */
export async function getSolanaHolderAnalytics(
  mintAddress: string,
  network: string = 'devnet'
): Promise<{ success: boolean; data?: HolderAnalytics; error?: string }> {
  try {
    console.log(`🔍 Fetching real Solana holder data for token ${mintAddress}`);

    const connection = new Connection(
      network === 'mainnet' 
        ? process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
        : 'https://api.devnet.solana.com'
    );

    const mintPublicKey = new PublicKey(mintAddress);
    
    // Get token accounts for this mint using getProgramAccounts
    const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
    
    const accounts = await connection.getProgramAccounts(TOKEN_PROGRAM_ID, {
      filters: [
        {
          dataSize: 165, // Token account data size
        },
        {
          memcmp: {
            offset: 0, // Mint address offset in token account
            bytes: mintPublicKey.toBase58(),
          },
        },
      ],
    });
    
    const holders: TokenHolderData[] = [];
    let totalSupply = 0;

    // Get mint info for total supply
    const mintInfo = await connection.getTokenSupply(mintPublicKey);
    totalSupply = mintInfo.value.uiAmount || 0;

    for (const accountInfo of accounts) {
      try {
        const tokenAmount = await connection.getTokenAccountBalance(accountInfo.pubkey);
        const balance = tokenAmount.value.uiAmount || 0;
        
        if (balance > 0) {
          const percentageOwnership = totalSupply > 0 ? (balance / totalSupply) * 100 : 0;
          
          holders.push({
            address: accountInfo.account.owner.toString(),
            balance: balance,
            percentageOwnership: percentageOwnership,
            rank: 0, // Will be set after sorting
            isCreator: false, // Would need additional lookup
            isManager: false  // Would need additional lookup
          });
        }
      } catch (error) {
        console.warn(`Error processing token account ${accountInfo.pubkey}:`, error);
      }
    }

    // Sort by balance and assign ranks
    holders.sort((a, b) => b.balance - a.balance);
    holders.forEach((holder, index) => {
      holder.rank = index + 1;
    });

    // Calculate analytics
    const distribution = calculateDistribution(holders);
    const concentration = calculateConcentration(holders);
    
    const totalBalance = holders.reduce((sum, h) => sum + h.balance, 0);
    const averageHolding = totalBalance / holders.length;
    const sortedBalances = holders.map(h => h.balance).sort((a, b) => a - b);
    const medianHolding = sortedBalances[Math.floor(sortedBalances.length / 2)] || 0;

    const analytics: HolderAnalytics = {
      totalHolders: holders.length,
      topHolders: holders.slice(0, 100),
      distribution,
      concentration,
      averageHolding,
      medianHolding
    };

    // Store analytics in Supabase for caching
    await storeHolderAnalytics(mintAddress, 'solana', analytics);

    return { success: true, data: analytics };

  } catch (error) {
    console.error('❌ Error fetching Solana holder analytics:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch holder analytics' 
    };
  }
}

/**
 * Calculate holder distribution categories
 */
function calculateDistribution(holders: TokenHolderData[]) {
  const whales = holders.filter(h => h.percentageOwnership > 5).length;
  const large = holders.filter(h => h.percentageOwnership > 1 && h.percentageOwnership <= 5).length;
  const medium = holders.filter(h => h.percentageOwnership > 0.1 && h.percentageOwnership <= 1).length;
  const small = holders.filter(h => h.percentageOwnership <= 0.1).length;

  return { whales, large, medium, small };
}

/**
 * Calculate concentration metrics
 */
function calculateConcentration(holders: TokenHolderData[]) {
  const top10 = holders.slice(0, 10);
  const top50 = holders.slice(0, 50);
  
  const top10Percentage = top10.reduce((sum, h) => sum + h.percentageOwnership, 0);
  const top50Percentage = top50.reduce((sum, h) => sum + h.percentageOwnership, 0);
  
  // Calculate Gini coefficient for wealth distribution
  const giniCoefficient = calculateGiniCoefficient(holders.map(h => h.balance));

  return {
    top10Percentage,
    top50Percentage,
    giniCoefficient
  };
}

/**
 * Calculate Gini coefficient for wealth inequality
 */
function calculateGiniCoefficient(balances: number[]): number {
  if (balances.length === 0) return 0;
  
  const sortedBalances = balances.slice().sort((a, b) => a - b);
  const n = sortedBalances.length;
  const sum = sortedBalances.reduce((a, b) => a + b, 0);
  
  if (sum === 0) return 0;
  
  let giniSum = 0;
  for (let i = 0; i < n; i++) {
    giniSum += (2 * (i + 1) - n - 1) * sortedBalances[i];
  }
  
  return giniSum / (n * sum);
}

/**
 * Store holder analytics in Supabase for caching
 */
async function storeHolderAnalytics(
  tokenAddress: string,
  network: 'algorand' | 'solana',
  analytics: HolderAnalytics
) {
  try {
    // Store overall analytics
    await supabase
      .from('token_analytics')
      .upsert({
        token_address: tokenAddress,
        network,
        holder_count: analytics.totalHolders,
        last_updated: new Date().toISOString()
      });

    // Store individual holder data (top 100)
    const holderData = analytics.topHolders.map(holder => ({
      token_address: tokenAddress,
      network,
      holder_address: holder.address,
      balance: holder.balance,
      percentage_ownership: holder.percentageOwnership,
      holding_rank: holder.rank,
      updated_at: new Date().toISOString()
    }));

    // Clear old holder data and insert new
    await supabase
      .from('holder_analytics')
      .delete()
      .eq('token_address', tokenAddress)
      .eq('network', network);

    if (holderData.length > 0) {
      await supabase
        .from('holder_analytics')
        .insert(holderData);
    }

  } catch (error) {
    console.error('Error storing holder analytics:', error);
  }
}

/**
 * Get cached holder analytics from Supabase
 */
export async function getCachedHolderAnalytics(
  tokenAddress: string,
  network: 'algorand' | 'solana',
  maxAgeHours: number = 1
): Promise<{ success: boolean; data?: HolderAnalytics; error?: string }> {
  try {
    const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);

    // Get token analytics
    const { data: tokenAnalytics } = await supabase
      .from('token_analytics')
      .select('*')
      .eq('token_address', tokenAddress)
      .eq('network', network)
      .gte('last_updated', cutoffTime.toISOString())
      .single();

    if (!tokenAnalytics) {
      return { success: false, error: 'No cached data available' };
    }

    // Get holder data
    const { data: holderData } = await supabase
      .from('holder_analytics')
      .select('*')
      .eq('token_address', tokenAddress)
      .eq('network', network)
      .order('holding_rank', { ascending: true })
      .limit(100);

    const topHolders: TokenHolderData[] = (holderData || []).map(holder => ({
      address: holder.holder_address,
      balance: holder.balance,
      percentageOwnership: holder.percentage_ownership,
      rank: holder.holding_rank,
      isCreator: false, // Would need additional data
      isManager: false  // Would need additional data
    }));

    // Reconstruct analytics from cached data
    const distribution = calculateDistribution(topHolders);
    const concentration = calculateConcentration(topHolders);
    
    const totalBalance = topHolders.reduce((sum, h) => sum + h.balance, 0);
    const averageHolding = totalBalance / tokenAnalytics.holder_count;
    const sortedBalances = topHolders.map(h => h.balance).sort((a, b) => a - b);
    const medianHolding = sortedBalances[Math.floor(sortedBalances.length / 2)] || 0;

    const analytics: HolderAnalytics = {
      totalHolders: tokenAnalytics.holder_count,
      topHolders,
      distribution,
      concentration,
      averageHolding,
      medianHolding
    };

    return { success: true, data: analytics };

  } catch (error) {
    console.error('Error getting cached holder analytics:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get cached analytics' 
    };
  }
}

/**
 * Get holder analytics with caching
 */
export async function getHolderAnalytics(
  tokenAddress: string,
  network: 'algorand' | 'solana',
  forceRefresh: boolean = false
): Promise<{ success: boolean; data?: HolderAnalytics; error?: string }> {
  
  // Try cached data first unless force refresh
  if (!forceRefresh) {
    const cachedResult = await getCachedHolderAnalytics(tokenAddress, network);
    if (cachedResult.success) {
      console.log('📊 Using cached holder analytics');
      return cachedResult;
    }
  }

  // Fetch fresh data
  console.log('🔄 Fetching fresh holder analytics');
  
  if (network === 'algorand') {
    return await getAlgorandHolderAnalytics(parseInt(tokenAddress));
  } else {
    return await getSolanaHolderAnalytics(tokenAddress);
  }
}
