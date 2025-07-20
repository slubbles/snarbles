'use client';

import { useState, useEffect } from 'react';
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider';
import { DashboardLayout } from '@/components/dashboard/shared/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, Coins, Activity, ArrowLeft, Shield } from 'lucide-react';
import Link from 'next/link';

export default function AlgorandAnalyticsPage() {
  const [mounted, setMounted] = useState(false);
  const { connected: algorandConnected, address, selectedNetwork } = useAlgorandWallet();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!algorandConnected) {
    return (
      <DashboardLayout 
        network="algorand" 
        walletAddress={undefined}
        isConnected={false}
      >
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Card className="glass-card border-green-500/30 bg-green-500/5">
            <CardContent className="text-center p-12">
              <BarChart3 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">Connect Algorand Wallet</h2>
              <p className="text-muted-foreground mb-6">
                You need to connect an Algorand wallet to view analytics
              </p>
              <Link 
                href="/dashboard/algorand"
                className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-colors"
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
      network="algorand" 
      walletAddress={address || undefined}
      isConnected={algorandConnected}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Network Status */}
        <div className="mb-6">
          {selectedNetwork === 'algorand-mainnet' ? (
            <div className="flex items-center justify-center mb-4 bg-yellow-500/10 border border-yellow-500/20 p-2 rounded-lg">
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 mr-2">
                Mainnet
              </Badge>
              <span className="text-sm text-yellow-600">⚠️ You are using Algorand Mainnet - real assets with real value</span>
            </div>
          ) : (
            <div className="flex items-center justify-center mb-4 bg-[#76f935]/10 border border-[#76f935]/20 p-2 rounded-lg">
              <Badge className="bg-[#76f935]/20 text-[#76f935] border-[#76f935]/30 mr-2">
                Testnet
              </Badge>
              <span className="text-sm text-[#76f935]">You're on Algorand Testnet - perfect for testing</span>
            </div>
          )}
        </div>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Algorand Analytics</h1>
            <p className="text-muted-foreground">
              Comprehensive insights into your ASA token performance and activity
            </p>
          </div>
          
          <div className="flex gap-4">
            <Link 
              href="/dashboard/algorand/assets"
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              <Shield className="w-4 h-4" />
              Manage Assets
            </Link>
          </div>
        </div>

        {/* Analytics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="glass-card border-green-500/30 bg-green-500/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Assets</p>
                  <p className="text-2xl font-bold text-foreground">0</p>
                </div>
                <Coins className="w-8 h-8 text-green-500" />
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

          <Card className="glass-card border-purple-500/30 bg-purple-500/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Portfolio Value</p>
                  <p className="text-2xl font-bold text-foreground">$0</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
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
                  Detailed analytics and insights for your assets will be available here
                </p>
                <Link 
                  href="/dashboard/algorand/assets"
                  className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-colors font-medium"
                >
                  <Shield className="w-4 h-4" />
                  Manage Assets
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ASA-Specific Features */}
        <div className="mt-8">
          <Card className="glass-card border-green-500/30 bg-green-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-500" />
                ASA Analytics Features Coming Soon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4">
                  <Shield className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <h4 className="font-semibold mb-1">Freeze Analytics</h4>
                  <p className="text-sm text-muted-foreground">Track freeze/unfreeze events and patterns</p>
                </div>
                <div className="text-center p-4">
                  <Activity className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <h4 className="font-semibold mb-1">Clawback Monitoring</h4>
                  <p className="text-sm text-muted-foreground">Monitor clawback operations and asset recovery</p>
                </div>
                <div className="text-center p-4">
                  <Coins className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                  <h4 className="font-semibold mb-1">Opt-in Analytics</h4>
                  <p className="text-sm text-muted-foreground">Track asset adoption and opt-in rates</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
