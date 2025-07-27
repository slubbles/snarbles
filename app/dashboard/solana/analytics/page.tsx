'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { ADMIN_WALLET } from '@/lib/solana';
import { DashboardLayout } from '@/components/dashboard/shared/DashboardLayout';
import { UserAnalytics } from '@/components/dashboard/shared/UserAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Coins, Activity, ArrowLeft, Shield } from 'lucide-react';
import Link from 'next/link';

export default function SolanaAnalyticsPage() {
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
            <p className="mt-4 text-muted-foreground">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  // Check if user is admin
  const isUserAdmin = solanaConnected && publicKey && publicKey.toString() === ADMIN_WALLET.toString();

  // Show access denied if not admin
  if (!isUserAdmin) {
    return (
      <DashboardLayout 
        network="solana" 
        walletAddress={publicKey?.toString() || undefined}
        isConnected={solanaConnected}
      >
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Card className="glass-card border-red-500/30 bg-red-500/5">
            <CardContent className="text-center p-12">
              <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">Access Denied</h2>
              <p className="text-muted-foreground mb-6">
                Analytics are restricted to administrators only.
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
              <BarChart3 className="w-16 h-16 text-purple-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">Connect Solana Wallet</h2>
              <p className="text-muted-foreground mb-6">
                You need to connect a Solana wallet to view analytics
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
            <h1 className="text-3xl font-bold text-foreground mb-2">Solana Analytics</h1>
            <p className="text-muted-foreground">
              Comprehensive insights into your SPL token performance and activity
            </p>
          </div>
          
          <div className="flex gap-4">
            <Link 
              href="/dashboard/solana/tokens"
              className="inline-flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              <Coins className="w-4 h-4" />
              Manage Tokens
            </Link>
          </div>
        </div>

        {/* Analytics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="glass-card border-purple-500/30 bg-purple-500/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Tokens</p>
                  <p className="text-2xl font-bold text-foreground">0</p>
                </div>
                <Coins className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-blue-500/30 bg-blue-500/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Transactions</p>
                  <p className="text-2xl font-bold text-foreground">0</p>
                </div>
                <Activity className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-green-500/30 bg-green-500/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Portfolio Value</p>
                  <p className="text-2xl font-bold text-foreground">$0</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-orange-500/30 bg-orange-500/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Growth</p>
                  <p className="text-2xl font-bold text-foreground">+0%</p>
                </div>
                <BarChart3 className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <div className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Analytics Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">Analytics Coming Soon</h3>
                <p className="text-muted-foreground mb-6">
                  Detailed analytics and insights for your tokens will be available here
                </p>
                <Link 
                  href="/dashboard/solana/tokens"
                  className="inline-flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg transition-colors font-medium"
                >
                  <Coins className="w-4 h-4" />
                  Manage Tokens
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coming Soon Features */}
        <div className="mt-8">
          <Card className="glass-card border-blue-500/30 bg-blue-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                Advanced Analytics Coming Soon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4">
                  <TrendingUp className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <h4 className="font-semibold mb-1">Price Tracking</h4>
                  <p className="text-sm text-muted-foreground">Real-time token price monitoring</p>
                </div>
                <div className="text-center p-4">
                  <Activity className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <h4 className="font-semibold mb-1">Volume Analysis</h4>
                  <p className="text-sm text-muted-foreground">Trading volume and liquidity metrics</p>
                </div>
                <div className="text-center p-4">
                  <Coins className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                  <h4 className="font-semibold mb-1">Holder Analytics</h4>
                  <p className="text-sm text-muted-foreground">Token distribution and holder insights</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
