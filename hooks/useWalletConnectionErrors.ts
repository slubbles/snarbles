import { useCallback } from 'react';
import { 
  isMobileDevice, 
  needsWalletAppGuidance, 
  isMobileConnectionError 
} from '@/lib/mobile-wallet-detection';

interface WalletConnectionErrorHandler {
  handleConnectionError: (error: Error, walletType: 'solana' | 'algorand') => boolean;
  shouldShowMobileGuidance: (error: Error, walletType: 'solana' | 'algorand') => boolean;
}

export const useWalletConnectionErrors = (): WalletConnectionErrorHandler => {
  
  const shouldShowMobileGuidance = useCallback((error: Error, walletType: 'solana' | 'algorand'): boolean => {
    // CRITICAL: Only for mobile devices
    if (!isMobileDevice()) {
      console.log('🖥️ Desktop device - no mobile guidance needed');
      return false;
    }
    
    console.log('📱 Mobile device detected - evaluating wallet connection error');
    
    // Check if user needs wallet app guidance
    const needsGuidance = needsWalletAppGuidance(walletType);
    if (!needsGuidance) {
      console.log(`✅ Already in ${walletType} wallet app browser - no guidance needed`);
      return false;
    }
    
    // Check if this is a mobile-specific connection error
    const isMobileError = isMobileConnectionError(error);
    if (!isMobileError) {
      console.log('❌ Not a mobile connection error - standard error handling');
      return false;
    }
    
    console.log(`🎯 Mobile guidance triggered for ${walletType} wallet`);
    console.log(`📋 Error: ${error.message}`);
    
    return true;
  }, []);
  
  const handleConnectionError = useCallback((error: Error, walletType: 'solana' | 'algorand'): boolean => {
    return shouldShowMobileGuidance(error, walletType);
  }, [shouldShowMobileGuidance]);
  
  return { 
    handleConnectionError,
    shouldShowMobileGuidance
  };
};
