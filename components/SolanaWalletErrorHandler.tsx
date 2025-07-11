'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletError } from '@solana/wallet-adapter-base';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertTriangle, 
  RefreshCw, 
  ExternalLink, 
  CheckCircle, 
  XCircle, 
  Download,
  Wifi,
  Shield,
  HelpCircle,
  Zap,
  Globe
} from 'lucide-react';

interface SolanaWalletErrorHandlerProps {
  children: React.ReactNode;
}

interface WalletStatus {
  isDetected: boolean;
  isInstalled: boolean;
  isConnected: boolean;
  error: string | null;
  needsInstall: boolean;
}

interface WalletProviderInfo {
  name: string;
  icon: string;
  installUrl: string;
  chromeExtensionId?: string;
  firefoxAddonId?: string;
  description: string;
}

const WALLET_PROVIDERS: Record<string, WalletProviderInfo> = {
  phantom: {
    name: 'Phantom',
    icon: '👻',
    installUrl: 'https://phantom.app/',
    chromeExtensionId: 'bfnaelmomeimhlpmgjnjophhpkkoljpa',
    description: 'The leading Solana wallet for DeFi & NFTs'
  },
  solflare: {
    name: 'Solflare',
    icon: '🔥',
    installUrl: 'https://solflare.com/',
    chromeExtensionId: 'bhhhlbepdkbapadjdnnojkbgioiodbic',
    description: 'Secure Solana wallet for web and mobile'
  },
  backpack: {
    name: 'Backpack',
    icon: '🎒',
    installUrl: 'https://backpack.app/',
    description: 'The crypto super app and wallet'
  },
  sollet: {
    name: 'Sollet',
    icon: '💼',
    installUrl: 'https://www.sollet.io/',
    description: 'Web-based Solana wallet'
  }
};

export function SolanaWalletErrorHandler({ children }: SolanaWalletErrorHandlerProps) {
  const { wallets, wallet, connected, connecting, disconnecting } = useWallet();
  const [walletStatuses, setWalletStatuses] = useState<Record<string, WalletStatus>>({});
  const [showDetailed, setShowDetailed] = useState(false);
  const [lastError, setLastError] = useState<WalletError | null>(null);
  const { toast } = useToast();

  // Detect wallet availability
  useEffect(() => {
    const detectWallets = () => {
      const statuses: Record<string, WalletStatus> = {};

      wallets.forEach(walletAdapter => {
        const walletName = walletAdapter.adapter.name.toLowerCase();
        let isDetected = false;
        let isInstalled = false;
        let needsInstall = false;

        try {
          // Check if wallet is available
          isDetected = walletAdapter.adapter.readyState === 'Installed';
          isInstalled = isDetected;

          // Additional checks for specific wallets
          if (typeof window !== 'undefined') {
            switch (walletName) {
              case 'phantom':
                isDetected = !!(window as any).phantom?.solana;
                isInstalled = isDetected;
                break;
              case 'solflare':
                isDetected = !!(window as any).solflare;
                isInstalled = isDetected;
                break;
              case 'backpack':
                isDetected = !!(window as any).backpack;
                isInstalled = isDetected;
                break;
            }
          }

          needsInstall = !isInstalled && walletAdapter.adapter.readyState === 'NotDetected';

        } catch (error) {
          console.warn(`Error detecting ${walletName}:`, error);
        }

        statuses[walletName] = {
          isDetected,
          isInstalled,
          isConnected: connected && wallet?.adapter.name === walletAdapter.adapter.name,
          error: null,
          needsInstall
        };
      });

      setWalletStatuses(statuses);
    };

    detectWallets();
    
    // Re-detect periodically
    const interval = setInterval(detectWallets, 5000);
    
    // Listen for wallet changes
    const handleStorage = () => detectWallets();
    window.addEventListener('storage', handleStorage);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
    };
  }, [wallets, wallet, connected]);

  // Handle wallet errors
  useEffect(() => {
    const handleError = (error: WalletError) => {
      setLastError(error);
      
      let errorMessage = 'Wallet connection failed';
      let actionable = false;

      switch (error.name) {
        case 'WalletNotFoundError':
          errorMessage = 'Wallet not found. Please install a Solana wallet extension.';
          actionable = true;
          break;
        case 'WalletNotInstalledError':
          errorMessage = 'Wallet extension not installed. Please install and refresh the page.';
          actionable = true;
          break;
        case 'WalletNotReadyError':
          errorMessage = 'Wallet is not ready. Please unlock your wallet and try again.';
          actionable = true;
          break;
        case 'WalletConnectionError':
          errorMessage = 'Failed to connect to wallet. Please check your wallet settings.';
          actionable = true;
          break;
        case 'WalletDisconnectedError':
          errorMessage = 'Wallet was disconnected. Please reconnect to continue.';
          actionable = true;
          break;
        case 'WalletSignTransactionError':
          errorMessage = 'Transaction signature was cancelled or failed.';
          break;
        default:
          errorMessage = error.message || 'An unknown wallet error occurred.';
      }

      toast({
        title: "Wallet Error",
        description: errorMessage,
        variant: "destructive",
        duration: actionable ? 6000 : 4000,
      });
    };

    // Error handling would be implemented based on wallet provider events
    // This is a placeholder for the error handling logic
  }, [toast]);

  const getWalletStatusIcon = (status: WalletStatus) => {
    if (status.isConnected) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (status.isDetected) return <Zap className="w-4 h-4 text-blue-500" />;
    if (status.needsInstall) return <Download className="w-4 h-4 text-orange-500" />;
    return <XCircle className="w-4 h-4 text-gray-400" />;
  };

  const getWalletStatusText = (status: WalletStatus) => {
    if (status.isConnected) return 'Connected';
    if (status.isDetected) return 'Ready';
    if (status.needsInstall) return 'Install Required';
    return 'Not Available';
  };

  const getWalletStatusColor = (status: WalletStatus) => {
    if (status.isConnected) return 'bg-green-500/10 text-green-700 border-green-500/20';
    if (status.isDetected) return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
    if (status.needsInstall) return 'bg-orange-500/10 text-orange-700 border-orange-500/20';
    return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
  };

  const openWalletInstallPage = (walletName: string) => {
    const provider = WALLET_PROVIDERS[walletName.toLowerCase()];
    if (provider) {
      window.open(provider.installUrl, '_blank');
    }
  };

  const refreshWalletDetection = () => {
    window.location.reload();
  };

  const getNetworkStatus = () => {
    // Simple network connectivity check
    return navigator.onLine;
  };

  const installedWallets = Object.entries(walletStatuses).filter(([_, status]) => status.isDetected);
  const availableWallets = Object.entries(walletStatuses).filter(([_, status]) => status.needsInstall);

  return (
    <div className="wallet-error-handler">
      {children}
      
      {/* Wallet Status Debug Panel - Only show if there are issues or in development */}
      {(process.env.NODE_ENV === 'development' || Object.values(walletStatuses).some(s => s.error) || showDetailed) && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm">
          <Card className="shadow-lg border-orange-500/20 bg-orange-50/10 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Wallet Status</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetailed(!showDetailed)}
                  className="h-6 w-6 p-0"
                >
                  <HelpCircle className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {/* Network Status */}
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  Network
                </span>
                <Badge variant={getNetworkStatus() ? 'default' : 'destructive'} className="h-4 text-xs">
                  {getNetworkStatus() ? 'Online' : 'Offline'}
                </Badge>
              </div>

              {/* Installed Wallets */}
              {installedWallets.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-green-700">Detected Wallets:</div>
                  {installedWallets.map(([name, status]) => (
                    <div key={name} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1">
                        {getWalletStatusIcon(status)}
                        {WALLET_PROVIDERS[name]?.name || name}
                      </span>
                      <Badge className={`h-4 text-xs ${getWalletStatusColor(status)}`}>
                        {getWalletStatusText(status)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              {/* Missing Wallets */}
              {availableWallets.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-orange-700">Install Recommended:</div>
                  {availableWallets.slice(0, 2).map(([name, status]) => (
                    <div key={name} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1">
                        <Download className="w-3 h-3 text-orange-500" />
                        {WALLET_PROVIDERS[name]?.name || name}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openWalletInstallPage(name)}
                        className="h-5 px-2 text-xs"
                      >
                        Install
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t border-orange-500/20">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={refreshWalletDetection}
                  className="h-6 px-2 text-xs flex-1"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Refresh
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open('/support', '_blank')}
                  className="h-6 px-2 text-xs flex-1"
                >
                  <HelpCircle className="w-3 h-3 mr-1" />
                  Help
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Connection Status Indicator */}
      {connecting && (
        <div className="fixed top-4 right-4 z-50">
          <Alert className="border-blue-500/50 bg-blue-500/10">
            <Zap className="w-4 h-4 animate-pulse" />
            <AlertDescription>
              Connecting to wallet...
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Error Alert */}
      {lastError && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
          <Alert variant="destructive" className="shadow-lg">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription className="space-y-2">
              <div>{lastError.message}</div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setLastError(null)}
                  className="h-6 px-2 text-xs"
                >
                  Dismiss
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open('/support#wallet-issues', '_blank')}
                  className="h-6 px-2 text-xs"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Get Help
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}

export default SolanaWalletErrorHandler; 