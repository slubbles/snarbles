'use client';

import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider';
import { isAdmin as checkIsAdmin } from '@/lib/admin-config';
import { ADMIN_WALLET } from '@/lib/solana';
import LiveAnalyticsDashboard from '@/components/dashboard/LiveAnalyticsDashboard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

export default function AnalyticsPage() {
  // Check wallet connections
  const { connected: solanaConnected, publicKey: solanaPublicKey } = useWallet();
  const { connected: algorandConnected, address: algorandAddress } = useAlgorandWallet();

  // Check if user is admin (supports both Algorand and Solana)
  const isUserAdmin = (solanaConnected && solanaPublicKey && solanaPublicKey.toString() === ADMIN_WALLET.toString()) ||
                      (algorandConnected && algorandAddress && checkIsAdmin(algorandAddress));

  // Show access denied if not admin
  if (!isUserAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md mx-auto p-6">
          <Alert className="border-red-500/20 bg-red-500/10">
            <Shield className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-600 dark:text-red-400">
              Access denied. Analytics are restricted to administrators only.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <LiveAnalyticsDashboard />
    </div>
  );
}
