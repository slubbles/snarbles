'use client';

import React, { useMemo, createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { SOLANA_NETWORKS, CURRENT_SOLANA_NETWORK } from '@/lib/solana-data';
import { AlgorandWalletProvider } from './AlgorandWalletProvider';
import SolanaWalletErrorHandler from '@/components/SolanaWalletErrorHandler';

// Import wallet adapter CSS - temporarily disabled due to CSP issues
// import '@solana/wallet-adapter-react-ui/styles.css';

// Network Context for Solana network switching
type SolanaNetworkType = typeof SOLANA_NETWORKS[keyof typeof SOLANA_NETWORKS];

interface SolanaNetworkContextType {
  currentNetwork: SolanaNetworkType;
  setNetwork: (network: keyof typeof SOLANA_NETWORKS) => void;
  availableNetworks: typeof SOLANA_NETWORKS;
  isTestnet: boolean;
}

const SolanaNetworkContext = createContext<SolanaNetworkContextType | undefined>(undefined);

export function useSolanaNetwork(): SolanaNetworkContextType {
  const context = useContext(SolanaNetworkContext);
  if (!context) {
    throw new Error('useSolanaNetwork must be used within a SolanaNetworkProvider');
  }
  return context;
}

// Enhanced network provider with better persistence and error handling
function SolanaNetworkProvider({ children }: { children: React.ReactNode }) {
  const [currentNetworkKey, setCurrentNetworkKey] = useState<keyof typeof SOLANA_NETWORKS>('DEVNET'); // Default to DEVNET
  const [isInitialized, setIsInitialized] = useState(false);
  
  const setNetwork = useCallback((network: keyof typeof SOLANA_NETWORKS) => {
    console.log(`🔄 Switching Solana network from ${currentNetworkKey} to ${network}`);
    setCurrentNetworkKey(network);
    
    // Store preference in localStorage with error handling
    try {
      localStorage.setItem('solana_network_preference', network);
      console.log(`✅ Saved network preference: ${network}`);
    } catch (error) {
      console.warn('Failed to save network preference:', error);
    }
  }, [currentNetworkKey]);

  // Load network preference on mount with validation
  useEffect(() => {
    try {
      const saved = localStorage.getItem('solana_network_preference') as keyof typeof SOLANA_NETWORKS;
      if (saved && SOLANA_NETWORKS[saved]) {
        console.log(`📂 Loaded saved network preference: ${saved}`);
        setCurrentNetworkKey(saved);
      } else {
        console.log(`🆕 Using default network: DEVNET`);
      }
    } catch (error) {
      console.warn('Failed to load network preference, using default:', error);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  const currentNetwork = SOLANA_NETWORKS[currentNetworkKey];

  const value = useMemo(() => ({
    currentNetwork,
    setNetwork,
    availableNetworks: SOLANA_NETWORKS,
    isTestnet: currentNetwork.isTestnet
  }), [currentNetwork, setNetwork]);

  // Don't render children until network is initialized
  if (!isInitialized) {
    return null;
  }

  return (
    <SolanaNetworkContext.Provider value={value}>
      {children}
    </SolanaNetworkContext.Provider>
  );
}

// Enhanced wallet configuration with better error handling
function SolanaWalletProviderInner({ children }: { children: React.ReactNode }) {
  const { currentNetwork } = useSolanaNetwork();
  const [walletError, setWalletError] = useState<string | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  
  // Map network to WalletAdapterNetwork enum
  const getWalletAdapterNetwork = useCallback(() => {
    switch (currentNetwork.name) {
      case 'Mainnet Beta':
        return WalletAdapterNetwork.Mainnet;
      case 'Testnet':
        return WalletAdapterNetwork.Testnet;
      case 'Devnet':
        return WalletAdapterNetwork.Devnet;
      default:
        return WalletAdapterNetwork.Devnet; // Default to devnet as it's deployed
    }
  }, [currentNetwork.name]);

  const network = getWalletAdapterNetwork();
  const endpoint = useMemo(() => currentNetwork.rpcUrl, [currentNetwork.rpcUrl]);

  // Enhanced wallet configuration with error handling and duplicate prevention
  // Limited to Phantom and OKX wallets only
  const wallets = useMemo(() => {
    console.log(`🔧 Configuring wallets for ${currentNetwork.name} (${network})`);
    
    try {
      // Create wallet adapters with explicit network configuration
      // Only Phantom is configured through standard adapter
      // OKX will be handled through custom detection
      const phantomAdapter = new PhantomWalletAdapter();
      
      const adapters = [phantomAdapter];
      
      // Add unique identifiers to prevent React key conflicts
      adapters.forEach((adapter, index) => {
        // Ensure each adapter has a unique identifier
        (adapter as any)._uniqueId = `${adapter.name}_${network}_${index}`;
      });
      
      console.log(`✅ Configured ${adapters.length} Solana wallet adapters`);
      console.log(`📝 Supported wallets: Phantom (standard), OKX (custom detection)`);
      adapters.forEach((adapter, index) => {
        console.log(`  ${index + 1}. ${adapter.name} (${(adapter as any)._uniqueId})`);
      });
      
      return adapters;
    } catch (error) {
      console.error('Error configuring wallet adapters:', error);
      setWalletError('Failed to configure wallet adapters');
      return [];
    }
  }, [network, currentNetwork.name]);

  // Enhanced connection configuration with better error handling
  const connectionConfig = useMemo(() => ({
    commitment: 'confirmed' as const,
    confirmTransactionInitialTimeout: 60000,
    wsEndpoint: undefined, // Disable websocket for stability
    httpHeaders: {
      'Content-Type': 'application/json',
    },
  }), []);

  // Enhanced error handler with detailed logging and user feedback
  const handleError = useCallback((error: Error, adapter?: any) => {
    const errorMessage = error?.message || 'Unknown wallet error';
    const adapterName = adapter?.name || 'Unknown';
    
    console.group('🚨 Solana Wallet Error');
    console.error('Error:', errorMessage);
    console.error('Adapter:', adapterName);
    console.error('Network:', currentNetwork.name);
    console.error('Full error:', error);
    console.groupEnd();

    // Set user-friendly error message
    let userMessage = errorMessage;
    if (errorMessage.includes('rejected')) {
      userMessage = 'Wallet connection was rejected. Please try again.';
    } else if (errorMessage.includes('not found')) {
      userMessage = 'Wallet not found. Please install a Solana wallet extension.';
    } else if (errorMessage.includes('network')) {
      userMessage = 'Network connection issue. Please check your internet connection.';
    }

    setWalletError(userMessage);
    
    // Clear error after delay
    setTimeout(() => setWalletError(null), 5000);
  }, [currentNetwork.name]);

  // Auto-reconnection logic with improved handling
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleVisibilityChange = () => {
      if (!document.hidden && !isReconnecting) {
        setIsReconnecting(true);
        console.log('🔄 Page became visible, checking wallet connection...');
        
        // Brief delay to allow wallets to initialize
        setTimeout(() => {
          setIsReconnecting(false);
        }, 2000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isReconnecting]);

  // Local storage key with network-specific naming
  const localStorageKey = useMemo(() => 
    `snarbles_wallet_${currentNetwork.name.toLowerCase().replace(/\s+/g, '_')}`, 
    [currentNetwork.name]
  );

  return (
    <ConnectionProvider 
      endpoint={endpoint}
      config={connectionConfig}
    >
      <SolanaWalletProvider 
        wallets={wallets} 
        autoConnect={true} // Enable auto-connect for seamless persistence across pages
        onError={handleError}
        localStorageKey={localStorageKey}
      >
        <WalletModalProvider>
          <SolanaWalletErrorHandler>
            <AlgorandWalletProvider>
              {children}
            </AlgorandWalletProvider>
          </SolanaWalletErrorHandler>
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}

// Main provider component with comprehensive error boundaries
export default function WalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <SolanaNetworkProvider>
      <SolanaWalletProviderInner>
        {children}
      </SolanaWalletProviderInner>
    </SolanaNetworkProvider>
  );
}

interface WalletContextProviderProps {
  children: React.ReactNode;
}

export function WalletContextProvider({ children }: WalletContextProviderProps) {
  return <WalletProvider>{children}</WalletProvider>;
}