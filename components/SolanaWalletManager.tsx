'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { WalletReadyState } from '@solana/wallet-adapter-base';
import { PublicKey } from '@solana/web3.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Wallet, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Zap, 
  ExternalLink, 
  Download,
  Eye,
  EyeOff,
  Settings,
  Shield,
  Globe,
  Clock,
  Database
} from 'lucide-react';

interface SolanaWalletManagerProps {
  onConnectionChange?: (connected: boolean, publicKey: PublicKey | null) => void;
  showDebugInfo?: boolean;
  autoReconnect?: boolean;
}

interface ConnectionAttempt {
  timestamp: number;
  walletName: string;
  success: boolean;
  error?: string;
}

interface WalletDiagnostics {
  isInstalled: boolean;
  readyState: WalletReadyState;
  lastConnectionAttempt?: number;
  connectionHistory: ConnectionAttempt[];
  rpcLatency?: number;
  networkStatus: 'connected' | 'disconnected' | 'checking';
}

export function SolanaWalletManager({ 
  onConnectionChange, 
  showDebugInfo = false,
  autoReconnect = true 
}: SolanaWalletManagerProps) {
  const { 
    wallet, 
    wallets, 
    publicKey, 
    connected, 
    connecting, 
    disconnecting,
    connect,
    disconnect,
    select 
  } = useWallet();
  
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();
  const { toast } = useToast();
  
  const [diagnostics, setDiagnostics] = useState<Record<string, WalletDiagnostics>>({});
  const [connectionHistory, setConnectionHistory] = useState<ConnectionAttempt[]>([]);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [rpcLatency, setRpcLatency] = useState<number | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [lastHeartbeat, setLastHeartbeat] = useState<number>(Date.now());

  // Debug logging utility
  const debug = useCallback((message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development' || showDebugInfo) {
      console.log(`🔧 [SolanaWalletManager] ${message}`, data || '');
    }
  }, [showDebugInfo]);

  // Test RPC connection latency
  const testRpcLatency = useCallback(async () => {
    if (!connection) return;
    
    try {
      const startTime = Date.now();
      await connection.getLatestBlockhash();
      const latency = Date.now() - startTime;
      setRpcLatency(latency);
      debug(`RPC latency: ${latency}ms`);
      return latency;
    } catch (error) {
      debug('RPC latency test failed:', error);
      setRpcLatency(null);
      return null;
    }
  }, [connection, debug]);

  // Comprehensive wallet diagnostics
  const runWalletDiagnostics = useCallback(async () => {
    debug('Running wallet diagnostics...');
    
    const newDiagnostics: Record<string, WalletDiagnostics> = {};
    
    for (const walletAdapter of wallets) {
      const walletName = walletAdapter.adapter.name;
      
      try {
        const readyState = walletAdapter.adapter.readyState;
        let isInstalled = false;
        
        // Check installation status
        switch (walletName.toLowerCase()) {
          case 'phantom':
            isInstalled = !!(window as any).phantom?.solana;
            break;
          case 'solflare':
            isInstalled = !!(window as any).solflare;
            break;
          case 'backpack':
            isInstalled = !!(window as any).backpack;
            break;
          default:
            isInstalled = readyState === WalletReadyState.Installed;
        }
        
        newDiagnostics[walletName] = {
          isInstalled,
          readyState,
          connectionHistory: diagnostics[walletName]?.connectionHistory || [],
          networkStatus: 'checking'
        };
        
        debug(`Wallet ${walletName}:`, {
          installed: isInstalled,
          readyState: WalletReadyState[readyState]
        });
        
      } catch (error) {
        debug(`Error diagnosing ${walletName}:`, error);
        newDiagnostics[walletName] = {
          isInstalled: false,
          readyState: WalletReadyState.NotDetected,
          connectionHistory: [],
          networkStatus: 'disconnected'
        };
      }
    }
    
    setDiagnostics(newDiagnostics);
    await testRpcLatency();
  }, [wallets, diagnostics, debug, testRpcLatency]);

  // Enhanced connection handler with retry logic
  const handleConnect = useCallback(async (walletName?: string) => {
    if (connecting || connected) return;
    
    try {
      debug(`Attempting to connect ${walletName ? `to ${walletName}` : 'wallet'}...`);
      
      if (walletName) {
        const selectedWallet = wallets.find(w => w.adapter.name === walletName);
        if (selectedWallet) {
          select(selectedWallet.adapter.name);
          await new Promise(resolve => setTimeout(resolve, 100)); // Brief delay for selection
        }
      }
      
      await connect();
      
      const attempt: ConnectionAttempt = {
        timestamp: Date.now(),
        walletName: wallet?.adapter.name || walletName || 'Unknown',
        success: true
      };
      
      setConnectionHistory(prev => [attempt, ...prev.slice(0, 9)]);
      debug('Connection successful!');
      
      toast({
        title: "Wallet Connected",
        description: `Successfully connected to ${wallet?.adapter.name || 'wallet'}`,
        duration: 3000,
      });
      
    } catch (error: any) {
      const attempt: ConnectionAttempt = {
        timestamp: Date.now(),
        walletName: wallet?.adapter.name || walletName || 'Unknown',
        success: false,
        error: error.message
      };
      
      setConnectionHistory(prev => [attempt, ...prev.slice(0, 9)]);
      debug('Connection failed:', error);
      
      toast({
        title: "Connection Failed",
        description: error.message || 'Failed to connect to wallet',
        variant: "destructive",
        duration: 5000,
      });
    }
  }, [connecting, connected, wallets, select, connect, wallet, debug, toast]);

  // Enhanced disconnect handler
  const handleDisconnect = useCallback(async () => {
    if (!connected) return;
    
    try {
      debug('Disconnecting wallet...');
      await disconnect();
      
      toast({
        title: "Wallet Disconnected",
        description: "Successfully disconnected from wallet",
        duration: 2000,
      });
      
    } catch (error: any) {
      debug('Disconnect failed:', error);
      toast({
        title: "Disconnect Failed",
        description: error.message || 'Failed to disconnect wallet',
        variant: "destructive",
        duration: 3000,
      });
    }
  }, [connected, disconnect, debug, toast]);

  // Auto-reconnection logic
  useEffect(() => {
    if (!autoReconnect) return;

    let reconnectTimer: NodeJS.Timeout;
    
    const attemptReconnect = async () => {
      if (connected || connecting || isReconnecting) return;
      
      const lastConnectedWallet = localStorage.getItem('snarbles_last_connected_wallet');
      if (!lastConnectedWallet) return;
      
      debug('Attempting auto-reconnect...');
      setIsReconnecting(true);
      
      try {
        const walletToReconnect = wallets.find(w => w.adapter.name === lastConnectedWallet);
        if (walletToReconnect && walletToReconnect.adapter.readyState === WalletReadyState.Installed) {
          await handleConnect(lastConnectedWallet);
        }
      } catch (error) {
        debug('Auto-reconnect failed:', error);
      } finally {
        setIsReconnecting(false);
      }
    };

    // Attempt reconnect on page visibility change
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        reconnectTimer = setTimeout(attemptReconnect, 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Initial reconnect attempt
    reconnectTimer = setTimeout(attemptReconnect, 2000);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [autoReconnect, connected, connecting, isReconnecting, wallets, handleConnect, debug]);

  // Save last connected wallet
  useEffect(() => {
    if (connected && wallet) {
      localStorage.setItem('snarbles_last_connected_wallet', wallet.adapter.name);
      debug(`Saved last connected wallet: ${wallet.adapter.name}`);
    }
  }, [connected, wallet, debug]);

  // Notify parent of connection changes
  useEffect(() => {
    onConnectionChange?.(connected, publicKey);
  }, [connected, publicKey, onConnectionChange]);

  // Periodic health checks
  useEffect(() => {
    const interval = setInterval(() => {
      setLastHeartbeat(Date.now());
      if (connected) {
        testRpcLatency();
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [connected, testRpcLatency]);

  // Initial diagnostics
  useEffect(() => {
    runWalletDiagnostics();
  }, []);

  // Get wallet status color
  const getStatusColor = (status: WalletDiagnostics) => {
    if (status.isInstalled && status.readyState === WalletReadyState.Installed) {
      return 'bg-green-500/10 text-green-700 border-green-500/20';
    }
    if (status.readyState === WalletReadyState.Loadable) {
      return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
    }
    return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
  };

  const installedWallets = useMemo(() => 
    Object.entries(diagnostics).filter(([_, status]) => status.isInstalled),
    [diagnostics]
  );

  return (
    <div className="space-y-4">
      {/* Main Connection Interface */}
      <Card className="border-[#9945FF]/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-[#9945FF]" />
              <CardTitle className="text-lg">Solana Wallet</CardTitle>
            </div>
            {showDebugInfo && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="h-8 w-8 p-0"
              >
                {showAdvanced ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            )}
          </div>
          <CardDescription>
            {connected 
              ? `Connected to ${wallet?.adapter.name} • ${publicKey?.toString().slice(0, 8)}...`
              : 'Connect your Solana wallet to continue'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {connected ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : connecting || isReconnecting ? (
                <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-gray-400" />
              )}
              <span className="text-sm font-medium">
                {connected ? 'Connected' : connecting ? 'Connecting...' : isReconnecting ? 'Reconnecting...' : 'Not Connected'}
              </span>
            </div>
            
            {rpcLatency && (
              <Badge variant="outline" className="text-xs">
                <Globe className="w-3 h-3 mr-1" />
                {rpcLatency}ms
              </Badge>
            )}
          </div>

          {/* Connection Controls */}
          <div className="flex gap-2">
            {connected ? (
              <Button 
                onClick={handleDisconnect}
                disabled={disconnecting}
                variant="outline"
                className="flex-1"
              >
                {disconnecting ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Wallet className="w-4 h-4 mr-2" />
                )}
                Disconnect
              </Button>
            ) : (
              <Button 
                onClick={() => setVisible(true)}
                disabled={connecting || isReconnecting}
                className="flex-1 bg-[#9945FF] hover:bg-[#8A3FF0] text-white"
              >
                {connecting || isReconnecting ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Wallet className="w-4 h-4 mr-2" />
                )}
                {isReconnecting ? 'Reconnecting...' : 'Connect Wallet'}
              </Button>
            )}
            
            <Button 
              onClick={runWalletDiagnostics}
              variant="outline"
              size="sm"
              className="px-3"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          {/* Advanced Diagnostics */}
          {showAdvanced && (
            <div className="space-y-3 pt-3 border-t border-border">
              <div className="text-sm font-medium">Wallet Diagnostics</div>
              
              {/* Installed Wallets */}
              {installedWallets.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">Detected Wallets:</div>
                  {installedWallets.map(([name, status]) => (
                    <div key={name} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        {name}
                      </span>
                      <Badge className={`text-xs h-5 ${getStatusColor(status)}`}>
                        {WalletReadyState[status.readyState]}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              {/* Connection History */}
              {connectionHistory.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">Recent Connections:</div>
                  {connectionHistory.slice(0, 3).map((attempt, index) => (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1">
                        {attempt.success ? (
                          <CheckCircle className="w-3 h-3 text-green-500" />
                        ) : (
                          <AlertTriangle className="w-3 h-3 text-red-500" />
                        )}
                        {attempt.walletName}
                      </span>
                      <span className="text-muted-foreground">
                        {new Date(attempt.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* System Info */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Heartbeat: {Math.floor((Date.now() - lastHeartbeat) / 1000)}s</span>
                </div>
                <div className="flex items-center gap-1">
                  <Database className="w-3 h-3" />
                  <span>Wallets: {installedWallets.length}/{wallets.length}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error States */}
      {installedWallets.length === 0 && (
        <Alert className="border-orange-500/50 bg-orange-500/10">
          <Download className="w-4 h-4" />
          <AlertDescription className="space-y-2">
            <div>No Solana wallets detected. Install a wallet extension to continue.</div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open('https://phantom.app/', '_blank')}
                className="h-6 px-2 text-xs"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Phantom
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open('https://solflare.com/', '_blank')}
                className="h-6 px-2 text-xs"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Solflare
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default SolanaWalletManager; 