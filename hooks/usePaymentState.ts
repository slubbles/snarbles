'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PaymentState {
  selectedMethod: 'credits' | 'algo_direct' | null;
  isProcessing: boolean;
  lastError: string | null;
  transactionId: string | null;
  tokenCreationStep: number;
  steps: string[];
  userCredits: number;
  walletBalance: number | null;
  isConnected: boolean;
  network: 'algorand' | 'solana' | null;
}

interface PaymentActions {
  setSelectedMethod: (method: 'credits' | 'algo_direct') => void;
  setProcessing: (processing: boolean) => void;
  setError: (error: string | null) => void;
  setTransactionId: (txId: string | null) => void;
  setTokenCreationStep: (step: number) => void;
  setUserCredits: (credits: number) => void;
  setWalletBalance: (balance: number | null) => void;
  setIsConnected: (connected: boolean) => void;
  setNetwork: (network: 'algorand' | 'solana' | null) => void;
  resetPayment: () => void;
  clearError: () => void;
}

type PaymentStore = PaymentState & PaymentActions;

const initialState: PaymentState = {
  selectedMethod: null,
  isProcessing: false,
  lastError: null,
  transactionId: null,
  tokenCreationStep: 0,
  steps: [
    'Preparing payment',
    'Confirming transaction',
    'Sign transaction on Pera Wallet app',
    'Processing',
    'Success'
  ],
  userCredits: 0,
  walletBalance: null,
  isConnected: false,
  network: null
};

export const usePaymentState = create<PaymentStore>()(
  persist(
    (set) => ({
      ...initialState,
      
      setSelectedMethod: (method: 'credits' | 'algo_direct') => {
        set({ selectedMethod: method, lastError: null });
      },
      
      setProcessing: (processing: boolean) => {
        set({ isProcessing: processing });
        if (processing) {
          set({ lastError: null });
        }
      },
      
      setError: (error: string | null) => {
        set({ lastError: error, isProcessing: false });
      },
      
      setTransactionId: (txId: string | null) => {
        set({ transactionId: txId });
      },
      
      setTokenCreationStep: (step: number) => {
        set({ tokenCreationStep: step });
      },
      
      setUserCredits: (credits: number) => {
        set({ userCredits: credits });
      },
      
      setWalletBalance: (balance: number | null) => {
        set({ walletBalance: balance });
      },
      
      setIsConnected: (connected: boolean) => {
        set({ isConnected: connected });
        if (!connected) {
          set({ walletBalance: null });
        }
      },
      
      setNetwork: (network: 'algorand' | 'solana' | null) => {
        set({ network });
      },
      
      resetPayment: () => {
        set({
          selectedMethod: null,
          isProcessing: false,
          lastError: null,
          transactionId: null,
          tokenCreationStep: 0
        });
      },
      
      clearError: () => {
        set({ lastError: null });
      }
    }),
    {
      name: 'snarbles-payment-state',
      partialize: (state: PaymentStore) => ({
        selectedMethod: state.selectedMethod,
        userCredits: state.userCredits,
        network: state.network
      })
    }
  )
);

// Computed selectors
export const usePaymentSelectors = () => {
  const state = usePaymentState();
  
  return {
    canPay: state.selectedMethod !== null && state.isConnected && !state.isProcessing,
    hasEnoughCredits: state.userCredits >= 10, // Check credits regardless of selection
    hasEnoughAlgo: state.walletBalance !== null && state.walletBalance >= 10, // Check ALGO regardless of selection
    currentStep: state.steps[state.tokenCreationStep] || 'Preparing',
    progressPercentage: (state.tokenCreationStep / (state.steps.length - 1)) * 100,
    isAlgorandNetwork: state.network === 'algorand',
    needsConnection: !state.isConnected,
    hasError: state.lastError !== null
  };
};
