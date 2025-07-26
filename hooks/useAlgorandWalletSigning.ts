'use client';

import { useCallback } from 'react';
import * as algosdk from 'algosdk';

/**
 * Custom hook for Algorand wallet transaction signing
 * Integrates with Pera Wallet and other Algorand wallet providers
 */
export function useAlgorandWalletSigning() {
  
  const signTransactions = useCallback(async (transactions: algosdk.Transaction[]): Promise<Uint8Array[]> => {
    try {
      console.log('🔐 Starting wallet signing process...', { count: transactions.length });
      
      // Check if we have a wallet connection
      if (typeof window === 'undefined') {
        throw new Error('Wallet signing only available in browser environment');
      }

      // For Pera Wallet integration, we need to:
      // 1. Import the Pera Wallet connector
      // 2. Check wallet connection status
      // 3. Request transaction signing
      
      // Try to get Pera Wallet instance
      let peraWallet: any = null;
      
      try {
        // Dynamic import to avoid SSR issues
        const { PeraWalletConnect } = await import('@perawallet/connect');
        peraWallet = new PeraWalletConnect({
          shouldShowSignTxnToast: true
        });
        console.log('✅ Pera Wallet connector initialized');
      } catch (error) {
        console.warn('⚠️ Pera Wallet not available, checking for other wallets...', error);
      }

      // Check if Pera Wallet is connected
      if (peraWallet) {
        try {
          const accounts = peraWallet.connector?.accounts || [];
          if (accounts.length === 0) {
            console.log('🔗 No connected accounts, attempting to connect...');
            const newAccounts = await peraWallet.connect();
            console.log('✅ Connected to Pera Wallet:', newAccounts);
          }

          // Convert transactions to the format expected by Pera Wallet
          const txnsToSign = transactions.map((txn, index) => ({
            txn: txn,
            signers: [], // Empty means the wallet should sign with the connected account
          }));

          console.log('📝 Requesting signature from Pera Wallet...');
          const signedTxns = await peraWallet.signTransaction([txnsToSign]);
          
          console.log('✅ Transactions signed successfully by Pera Wallet');
          return signedTxns;
          
        } catch (peraError) {
          console.error('❌ Pera Wallet signing failed:', peraError);
          throw new Error(`Pera Wallet signing failed: ${peraError}`);
        }
      }

      // Fallback: Check for browser extension wallets (like MyAlgo)
      if ((window as any).MyAlgoConnect) {
        console.log('🔍 Trying MyAlgo wallet...');
        const myAlgoWallet = new (window as any).MyAlgoConnect();
        
        try {
          const signedTxns = await myAlgoWallet.signTransaction(transactions);
          console.log('✅ Transactions signed by MyAlgo wallet');
          return signedTxns.map((signed: any) => signed.blob);
        } catch (myAlgoError) {
          console.error('❌ MyAlgo signing failed:', myAlgoError);
          throw new Error(`MyAlgo signing failed: ${myAlgoError}`);
        }
      }

      // If no wallet is available, provide a helpful error
      throw new Error(
        'No compatible Algorand wallet found. Please install and connect Pera Wallet or MyAlgo.'
      );

    } catch (error) {
      console.error('❌ Wallet signing process failed:', error);
      throw error;
    }
  }, []);

  const isWalletConnected = useCallback(async (): Promise<boolean> => {
    try {
      if (typeof window === 'undefined') return false;

      // Check Pera Wallet connection
      try {
        const { PeraWalletConnect } = await import('@perawallet/connect');
        const peraWallet = new PeraWalletConnect();
        const accounts = peraWallet.connector?.accounts || [];
        if (accounts.length > 0) {
          console.log('✅ Pera Wallet is connected');
          return true;
        }
      } catch (error) {
        console.log('⚠️ Pera Wallet not available');
      }

      // Check MyAlgo wallet
      if ((window as any).MyAlgoConnect) {
        console.log('✅ MyAlgo wallet is available');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking wallet connection:', error);
      return false;
    }
  }, []);

  return {
    signTransactions,
    isWalletConnected
  };
}

/**
 * Helper function to prepare transactions for wallet signing
 */
export function prepareTransactionsForSigning(transactions: algosdk.Transaction[]): algosdk.Transaction[] {
  return transactions.map(txn => {
    // Ensure all transactions have proper network configuration
    if (!txn.genesisID) {
      console.warn('⚠️ Transaction missing genesisID, this may cause signing issues');
    }
    return txn;
  });
}
