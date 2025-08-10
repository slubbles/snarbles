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
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Initializing Algorand dashboard...</p>
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
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="max-w-md mx-auto text-center">
            <Card className="bg-card border border-green-500/30">
              <CardHeader className="text-center">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                  <Wallet className="w-8 h-8 text-green-500" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-foreground">Connect Algorand Wallet</h2>
                  <p className="text-muted-foreground">
                    Connect your Algorand wallet to access your ASA token dashboard
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <div className="text-sm text-green-400">
                    <p className="font-semibold mb-2">Supported Wallets:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Pera Wallet (Recommended)</li>
                      <li>Defly Wallet</li>
                      <li>MyAlgo Wallet</li>
                      <li>Algorand Wallet</li>
                    </ul>
                  </div>
                </div>
                
                <div className="flex flex-col gap-3">
                  <WalletConnectionManager className="w-full" />
                  <Link 
                    href="/dashboard/solana" 
                    className="text-primary hover:text-primary/80 text-sm inline-flex items-center justify-center"
                  >
                    Use Solana instead
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
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
        {/* Network Status Banner */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          {selectedNetwork === 'algorand-mainnet' ? (
            <div className="flex items-center justify-center mb-4 bg-yellow-500/10 border border-yellow-500/20 p-2 rounded-lg">
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 mr-2">
                Mainnet
              </Badge>
              <span className="text-sm text-yellow-600">⚠️ You are using Algorand Mainnet - real tokens with real value</span>
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

        {/* Algorand Dashboard Component */}
        <AlgorandDashboard />
      </div>
    </DashboardLayout>
  );
}
