'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { DashboardLayout } from '@/components/dashboard/shared/DashboardLayout';
import { SolanaTokenList } from '@/components/dashboard/solana/SolanaTokenList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Coins, Plus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SolanaTokensPage() {
  const [mounted, setMounted] = useState(false);
  const { connected: solanaConnected, publicKey } = useWallet();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading token management...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!solanaConnected) {
    return (
      <DashboardLayout 
        network="solana" 
        walletAddress={undefined}
        isConnected={false}
      >
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Card className="glass-card border-purple-500/30 bg-purple-500/5">
            <CardContent className="text-center p-12">
              <Coins className="w-16 h-16 text-purple-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">Connect Solana Wallet</h2>
              <p className="text-muted-foreground mb-6">
                You need to connect a Solana wallet to manage tokens
              </p>
              <Link 
                href="/dashboard/solana"
                className="inline-flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Link>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      network="solana" 
      walletAddress={publicKey?.toBase58()}
      isConnected={solanaConnected}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Solana Token Management</h1>
            <p className="text-muted-foreground">
              Create, mint, burn, and transfer your SPL tokens with Slerf Tools
            </p>
          </div>
          
          <div className="flex gap-4">
            <Link 
              href="/create"
              className="inline-flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              Create New Token
            </Link>
          </div>
        </div>

        {/* Token Management Section */}
        <div className="space-y-8">
          
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="glass-card border-purple-500/30 bg-purple-500/5">
              <CardContent className="p-6 text-center">
                <Plus className="w-8 h-8 text-purple-500 mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-2">Create Token</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create a new SPL token with custom properties
                </p>
                <Link 
                  href="/create"
                  className="inline-flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create Token
                </Link>
              </CardContent>
            </Card>

            <Card className="glass-card border-blue-500/30 bg-blue-500/5">
              <CardContent className="p-6 text-center">
                <Coins className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-2">Manage Tokens</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Mint, burn, and transfer your existing tokens
                </p>
                <div className="text-sm text-blue-600 font-medium">
                  Connect wallet to view tokens
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-green-500/30 bg-green-500/5">
              <CardContent className="p-6 text-center">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                  <span className="text-green-500 font-bold text-sm">$</span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">Analytics</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  View token performance and transaction history
                </p>
                <Link 
                  href="/dashboard/solana/analytics"
                  className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  View Analytics
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Token List and Management */}
          <SolanaTokenList 
            tokens={[]} // Will be populated with real data
            onTokenSelect={(token) => {
              console.log('Selected token:', token);
            }}
            onRefresh={() => {
              console.log('Refreshing tokens...');
            }}
            isLoading={false}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
