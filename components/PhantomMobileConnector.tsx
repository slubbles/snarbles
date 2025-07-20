'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Smartphone, 
  Download, 
  ExternalLink, 
  CheckCircle,
  Loader2,
  AlertTriangle,
  Wifi,
  Globe
} from 'lucide-react';
import { 
  isMobile, 
  isIOS, 
  isPhantomMobileBrowser, 
  shouldUseMobileFlow,
  attemptMobileWalletConnection,
  PHANTOM_APP_STORE_LINKS,
  getCurrentPageUrl
} from '@/lib/mobile-wallet-utils';

interface PhantomMobileConnectorProps {
  onConnectionChange?: (connected: boolean) => void;
  className?: string;
}

export function PhantomMobileConnector({
  onConnectionChange,
  className = ''
}: PhantomMobileConnectorProps) {
  const { 
    wallet, 
    wallets, 
    publicKey, 
    connected, 
    connecting, 
    connect,
    disconnect,
    select 
  } = useWallet();
  
  const { setVisible } = useWalletModal();
  const { toast } = useToast();
  
  const [isPhantomDetected, setIsPhantomDetected] = useState(false);
  const [connectionMethod, setConnectionMethod] = useState<'extension' | 'mobile' | 'in-app'>('extension');
  const [isMobileEnvironment, setIsMobileEnvironment] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Detect environment and wallet availability
  useEffect(() => {
    const detectEnvironment = () => {
      if (typeof window === 'undefined') return;

      const mobile = isMobile();
      const phantomDetected = !!(window as any).phantom?.solana;
      const inPhantomApp = isPhantomMobileBrowser();
      
      setIsMobileEnvironment(mobile);
      setIsPhantomDetected(phantomDetected);
      
      if (inPhantomApp) {
        setConnectionMethod('in-app');
      } else if (mobile) {
        setConnectionMethod('mobile');
      } else {
        setConnectionMethod('extension');
      }
      
      console.log('🔍 Phantom Environment Detection:', {
        mobile,
        phantomDetected,
        inPhantomApp,
        connectionMethod: inPhantomApp ? 'in-app' : mobile ? 'mobile' : 'extension'
      });
    };

    detectEnvironment();
    
    // Re-check when window regains focus (user returns from Phantom app)
    const handleFocus = () => {
      setTimeout(detectEnvironment, 1000);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Handle connection change events
  useEffect(() => {
    onConnectionChange?.(connected);
  }, [connected, onConnectionChange]);

  const handlePhantomConnect = useCallback(async () => {
    if (isConnecting || connecting || connected) return;

    setIsConnecting(true);

    try {
      if (connectionMethod === 'mobile' && shouldUseMobileFlow('phantom')) {
        // Mobile deep link flow
        toast({
          title: "Opening Phantom App",
          description: "Redirecting to Phantom mobile app...",
          duration: 3000,
        });

        const result = await attemptMobileWalletConnection('phantom', true);
        
        if (result.success) {
          // Store connection attempt for when user returns
          localStorage.setItem('phantom_mobile_connection_attempt', Date.now().toString());
          console.log('✅ Successfully initiated Phantom mobile connection');
          
          // The actual connection will happen when the user returns from the app
          // We'll check for this in the focus handler
        } else {
          throw new Error(result.error || 'Failed to open Phantom app');
        }
      } else if (connectionMethod === 'in-app') {
        // Direct connection in Phantom's in-app browser
        console.log('🔗 Connecting directly in Phantom in-app browser');
        
        // Find and select Phantom wallet
        const phantomWallet = wallets.find(w => w.adapter.name === 'Phantom');
        if (phantomWallet) {
          select(phantomWallet.adapter.name);
          await new Promise(resolve => setTimeout(resolve, 100));
          await connect();
        } else {
          throw new Error('Phantom wallet not found');
        }
      } else {
        // Standard extension flow
        console.log('🔗 Using standard wallet selection modal');
        
        if (isPhantomDetected) {
          const phantomWallet = wallets.find(w => w.adapter.name === 'Phantom');
          if (phantomWallet) {
            select(phantomWallet.adapter.name);
            await new Promise(resolve => setTimeout(resolve, 100));
            await connect();
          } else {
            setVisible(true);
          }
        } else {
          setVisible(true);
        }
      }
    } catch (error: any) {
      console.error('❌ Phantom connection failed:', error);
      
      const errorMessage = error.message || 'Failed to connect to Phantom';
      
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsConnecting(false);
    }
  }, [
    isConnecting,
    connecting,
    connected,
    connectionMethod,
    isPhantomDetected,
    wallets,
    select,
    connect,
    setVisible,
    toast
  ]);

  const handleDisconnect = useCallback(async () => {
    try {
      await disconnect();
      toast({
        title: "Phantom Disconnected",
        description: "Successfully disconnected from Phantom",
        duration: 2000,
      });
    } catch (error: any) {
      console.error('❌ Phantom disconnect failed:', error);
      toast({
        title: "Disconnect Failed",
        description: error.message || 'Failed to disconnect from Phantom',
        variant: "destructive",
        duration: 3000,
      });
    }
  }, [disconnect, toast]);

  const handleInstallPhantom = useCallback(() => {
    const appStoreLink = isIOS() 
      ? PHANTOM_APP_STORE_LINKS.ios 
      : PHANTOM_APP_STORE_LINKS.android;
    
    window.open(appStoreLink, '_blank');
    
    toast({
      title: "Installing Phantom",
      description: "Opening Phantom in the app store...",
      duration: 3000,
    });
  }, [toast]);

  // Check for returning users from mobile app
  useEffect(() => {
    const checkMobileReturn = () => {
      const connectionAttempt = localStorage.getItem('phantom_mobile_connection_attempt');
      if (connectionAttempt) {
        const attemptTime = parseInt(connectionAttempt);
        const now = Date.now();
        
        // If user returned within 5 minutes, check for wallet connection
        if (now - attemptTime < 300000) {
          console.log('🔄 User returned from Phantom app, checking connection...');
          
          // Clear the stored attempt
          localStorage.removeItem('phantom_mobile_connection_attempt');
          
          // Check if wallet is now connected
          setTimeout(() => {
            if (connected) {
              toast({
                title: "Phantom Connected",
                description: "Successfully connected via Phantom mobile app",
                duration: 3000,
              });
            }
          }, 1000);
        }
      }
    };

    if (isMobileEnvironment) {
      checkMobileReturn();
    }
  }, [connected, isMobileEnvironment, toast]);

  const renderConnectionStatus = () => {
    if (connected) {
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium text-green-700">Connected to Phantom</span>
          </div>
          
          <div className="text-sm text-muted-foreground">
            {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-6)}
          </div>
          
          <Button
            onClick={handleDisconnect}
            variant="outline"
            size="sm"
            className="w-full"
            data-testid="phantom-disconnect"
          >
            Disconnect
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {connectionMethod === 'mobile' ? (
            <Smartphone className="w-4 h-4 text-blue-500" />
          ) : connectionMethod === 'in-app' ? (
            <Globe className="w-4 h-4 text-purple-500" />
          ) : (
            <Wifi className="w-4 h-4 text-purple-500" />
          )}
          <span className="text-sm font-medium">
            {connectionMethod === 'mobile' ? 'Mobile App' : 
             connectionMethod === 'in-app' ? 'In-App Browser' : 
             'Browser Extension'}
          </span>
        </div>
        
        {connectionMethod === 'mobile' && !isPhantomDetected && (
          <Alert className="border-orange-500/50 bg-orange-500/10">
            <Download className="w-4 h-4" />
            <AlertDescription className="space-y-2">
              <div>Phantom app not detected.</div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleInstallPhantom}
                className="h-8 px-3"
                data-testid="install-phantom"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Install Phantom
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  return (
    <Card className={`border-2 border-purple-500/20 transition-all duration-200 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-xl">
              👻
            </div>
            <div>
              <CardTitle className="text-lg">Phantom Wallet</CardTitle>
              <CardDescription className="text-sm">
                Solana wallet for web and mobile
              </CardDescription>
            </div>
          </div>
          
          {isMobileEnvironment && (
            <Badge variant="outline" className="text-xs">
              <Smartphone className="w-3 h-3 mr-1" />
              Mobile
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {renderConnectionStatus()}
        
        {!connected && (
          <Button
            onClick={handlePhantomConnect}
            disabled={isConnecting || connecting}
            className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:opacity-90 text-white font-medium"
            data-testid="phantom-connect-mobile"
          >
            {isConnecting || connecting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                Connect Phantom
                {connectionMethod === 'mobile' && <ExternalLink className="w-4 h-4 ml-2" />}
              </>
            )}
          </Button>
        )}
        
        {connectionMethod === 'mobile' && !connected && (
          <p className="text-xs text-muted-foreground text-center">
            This will open the Phantom app. Return to this page after connecting.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default PhantomMobileConnector;
