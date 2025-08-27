'use client';

import { useState, useEffect } from 'react';
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider';
import { isAdmin as checkIsAdmin } from '@/lib/admin-config';
import { DashboardLayout } from '@/components/dashboard/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import WalletConnectionManager from '@/components/WalletConnectionManager';
import dynamic from 'next/dynamic';

// Dynamically import AlgorandDashboard to fix hydration issues
const AlgorandDashboard = dynamic(
  () => import('../AlgorandDashboard'), 
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-foreground text-lg font-semibold">Loading Algorand Dashboard...</p>
          <p className="text-muted-foreground mt-2">Please wait while we fetch your assets</p>
        </div>
      </div>
    )
  }
);

export default function AlgorandDashboardPage() {
  const [mounted, setMounted] = useState(false);
  const { connected: algorandConnected, selectedNetwork, address } = useAlgorandWallet();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if user is admin
  const isUserAdmin = !!(algorandConnected && address && checkIsAdmin(address));

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <div className="min-h-screen app-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="glass-card border-gradient-br mx-auto max-w-md">
              <div className="p-8">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-green-500/20 to-blue-500/20 flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-green-500/30">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                </div>
                <h3 className="text-xl font-semibold text-gradient-primary mb-3">Initializing Dashboard</h3>
                <p className="text-muted-foreground">Setting up your Algorand environment...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No Algorand wallet connected
  if (!algorandConnected) {
    return (
      <DashboardLayout 
        network="algorand" 
        walletAddress={undefined}
        isConnected={false}
        isAdmin={false}
      >
        <div className="min-h-screen app-background flex items-center justify-center">
          <div className="max-w-lg mx-auto px-4">
            <Card className="glass-card border-gradient-br">
              <CardHeader className="text-center pb-6">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-green-500/20 to-blue-500/20 flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-green-500/30">
                  <Wallet className="w-10 h-10 text-gradient-green" />
                </div>
                <div className="space-y-3">
                  <h1 className="text-3xl font-bold text-gradient-primary">
                    Connect Algorand Wallet
                  </h1>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Access your ASA token dashboard and manage your Algorand assets with precision
                  </p>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="glass-card-inner border-green-500/30 bg-gradient-to-r from-green-500/5 to-blue-500/5">
                  <div className="text-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-500 to-blue-500"></div>
                      <span className="font-semibold text-gradient-green">Supported Wallets</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                        <span className="text-sm">Pera Wallet</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                        <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                        <span className="text-sm">Defly Wallet</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                        <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                        <span className="text-sm">MyAlgo Wallet</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                        <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                        <span className="text-sm">Algorand Wallet</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <WalletConnectionManager className="w-full" />
                  
                  <div className="text-center">
                    <Link 
                      href="/dashboard/solana" 
                      className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-gradient-primary transition-all duration-300 group"
                    >
                      <span>Prefer Solana?</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Render Algorand Dashboard with new layout
  return (
    <DashboardLayout 
      network="algorand" 
      walletAddress={address || undefined}
      isConnected={algorandConnected}
      isAdmin={isUserAdmin}
      stats={{
        totalTokens: 0, // Will be populated by the dashboard
        totalTransactions: 0,
        portfolioValue: 0
      }}
    >
      <div>
        {/* Enhanced Network Status Banner */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {selectedNetwork === 'algorand-mainnet' ? (
            <div className="glass-card border-gradient-br bg-gradient-to-r from-yellow-500/5 to-orange-500/5">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 p-6">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-4 h-4 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 animate-pulse"></div>
                      <div className="absolute inset-0 w-4 h-4 rounded-full bg-yellow-400 animate-ping opacity-75"></div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-gradient-yellow font-semibold text-lg">Algorand Mainnet</span>
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                          Live Network
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-muted-foreground">Real value</span>
                        <div className="w-2 h-2 rounded-full bg-yellow-400/50"></div>
                        <span className="text-sm text-yellow-400">Production ready</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="h-8 w-px bg-gradient-to-b from-transparent via-yellow-500/30 to-transparent hidden sm:block"></div>
                
                <div className="text-center sm:text-left">
                  <p className="text-sm text-muted-foreground">
                    <span className="text-gradient-yellow font-medium">⚠️ Mainnet Active:</span> You're using real ALGO with actual value - trade carefully
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card border-gradient-br bg-gradient-to-r from-green-500/5 to-blue-500/5">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 p-6">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-4 h-4 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 animate-pulse"></div>
                      <div className="absolute inset-0 w-4 h-4 rounded-full bg-green-400 animate-ping opacity-75"></div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-gradient-green font-semibold text-lg">Algorand Testnet</span>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          Test Network
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-muted-foreground">Perfect for testing</span>
                        <div className="w-2 h-2 rounded-full bg-green-400/50"></div>
                        <span className="text-sm text-green-400">Free transactions</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="h-8 w-px bg-gradient-to-b from-transparent via-green-500/30 to-transparent hidden sm:block"></div>
                
                <div className="text-center sm:text-left">
                  <p className="text-sm text-muted-foreground">
                    <span className="text-gradient-green font-medium">🧪 Test Environment:</span> Safe space to experiment with ASA tokens at no cost
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Algorand Dashboard Component */}
        <AlgorandDashboard />
      </div>
    </DashboardLayout>
  );
}
