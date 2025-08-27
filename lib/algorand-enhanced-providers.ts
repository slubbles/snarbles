/**
 * Enhanced Algorand Network Configuration with Multiple Providers
 * 
 * This module provides network configurations with multiple endpoint providers
 * including Algonode.cloud and Nodely.io for better performance and reliability.
 */

// Endpoint provider configurations
export const ALGORAND_PROVIDERS = {
  nodely: {
    name: 'Nodely.io',
    priority: 1, // Higher priority = preferred
    mainnet: {
      algodUrl: 'https://algorand-mainnet.g.alchemy.com/v2/demo', // Nodely.io endpoint
      indexerUrl: 'https://algorand-mainnet-idx.g.alchemy.com/v2/demo'
    },
    testnet: {
      algodUrl: 'https://algorand-testnet.g.alchemy.com/v2/demo',
      indexerUrl: 'https://algorand-testnet-idx.g.alchemy.com/v2/demo'
    },
    rateLimit: 300, // requests per minute
    timeout: 5000
  },
  algonode: {
    name: 'Algonode.cloud',
    priority: 2, // Fallback provider
    mainnet: {
      algodUrl: 'https://mainnet-api.algonode.cloud',
      indexerUrl: 'https://mainnet-idx.algonode.cloud'
    },
    testnet: {
      algodUrl: 'https://testnet-api.algonode.cloud',
      indexerUrl: 'https://testnet-idx.algonode.cloud'
    },
    rateLimit: 200, // requests per minute
    timeout: 10000
  }
} as const;

// Enhanced network configurations with multiple providers
export const ENHANCED_ALGORAND_NETWORKS = {
  'algorand-mainnet': {
    name: 'Algorand Mainnet',
    providers: [
      {
        name: 'Nodely.io',
        algodUrl: 'https://algod-mainnet.nodely.dev',
        indexerUrl: 'https://indexer-mainnet.nodely.dev'
      },
      {
        name: 'Algonode.cloud',
        algodUrl: 'https://mainnet-api.algonode.cloud',
        indexerUrl: 'https://mainnet-idx.algonode.cloud'
      }
    ],
    token: '',
    port: '',
    chainId: 416001,
    explorer: 'https://explorer.perawallet.app',
    isMainnet: true,
    color: 'bg-[#00d4aa]'
  }
} as const;

// Provider health tracking
interface ProviderHealth {
  name: string;
  lastChecked: number;
  responseTime: number;
  isHealthy: boolean;
  errorCount: number;
  successCount: number;
}

class AlgorandProviderManager {
  private healthStatus: Map<string, ProviderHealth> = new Map();
  private requestCounts: Map<string, number> = new Map();
  private lastRateLimitReset: Map<string, number> = new Map();

  /**
   * Get the best available provider for a network
   */
  async getBestProvider(network: string): Promise<{ algodUrl: string; indexerUrl: string; name: string }> {
    const networkConfig = ENHANCED_ALGORAND_NETWORKS[network as keyof typeof ENHANCED_ALGORAND_NETWORKS];
    
    if (!networkConfig) {
      throw new Error(`Unknown network: ${network}`);
    }

    // Sort providers by health and priority
    const sortedProviders = [...networkConfig.providers].sort((a, b) => {
      const healthA = this.healthStatus.get(a.name) || this.createDefaultHealth(a.name);
      const healthB = this.healthStatus.get(b.name) || this.createDefaultHealth(b.name);
      
      // Prefer healthy providers
      if (healthA.isHealthy !== healthB.isHealthy) {
        return healthA.isHealthy ? -1 : 1;
      }
      
      // Among healthy providers, prefer faster ones
      return healthA.responseTime - healthB.responseTime;
    });

    // Try each provider until one works
    for (const provider of sortedProviders) {
      if (this.canUseProvider(provider.name)) {
        return {
          algodUrl: provider.algodUrl,
          indexerUrl: provider.indexerUrl,
          name: provider.name
        };
      }
    }

    // Fallback to first provider if all are rate limited
    const fallback = sortedProviders[0];
    return {
      algodUrl: fallback.algodUrl,
      indexerUrl: fallback.indexerUrl,
      name: fallback.name
    };
  }

  /**
   * Test provider health and response time
   */
  async testProviderHealth(provider: { algodUrl: string; indexerUrl: string; name: string }): Promise<ProviderHealth> {
    const startTime = Date.now();
    let health = this.healthStatus.get(provider.name) || this.createDefaultHealth(provider.name);

    try {
      // Test algod endpoint
      const algodResponse = await Promise.race([
        fetch(`${provider.algodUrl}/v2/status`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]) as Response;

      if (algodResponse.ok) {
        const responseTime = Date.now() - startTime;
        health = {
          ...health,
          lastChecked: Date.now(),
          responseTime,
          isHealthy: true,
          successCount: health.successCount + 1,
          errorCount: Math.max(0, health.errorCount - 1) // Reduce error count on success
        };
      } else {
        throw new Error(`HTTP ${algodResponse.status}`);
      }
    } catch (error) {
      health = {
        ...health,
        lastChecked: Date.now(),
        responseTime: Date.now() - startTime,
        isHealthy: false,
        errorCount: health.errorCount + 1
      };
      console.warn(`Provider ${provider.name} health check failed:`, error);
    }

    this.healthStatus.set(provider.name, health);
    return health;
  }

  /**
   * Check if provider can be used (not rate limited)
   */
  private canUseProvider(providerName: string): boolean {
    const now = Date.now();
    const lastReset = this.lastRateLimitReset.get(providerName) || 0;
    const requestCount = this.requestCounts.get(providerName) || 0;

    // Reset rate limit counter every minute
    if (now - lastReset > 60000) {
      this.requestCounts.set(providerName, 0);
      this.lastRateLimitReset.set(providerName, now);
      return true;
    }

    // Check rate limits
    const provider = Object.values(ALGORAND_PROVIDERS).find(p => p.name === providerName);
    const rateLimit = provider?.rateLimit || 100;

    return requestCount < rateLimit;
  }

  /**
   * Record a request for rate limiting
   */
  recordRequest(providerName: string): void {
    const current = this.requestCounts.get(providerName) || 0;
    this.requestCounts.set(providerName, current + 1);
  }

  /**
   * Get provider statistics
   */
  getProviderStats(): Record<string, ProviderHealth> {
    const stats: Record<string, ProviderHealth> = {};
    for (const [name, health] of this.healthStatus.entries()) {
      stats[name] = { ...health };
    }
    return stats;
  }

  private createDefaultHealth(name: string): ProviderHealth {
    return {
      name,
      lastChecked: 0,
      responseTime: 0,
      isHealthy: true,
      errorCount: 0,
      successCount: 0
    };
  }
}

// Global provider manager instance
export const providerManager = new AlgorandProviderManager();

/**
 * Enhanced function to get Algorand client with automatic provider selection
 */
export async function getEnhancedAlgorandClient(network: string) {
  const { default: algosdk } = await import('algosdk');
  
  try {
    const provider = await providerManager.getBestProvider(network);
    providerManager.recordRequest(provider.name);
    
    console.log(`🔗 Using ${provider.name} for ${network} algod requests`);
    
    return {
      client: new algosdk.Algodv2('', provider.algodUrl, ''),
      provider: provider.name
    };
  } catch (error) {
    console.error('Failed to get enhanced Algorand client:', error);
    // Fallback to original implementation
    const { getAlgorandClient } = await import('./algorand');
    return {
      client: getAlgorandClient(network),
      provider: 'fallback'
    };
  }
}

/**
 * Enhanced function to get Algorand indexer with automatic provider selection
 */
export async function getEnhancedAlgorandIndexer(network: string) {
  const { default: algosdk } = await import('algosdk');
  
  try {
    const provider = await providerManager.getBestProvider(network);
    providerManager.recordRequest(provider.name);
    
    console.log(`📊 Using ${provider.name} for ${network} indexer requests`);
    
    return {
      client: new algosdk.Indexer('', provider.indexerUrl, ''),
      provider: provider.name
    };
  } catch (error) {
    console.error('Failed to get enhanced Algorand indexer:', error);
    // Fallback to original implementation
    const { getAlgorandIndexerClient } = await import('./algorand');
    return {
      client: getAlgorandIndexerClient(network),
      provider: 'fallback'
    };
  }
}

/**
 * Test all providers and return performance metrics
 */
export async function benchmarkProviders(network: string): Promise<{
  results: ProviderHealth[];
  fastest: string;
  recommended: string;
}> {
  const networkConfig = ENHANCED_ALGORAND_NETWORKS[network as keyof typeof ENHANCED_ALGORAND_NETWORKS];
  
  if (!networkConfig) {
    throw new Error(`Unknown network: ${network}`);
  }

  console.log(`🏃‍♂️ Benchmarking providers for ${network}...`);
  
  const results = await Promise.all(
    networkConfig.providers.map(provider => 
      providerManager.testProviderHealth(provider)
    )
  );

  const healthyProviders = results.filter(r => r.isHealthy);
  const fastest = healthyProviders.length > 0 
    ? healthyProviders.reduce((prev, current) => 
        prev.responseTime < current.responseTime ? prev : current
      ).name
    : 'none';

  const recommended = healthyProviders.length > 0 
    ? healthyProviders.reduce((prev, current) => {
        // Prefer providers with good response time and low error rate
        const prevScore = prev.responseTime + (prev.errorCount * 100);
        const currentScore = current.responseTime + (current.errorCount * 100);
        return prevScore < currentScore ? prev : current;
      }).name
    : 'none';

  console.log(`⚡ Fastest provider: ${fastest}`);
  console.log(`🎯 Recommended provider: ${recommended}`);

  return { results, fastest, recommended };
}

export default {
  ENHANCED_ALGORAND_NETWORKS,
  providerManager,
  getEnhancedAlgorandClient,
  getEnhancedAlgorandIndexer,
  benchmarkProviders
};
