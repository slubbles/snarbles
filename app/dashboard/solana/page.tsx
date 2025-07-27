'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { ADMIN_WALLET } from '@/lib/solana';
import { DashboardLayout } from '@/components/dashboard/shared/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import WalletConnectionManager from '@/components/WalletConnectionManager';
import SolanaDashboard from '../SolanaDashboard';

export default function SolanaDashboardPage() {
  const [mounted, setMounted] = useState(false);
  const { connected: solanaConnected, publicKey } = useWallet();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if user is admin
  const isUserAdmin = !!(solanaConnected && publicKey && publicKey.toString() === ADMIN_WALLET.toString());

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Initializing Solana dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // No Solana wallet connected
  if (!solanaConnected) {
    return (
      <DashboardLayout 
        network="solana" 
        walletAddress={undefined}
        isConnected={false}
        isAdmin={false}
      >
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="max-w-md mx-auto text-center">
            <Card className="glass-card border-purple-500/30 bg-purple-500/5">
              <CardHeader className="text-center">
                <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto">
                  <Wallet className="w-8 h-8 text-purple-500" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-foreground">Connect Solana Wallet</h2>
                  <p className="text-muted-foreground">
                    Connect your Solana wallet to access your SPL token dashboard
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                  <div className="text-sm text-purple-600">
                    <p className="font-semibold mb-2">Supported Wallets:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Phantom Wallet</li>
                      <li>Solflare</li>
                      <li>Backpack</li>
                      <li>Other Solana wallets</li>
                    </ul>
                  </div>
                </div>
                
                <div className="flex flex-col gap-3">
                  <WalletConnectionManager className="w-full" />
                  <Link 
                    href="/dashboard/algorand" 
                    className="text-primary hover:text-primary/80 text-sm inline-flex items-center justify-center"
                  >
                    Use Algorand instead
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

  // Render Solana Dashboard with new layout
  return (
    <DashboardLayout 
      network="solana" 
      walletAddress={publicKey?.toBase58()}
      isConnected={solanaConnected}
      isAdmin={isUserAdmin}
      stats={{
        totalTokens: 0, // Will be populated by the dashboard
        totalTransactions: 0,
        portfolioValue: 0
      }}
    >
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <SolanaDashboard />
      </div>
    </DashboardLayout>
  );
}
