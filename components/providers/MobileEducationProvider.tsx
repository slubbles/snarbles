'use client';

import React, { createContext, useContext, useCallback } from 'react';
import { useWalletConnectionErrors } from '@/hooks/useWalletConnectionErrors';

interface MobileEducationContextType {
  showMobileGuidance: (walletType: 'solana' | 'algorand', error?: string) => void;
}

const MobileEducationContext = createContext<MobileEducationContextType | null>(null);

export const useMobileEducation = () => {
  const context = useContext(MobileEducationContext);
  if (!context) {
    throw new Error('useMobileEducation must be used within a MobileEducationProvider');
  }
  return context;
};

interface MobileEducationProviderProps {
  children: React.ReactNode;
  onShowGuidance: (walletType: 'solana' | 'algorand', error?: string) => void;
}

export const MobileEducationProvider: React.FC<MobileEducationProviderProps> = ({
  children,
  onShowGuidance
}) => {
  const { handleConnectionError } = useWalletConnectionErrors();

  const showMobileGuidance = useCallback((walletType: 'solana' | 'algorand', error?: string) => {
    const mockError = new Error(error || 'Connection failed');
    
    // Check if this should trigger mobile guidance
    if (handleConnectionError(mockError, walletType)) {
      onShowGuidance(walletType, error);
    }
  }, [handleConnectionError, onShowGuidance]);

  const value = {
    showMobileGuidance
  };

  return (
    <MobileEducationContext.Provider value={value}>
      {children}
    </MobileEducationContext.Provider>
  );
};
