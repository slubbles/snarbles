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
  
  // Filter out any non-Solana wallets that might cause key conflicts
  const solanaOnlyWallets = React.useMemo(() => {
    return wallets.filter(wallet => {
      const name = wallet.adapter.name.toLowerCase();
      // Exclude EVM wallets that might be auto-detected
      return !name.includes('metamask') && 
             !name.includes('coinbase wallet') &&
             !name.includes('walletconnect') &&
             !name.includes('trust wallet') &&
             !name.includes('rainbow');
    });
  }, [wallets]);

  // Log filtered wallets for debugging
  React.useEffect(() => {
    console.log('🔍 Available Solana wallets:', solanaOnlyWallets.map(w => w.adapter.name));
    if (solanaOnlyWallets.length !== wallets.length) {
      console.log('🚫 Filtered out non-Solana wallets:', 
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
