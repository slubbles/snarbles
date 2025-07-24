'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Smartphone, 
  Wifi, 
  AlertTriangle, 
  CheckCircle, 
  ExternalLink, 
  RefreshCw,
  Download
} from 'lucide-react';
import { detectMobileWalletEnvironment, validateMobileWalletForSolana } from '@/lib/solana-mobile-optimized';

interface SolanaMobileWalletManagerProps {
  onConnectionChange?: (connected: boolean) => void;
  showInstructions?: boolean;
  className?: string;
}

export default function SolanaMobileWalletManager({ 
  onConnectionChange, 
  showInstructions = true,
  className = '' 
}: SolanaMobileWalletManagerProps) {
  const { connected, publicKey, wallet, connecting, disconnecting } = useWallet();
  const [environment, setEnvironment] = useState<any>({});
  const [validation, setValidation] = useState<any>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    checkEnvironment();
  }, []);

  useEffect(() => {
    onConnectionChange?.(connected);
  }, [connected, onConnectionChange]);

  const checkEnvironment = () => {
    const env = detectMobileWalletEnvironment();
    const val = validateMobileWalletForSolana();
    setEnvironment(env);
    setValidation(val);
  };

  const openWalletApp = (walletType: 'phantom' | 'okx') => {
    const currentUrl = window.location.href;
    
    if (walletType === 'phantom') {
      if (environment.isMobile) {
        // Try to open Phantom app with deep link
        const phantomUrl = `https://phantom.app/ul/browse/${encodeURIComponent(currentUrl)}?ref=snarbles`;
        window.open(phantomUrl, '_blank');
      } else {
        window.open('https://phantom.app/', '_blank');
      }
    } else if (walletType === 'okx') {
      if (environment.isMobile) {
        // Try to open OKX app
        window.open('okx://wallet', '_blank');
      } else {
        window.open('https://www.okx.com/web3', '_blank');
      }
    }
  };

  const downloadWallet = (walletType: 'phantom' | 'okx') => {
    if (walletType === 'phantom') {
      if (environment.isMobile) {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const storeUrl = isIOS 
          ? 'https://apps.apple.com/us/app/phantom-solana-wallet/id1598432977'
          : 'https://play.google.com/store/apps/details?id=app.phantom';
        window.open(storeUrl, '_blank');
      } else {
        window.open('https://phantom.app/download', '_blank');
      }
    } else if (walletType === 'okx') {
      if (environment.isMobile) {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const storeUrl = isIOS 
          ? 'https://apps.apple.com/app/okx-buy-bitcoin-eth-crypto/id1327268470'
          : 'https://play.google.com/store/apps/details?id=com.okinc.okex.gp';
        window.open(storeUrl, '_blank');
      } else {
        window.open('https://www.okx.com/web3', '_blank');
      }
    }
  };

  if (!mounted) {
    return (
      <div className="animate-pulse">
        <div className="h-12 bg-gray-300 rounded"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Connection Status */}
      <Card className="snarbles-glass">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Smartphone className="w-5 h-5" />
            Solana Wallet Connection
            {connected ? (
              <Badge variant="default" className="bg-green-500 text-white">
                <CheckCircle className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary">
                <Wifi className="w-3 h-3 mr-1" />
                Not Connected
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Environment Info */}
          {environment.isMobile && (
            <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
              <Smartphone className="w-4 h-4" />
              <span>
                Mobile detected • {environment.walletApp ? `${environment.walletApp} wallet` : 'No wallet app'} 
                {environment.isInAppBrowser && ' • In-app browser'}
              </span>
            </div>
          )}

          {/* Connection Interface */}
          <div className="flex flex-col gap-3">
            {connected && publicKey ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <p className="font-medium text-green-800">Connected to Solana</p>
                    <p className="text-sm text-green-600">
                      {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}
                    </p>
                  </div>
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                
                <WalletMultiButton className="w-full snarbles-btn-outline" />
              </div>
            ) : (
              <div className="space-y-3">
                {/* Wallet Connection Button */}
                <WalletMultiButton className="w-full snarbles-btn-primary text-white" />
                
                {/* Mobile-specific issues */}
                {!validation.isReady && validation.issues.length > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="space-y-2">
                      <p className="font-medium">Connection Issues Detected:</p>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {validation.issues.map((issue: string, index: number) => (
                          <li key={index}>{issue}</li>
                        ))}
                      </ul>
                      {validation.recommendations.length > 0 && (
                        <div className="mt-2">
                          <p className="font-medium text-sm">Recommendations:</p>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            {validation.recommendations.map((rec: string, index: number) => (
                              <li key={index}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={checkEnvironment}
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Connection Status
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Instructions */}
      {showInstructions && environment.isMobile && !connected && (
        <Card className="snarbles-glass border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg">Mobile Wallet Setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              To create tokens on mobile, you need a Solana wallet app:
            </p>
            
            {/* Phantom Wallet */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">P</span>
                </div>
                <div>
                  <p className="font-medium">Phantom Wallet</p>
                  <p className="text-sm text-muted-foreground">Most popular Solana wallet</p>
                </div>
              </div>
              <div className="flex gap-2">
                {!environment.isPhantom && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadWallet('phantom')}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Install
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openWalletApp('phantom')}
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Open
                </Button>
              </div>
            </div>

            {/* OKX Wallet */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">O</span>
                </div>
                <div>
                  <p className="font-medium">OKX Wallet</p>
                  <p className="text-sm text-muted-foreground">Multi-chain wallet with Solana support</p>
                </div>
              </div>
              <div className="flex gap-2">
                {!environment.isOKX && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadWallet('okx')}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Install
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openWalletApp('okx')}
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Open
                </Button>
              </div>
            </div>

            {/* Step-by-step instructions */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="font-medium text-blue-800 mb-2">Quick Setup:</p>
              <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
                <li>Install a wallet app (Phantom recommended)</li>
                <li>Create or import your Solana wallet</li>
                <li>Return to this page and click "Connect Wallet"</li>
                <li>Approve the connection in your wallet app</li>
              </ol>
            </div>

            {environment.isInAppBrowser && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium">Using In-App Browser</p>
                  <p className="text-sm">
                    For better wallet connectivity, consider opening this page in your default browser (Safari, Chrome, etc.)
                  </p>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
