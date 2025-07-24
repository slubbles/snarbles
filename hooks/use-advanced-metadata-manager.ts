import React from 'react';
import { toast } from 'sonner';
import { 
  metadataService,
  type MetadataUpdateRequest,
  type AuthorityUpdateRequest,
  type MetadataValidationResult,
  type MetadataHistoryEntry
} from '@/lib/metadata-service';
import { 
  aiMetadataService,
  type AIMetadataRequest,
  type AIMetadataResponse,
  type MetadataAnalytics,
  type BatchOperationRequest,
  type BatchOperationResult
} from '@/lib/ai-metadata-service';
import { useDashboardWebSocket } from '@/lib/websocket-client';

export interface AdvancedMetadataManagerConfig {
  enableRealTimeUpdates?: boolean;
  enableAnalytics?: boolean;
  enableAIFeatures?: boolean;
  enableBatchOperations?: boolean;
  autoValidation?: boolean;
  cacheDuration?: number; // minutes
}

export interface MetadataCache {
  [key: string]: {
    data: any;
    timestamp: number;
    expiry: number;
  };
}

export interface UseAdvancedMetadataManagerResult {
  // Core functionality
  updateMetadata: (request: MetadataUpdateRequest) => Promise<{ success: boolean; transactionHash?: string; error?: string }>;
  updateAuthority: (request: AuthorityUpdateRequest) => Promise<{ success: boolean; transactionHash?: string; error?: string }>;
  validateMetadata: (metadata: any, network: 'algorand' | 'solana') => Promise<MetadataValidationResult>;
  getMetadataHistory: (tokenId: string, network: 'algorand' | 'solana') => Promise<MetadataHistoryEntry[]>;
  
  // AI-powered features
  generateAIMetadata: (request: AIMetadataRequest) => Promise<AIMetadataResponse>;
  analyzeMetadata: (tokenId: string, network: 'algorand' | 'solana', metadata: any) => Promise<MetadataAnalytics>;
  optimizeForSEO: (metadata: any, keywords: string[]) => Promise<{ optimizedMetadata: any; seoScore: number; improvements: string[] }>;
  
  // Batch operations
  executeBatchOperation: (request: BatchOperationRequest) => Promise<BatchOperationResult>;
  
  // Real-time features
  subscribeToToken: (tokenId: string) => void;
  unsubscribeFromToken: (tokenId: string) => void;
  
  // State management
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  
  // Analytics & caching
  analytics: MetadataAnalytics[];
  cache: MetadataCache;
  clearCache: () => void;
  
  // WebSocket integration
  isConnected: boolean;
  metadataUpdates: any[];
  authorityUpdates: any[];
  
  // Configuration
  config: AdvancedMetadataManagerConfig;
  updateConfig: (newConfig: Partial<AdvancedMetadataManagerConfig>) => void;
}

/**
 * Advanced metadata manager hook with AI, analytics, and real-time features
 */
export function useAdvancedMetadataManager(
  walletAddress: string,
  signTransaction: (txn: any) => Promise<any>,
  initialConfig: AdvancedMetadataManagerConfig = {}
): UseAdvancedMetadataManagerResult {
  // Configuration state
  const [config, setConfig] = React.useState<AdvancedMetadataManagerConfig>({
    enableRealTimeUpdates: true,
    enableAnalytics: true,
    enableAIFeatures: true,
    enableBatchOperations: true,
    autoValidation: true,
    cacheDuration: 30,
    ...initialConfig
  });

  // Core state
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = React.useState<Date | null>(null);
  const [analytics, setAnalytics] = React.useState<MetadataAnalytics[]>([]);
  const [cache, setCache] = React.useState<MetadataCache>({});

  // WebSocket integration
  const {
    isConnected,
    metadataUpdates,
    authorityUpdates,
    subscribeToMetadata,
    subscribeToAuthority,
    client: wsClient
  } = useDashboardWebSocket(config.enableRealTimeUpdates ? walletAddress : undefined);

  // Subscribed tokens tracking
  const [subscribedTokens, setSubscribedTokens] = React.useState<Set<string>>(new Set());

  // Cache management
  const getCachedData = React.useCallback((key: string) => {
    const cached = cache[key];
    if (cached && Date.now() < cached.expiry) {
      return cached.data;
    }
    return null;
  }, [cache]);

  const setCachedData = React.useCallback((key: string, data: any) => {
    const expiry = Date.now() + (config.cacheDuration || 30) * 60 * 1000;
    setCache(prev => ({
      ...prev,
      [key]: { data, timestamp: Date.now(), expiry }
    }));
  }, [config.cacheDuration]);

  const clearCache = React.useCallback(() => {
    setCache({});
  }, []);

  // Core metadata operations
  const updateMetadata = React.useCallback(async (request: MetadataUpdateRequest) => {
    try {
      setLoading(true);
      setError(null);

      // Auto-validation if enabled
      if (config.autoValidation) {
        const validation = await metadataService.validateMetadata(request.metadata, request.network);
        if (!validation.isValid) {
          const errorMsg = `Validation failed: ${validation.errors.join(', ')}`;
          setError(errorMsg);
          toast.error(errorMsg);
          return { success: false, error: errorMsg };
        }
      }

      const result = await metadataService.updateMetadata(request);
      
      if (result.success) {
        setLastUpdate(new Date());
        // Clear relevant cache entries
        const cacheKey = `metadata_${request.tokenId}_${request.network}`;
        setCache(prev => {
          const { [cacheKey]: removed, ...rest } = prev;
          return rest;
        });
        
        toast.success('Metadata updated successfully!');
      } else {
        setError(result.error || 'Update failed');
        toast.error(result.error || 'Failed to update metadata');
      }

      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [config.autoValidation]);

  const updateAuthority = React.useCallback(async (request: AuthorityUpdateRequest) => {
    try {
      setLoading(true);
      setError(null);

      const result = await metadataService.updateAuthority(request);
      
      if (result.success) {
        setLastUpdate(new Date());
        toast.success('Authority updated successfully!');
      } else {
        setError(result.error || 'Authority update failed');
        toast.error(result.error || 'Failed to update authority');
      }

      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const validateMetadata = React.useCallback(async (metadata: any, network: 'algorand' | 'solana') => {
    try {
      setLoading(true);
      return await metadataService.validateMetadata(metadata, network);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Validation failed';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const getMetadataHistory = React.useCallback(async (tokenId: string, network: 'algorand' | 'solana') => {
    try {
      const cacheKey = `history_${tokenId}_${network}`;
      const cached = getCachedData(cacheKey);
      if (cached) return cached;

      setLoading(true);
      const result = await metadataService.getMetadataHistory(tokenId, network);
      
      if (result.success && result.data) {
        setCachedData(cacheKey, result.data);
        return result.data;
      }
      
      return [];
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get history';
      setError(errorMsg);
      return [];
    } finally {
      setLoading(false);
    }
  }, [getCachedData, setCachedData]);

  // AI-powered features
  const generateAIMetadata = React.useCallback(async (request: AIMetadataRequest) => {
    if (!config.enableAIFeatures) {
      throw new Error('AI features are disabled');
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await aiMetadataService.generateMetadataSuggestions(request);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'AI generation failed';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [config.enableAIFeatures]);

  const analyzeMetadata = React.useCallback(async (tokenId: string, network: 'algorand' | 'solana', metadata: any) => {
    if (!config.enableAnalytics) {
      throw new Error('Analytics features are disabled');
    }

    try {
      const cacheKey = `analytics_${tokenId}_${network}`;
      const cached = getCachedData(cacheKey);
      if (cached) return cached;

      setLoading(true);
      const result = await aiMetadataService.analyzeMetadata(tokenId, network, metadata);
      
      setCachedData(cacheKey, result);
      
      // Update analytics state
      setAnalytics(prev => {
        const filtered = prev.filter(a => !(a.tokenId === tokenId && a.network === network));
        return [...filtered, result];
      });
      
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Analysis failed';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [config.enableAnalytics, getCachedData, setCachedData]);

  const optimizeForSEO = React.useCallback(async (metadata: any, keywords: string[]) => {
    if (!config.enableAIFeatures) {
      throw new Error('AI features are disabled');
    }

    try {
      setLoading(true);
      return await aiMetadataService.optimizeForSEO(metadata, keywords);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'SEO optimization failed';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [config.enableAIFeatures]);

  // Batch operations
  const executeBatchOperation = React.useCallback(async (request: BatchOperationRequest) => {
    if (!config.enableBatchOperations) {
      throw new Error('Batch operations are disabled');
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await aiMetadataService.executeBatchOperation(request);
      
      if (result.success) {
        setLastUpdate(new Date());
        toast.success(`Batch operation completed: ${result.summary.successful}/${result.summary.total} successful`);
      } else {
        toast.error('Batch operation failed');
      }
      
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Batch operation failed';
      setError(errorMsg);
      toast.error(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [config.enableBatchOperations]);

  // Real-time subscriptions
  const subscribeToToken = React.useCallback((tokenId: string) => {
    if (!config.enableRealTimeUpdates || !wsClient) return;

    subscribeToMetadata(tokenId);
    subscribeToAuthority(tokenId);
    setSubscribedTokens(prev => new Set(prev).add(tokenId));
  }, [config.enableRealTimeUpdates, wsClient, subscribeToMetadata, subscribeToAuthority]);

  const unsubscribeFromToken = React.useCallback((tokenId: string) => {
    if (!wsClient) return;

    wsClient.unsubscribeFromMetadataUpdates(tokenId);
    wsClient.unsubscribeFromAuthorityUpdates(tokenId);
    setSubscribedTokens(prev => {
      const newSet = new Set(prev);
      newSet.delete(tokenId);
      return newSet;
    });
  }, [wsClient]);

  // Configuration management
  const updateConfig = React.useCallback((newConfig: Partial<AdvancedMetadataManagerConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  // Cleanup effect
  React.useEffect(() => {
    return () => {
      // Unsubscribe from all tokens on unmount
      subscribedTokens.forEach(tokenId => {
        if (wsClient) {
          wsClient.unsubscribeFromMetadataUpdates(tokenId);
          wsClient.unsubscribeFromAuthorityUpdates(tokenId);
        }
      });
    };
  }, [subscribedTokens, wsClient]);

  // Cache cleanup effect
  React.useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      setCache(prev => {
        const filtered = Object.entries(prev).reduce((acc, [key, value]) => {
          if (now < value.expiry) {
            acc[key] = value;
          }
          return acc;
        }, {} as MetadataCache);
        return filtered;
      });
    }, 5 * 60 * 1000); // Clean up every 5 minutes

    return () => clearInterval(cleanup);
  }, []);

  // Error recovery effect
  React.useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 10000); // Clear error after 10 seconds
      return () => clearTimeout(timer);
    }
  }, [error]);

  return {
    // Core functionality
    updateMetadata,
    updateAuthority,
    validateMetadata,
    getMetadataHistory,
    
    // AI-powered features
    generateAIMetadata,
    analyzeMetadata,
    optimizeForSEO,
    
    // Batch operations
    executeBatchOperation,
    
    // Real-time features
    subscribeToToken,
    unsubscribeFromToken,
    
    // State management
    loading,
    error,
    lastUpdate,
    
    // Analytics & caching
    analytics,
    cache,
    clearCache,
    
    // WebSocket integration
    isConnected,
    metadataUpdates,
    authorityUpdates,
    
    // Configuration
    config,
    updateConfig
  };
}

/**
 * Simplified hook for basic metadata operations
 */
export function useBasicMetadataManager(
  walletAddress: string,
  signTransaction: (txn: any) => Promise<any>
) {
  return useAdvancedMetadataManager(walletAddress, signTransaction, {
    enableRealTimeUpdates: false,
    enableAnalytics: false,
    enableAIFeatures: false,
    enableBatchOperations: false,
    autoValidation: true,
    cacheDuration: 15
  });
}

/**
 * Hook for AI-powered metadata management
 */
export function useAIMetadataManager(
  walletAddress: string,
  signTransaction: (txn: any) => Promise<any>
) {
  return useAdvancedMetadataManager(walletAddress, signTransaction, {
    enableRealTimeUpdates: true,
    enableAnalytics: true,
    enableAIFeatures: true,
    enableBatchOperations: true,
    autoValidation: true,
    cacheDuration: 30
  });
}

export default useAdvancedMetadataManager;
