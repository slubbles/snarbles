'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Smartphone, 
  Wifi, 
  Globe, 
  Settings, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { isMobile, isIOS, isAndroid } from '@/lib/mobile-wallet-utils';
import PhantomMobileConnector from '@/components/PhantomMobileConnector';
import PeraMobileConnector from '@/components/PeraMobileConnector';
import { useToast } from '@/hooks/use-toast';

interface MobileWalletManagerProps {
  onConnectionChange?: (walletType: 'phantom' | 'pera' | null, connected: boolean, address?: string) => void;
  className?: string;
  showAdvanced?: boolean;
}

export function MobileWalletManager({
  onConnectionChange,
  className = '',
  showAdvanced = false
}: MobileWalletManagerProps) {
  const [activeWallet, setActiveWallet] = useState<'phantom' | 'pera' | null>(null);
  const [connectionStates, setConnectionStates] = useState({
    phantom: { connected: false, address: undefined as string | undefined },
    pera: { connected: false, address: undefined as string | undefined }
  });
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [environmentInfo, setEnvironmentInfo] = useState({
    isMobile: false,
    isIOS: false,
    isAndroid: false,
    userAgent: '',
    screenSize: { width: 0, height: 0 }
  });
  
  const { toast } = useToast();

  // Detect environment
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateEnvironment = () => {
      setEnvironmentInfo({
        isMobile: isMobile(),
        isIOS: isIOS(),
        isAndroid: isAndroid(),
        userAgent: navigator.userAgent,
        screenSize: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      });
    };

    updateEnvironment();
    
    // Update on resize
    window.addEventListener('resize', updateEnvironment);
    return () => window.removeEventListener('resize', updateEnvironment);
  }, []);

  // Handle Phantom connection changes
  const handlePhantomConnectionChange = (connected: boolean) => {
    setConnectionStates(prev => ({
      ...prev,
      phantom: { connected, address: undefined }
    }));

    if (connected) {
      setActiveWallet('phantom');
      // Disconnect other wallets if connected
      if (connectionStates.pera.connected) {
        toast({
          title: "Wallet Switched",
          description: "Switched to Phantom wallet",
          duration: 3000,
        });
      }
    } else if (activeWallet === 'phantom') {
      setActiveWallet(null);
    }

    onConnectionChange?.('phantom', connected);
  };

  // Handle Pera connection changes
  const handlePeraConnectionChange = (connected: boolean, address?: string) => {
    setConnectionStates(prev => ({
      ...prev,
      pera: { connected, address }
    }));

    if (connected) {
      setActiveWallet('pera');
      // Disconnect other wallets if connected
      if (connectionStates.phantom.connected) {
        toast({
          title: "Wallet Switched",
          description: "Switched to Pera Wallet",
          duration: 3000,
        });
      }
    } else if (activeWallet === 'pera') {
      setActiveWallet(null);
    }

    onConnectionChange?.('pera', connected, address);
  };

  const getConnectionSummary = () => {
    const connectedWallets = Object.entries(connectionStates)
      .filter(([_, state]) => state.connected)
      .map(([name, _]) => name);

    if (connectedWallets.length === 0) {
      return "No wallets connected";
    }

    if (connectedWallets.length === 1) {
      return `Connected to ${connectedWallets[0]}`;
    }

    return `Multiple wallets connected (${connectedWallets.join(', ')})`;
  };

  const refreshConnections = () => {
    // Trigger a refresh of wallet connections
    window.location.reload();
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Mobile Environment Alert */}
      {environmentInfo.isMobile && (
        <Alert className="border-blue-500/50 bg-blue-500/10">
          <Smartphone className="w-4 h-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <strong>Mobile Environment Detected</strong>
                <p className="text-sm mt-1">
                  Using mobile-optimized wallet connection flow
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                {environmentInfo.isIOS ? 'iOS' : environmentInfo.isAndroid ? 'Android' : 'Mobile'}
              </Badge>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Connection Status Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Wallet Connection Status</CardTitle>
              <CardDescription>
                {getConnectionSummary()}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {showAdvanced && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDiagnostics(!showDiagnostics)}
                >
                  {showDiagnostics ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshConnections}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {showDiagnostics && (
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Environment:</strong>
                  <ul className="text-muted-foreground mt-1">
                    <li>Mobile: {environmentInfo.isMobile ? '✅' : '❌'}</li>
                    <li>iOS: {environmentInfo.isIOS ? '✅' : '❌'}</li>
                    <li>Android: {environmentInfo.isAndroid ? '✅' : '❌'}</li>
                  </ul>
                </div>
                <div>
                  <strong>Screen:</strong>
                  <ul className="text-muted-foreground mt-1">
                    <li>Width: {environmentInfo.screenSize.width}px</li>
                    <li>Height: {environmentInfo.screenSize.height}px</li>
                  </ul>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground">
                <strong>User Agent:</strong>
                <p className="break-all">{environmentInfo.userAgent}</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Wallet Connection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Phantom Wallet */}
        <PhantomMobileConnector 
          onConnectionChange={handlePhantomConnectionChange}
          className={activeWallet === 'phantom' ? 'ring-2 ring-purple-500' : ''}
        />

        {/* Pera Wallet */}
        <PeraMobileConnector 
          onConnectionChange={handlePeraConnectionChange}
          className={activeWallet === 'pera' ? 'ring-2 ring-blue-500' : ''}
        />
      </div>

      {/* Active Wallet Summary */}
      {activeWallet && (
        <Card className="border-green-500/50 bg-green-500/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="font-medium">
                  {activeWallet === 'phantom' ? 'Phantom Wallet' : 'Pera Wallet'} Connected
                </p>
                <p className="text-sm text-muted-foreground">
                  {activeWallet === 'phantom' ? 'Solana' : 'Algorand'} wallet ready for transactions
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mobile-specific Instructions */}
      {environmentInfo.isMobile && !activeWallet && (
        <Alert>
          <Smartphone className="w-4 h-4" />
          <AlertDescription>
            <strong>Mobile Wallet Connection Tips:</strong>
            <ul className="mt-2 text-sm space-y-1">
              <li>• Install the wallet app from your app store first</li>
              <li>• Tap "Connect" to open the wallet app</li>
              <li>• Approve the connection in the wallet app</li>
              <li>• Return to this page to continue</li>
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default MobileWalletManager;
