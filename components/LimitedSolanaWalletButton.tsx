'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Wallet, 
  CheckCircle, 
  AlertTriangle, 
  ExternalLink, 
  Download
} from 'lucide-react';

interface WalletInfo {
  name: string;
  icon: string;
  isInstalled: boolean;
  isConnected: boolean;
  connect: () => Promise<void>;
  downloadUrl: string;
}

export default function LimitedSolanaWalletButton({ 
  variant = "default",
  size = "default",
  className = ""
}: {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}) {
  const { wallet, connected, connecting, disconnect, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const { toast } = useToast();
  const [availableWallets, setAvailableWallets] = useState<WalletInfo[]>([]);
  const [showWalletSelector, setShowWalletSelector] = useState(false);

  // Detect available wallets (Phantom and OKX only)
  const detectWallets = useCallback(() => {
    const wallets: WalletInfo[] = [];

    // Check for Phantom
    const isPhantomInstalled = typeof window !== 'undefined' && 
      ((window as any).phantom?.solana?.isPhantom || (window as any).solana?.isPhantom);
    
    wallets.push({
      name: 'Phantom',
      icon: 'https://www.phantom.app/img/phantom-logo.svg',
      isInstalled: isPhantomInstalled,
      isConnected: connected && wallet?.adapter?.name === 'Phantom',
      connect: async () => {
        if (isPhantomInstalled) {
          setVisible(true); // Use the standard wallet modal for Phantom
        } else {
          window.open('https://phantom.app/', '_blank');
        }
      },
      downloadUrl: 'https://phantom.app/'
    });

    // Check for OKX
    const isOKXInstalled = typeof window !== 'undefined' && 
      (window as any).okxwallet?.solana;
    
    wallets.push({
      name: 'OKX Wallet',
      icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iOCIgZmlsbD0iIzAwMCIvPgo8cGF0aCBkPSJNMTIgOEgyMFYxNkgxMlY4WiIgZmlsbD0iI0ZGRiIvPgo8cGF0aCBkPSJNOCAxMkgxNlYyMEg4VjEyWiIgZmlsbD0iI0ZGRiIvPgo8cGF0aCBkPSJNMTYgMTZIMjRWMjRIMTZWMTZaIiBmaWxsPSIjRkZGIi8+Cjwvc3ZnPgo=',
      isInstalled: isOKXInstalled,
      isConnected: false, // OKX connection handled separately
      connect: async () => {
        if (isOKXInstalled) {
          await connectOKXWallet();
        } else {
          window.open('https://www.okx.com/web3', '_blank');
        }
      },
      downloadUrl: 'https://www.okx.com/web3'
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
        toast({
          title: "OKX Wallet Connected",
          description: `Connected to ${response.publicKey.slice(0, 8)}...${response.publicKey.slice(-8)}`,
        });
      }
    } catch (error) {
      console.error('OKX connection error:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to OKX Wallet. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    detectWallets();
    // Re-detect wallets periodically to catch installations
    const interval = setInterval(detectWallets, 3000);
    return () => clearInterval(interval);
  }, [detectWallets]);

  const handleDisconnect = async () => {
    try {
      await disconnect();
      toast({
        title: "Wallet Disconnected",
        description: "Successfully disconnected from wallet",
      });
    } catch (error) {
      console.error('Disconnect error:', error);
      toast({
        title: "Disconnect Failed",
        description: "Failed to disconnect wallet",
        variant: "destructive",
      });
    }
  };

  // If connected, show connected state
  if (connected && publicKey) {
    return (
      <div className="flex items-center space-x-2">
        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
          <CheckCircle className="w-3 h-3 mr-1" />
          Connected
        </Badge>
        <Button
          variant="outline"
          size={size}
          onClick={handleDisconnect}
          className={className}
        >
          <Wallet className="w-4 h-4 mr-2" />
          {publicKey.toString().slice(0, 8)}...
        </Button>
      </div>
    );
  }

  // If connecting, show loading state
  if (connecting) {
    return (
      <Button
        variant={variant}
        size={size}
        disabled
        className={className}
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
        size={size}
        onClick={() => setShowWalletSelector(true)}
        className={className}
      >
        <Wallet className="w-4 h-4 mr-2" />
        Connect Wallet
      </Button>

      {showWalletSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="glass-card w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-foreground">Connect Solana Wallet</CardTitle>
              <CardDescription className="text-muted-foreground">
                Choose your preferred wallet (limited to Phantom and OKX)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {availableWallets.map((walletInfo) => (
                <div
                  key={walletInfo.name}
                  className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <img 
                      src={walletInfo.icon} 
                      alt={walletInfo.name}
                      className="w-8 h-8 rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iNCIgZmlsbD0iI0Y5RkFGQiIvPgo8cGF0aCBkPSJNMTYgOEMxMi42ODYgOCAxMCAxMC42ODYgMTAgMTRDMTAgMTcuMzE0IDEyLjY4NiAyMCAxNiAyMEMxOS4zMTQgMjAgMjIgMTcuMzE0IDIyIDE0QzIyIDEwLjY4NiAxOS4zMTQgOCAxNiA4WiIgZmlsbD0iIzk5QTJBOCIvPgo8L3N2Zz4K';
                      }}
                    />
                    <div>
                      <p className="font-medium text-foreground">{walletInfo.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {walletInfo.isInstalled ? 'Installed' : 'Not installed'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {walletInfo.isConnected && (
                      <Badge variant="outline" className="text-green-500 border-green-500">
                        Connected
                      </Badge>
                    )}
                    {!walletInfo.isInstalled ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(walletInfo.downloadUrl, '_blank')}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Install
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => {
                          walletInfo.connect();
                          setShowWalletSelector(false);
                        }}
                        disabled={walletInfo.isConnected}
                      >
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              
              <div className="pt-4 border-t border-border">
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
