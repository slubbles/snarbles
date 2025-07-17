'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Smartphone, 
  Download, 
  ExternalLink, 
  Wifi, 
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  isMobile, 
  isIOS, 
  isAndroid, 
  isPhantomMobileBrowser, 
  isPeraMobileBrowser,
  shouldUseMobileFlow,
  attemptMobileWalletConnection,
  PHANTOM_APP_STORE_LINKS,
  PERA_APP_STORE_LINKS
} from '@/lib/mobile-wallet-utils';

interface MobileWalletButtonProps {
  walletType: 'phantom' | 'pera';
  onConnect?: () => void;
  onError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
}

export function MobileWalletButton({
  walletType,
  onConnect,
  onError,
  className = '',
  disabled = false
}: MobileWalletButtonProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionMethod, setConnectionMethod] = useState<'extension' | 'mobile' | 'unknown'>('unknown');
  const [walletDetected, setWalletDetected] = useState(false);
  const { toast } = useToast();

  const walletConfig = {
    phantom: {
      name: 'Phantom',
      icon: '👻',
      color: 'from-purple-500 to-indigo-500',
      description: 'Solana wallet for web and mobile',
      appStoreLinks: PHANTOM_APP_STORE_LINKS,
      deepLinkSupported: true
    },
    pera: {
      name: 'Pera Wallet',
      icon: '🔷',
      color: 'from-blue-500 to-cyan-500',
      description: 'Official Algorand wallet',
      appStoreLinks: PERA_APP_STORE_LINKS,
      deepLinkSupported: true
    }
  };

  const config = walletConfig[walletType];

  // Detect wallet availability
  useEffect(() => {
    const detectWallet = () => {
      if (typeof window === 'undefined') return;

      if (walletType === 'phantom') {
        const phantomDetected = !!(window as any).phantom?.solana;
        setWalletDetected(phantomDetected);
        
        if (phantomDetected) {
          setConnectionMethod(isMobile() ? 'mobile' : 'extension');
        } else {
          setConnectionMethod(isMobile() ? 'mobile' : 'extension');
        }
      } else if (walletType === 'pera') {
        const peraDetected = !!(window as any).algorand || !!(window as any).PeraWalletConnect;
        setWalletDetected(peraDetected);
        
        if (peraDetected) {
          setConnectionMethod(isMobile() ? 'mobile' : 'extension');
        } else {
          setConnectionMethod(isMobile() ? 'mobile' : 'extension');
        }
      }
    };

    detectWallet();
    
    // Re-check when window regains focus (user returns from app store)
    const handleFocus = () => {
      setTimeout(detectWallet, 1000);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [walletType]);

  const handleMobileConnect = useCallback(async () => {
    if (disabled || isConnecting) return;

    setIsConnecting(true);

    try {
      if (connectionMethod === 'mobile' && shouldUseMobileFlow(walletType)) {
        // Mobile deep link flow
        toast({
          title: "Opening Wallet App",
          description: `Redirecting to ${config.name} mobile app...`,
          duration: 3000,
        });

        const result = await attemptMobileWalletConnection(walletType, true);
        
        if (result.success) {
          // Connection attempt was made - the rest happens in the wallet app
          console.log(`✅ Successfully initiated ${config.name} mobile connection`);
          onConnect?.();
        } else {
          throw new Error(result.error || 'Failed to connect to mobile wallet');
        }
      } else {
        // Standard web extension flow
        onConnect?.();
      }
    } catch (error: any) {
      console.error(`❌ ${config.name} mobile connection failed:`, error);
      
      const errorMessage = error.message || `Failed to connect to ${config.name}`;
      onError?.(errorMessage);
      
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsConnecting(false);
    }
  }, [walletType, connectionMethod, config.name, disabled, isConnecting, onConnect, onError, toast]);

  const handleInstallWallet = useCallback(() => {
    const appStoreLink = isIOS() 
      ? config.appStoreLinks.ios 
      : config.appStoreLinks.android;
    
    window.open(appStoreLink, '_blank');
    
    toast({
      title: "Installing Wallet",
      description: `Opening ${config.name} in the app store...`,
      duration: 3000,
    });
  }, [config.appStoreLinks, config.name, toast]);

  const renderConnectionMethod = () => {
    if (connectionMethod === 'mobile') {
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium">Mobile Connection</span>
          </div>
          
          {walletDetected ? (
            <Alert className="border-green-500/50 bg-green-500/10">
              <CheckCircle className="w-4 h-4" />
              <AlertDescription>
                {config.name} app detected. Click connect to open the wallet.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-orange-500/50 bg-orange-500/10">
              <Download className="w-4 h-4" />
              <AlertDescription className="space-y-2">
                <div>{config.name} app not detected.</div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleInstallWallet}
                  className="h-8 px-3"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Install {config.name}
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Wifi className="w-4 h-4 text-purple-500" />
          <span className="text-sm font-medium">Browser Extension</span>
        </div>
        
        {walletDetected ? (
          <Badge className="bg-green-500/10 text-green-700 border-green-500/20">
            {config.name} Extension Detected
          </Badge>
        ) : (
          <Badge className="bg-orange-500/10 text-orange-700 border-orange-500/20">
            {config.name} Extension Required
          </Badge>
        )}
      </div>
    );
  };

  return (
    <Card className={`border-2 transition-all duration-200 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center text-white text-xl`}>
              {config.icon}
            </div>
            <div>
              <CardTitle className="text-lg">{config.name}</CardTitle>
              <CardDescription className="text-sm">
                {config.description}
              </CardDescription>
            </div>
          </div>
          
          {isMobile() && (
            <Badge variant="outline" className="text-xs">
              <Smartphone className="w-3 h-3 mr-1" />
              Mobile
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {renderConnectionMethod()}
        
        <Button
          onClick={handleMobileConnect}
          disabled={disabled || isConnecting}
          className={`w-full bg-gradient-to-r ${config.color} hover:opacity-90 text-white font-medium`}
        >
          {isConnecting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              Connect {config.name}
              {connectionMethod === 'mobile' && <ExternalLink className="w-4 h-4 ml-2" />}
            </>
          )}
        </Button>
        
        {connectionMethod === 'mobile' && (
          <p className="text-xs text-muted-foreground text-center">
            This will open the {config.name} app. Return to this page after connecting.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default MobileWalletButton;
