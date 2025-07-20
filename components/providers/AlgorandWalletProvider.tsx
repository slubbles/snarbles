'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import algosdk from 'algosdk';
import { getAlgorandNetwork, ALGORAND_NETWORKS } from '@/lib/algorand';

// Import the actual PeraWalletConnect type
import type { PeraWalletConnect } from '@perawallet/connect';

interface AlgorandWalletContextType {
  connected: boolean;
  address: string | null;
  selectedNetwork: string;
  setSelectedNetwork: (network: string) => void;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signTransaction: (txn: any) => Promise<any>;
  signAtomicGroup: (transactions: any[]) => Promise<Uint8Array[]>;
  peraWallet: PeraWalletConnect | null;
  isConnecting: boolean;
  isPeraWalletReady: boolean;
  error: string | null;
  balance: number | null;
  networkConfig: any;
}

const AlgorandWalletContext = createContext<AlgorandWalletContextType | null>(null);

interface AlgorandWalletProviderProps {
  children: ReactNode;
}

export function AlgorandWalletProvider({ children }: AlgorandWalletProviderProps) {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<string>('algorand-mainnet'); // Default to mainnet for production
  const [peraWallet, setPeraWallet] = useState<PeraWalletConnect | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPeraWalletReady, setIsPeraWalletReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [networkSwitching, setNetworkSwitching] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [networkConfig, setNetworkConfig] = useState(getAlgorandNetwork('algorand-mainnet'));

  // Check network connectivity specifically for mobile wallet apps
  const checkNetworkConnectivity = async () => {
    try {
      // Multiple connectivity checks for mobile wallet apps
      if (!navigator.onLine) {
        throw new Error('Device appears to be offline');
      }

      // For Pera wallet app browsers, try a simple network request
      const testUrl = 'https://mainnet-api.algonode.cloud/health';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      try {
        const response = await fetch(testUrl, {
          signal: controller.signal,
          mode: 'no-cors' // Important for CORS in mobile apps
        });
        clearTimeout(timeoutId);
        
        console.log('✅ Network connectivity confirmed');
        return true;
      } catch (fetchError) {
        clearTimeout(timeoutId);
        console.warn('⚠️ Network test failed, but continuing anyway:', fetchError);
        // Don't throw here - mobile apps often block external requests
        return true;
      }
    } catch (error) {
      console.error('❌ Network connectivity check failed:', error);
      throw new Error('No internet connection available. Please check your connection and try again.');
    }
  };

  // Update network configuration when selected network changes
  useEffect(() => {
    console.log(`🔄 Algorand network changed to: ${selectedNetwork}`);
    const config = getAlgorandNetwork(selectedNetwork);
    
    // Track network switching state
    setNetworkSwitching(true);
    
    setNetworkConfig(config);
    
    // Clear network switching state after a delay
    setTimeout(() => setNetworkSwitching(false), 1000);
  }, [selectedNetwork]);

  // Initialize/reinitialize Pera Wallet when network changes
  useEffect(() => {
    const initializeWallet = async () => {
      setIsPeraWalletReady(false);
      setError(null);
      
      try {
        console.log(`🔧 Initializing Pera Wallet for ${selectedNetwork}`);
        
        // If there's an existing connection, disconnect first
        if (peraWallet && connected) {
          console.log('📤 Disconnecting from previous network...');
          try {
            await peraWallet.disconnect();
          } catch (disconnectError) {
            console.warn('Warning during disconnect:', disconnectError);
          }
          setConnected(false);
          setAddress(null);
          setBalance(null);
        }

        // Clean up any existing ethereum property conflicts
        if (typeof window !== 'undefined' && window.ethereum) {
          try {
            // Temporarily store ethereum reference if it exists
            const existingEthereum = window.ethereum;
            console.log('🔧 Handling ethereum property conflict...');
          } catch (ethError) {
            console.warn('Ethereum property conflict detected and handled:', ethError);
          }
        }

        // Dynamic import to avoid SSR issues
        const { PeraWalletConnect } = await import('@perawallet/connect');
        
        // Get the chain ID for the selected network
        const config = getAlgorandNetwork(selectedNetwork);
        console.log(`🌐 Creating Pera Wallet instance for chainId: ${config.chainId}`);
        
        const wallet = new PeraWalletConnect({
          chainId: config.chainId,
          shouldShowSignTxnToast: true,
          compactMode: false
        });
        
        setPeraWallet(wallet);

        // Listen for disconnect events - safely check if connector exists and has the 'on' method
        if (wallet.connector && typeof wallet.connector.on === 'function') {
          wallet.connector.on('disconnect', () => {
            console.log('📱 Pera Wallet disconnected');
            setConnected(false);
            setAddress(null);
            setBalance(null);
            setError(null);
            
            // Dispatch a custom event when wallet disconnects
            const event = new CustomEvent('algorand-wallet-change', { detail: { connected: false } });
            window.dispatchEvent(event);
          });
        }

        // Add a small delay to ensure wallet is fully initialized
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log(`✅ Pera Wallet ready for ${selectedNetwork}`);
        setIsPeraWalletReady(true);
        
        // Try to reconnect to existing session on the new network
        try {
          const accounts = await wallet.reconnectSession();
          if (accounts.length > 0) {
            console.log(`✅ Reconnected to existing session on ${selectedNetwork}:`, accounts[0]);
            setConnected(true);
            setAddress(accounts[0]);
            
            // Dispatch a custom event when wallet connects
            const event = new CustomEvent('algorand-wallet-change', { detail: { connected: true, address: accounts[0] } });
            window.dispatchEvent(event);
            
            await updateBalance(accounts[0]);
          }
        } catch (reconnectError) {
          console.log(`ℹ️ No existing session found for ${selectedNetwork}`);
        }

      } catch (error) {
        console.error(`❌ Failed to initialize Pera Wallet for ${selectedNetwork}:`, error);
        setError(`Failed to initialize wallet for ${selectedNetwork}`);
      }
    };

    initializeWallet();
  }, [selectedNetwork]); // React to network changes

  const updateBalance = async (walletAddress: string) => {
    try {
      const { getAlgorandAccountInfo } = await import('@/lib/algorand');
      const accountInfo = await getAlgorandAccountInfo(walletAddress, selectedNetwork);
      
      if (accountInfo.success) {
        setBalance(accountInfo.balance || 0);
        console.log(`💰 Balance updated: ${accountInfo.balance} ALGO on ${selectedNetwork}`);
      }
    } catch (error) {
      console.error('Failed to update balance:', error);
    }
  };

  const connect = async () => {
    if (!peraWallet || !isPeraWalletReady) {
      const errorMsg = !peraWallet 
        ? `Pera Wallet not initialized for ${selectedNetwork}`
        : `Pera Wallet not ready for ${selectedNetwork}. Please wait a moment and try again.`;
      throw new Error(errorMsg);
    }

    // Check network connectivity for mobile wallet apps
    try {
      await checkNetworkConnectivity();
    } catch (connectivityError: any) {
      setError(connectivityError.message);
      throw connectivityError;
    }

    setIsConnecting(true);
    setNetworkSwitching(false);
    setError(null);

    try {
      console.log(`🔗 Connecting to Pera Wallet on ${selectedNetwork}...`);
      
      // For mainnet connections, add additional validation
      if (selectedNetwork === 'algorand-mainnet') {
        console.log('🚨 Connecting to Algorand Mainnet - please ensure your Pera Wallet is set to Mainnet');
      }
      
      // Add a small delay for mobile wallet app readiness
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const accounts = await peraWallet.connect();
      
      if (accounts.length > 0) {
        setConnected(true);
        setAddress(accounts[0]);
        
        // Dispatch a custom event when wallet connects
        const event = new CustomEvent('algorand-wallet-change', {
          detail: { connected: true, address: accounts[0], network: selectedNetwork }
        });
        window.dispatchEvent(event);
        await updateBalance(accounts[0]);
        
        console.log(`✅ Successfully connected to ${selectedNetwork}:`, accounts[0]);
      }
    } catch (error) {
      console.error(`❌ Failed to connect to Pera Wallet on ${selectedNetwork}:`, error);
      
      let errorMessage = `Failed to connect to Algorand ${networkConfig.name}`;
      if (error instanceof Error) {
        if (error.message.includes('cancelled') || error.message.includes('rejected')) {
          errorMessage = 'Connection cancelled by user';
        } else if (error.message.includes('network') || error.message.includes('internet')) {
          errorMessage = `Network error connecting to ${networkConfig.name}. Please check your internet connection and ensure Pera Wallet is properly connected.`;
        } else if (error.message.includes('mismatch')) {
          errorMessage = `Network mismatch error. Please ensure your Pera Wallet is set to ${networkConfig.name}.`;
        } else if (selectedNetwork === 'algorand-mainnet' && error.message.includes('chain')) {
          errorMessage = `Mainnet connection failed. Please ensure your Pera Wallet is configured for Algorand Mainnet (not Testnet).`;
        } else {
          errorMessage = `${networkConfig.name}: ${error.message}`;
        }
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    if (!peraWallet) return;

    try {
      console.log(`📤 Disconnecting from ${selectedNetwork}...`);
      await peraWallet.disconnect();
      setConnected(false);
      setAddress(null);
      setBalance(null);
      setError(null);
      console.log(`✅ Successfully disconnected from ${selectedNetwork}`);
    } catch (error) {
      console.error(`❌ Failed to disconnect from ${selectedNetwork}:`, error);
      // Don't throw here, just log the error
    } finally {
      // Reset wallet ready state when disconnecting
      setIsPeraWalletReady(false);
      // Reinitialize wallet for current network
      setTimeout(() => {
        const config = getAlgorandNetwork(selectedNetwork);
        setNetworkConfig(config);
      }, 100);
    }
  };

  const signTransaction = async (txn: any) => {
    if (!peraWallet || !address) {
      throw new Error(`Wallet not connected to ${selectedNetwork}`);
    }

    setError(null);

    try {
      // Check network connectivity before signing
      await checkNetworkConnectivity();
      
      console.log(`📝 Signing transaction on ${selectedNetwork}...`);
      console.log('Transaction details:', {
        type: typeof txn,
        constructor: txn?.constructor?.name,
        isTransaction: txn instanceof algosdk.Transaction,
        network: selectedNetwork,
        chainId: networkConfig.chainId
      });
      
      // Validate that we have a proper algosdk.Transaction object
      if (!(txn instanceof algosdk.Transaction)) {
        throw new Error('Invalid transaction object - must be algosdk.Transaction instance');
      }
      
      console.log('✓ Transaction validation passed');
      console.log(`📱 Sending to Pera Wallet for signing on ${selectedNetwork}...`);

      // Format transaction for Pera Wallet - it expects SignerTransaction[][]
      const signerTransaction = {
        txn: txn,
        signers: [address]
      };

      console.log('Formatted SignerTransaction for', selectedNetwork);

      // Add a small delay to ensure wallet app is ready
      await new Promise(resolve => setTimeout(resolve, 500));

      // CRITICAL: Pera Wallet expects SignerTransaction[][]
      const signedTxns = await peraWallet.signTransaction([[signerTransaction]]);
      
      if (!signedTxns || signedTxns.length === 0) {
        throw new Error('Transaction signing failed - no signed transaction returned');
      }
      
      console.log(`✅ Transaction signed successfully on ${selectedNetwork}`);
      
      // Extract the first signed transaction
      const firstSignedTxn = signedTxns[0];

      // Ensure we have a Uint8Array for submission
      let signedTxnBytes: Uint8Array;
      
      if (firstSignedTxn instanceof Uint8Array) {
        signedTxnBytes = firstSignedTxn;
      } else if (Array.isArray(firstSignedTxn)) {
        signedTxnBytes = new Uint8Array(firstSignedTxn);
      } else if (firstSignedTxn && typeof firstSignedTxn === 'object' && 'blob' in firstSignedTxn) {
        signedTxnBytes = new Uint8Array((firstSignedTxn as any).blob);
      } else {
        console.error('Unexpected signed transaction format:', firstSignedTxn);
        throw new Error(`Unexpected signed transaction format: ${typeof firstSignedTxn}`);
      }

      console.log(`✅ Transaction ready for submission to ${selectedNetwork}`);
      
      return signedTxnBytes;
    } catch (error) {
      console.error(`❌ Transaction signing failed on ${selectedNetwork}:`, error);
      
      let errorMessage = `Failed to sign transaction on ${networkConfig.name}`;
      if (error instanceof Error) {
        if (error.message.includes('cancelled') || error.message.includes('rejected')) {
          errorMessage = 'Transaction cancelled by user';
        } else if (error.message.includes('insufficient')) {
          errorMessage = `Insufficient balance for transaction on ${networkConfig.name}`;
        } else if (error.message.includes('network') || error.message.includes('internet') || error.message.includes('connectivity')) {
          errorMessage = 'Network connection error. Please check your internet connection and try again.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Transaction timed out. Please try again.';
        } else {
          errorMessage = `${networkConfig.name}: ${error.message}`;
        }
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const signAtomicGroup = async (transactions: any[]) => {
    if (!peraWallet || !address) {
      throw new Error(`Wallet not connected to ${selectedNetwork}`);
    }

    setError(null);

    try {
      console.log(`📝 Signing atomic transaction group on ${selectedNetwork}...`);
      console.log('Group contains', transactions.length, 'transactions');
      
      // Validate that we have proper algosdk.Transaction objects
      for (let i = 0; i < transactions.length; i++) {
        if (!(transactions[i] instanceof algosdk.Transaction)) {
          throw new Error(`Transaction ${i} is not a valid algosdk.Transaction instance`);
        }
      }
      
      console.log('✓ All transactions validated');
      console.log(`📱 Sending atomic group to Pera Wallet for signing on ${selectedNetwork}...`);

      // Format transactions for Pera Wallet - it expects SignerTransaction[]
      const signerTransactions = transactions.map((txn, index) => ({
        txn: txn,
        signers: [address] // All transactions signed by the same address
      }));

      console.log('Formatted atomic group for', selectedNetwork);

      // Sign the atomic group - Pera Wallet expects SignerTransaction[][]
      const signedTxns = await peraWallet.signTransaction([signerTransactions]);
      
      if (!signedTxns || signedTxns.length === 0) {
        throw new Error('Atomic group signing failed - no signed transactions returned');
      }
      
      console.log(`✅ Atomic group signed successfully on ${selectedNetwork}`);
      
      // Since we passed [signerTransactions], the result is an array where the first element
      // contains our group of signed transactions
      const signedGroup = signedTxns[0];
      
      if (!signedGroup || !Array.isArray(signedGroup)) {
        throw new Error('Atomic group signing failed - invalid response format');
      }
      
      // Convert all signed transactions to Uint8Array format
      const signedTransactions: Uint8Array[] = [];
      
      for (const signedTxn of signedGroup) {
        let signedTxnBytes: Uint8Array;
        
        if (signedTxn instanceof Uint8Array) {
          signedTxnBytes = signedTxn;
        } else if (Array.isArray(signedTxn)) {
          signedTxnBytes = new Uint8Array(signedTxn);
        } else if (signedTxn && typeof signedTxn === 'object' && 'blob' in signedTxn) {
          signedTxnBytes = new Uint8Array((signedTxn as any).blob);
        } else {
          console.error('Unexpected signed transaction format:', signedTxn);
          throw new Error(`Unexpected signed transaction format: ${typeof signedTxn}`);
        }
        
        signedTransactions.push(signedTxnBytes);
      }

      console.log(`✅ Atomic group ready for submission to ${selectedNetwork}`);
      
      return signedTransactions;
    } catch (error) {
      console.error(`❌ Atomic group signing failed on ${selectedNetwork}:`, error);
      
      let errorMessage = `Failed to sign atomic group on ${networkConfig.name}`;
      if (error instanceof Error) {
        if (error.message.includes('cancelled') || error.message.includes('rejected')) {
          errorMessage = 'Atomic group signing cancelled by user';
        } else if (error.message.includes('insufficient')) {
          errorMessage = `Insufficient balance for atomic group on ${networkConfig.name}`;
        } else {
          errorMessage = `${networkConfig.name}: ${error.message}`;
        }
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Network switching helper
  const switchNetwork = async (newNetwork: string) => {
    console.log(`🔄 Switching from ${selectedNetwork} to ${newNetwork}`);
    
    // Don't do anything if network is the same
    if (newNetwork === selectedNetwork) {
      console.log('ℹ️ Already on the requested network');
      return;
    }

    // Begin network switching
    setNetworkSwitching(true);
    
    // Validate network
    if (!ALGORAND_NETWORKS[newNetwork as keyof typeof ALGORAND_NETWORKS]) {
      throw new Error(`Unsupported network: ${newNetwork}`);
    }

    // Set wallet as not ready during network switch
    setIsPeraWalletReady(false);
    
    // Notify user of network change
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('algorand-network-change', {
        detail: { network: newNetwork, previousNetwork: selectedNetwork }
      });
      window.dispatchEvent(event);
    }
    
    setSelectedNetwork(newNetwork);
    
    // Clear network switching state after a delay
    setTimeout(() => {
      setNetworkSwitching(false);
    }, 1500);
    // The useEffect will handle the wallet reinitialization
  };

  const value: AlgorandWalletContextType = {
    connected,
    address,
    selectedNetwork,
    setSelectedNetwork: switchNetwork,
    connect,
    disconnect,
    signTransaction,
    signAtomicGroup,
    peraWallet,
    isConnecting,
    isPeraWalletReady,
    error,
    balance,
    networkConfig,
  };

  return (
    <AlgorandWalletContext.Provider value={value}>
      {children}
    </AlgorandWalletContext.Provider>
  );
}

export function useAlgorandWallet() {
  const context = useContext(AlgorandWalletContext);
  if (!context) {
    throw new Error('useAlgorandWallet must be used within AlgorandWalletProvider');
  }
  return context;
}