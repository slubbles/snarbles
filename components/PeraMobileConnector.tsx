'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  Globe,
  QrCode
} from 'lucide-react';
import { 
  isMobile, 
  isIOS, 
  isPeraMobileBrowser, 
  shouldUseMobileFlow,
  attemptMobileWalletConnection,
  PERA_APP_STORE_LINKS,
  getCurrentPageUrl
} from '@/lib/mobile-wallet-utils';
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider';

interface PeraMobileConnectorProps {
  onConnectionChange?: (connected: boolean, address?: string) => void;
  className?: string;
}

export function PeraMobileConnector({
  onConnectionChange,
  className = ''
}: PeraMobileConnectorProps) {
  const {
    connected,
    address,
    connect,
    disconnect,
    isConnecting,
    isPeraWalletReady,
    error,
    selectedNetwork,
    networkConfig
  } = useAlgorandWallet();
  
  const { toast } = useToast();
  
  const [isPeraDetected, setIsPeraDetected] = useState(false);
  const [connectionMethod, setConnectionMethod] = useState<'extension' | 'mobile' | 'in-app' | 'qr'>('extension');
  const [isMobileEnvironment, setIsMobileEnvironment] = useState(false);
  const [isMobileConnecting, setIsMobileConnecting] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  
  // Detect environment and wallet availability
  useEffect(() => {
    const detectEnvironment = () => {
      if (typeof window === 'undefined') return;

      const mobile = isMobile();
      const peraDetected = !!(window as any).algorand || !!(window as any).PeraWalletConnect;
      const inPeraApp = isPeraMobileBrowser();
      
      setIsMobileEnvironment(mobile);
      setIsPeraDetected(peraDetected);
      
      if (inPeraApp) {
        setConnectionMethod('in-app');
      } else if (mobile) {
        // On mobile, prefer QR code for better UX
        setConnectionMethod('qr');
      } else {
        setConnectionMethod('extension');
      }
      
      console.log('🔍 Pera Environment Detection:', {
        mobile,
        peraDetected,
        inPeraApp,
        connectionMethod: inPeraApp ? 'in-app' : mobile ? 'qr' : 'extension'
      });
    };

    detectEnvironment();
    
    // Re-check when window regains focus (user returns from Pera app)
    const handleFocus = () => {
      setTimeout(detectEnvironment, 1000);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Handle connection change events
  useEffect(() => {
    onConnectionChange?.(connected, address || undefined);
  }, [connected, address, onConnectionChange]);

  const handlePeraConnect = useCallback(async () => {
    if (isMobileConnecting || isConnecting || connected) return;

    setIsMobileConnecting(true);

    try {
      if (connectionMethod === 'mobile' && shouldUseMobileFlow('pera')) {
        // Mobile deep link flow
        toast({
          title: "Opening Pera Wallet",
          description: "Redirecting to Pera Wallet mobile app...",
          duration: 3000,
        });

        const result = await attemptMobileWalletConnection('pera', true);
        
        if (result.success) {
          // Store connection attempt for when user returns
          localStorage.setItem('pera_mobile_connection_attempt', Date.now().toString());
          console.log('✅ Successfully initiated Pera mobile connection');
        } else {
          throw new Error(result.error || 'Failed to open Pera app');
        }
      } else if (connectionMethod === 'qr') {
        // QR code flow for mobile
        toast({
          title: "QR Code Connection",
          description: "Scan the QR code with your Pera Wallet app",
          duration: 5000,
        });
        
        // Generate QR code URL for WalletConnect
        const currentUrl = getCurrentPageUrl();
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(currentUrl)}`;
        setQrCodeUrl(qrUrl);
        
        // Still try the standard connection - Pera will handle the QR flow
        await connect();
      } else if (connectionMethod === 'in-app') {
        // Direct connection in Pera's in-app browser
        console.log('🔗 Connecting directly in Pera in-app browser');
        
        // Special handling for Pera wallet app browser to prevent "no internet" errors
        try {
          // Add a small delay to ensure the app browser is ready
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Check if we have internet connectivity in the app browser
          if (!navigator.onLine) {
            throw new Error('No internet connection detected. Please check your connection and try again.');
          }
          
          await connect();
        } catch (connectError: any) {
          if (connectError.message.includes('internet') || connectError.message.includes('network')) {
            throw new Error('Connection failed due to network issues. Please ensure you have a stable internet connection and try again.');
          }
          throw connectError;
        }
      } else {
        // Standard extension/web flow
        console.log('🔗 Using standard Pera wallet connection');
        await connect();
      }
    } catch (error: any) {
      console.error('❌ Pera connection failed:', error);
      
      let errorMessage = error.message || 'Failed to connect to Pera Wallet';
      
      // Enhanced error messages for common issues
      if (errorMessage.includes('internet') || errorMessage.includes('network')) {
        errorMessage = 'Network connection error. Please check your internet connection and try again.';
      } else if (errorMessage.includes('cancelled') || errorMessage.includes('rejected')) {
        errorMessage = 'Connection cancelled by user.';
      } else if (errorMessage.includes('timeout')) {
        errorMessage = 'Connection timed out. Please try again.';
      }
      
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsMobileConnecting(false);
    }
  }, [
    isMobileConnecting,
    isConnecting,
    connected,
    connectionMethod,
    connect,
    toast
  ]);

  const handleDisconnect = useCallback(async () => {
    try {
      await disconnect();
      setQrCodeUrl(null);
      toast({
        title: "Pera Wallet Disconnected",
        description: "Successfully disconnected from Pera Wallet",
        duration: 2000,
      });
    } catch (error: any) {
      console.error('❌ Pera disconnect failed:', error);
      toast({
        title: "Disconnect Failed",
        description: error.message || 'Failed to disconnect from Pera Wallet',
        variant: "destructive",
        duration: 3000,
      });
    }
  }, [disconnect, toast]);

  const handleInstallPera = useCallback(() => {
    const appStoreLink = isIOS() 
      ? PERA_APP_STORE_LINKS.ios 
      : PERA_APP_STORE_LINKS.android;
    
    window.open(appStoreLink, '_blank');
    
    toast({
      title: "Installing Pera Wallet",
      description: "Opening Pera Wallet in the app store...",
      duration: 3000,
    });
  }, [toast]);

  // Check for returning users from mobile app
  useEffect(() => {
    const checkMobileReturn = () => {
      const connectionAttempt = localStorage.getItem('pera_mobile_connection_attempt');
      if (connectionAttempt) {
        const attemptTime = parseInt(connectionAttempt);
        const now = Date.now();
        
        // If user returned within 5 minutes, check for wallet connection
        if (now - attemptTime < 300000) {
          console.log('🔄 User returned from Pera app, checking connection...');
          
          // Clear the stored attempt
          localStorage.removeItem('pera_mobile_connection_attempt');
          
          // Check if wallet is now connected
          setTimeout(() => {
            if (connected) {
              toast({
                title: "Pera Wallet Connected",
                description: "Successfully connected via Pera mobile app",
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
            <span className="text-sm font-medium text-green-700">Connected to Pera Wallet</span>
          </div>
          
          <div className="text-sm text-muted-foreground">
            {address?.slice(0, 8)}...{address?.slice(-6)}
          </div>
          
          <Button
            onClick={handleDisconnect}
            variant="outline"
            size="sm"
            className="w-full"
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
            <Globe className="w-4 h-4 text-blue-500" />
          ) : connectionMethod === 'qr' ? (
            <QrCode className="w-4 h-4 text-blue-500" />
          ) : (
            <Wifi className="w-4 h-4 text-blue-500" />
          )}
          <span className="text-sm font-medium">
            {connectionMethod === 'mobile' ? 'Mobile App' : 
             connectionMethod === 'in-app' ? 'In-App Browser' : 
             connectionMethod === 'qr' ? 'QR Code' :
             'Browser Extension'}
          </span>
        </div>
        
        {connectionMethod === 'mobile' && !isPeraDetected && (
          <Alert className="border-orange-500/50 bg-orange-500/10">
            <Download className="w-4 h-4" />
            <AlertDescription className="space-y-2">
              <div>Pera Wallet app not detected.</div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleInstallPera}
                className="h-8 px-3"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Install Pera Wallet
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        {connectionMethod === 'qr' && qrCodeUrl && (
          <div className="flex flex-col items-center space-y-2">
            <img 
              src={qrCodeUrl} 
              alt="QR Code for Pera Wallet" 
              className="w-32 h-32 border rounded-lg"
            />
            <p className="text-xs text-center text-muted-foreground">
              Scan with Pera Wallet app
            </p>
          </div>
        )}
        
        {error && (
          <Alert className="border-red-500/50 bg-red-500/10">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription className="text-sm">
              {error}
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  return (
    <Card className={`border-2 border-blue-500/20 transition-all duration-200 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xl">
              🔷
            </div>
            <div>
              <CardTitle className="text-lg">Pera Wallet</CardTitle>
              <CardDescription className="text-sm">
                Official Algorand wallet
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
            onClick={handlePeraConnect}
            disabled={isMobileConnecting || isConnecting || !isPeraWalletReady}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-90 text-white font-medium"
          >
            {isMobileConnecting || isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                Connect Pera Wallet
                {connectionMethod === 'mobile' && <ExternalLink className="w-4 h-4 ml-2" />}
                {connectionMethod === 'qr' && <QrCode className="w-4 h-4 ml-2" />}
              </>
            )}
          </Button>
        )}
        
        {connectionMethod === 'mobile' && !connected && (
          <p className="text-xs text-muted-foreground text-center">
            This will open the Pera Wallet app. Return to this page after connecting.
          </p>
        )}
        
        {connectionMethod === 'qr' && !connected && !qrCodeUrl && (
          <p className="text-xs text-muted-foreground text-center">
            A QR code will appear for mobile wallet connection.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default PeraMobileConnector;
