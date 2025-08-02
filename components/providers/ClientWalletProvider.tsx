'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

// Dynamically import WalletProvider to prevent SSR issues
const WalletProvider = dynamic(
  () => import('./WalletProvider'),
  { 
    ssr: false,
    loading: () => <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }
);

interface ClientWalletProviderProps {
  children: ReactNode;
}

export default function ClientWalletProvider({ children }: ClientWalletProviderProps) {
  return <WalletProvider>{children}</WalletProvider>;
} 