'use client';

import { useState, useEffect } from 'react';
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider';
import { DashboardLayout } from '@/components/dashboard/layout/DashboardLayout';
import TokenManagementPage from '@/components/dashboard/tokens/TokenManagementPage';

export default function AlgorandTokensPage() {
  const [mounted, setMounted] = useState(false);
  const { connected: algorandConnected, address } = useAlgorandWallet();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <DashboardLayout 
      network="algorand" 
      walletAddress={address || undefined}
      isConnected={algorandConnected}
      stats={{
        portfolioValue: 1250.75,
        totalTokens: 3,
        totalTransactions: 45
      }}
    >
      <TokenManagementPage 
        network="algorand" 
        walletAddress={address || undefined}
      />
    </DashboardLayout>
  );
}
