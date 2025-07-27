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
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Initializing dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // No wallet connected - show network selection
  if (!solanaConnected && !algorandConnected) {
    return (
      <div className="min-h-screen bg-background">
        {/* Enhanced animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-primary/15 to-primary/15 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-40 right-20 w-72 h-72 bg-gradient-to-br from-blue-500/12 to-blue-600/12 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.7s' }} />
          <div className="absolute bottom-32 left-1/4 w-64 h-64 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-br from-purple-500/8 to-purple-600/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
          
          {/* Header */}
          <div className="text-center mb-16 space-y-8">
            <div className="inline-flex items-center space-x-3 glass-card px-6 py-3">
              <Wallet className="w-5 h-5 text-primary animate-pulse" />
              <span className="uppercase tracking-wider text-primary font-bold text-sm">Multi-Network Dashboard</span>
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
              Manage your tokens across 
              <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent"> Solana and Algorand</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              Connect a wallet to get started with our unified token management platform
            </p>
          </div>

          {/* Network Selection Cards */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            
            {/* Solana Dashboard */}
            <Card className="glass-card-premium snarbles-border-glow snarbles-animate-fade-in transition-all duration-300 hover:scale-105">
              <CardHeader className="text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center mx-auto glass-card snarbles-border-glow">
                  <Coins className="w-10 h-10 text-purple-400" />
                </div>
                <div className="space-y-3">
                  <h2 className="text-3xl font-bold snarbles-subheading">Solana Network</h2>
                  <p className="text-muted-foreground text-lg">
                    Manage SPL tokens with lightning-fast transactions
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="glass-card p-6 snarbles-border-glow">
                  <div className="text-purple-400">
                    <p className="font-semibold mb-4 snarbles-subheading">Features:</p>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                      <li>Create SPL tokens</li>
                      <li>Mint, burn, transfer tokens</li>
                      <li>Manage token metadata</li>
                      <li>Real-time analytics</li>
                    </ul>
                  </div>
                </div>
                
                <div className="flex flex-col gap-4">
                  <div className="text-center text-sm text-muted-foreground mb-2">
                    No wallet connected
                  </div>
                  <WalletConnectionManager />
                  <Link 
                    href="/dashboard/solana"
                    className="w-full text-center glass-card p-4 text-muted-foreground hover:text-foreground transition-colors font-medium snarbles-border-glow"
                  >
                    Access Solana Dashboard
                    <ArrowRight className="w-4 h-4 ml-2 inline" />
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Algorand Dashboard */}
            <Card className="glass-card-premium snarbles-border-glow snarbles-animate-fade-in transition-all duration-300 hover:scale-105">
              <CardHeader className="text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center mx-auto glass-card snarbles-border-glow">
                  <BarChart3 className="w-10 h-10 text-green-400" />
                </div>
                <div className="space-y-3">
                  <h2 className="text-3xl font-bold snarbles-subheading">Algorand Network</h2>
                  <p className="text-muted-foreground text-lg">
                    Create ASA tokens with enterprise-grade security
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="glass-card p-6 snarbles-border-glow">
                  <div className="text-green-400">
                    <p className="font-semibold mb-4 snarbles-subheading">Features:</p>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                      <li>Create ASA tokens</li>
                      <li>Freeze/unfreeze assets</li>
                      <li>Clawback functionality</li>
                      <li>Advanced asset controls</li>
                    </ul>
                  </div>
                </div>
                
                <div className="flex flex-col gap-4">
                  <div className="text-center text-sm text-muted-foreground mb-2">
                    No wallet connected
                  </div>
                  <WalletConnectionManager />
                  <Link 
                    href="/dashboard/algorand"
                    className="w-full text-center glass-card p-4 text-muted-foreground hover:text-foreground transition-colors font-medium snarbles-border-glow"
                  >
                    Access Algorand Dashboard
                    <ArrowRight className="w-4 h-4 ml-2 inline" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Info */}
          <div className="text-center snarbles-animate-fade-in">
            <Card className="glass-card-premium snarbles-border-glow max-w-2xl mx-auto">
              <CardContent className="p-8">
                <div className="flex items-center justify-center gap-3 mb-6">
                  <Network className="w-6 h-6 text-blue-400" />
                  <h3 className="text-2xl font-bold snarbles-subheading">Multi-Network Support</h3>
                </div>
                <p className="text-muted-foreground mb-6 text-lg leading-relaxed">
                  Connect wallets from both networks to manage all your tokens in one place. 
                  Switch between networks seamlessly with our unified dashboard.
                </p>
                <Link 
                  href="/create" 
                  className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-lg"
                >
                  Create your first token
                  <ArrowRight className="w-5 h-5" />
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
        {/* Enhanced animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-primary/15 to-primary/15 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-40 right-20 w-72 h-72 bg-gradient-to-br from-blue-500/12 to-blue-600/12 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.7s' }} />
          <div className="absolute bottom-32 left-1/4 w-64 h-64 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-br from-purple-500/8 to-purple-600/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
          
          {/* Header */}
          <div className="text-center mb-16 space-y-8">
            <div className="inline-flex items-center space-x-3 glass-card px-6 py-3">
              <Wallet className="w-5 h-5 text-green-400 animate-pulse" />
              <span className="uppercase tracking-wider text-green-400 font-bold text-sm">Multi-Wallet Connected</span>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
              Select Network 
              <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent"> Dashboard</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              You're connected to both networks! Choose which dashboard to access.
            </p>
            
            {/* Connected Wallets Status */}
            <div className="flex justify-center gap-6 mt-8">
              <div className="glass-card px-6 py-3 snarbles-border-glow">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
                  <span className="text-purple-400 font-semibold">Solana</span>
                  <span className="text-muted-foreground font-mono text-sm">
                    {publicKey?.toBase58().slice(0, 8)}...
                  </span>
                </div>
              </div>
              <div className="glass-card px-6 py-3 snarbles-border-glow">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 font-semibold">Algorand</span>
                  <span className="text-muted-foreground font-mono text-sm">
                    {algorandAddress?.slice(0, 8)}...
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard Selection */}
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Solana Dashboard Option */}
            <Link href="/dashboard/solana">
              <Card className="glass-card-premium snarbles-border-glow transition-all duration-300 cursor-pointer h-full hover:scale-105 snarbles-animate-fade-in">
                <CardHeader className="text-center space-y-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center mx-auto glass-card snarbles-border-glow">
                    <Coins className="w-10 h-10 text-purple-400" />
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-3xl font-bold snarbles-subheading">Solana Dashboard</h2>
                    <p className="text-muted-foreground text-lg">
                      Manage your SPL tokens and view analytics
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="text-center">
                  <Button className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-4 text-lg transition-all duration-300 hover:scale-105">
                    Open Solana Dashboard
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </Link>

            {/* Algorand Dashboard Option */}
            <Link href="/dashboard/algorand">
              <Card className="glass-card-premium snarbles-border-glow transition-all duration-300 cursor-pointer h-full hover:scale-105 snarbles-animate-fade-in">
                <CardHeader className="text-center space-y-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center mx-auto glass-card snarbles-border-glow">
                    <BarChart3 className="w-10 h-10 text-green-400" />
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-3xl font-bold snarbles-subheading">Algorand Dashboard</h2>
                    <p className="text-muted-foreground text-lg">
                      Manage your ASA tokens and asset controls
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="text-center">
                  <Button className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-4 text-lg transition-all duration-300 hover:scale-105">
                    Open Algorand Dashboard
                    <ArrowRight className="w-5 h-5 ml-2" />
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
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="snarbles-card p-8 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-foreground text-lg font-semibold">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}