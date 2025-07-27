'use client';

import React from 'react';
import { WalletModalProvider as BaseWalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';

interface CustomWalletModalProviderProps {
  children: React.ReactNode;
}

// Custom wrapper that filters out non-Solana wallets to prevent duplicate keys
export default function CustomWalletModalProvider({ children }: CustomWalletModalProviderProps) {
  const { wallets } = useWallet();
  
  // Filter to only allow Phantom and OKX wallets for Solana
  const solanaOnlyWallets = React.useMemo(() => {
    return wallets.filter(wallet => {
      const name = wallet.adapter.name.toLowerCase();
      // Only allow Phantom and OKX wallets
      return name.includes('phantom') || name.includes('okx');
    });
  }, [wallets]);

  // Log filtered wallets for debugging
  React.useEffect(() => {
    console.log('🔍 Available Solana wallets (Phantom & OKX only):', solanaOnlyWallets.map(w => w.adapter.name));
    if (solanaOnlyWallets.length !== wallets.length) {
      console.log('🚫 Filtered out unsupported wallets:', 
        wallets.filter(w => !solanaOnlyWallets.includes(w)).map(w => w.adapter.name)
      );
    }
  }, [wallets, solanaOnlyWallets]);

  return (
    <BaseWalletModalProvider>
      {children}
    </BaseWalletModalProvider>
  );
}
