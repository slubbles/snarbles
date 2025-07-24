'use client';

import React from 'react';
import { EventEmitter } from 'events';

export interface DashboardUpdate {
  type: 'token_update' | 'transaction_update' | 'balance_update' | 'price_update' | 'market_update' | 'metadata_update' | 'authority_update' | 'metadata_sync';
  network: 'algorand' | 'solana';
  data: any;
  timestamp: number;
}

export interface MetadataUpdateData {
  tokenId: string;
  version: number;
  changes: Array<{
    field: string;
    oldValue: any;
    newValue: any;
    changeType: 'added' | 'modified' | 'removed';
  }>;
  updatedBy: string;
  transactionHash: string;
  status: 'pending' | 'confirmed' | 'failed';
}

export interface AuthorityUpdateData {
  tokenId: string;
  operation: 'transfer' | 'delegate' | 'revoke';
  from: string;
  to: string;
  permissions: string[];
  transactionHash: string;
  status: 'pending' | 'confirmed' | 'failed';
}

export interface WebSocketConfig {
  url?: string;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  pingInterval?: number;
}

class DashboardWebSocketClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketConfig>;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingTimer: NodeJS.Timeout | null = null;
  private isConnected = false;
  private subscriptions = new Set<string>();

  constructor(config: WebSocketConfig = {}) {
    super();
    
    this.config = {
      url: config.url || process.env.NEXT_PUBLIC_WS_URL || 'wss://api.snarbles.com/ws',
      autoReconnect: config.autoReconnect ?? true,
      reconnectInterval: config.reconnectInterval || 3000,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
      pingInterval: config.pingInterval || 30000
    };
  }

  connect(walletAddress?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Construct WebSocket URL with wallet address if provided
        const wsUrl = walletAddress 
          ? `${this.config.url}?wallet=${encodeURIComponent(walletAddress)}`
          : this.config.url;

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('✅ Dashboard WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.startPingTimer();
          this.emit('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const update: DashboardUpdate = JSON.parse(event.data);
            this.handleUpdate(update);
          } catch (error) {
            console.error('❌ Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('🔌 Dashboard WebSocket disconnected:', event.code, event.reason);
          this.isConnected = false;
          this.stopPingTimer();
          this.emit('disconnected', event);
          
          if (this.config.autoReconnect && this.reconnectAttempts < this.config.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ Dashboard WebSocket error:', error);
          this.emit('error', error);
          reject(error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.config.autoReconnect = false;
    this.stopPingTimer();
    this.clearReconnectTimer();
    
    if (this.ws) {
      this.ws.close(1000, 'User initiated disconnect');
      this.ws = null;
    }
    
    this.isConnected = false;
    this.subscriptions.clear();
  }

  subscribe(channel: string): void {
    if (!this.isConnected) {
      console.warn('⚠️ Cannot subscribe: WebSocket not connected');
      return;
    }

    this.subscriptions.add(channel);
    this.send({
      type: 'subscribe',
      channel
    });
  }

  unsubscribe(channel: string): void {
    if (!this.isConnected) return;

    this.subscriptions.delete(channel);
    this.send({
      type: 'unsubscribe',
      channel
    });
  }

  // Metadata-specific subscription methods
  subscribeToMetadataUpdates(tokenId: string): void {
    this.subscribe(`metadata:${tokenId}`);
  }

  subscribeToAuthorityUpdates(tokenId: string): void {
    this.subscribe(`authority:${tokenId}`);
  }

  subscribeToTokenUpdates(tokenIds: string[]): void {
    tokenIds.forEach(tokenId => {
      this.subscribe(`token:${tokenId}`);
    });
  }

  unsubscribeFromMetadataUpdates(tokenId: string): void {
    this.unsubscribe(`metadata:${tokenId}`);
  }

  unsubscribeFromAuthorityUpdates(tokenId: string): void {
    this.unsubscribe(`authority:${tokenId}`);
  }

  private send(data: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('⚠️ Cannot send: WebSocket not ready');
      return;
    }

    try {
      this.ws.send(JSON.stringify(data));
    } catch (error) {
      console.error('❌ Failed to send WebSocket message:', error);
    }
  }

  private handleUpdate(update: DashboardUpdate): void {
    // Emit specific event types for targeted listening
    this.emit('update', update);
    this.emit(update.type, update);
    this.emit(`${update.network}:${update.type}`, update);
  }

  private startPingTimer(): void {
    this.stopPingTimer();
    this.pingTimer = setInterval(() => {
      if (this.isConnected) {
        this.send({ type: 'ping', timestamp: Date.now() });
      }
    }, this.config.pingInterval);
  }

  private stopPingTimer(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private scheduleReconnect(): void {
    this.clearReconnectTimer();
    this.reconnectAttempts++;
    
    console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.config.maxReconnectAttempts})...`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(() => {
        // Reconnection failed, will try again if under max attempts
      });
    }, this.config.reconnectInterval * this.reconnectAttempts); // Exponential backoff
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  // Getters
  get connected(): boolean {
    return this.isConnected;
  }

  get readyState(): number {
    return this.ws?.readyState || WebSocket.CLOSED;
  }
}

// Singleton instance for the application
let dashboardWebSocket: DashboardWebSocketClient | null = null;

export function getDashboardWebSocket(): DashboardWebSocketClient {
  if (!dashboardWebSocket) {
    dashboardWebSocket = new DashboardWebSocketClient();
  }
  return dashboardWebSocket;
}

// React hook for dashboard WebSocket
export function useDashboardWebSocket(walletAddress?: string) {
  const [isConnected, setIsConnected] = React.useState(false);
  const [lastUpdate, setLastUpdate] = React.useState<DashboardUpdate | null>(null);
  const [metadataUpdates, setMetadataUpdates] = React.useState<MetadataUpdateData[]>([]);
  const [authorityUpdates, setAuthorityUpdates] = React.useState<AuthorityUpdateData[]>([]);
  const wsClient = React.useRef<DashboardWebSocketClient | null>(null);

  React.useEffect(() => {
    wsClient.current = getDashboardWebSocket();
    
    const handleConnected = () => setIsConnected(true);
    const handleDisconnected = () => setIsConnected(false);
    const handleUpdate = (update: DashboardUpdate) => setLastUpdate(update);
    
    const handleMetadataUpdate = (update: DashboardUpdate) => {
      if (update.type === 'metadata_update') {
        setMetadataUpdates(prev => [update.data as MetadataUpdateData, ...prev.slice(0, 49)]);
      }
    };
    
    const handleAuthorityUpdate = (update: DashboardUpdate) => {
      if (update.type === 'authority_update') {
        setAuthorityUpdates(prev => [update.data as AuthorityUpdateData, ...prev.slice(0, 49)]);
      }
    };

    wsClient.current.on('connected', handleConnected);
    wsClient.current.on('disconnected', handleDisconnected);
    wsClient.current.on('update', handleUpdate);
    wsClient.current.on('metadata_update', handleMetadataUpdate);
    wsClient.current.on('authority_update', handleAuthorityUpdate);

    // Connect if wallet address is provided
    if (walletAddress && !wsClient.current.connected) {
      wsClient.current.connect(walletAddress).catch(console.error);
    }

    return () => {
      if (wsClient.current) {
        wsClient.current.off('connected', handleConnected);
        wsClient.current.off('disconnected', handleDisconnected);
        wsClient.current.off('update', handleUpdate);
        wsClient.current.off('metadata_update', handleMetadataUpdate);
        wsClient.current.off('authority_update', handleAuthorityUpdate);
      }
    };
  }, [walletAddress]);

  const subscribe = React.useCallback((channel: string) => {
    wsClient.current?.subscribe(channel);
  }, []);

  const unsubscribe = React.useCallback((channel: string) => {
    wsClient.current?.unsubscribe(channel);
  }, []);

  const subscribeToMetadata = React.useCallback((tokenId: string) => {
    wsClient.current?.subscribeToMetadataUpdates(tokenId);
  }, []);

  const subscribeToAuthority = React.useCallback((tokenId: string) => {
    wsClient.current?.subscribeToAuthorityUpdates(tokenId);
  }, []);

  return {
    isConnected,
    lastUpdate,
    metadataUpdates,
    authorityUpdates,
    subscribe,
    unsubscribe,
    subscribeToMetadata,
    subscribeToAuthority,
    client: wsClient.current
  };
}

export default DashboardWebSocketClient;
