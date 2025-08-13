'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, Network, ArrowRight, Coins, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import WalletConnectionManager from '@/components/WalletConnectionManager';

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  
  // Wallet connections
  const { connected: solanaConnected, publicKey } = useWallet();
  const { connected: algorandConnected, address: algorandAddress } = useAlgorandWallet();

  // All hooks must be called before any conditional returns
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-redirect if only one wallet is connected
  useEffect(() => {
    if (mounted && solanaConnected && !algorandConnected) {
      window.location.href = '/dashboard/solana';
    }
    if (mounted && algorandConnected && !solanaConnected) {
      window.location.href = '/dashboard/algorand';
    }
  }, [mounted, solanaConnected, algorandConnected]);

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Initializing dashboard...</p>
        </div>
      </div>
    );
  }

  // No wallet connected - show network selection
  if (!solanaConnected && !algorandConnected) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16">
          
          {/* Mobile-Optimized Header */}
          <div className="text-center mb-8 lg:mb-12">
            <div className="inline-flex items-center space-x-2 px-3 py-2 mb-4 lg:mb-6">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="uppercase tracking-wider text-primary font-medium text-xs sm:text-sm">Multi-Network Dashboard</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-3 lg:mb-4">
              Manage your tokens across <span className="text-primary">Solana</span> and <span className="text-primary">Algorand</span>
            </h1>
            
            <p className="text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              Connect a wallet to get started with our unified token management platform
            </p>
          </div>

          {/* Mobile-First Network Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-8 lg:mb-12">
            
            {/* Solana Card - Mobile Optimized */}
            <Card className="glass-card border border-border">
              <CardHeader className="text-center pb-3 lg:pb-4 px-4 lg:px-6">
                <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-3 lg:mb-4">
                  <Coins className="w-6 h-6 lg:w-8 lg:h-8 text-purple-400" />
                </div>
                <h2 className="text-xl lg:text-2xl font-bold text-foreground">Solana Network</h2>
                <p className="text-sm lg:text-base text-muted-foreground">
                  Manage SPL tokens with lightning-fast transactions
                </p>
              </CardHeader>
              <CardContent className="space-y-3 lg:space-y-4 px-4 lg:px-6">
                <div className="space-y-2">
                  <p className="font-semibold text-foreground text-sm lg:text-base">Features:</p>
                  <ul className="text-xs lg:text-sm text-muted-foreground space-y-1">
                    <li>• Create SPL tokens</li>
                    <li>• Mint, burn, transfer tokens</li>
                    <li>• Manage token metadata</li>
                    <li>• Real-time analytics</li>
                  </ul>
                </div>
                
                <div className="text-center text-xs lg:text-sm text-muted-foreground py-2">
                  No wallet connected
                </div>
                
                <div className="w-full">
                  <WalletConnectionManager />
                </div>
                
                <Link 
                  href="/dashboard/solana"
                  className="flex items-center justify-center gap-2 w-full py-3 text-muted-foreground hover:text-foreground transition-colors"
                >
                  Access Solana Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </CardContent>
            </Card>

            {/* Algorand Card */}
            <Card className="glass-card border border-border">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Algorand Network</h2>
                <p className="text-muted-foreground">
                  Create ASA tokens with enterprise-grade security
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="font-semibold text-foreground">Features:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Create ASA tokens</li>
                    <li>• Freeze/unfreeze assets</li>
                    <li>• Clawback functionality</li>
                    <li>• Advanced asset controls</li>
                  </ul>
                </div>
                
                <div className="text-center text-sm text-muted-foreground py-2">
                  No wallet connected
                </div>
                
                <WalletConnectionManager />
                
                <Link 
                  href="/dashboard/algorand"
                  className="flex items-center justify-center gap-2 w-full py-3 text-muted-foreground hover:text-foreground transition-colors"
                >
                  Access Algorand Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Mobile-Optimized Multi-Network Info */}
          <div className="text-center">
            <Card className="glass-card border border-border max-w-2xl mx-auto">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-center gap-2 mb-3 lg:mb-4">
                  <Network className="w-4 h-4 lg:w-5 lg:h-5 text-blue-400" />
                  <h3 className="text-lg lg:text-xl font-bold text-foreground">Multi-Network Support</h3>
                </div>
                <p className="text-sm lg:text-base text-muted-foreground mb-4 lg:mb-6">
                  Connect wallets from both networks to manage all your tokens in one place. 
                  Switch between networks seamlessly with our unified dashboard.
                </p>
                <Link 
                  href="/create" 
                  className="button-enhanced inline-flex items-center gap-2 px-4 lg:px-6 py-2 lg:py-3 text-sm lg:text-base font-semibold transition-all"
                >
                  Create your first token
                  <ArrowRight className="w-3 h-3 lg:w-4 lg:h-4" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Both wallets connected - show network selection
  if (solanaConnected && algorandConnected) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16">
          
          {/* Mobile-Optimized Header */}
          <div className="text-center mb-8 lg:mb-12">
            <div className="inline-flex items-center space-x-2 px-3 lg:px-4 py-1 lg:py-2 mb-4 lg:mb-6">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="uppercase tracking-wider text-green-400 font-medium text-xs lg:text-sm">Multi-Wallet Connected</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-foreground mb-3 lg:mb-4">
              Select Network <span className="text-primary">Dashboard</span>
            </h1>
            
            <p className="text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto mb-4 lg:mb-6 px-4">
              You're connected to both networks! Choose which dashboard to access.
            </p>
            
            {/* Connected Wallets Status - Mobile Responsive */}
            <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 px-4">
              <div className="glass-card px-3 lg:px-4 py-2 border border-border">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span className="text-purple-400 font-medium text-sm lg:text-base">Solana</span>
                  <span className="text-muted-foreground font-mono text-xs lg:text-sm">
                    {publicKey?.toBase58().slice(0, 8)}...
                  </span>
                </div>
              </div>
              <div className="glass-card px-3 lg:px-4 py-2 border border-border">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-green-400 font-medium text-sm lg:text-base">Algorand</span>
                  <span className="text-muted-foreground font-mono text-xs lg:text-sm">
                    {algorandAddress?.slice(0, 8)}...
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile-Optimized Dashboard Selection */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 px-4 lg:px-0">
            
            {/* Solana Dashboard Option - Mobile Optimized */}
            <Link href="/dashboard/solana">
              <Card className="glass-card border border-border transition-all duration-300 cursor-pointer h-full hover:scale-105 active:scale-95">
                <CardHeader className="text-center pb-3 lg:pb-4 px-4 lg:px-6">
                  <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-3 lg:mb-4">
                    <Coins className="w-6 h-6 lg:w-8 lg:h-8 text-purple-400" />
                  </div>
                  <h2 className="text-xl lg:text-2xl font-bold text-foreground">Solana Dashboard</h2>
                  <p className="text-sm lg:text-base text-muted-foreground">
                    Manage your SPL tokens and view analytics
                  </p>
                </CardHeader>
                <CardContent className="text-center px-4 lg:px-6">
                  <Button className="w-full button-enhanced py-2 lg:py-3 text-sm lg:text-base">
                    Open Solana Dashboard
                    <ArrowRight className="w-3 h-3 lg:w-4 lg:h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </Link>

            {/* Algorand Dashboard Option - Mobile Optimized */}
            <Link href="/dashboard/algorand">
              <Card className="glass-card border border-border transition-all duration-300 cursor-pointer h-full hover:scale-105 active:scale-95">
                <CardHeader className="text-center pb-3 lg:pb-4 px-4 lg:px-6">
                  <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3 lg:mb-4">
                    <BarChart3 className="w-6 h-6 lg:w-8 lg:h-8 text-green-400" />
                  </div>
                  <h2 className="text-xl lg:text-2xl font-bold text-foreground">Algorand Dashboard</h2>
                  <p className="text-sm lg:text-base text-muted-foreground">
                    Manage your ASA tokens and asset controls
                  </p>
                </CardHeader>
                <CardContent className="text-center px-4 lg:px-6">
                  <Button className="w-full button-enhanced py-2 lg:py-3 text-sm lg:text-base">
                    Open Algorand Dashboard
                    <ArrowRight className="w-3 h-3 lg:w-4 lg:h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // This should not be reached due to auto-redirect, but provide a fallback
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="glass-card border border-border p-6 lg:p-8 text-center max-w-sm mx-auto">
        <div className="animate-spin rounded-full h-8 w-8 lg:h-10 lg:w-10 border-b-2 border-primary mx-auto mb-3 lg:mb-4"></div>
        <p className="text-foreground text-base lg:text-lg font-semibold">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}