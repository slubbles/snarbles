'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  Wallet, 
  CheckCircle, 
  AlertTriangle, 
  Download,
  X
} from 'lucide-react';

interface EnhancedSolanaWalletButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
}

interface WalletInfo {
  name: string;
  icon: string;
  isInstalled: boolean;
  isConnected: boolean;
  connect: () => Promise<void>;
  downloadUrl: string;
  description: string;
}

export function EnhancedSolanaWalletButton({
  className = '',
  size = 'md',
  showStatus = true,
  variant = 'default'
}: EnhancedSolanaWalletButtonProps) {
  const { 
    wallet, 
    wallets,
    publicKey, 
    connected, 
    connecting, 
    disconnect,
    select,
    connect
  } = useWallet();
  
  const { setVisible } = useWalletModal();
  const { toast } = useToast();
  const [availableWallets, setAvailableWallets] = useState<WalletInfo[]>([]);
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Custom persistence for OKX wallet (since it's not handled by standard adapter)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const tryAutoReconnectOKX = async () => {
      const lastConnectedWallet = localStorage.getItem('snarbles_last_wallet');
      if (lastConnectedWallet === 'OKX' && !connected) {
        const okxWallet = (window as any).okxwallet?.solana;
        if (okxWallet && !isReconnecting) {
          setIsReconnecting(true);
          console.log('🔄 Attempting to auto-reconnect OKX wallet...');
          
          try {
            const response = await okxWallet.connect({ onlyIfTrusted: true });
            if (response && response.publicKey) {
              console.log('✅ OKX wallet auto-reconnected successfully');
              toast({
                title: "🎉 Wallet Reconnected",
                description: "OKX wallet automatically reconnected",
                duration: 3000,
              });
            }
          } catch (error) {
            console.log('ℹ️ OKX auto-reconnection skipped (user approval required)');
            localStorage.removeItem('snarbles_last_wallet'); // Clear invalid stored connection
          } finally {
            setIsReconnecting(false);
          }
        }
      }
    };

    // Small delay to ensure wallets are initialized
    const timeoutId = setTimeout(tryAutoReconnectOKX, 1000);
    return () => clearTimeout(timeoutId);
  }, [connected, isReconnecting, toast]);

  // Track Phantom wallet connections for persistence
  useEffect(() => {
    if (connected && wallet?.adapter?.name === 'Phantom') {
      localStorage.setItem('snarbles_last_wallet', 'Phantom');
      console.log('✅ Phantom wallet preference stored for persistence');
    }
  }, [connected, wallet]);

  // Direct wallet connection without modal
  const connectWalletDirectly = useCallback(async (walletName: string) => {
    try {
      // Find the wallet adapter
      const walletAdapter = wallets.find(w => w.adapter.name.toLowerCase().includes(walletName.toLowerCase()));
      
      if (walletAdapter) {
        console.log(`🔄 Connecting directly to ${walletName} wallet...`);
        await select(walletAdapter.adapter.name);
        await connect();
        
        toast({
          title: `🎉 ${walletName} Connected`,
          description: `Successfully connected to ${walletName} wallet`,
          duration: 3000,
        });
      } else {
        throw new Error(`${walletName} wallet adapter not found`);
      }
    } catch (error) {
      console.error(`${walletName} connection error:`, error);
      toast({
        title: "❌ Connection Failed",
        description: `Failed to connect to ${walletName} wallet. Please try again.`,
        variant: "destructive",
        duration: 4000,
      });
    }
  }, [wallets, select, connect, toast]);

  // Detect available wallets (LIMITED TO PHANTOM AND OKX ONLY)
  const detectWallets = useCallback(() => {
    const wallets: WalletInfo[] = [];

    // Check for Phantom Wallet
    const isPhantomInstalled = typeof window !== 'undefined' && 
      ((window as any).phantom?.solana?.isPhantom || (window as any).solana?.isPhantom);
    
    wallets.push({
      name: 'Phantom',
      icon: 'https://phantom.app/img/phantom-icon.svg',
      isInstalled: isPhantomInstalled,
      isConnected: connected && wallet?.adapter?.name === 'Phantom',
      connect: async () => {
        if (isPhantomInstalled) {
          await connectWalletDirectly('Phantom'); // Direct connection without modal
        } else {
          window.open('https://phantom.app/', '_blank');
        }
      },
      downloadUrl: 'https://phantom.app/',
      description: 'A friendly crypto wallet built for DeFi & NFTs'
    });

    // Check for OKX Wallet
    const isOKXInstalled = typeof window !== 'undefined' && 
      (window as any).okxwallet?.solana;
    
    wallets.push({
      name: 'OKX Wallet',
      icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iOCIgZmlsbD0iIzAwMCIvPgo8cGF0aCBkPSJNMTIgOEgyMFYxNkgxMlY4WiIgZmlsbD0iI0ZGRiIvPgo8cGF0aCBkPSJNOCAxMkgxNlYyMEg4VjEyWiIgZmlsbD0iI0ZGRiIvPgo8cGF0aCBkPSJNMTYgMTZIMjRWMjRIMTZWMTZaIiBmaWxsPSIjRkZGIi8+Cjwvc3ZnPgo=',
      isInstalled: isOKXInstalled,
      isConnected: false, // OKX connection handled separately for now
      connect: async () => {
        if (isOKXInstalled) {
          // Use the connectWalletDirectly function which already handles OKX
          await connectWalletDirectly('OKX');
        } else {
          window.open('https://www.okx.com/web3', '_blank');
        }
      },
      downloadUrl: 'https://www.okx.com/web3',
      description: 'The most powerful Web3 wallet'
    });

    setAvailableWallets(wallets);
  }, [connected, wallet, setVisible]);

  // Custom OKX connection handler
  const connectOKXWallet = async () => {
    try {
      if (typeof window === 'undefined' || !(window as any).okxwallet?.solana) {
        throw new Error('OKX Wallet not detected');
      }

      const okxWallet = (window as any).okxwallet.solana;
      const response = await okxWallet.connect();
      
      if (response?.publicKey) {
        // Store wallet preference for persistence
        localStorage.setItem('snarbles_last_wallet', 'OKX');
        
        toast({
          title: "🎉 OKX Wallet Connected",
          description: `Connected to ${response.publicKey.slice(0, 8)}...${response.publicKey.slice(-8)}`,
        });
      }
    } catch (error) {
      console.error('OKX connection error:', error);
      toast({
        title: "❌ Connection Failed",
        description: "Failed to connect to OKX Wallet. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    detectWallets();
    // Re-detect wallets periodically to catch installations
    const interval = setInterval(detectWallets, 5000);
    return () => clearInterval(interval);
  }, [detectWallets]);

  const handleDisconnect = async () => {
    try {
      setIsReconnecting(true);
      
      // Clear wallet preference to prevent auto-reconnection
      localStorage.removeItem('snarbles_last_wallet');
      
      await disconnect();
      toast({
        title: "🔌 Wallet Disconnected",
        description: "Successfully disconnected from Solana wallet",
      });
    } catch (error) {
      console.error('Disconnect error:', error);
      toast({
        title: "❌ Disconnect Failed",
        description: "Failed to disconnect wallet",
        variant: "destructive",
      });
    } finally {
      setIsReconnecting(false);
    }
  };

  // Button size mapping
  const buttonSizeClass = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base'
  }[size];

  // If connected, show connected state
  if (connected && publicKey) {
    return (
      <div className="flex items-center space-x-2">
        {showStatus && (
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
            <CheckCircle className="w-3 h-3 mr-1" />
            Connected
          </Badge>
        )}
        <Button
          variant="outline"
          onClick={handleDisconnect}
          disabled={isReconnecting}
          className={`${buttonSizeClass} ${className}`}
        >
          <Wallet className="w-4 h-4 mr-2" />
          {publicKey.toString().slice(0, 6)}...{publicKey.toString().slice(-4)}
        </Button>
      </div>
    );
  }

  // If connecting, show loading state
  if (connecting) {
    return (
      <Button
        variant={variant}
        disabled
        className={`${buttonSizeClass} ${className}`}
      >
        <div className="animate-spin w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full" />
        Connecting...
      </Button>
    );
  }

  // Show wallet selector
  return (
    <>
      <Button
        variant={variant}
        onClick={() => setShowWalletSelector(true)}
        className={`${buttonSizeClass} ${className}`}
      >
        <Wallet className="w-4 h-4 mr-2" />
        Connect Wallet
      </Button>

      {showWalletSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="glass-card w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-foreground">Connect Solana Wallet</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Limited to Phantom and OKX wallets only
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowWalletSelector(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {availableWallets.map((walletInfo) => (
                <div
                  key={walletInfo.name}
                  className="p-4 border border-border rounded-lg hover:bg-muted/20 transition-all duration-200 cursor-pointer"
                  onClick={() => {
                    if (walletInfo.isInstalled) {
                      walletInfo.connect();
                      setShowWalletSelector(false);
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img 
                        src={walletInfo.icon} 
                        alt={walletInfo.name}
                        className="w-10 h-10 rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iI0Y5RkFGQiIvPgo8cGF0aCBkPSJNMjAgMTBDMTYuNjg2IDEwIDEyIDEyLjY4NiAxMiAxNkMxMiAxOS4zMTQgMTQuNjg2IDIyIDIwIDIyQzIzLjMxNCAyMiAyNiAxOS4zMTQgMjYgMTZDMjYgMTIuNjg2IDIzLjMxNCAxMCAyMCAxMFoiIGZpbGw9IiM5OUEyQTgiLz4KPC9zdmc+Cg==';
                        }}
                      />
                      <div>
                        <p className="font-medium text-foreground">{walletInfo.name}</p>
                        <p className="text-xs text-muted-foreground">{walletInfo.description}</p>
                        <div className="flex items-center mt-1">
                          {walletInfo.isInstalled ? (
                            <Badge variant="outline" className="text-green-500 border-green-500/20 bg-green-500/10">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Installed
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-orange-500 border-orange-500/20 bg-orange-500/10">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Not Installed
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      {!walletInfo.isInstalled ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(walletInfo.downloadUrl, '_blank');
                          }}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Install
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          disabled={walletInfo.isConnected}
                        >
                          {walletInfo.isConnected ? 'Connected' : 'Connect'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="pt-4 border-t border-border text-center">
                <p className="text-xs text-muted-foreground mb-3">
                  🔒 Only Phantom and OKX wallets are supported for Solana connections
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowWalletSelector(false)}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

export default EnhancedSolanaWalletButton;
