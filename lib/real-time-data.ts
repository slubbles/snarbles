'use client';

import React from 'react';
import { getDashboardWebSocket, DashboardUpdate } from './websocket-client';

export interface RealTimeDataConfig {
  enableWebSocket?: boolean;
  enablePolling?: boolean;
  pollingInterval?: number;
  cacheTimeout?: number;
}

export interface DataCache<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class RealTimeDataService {
  private cache = new Map<string, DataCache<any>>();
  private subscribers = new Map<string, Set<(data: any) => void>>();
  private pollingTimers = new Map<string, NodeJS.Timeout>();
  private wsClient = getDashboardWebSocket();
  private config: Required<RealTimeDataConfig>;

  constructor(config: RealTimeDataConfig = {}) {
    this.config = {
      enableWebSocket: config.enableWebSocket ?? true,
      enablePolling: config.enablePolling ?? true,
      pollingInterval: config.pollingInterval || 30000,
      cacheTimeout: config.cacheTimeout || 60000
    };

    // Set up WebSocket listeners
    if (this.config.enableWebSocket) {
      this.setupWebSocketListeners();
    }
  }

  private setupWebSocketListeners(): void {
    this.wsClient.on('token_update', (update: DashboardUpdate) => {
      const key = `tokens:${update.network}`;
      this.updateCache(key, update.data);
      this.notifySubscribers(key, update.data);
    });

    this.wsClient.on('balance_update', (update: DashboardUpdate) => {
      const key = `balance:${update.network}`;
      this.updateCache(key, update.data);
      this.notifySubscribers(key, update.data);
    });

    this.wsClient.on('transaction_update', (update: DashboardUpdate) => {
      const key = `transactions:${update.network}`;
      this.updateCache(key, update.data);
      this.notifySubscribers(key, update.data);
    });

    this.wsClient.on('price_update', (update: DashboardUpdate) => {
      const key = `prices:${update.network}`;
      this.updateCache(key, update.data);
      this.notifySubscribers(key, update.data);
    });
  }

  /**
   * Subscribe to real-time data updates
   */
  subscribe<T>(
    key: string, 
    callback: (data: T) => void, 
    fetcher?: () => Promise<T>
  ): () => void {
    // Add callback to subscribers
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key)!.add(callback);

    // Check cache first
    const cached = this.getFromCache<T>(key);
    if (cached) {
      callback(cached);
    } else if (fetcher) {
      // Fetch initial data
      this.fetchAndCache(key, fetcher).then(callback).catch(console.error);
    }

    // Set up polling if enabled and not already polling
    if (this.config.enablePolling && fetcher && !this.pollingTimers.has(key)) {
      this.startPolling(key, fetcher);
    }

    // Subscribe to WebSocket channel if enabled
    if (this.config.enableWebSocket) {
      this.wsClient.subscribe(key);
    }

    // Return unsubscribe function
    return () => {
      this.subscribers.get(key)?.delete(callback);
      
      // Clean up if no more subscribers
      if (this.subscribers.get(key)?.size === 0) {
        this.subscribers.delete(key);
        this.stopPolling(key);
        
        if (this.config.enableWebSocket) {
          this.wsClient.unsubscribe(key);
        }
      }
    };
  }

  /**
   * Get data from cache if valid
   */
  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now > cached.expiry) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Update cache with new data
   */
  private updateCache<T>(key: string, data: T): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiry: now + this.config.cacheTimeout
    });
  }

  /**
   * Fetch data and update cache
   */
  private async fetchAndCache<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    try {
      const data = await fetcher();
      this.updateCache(key, data);
      return data;
    } catch (error) {
      console.error(`❌ Failed to fetch data for ${key}:`, error);
      throw error;
    }
  }

  /**
   * Notify all subscribers of data update
   */
  private notifySubscribers<T>(key: string, data: T): void {
    const callbacks = this.subscribers.get(key);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Error in subscriber callback for ${key}:`, error);
        }
      });
    }
  }

  /**
   * Start polling for data updates
   */
  private startPolling<T>(key: string, fetcher: () => Promise<T>): void {
    const timer = setInterval(async () => {
      try {
        const data = await this.fetchAndCache(key, fetcher);
        this.notifySubscribers(key, data);
      } catch (error) {
        console.error(`❌ Polling error for ${key}:`, error);
      }
    }, this.config.pollingInterval);

    this.pollingTimers.set(key, timer);
  }

  /**
   * Stop polling for a specific key
   */
  private stopPolling(key: string): void {
    const timer = this.pollingTimers.get(key);
    if (timer) {
      clearInterval(timer);
      this.pollingTimers.delete(key);
    }
  }

  /**
   * Clear all cache and stop all polling
   */
  cleanup(): void {
    this.cache.clear();
    this.subscribers.clear();
    
    this.pollingTimers.forEach(timer => clearInterval(timer));
    this.pollingTimers.clear();
  }

  /**
   * Force refresh data for a specific key
   */
  async refresh<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const data = await this.fetchAndCache(key, fetcher);
    this.notifySubscribers(key, data);
    return data;
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats(): { keys: string[]; totalSize: number; hitRate: number } {
    return {
      keys: Array.from(this.cache.keys()),
      totalSize: this.cache.size,
      hitRate: 0 // TODO: Implement hit rate tracking
    };
  }
}

// Singleton instance
let realTimeDataService: RealTimeDataService | null = null;

export function getRealTimeDataService(): RealTimeDataService {
  if (!realTimeDataService) {
    realTimeDataService = new RealTimeDataService();
  }
  return realTimeDataService;
}

// React hook for real-time data
export function useRealTimeData<T>(
  key: string,
  fetcher?: () => Promise<T>,
  options: { enabled?: boolean } = {}
) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const dataService = React.useRef(getRealTimeDataService());

  React.useEffect(() => {
    if (!options.enabled) return;

    setLoading(true);
    setError(null);

    const unsubscribe = dataService.current.subscribe<T>(
      key,
      (newData) => {
        setData(newData);
        setLoading(false);
        setError(null);
      },
      fetcher
    );

    // Handle initial fetch error
    if (fetcher) {
      fetcher().catch((err) => {
        setError(err);
        setLoading(false);
      });
    }

    return unsubscribe;
  }, [key, options.enabled]);

  const refresh = React.useCallback(async () => {
    if (!fetcher) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const newData = await dataService.current.refresh(key, fetcher);
      setData(newData);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [key, fetcher]);

  return {
    data,
    loading,
    error,
    refresh
  };
}

export default RealTimeDataService;
