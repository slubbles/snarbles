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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">Token Dashboard</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Manage your tokens across Solana and Algorand networks. Connect a wallet to get started.
            </p>
          </div>

          {/* Network Selection Cards */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            
            {/* Solana Dashboard */}
            <Card className="snarbles-card-premium border-purple-500/30 snarbles-glow-purple transition-all duration-200 hover:scale-105">
              <CardHeader className="text-center">
                <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto">
                  <Coins className="w-8 h-8 text-purple-500" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-foreground">Solana Network</h2>
                  <p className="text-muted-foreground">
                    Manage SPL tokens with lightning-fast transactions
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                  <div className="text-sm text-purple-600">
                    <p className="font-semibold mb-2">Features:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Create SPL tokens</li>
                      <li>Mint, burn, transfer tokens</li>
                      <li>Manage token metadata</li>
                      <li>Real-time analytics</li>
                    </ul>
                  </div>
                </div>
                
                <div className="flex flex-col gap-3">
                  <WalletConnectionManager className="w-full" />
                  <Link 
                    href="/dashboard/solana"
                    className="w-full snarbles-btn-primary text-white px-4 py-3 rounded-lg text-center transition-colors font-medium"
                  >
                    Access Solana Dashboard
                    <ArrowRight className="w-4 h-4 ml-2 inline" />
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Algorand Dashboard */}
            <Card className="snarbles-card-premium border-green-500/30 snarbles-glow-green transition-all duration-200 hover:scale-105">
              <CardHeader className="text-center">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                  <BarChart3 className="w-8 h-8 text-green-500" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-foreground">Algorand Network</h2>
                  <p className="text-muted-foreground">
                    Create ASA tokens with enterprise-grade security
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <div className="text-sm text-green-600">
                    <p className="font-semibold mb-2">Features:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Create ASA tokens</li>
                      <li>Freeze/unfreeze assets</li>
                      <li>Clawback functionality</li>
                      <li>Advanced asset controls</li>
                    </ul>
                  </div>
                </div>
                
                <div className="flex flex-col gap-3">
                  <WalletConnectionManager className="w-full" />
                  <Link 
                    href="/dashboard/algorand"
                    className="w-full snarbles-btn-primary text-white px-4 py-3 rounded-lg text-center transition-colors font-medium"
                  >
                    Access Algorand Dashboard
                    <ArrowRight className="w-4 h-4 ml-2 inline" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Info */}
          <div className="text-center">
            <Card className="snarbles-card border-blue-500/30 snarbles-glow-blue">
              <CardContent className="p-6">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Network className="w-5 h-5 text-blue-500" />
                  <h3 className="text-lg font-semibold text-blue-600">Multi-Network Support</h3>
                </div>
                <p className="text-muted-foreground mb-4">
                  Connect wallets from both networks to manage all your tokens in one place. 
                  Switch between networks seamlessly with our unified dashboard.
                </p>
                <Link 
                  href="/create" 
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Create your first token
                  <ArrowRight className="w-4 h-4" />
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">Select Network Dashboard</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              You're connected to both networks! Choose which dashboard to access.
            </p>
            
            {/* Connected Wallets Status */}
            <div className="flex justify-center gap-4 mt-6">
              <Badge className="bg-purple-500/20 text-purple-600 border-purple-500/30">
                Solana: {publicKey?.toBase58().slice(0, 8)}...
              </Badge>
              <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                Algorand: {algorandAddress?.slice(0, 8)}...
              </Badge>
            </div>
          </div>

          {/* Dashboard Selection */}
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Solana Dashboard Option */}
            <Link href="/dashboard/solana">
              <Card className="snarbles-card-premium border-purple-500/30 snarbles-glow-purple transition-all duration-200 cursor-pointer h-full hover:scale-105">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto">
                    <Coins className="w-8 h-8 text-purple-500" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-foreground">Solana Dashboard</h2>
                    <p className="text-muted-foreground">
                      Manage your SPL tokens and view analytics
                    </p>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <Button className="w-full snarbles-btn-primary text-white">
                      Open Solana Dashboard
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Algorand Dashboard Option */}
            <Link href="/dashboard/algorand">
              <Card className="snarbles-card-premium border-green-500/30 snarbles-glow-green transition-all duration-200 cursor-pointer h-full hover:scale-105">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                    <BarChart3 className="w-8 h-8 text-green-500" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-foreground">Algorand Dashboard</h2>
                    <p className="text-muted-foreground">
                      Manage your ASA tokens and asset controls
                    </p>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <Button className="w-full snarbles-btn-primary text-white">
                      Open Algorand Dashboard
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
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