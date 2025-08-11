/**
 * Mobile Wallet Detection Utilities
 * Ensures mobile-specific guidance only appears on mobile devices
 */

export const isMobileDevice = (): boolean => {
  // Only run on client side
  if (typeof window === 'undefined') return false;
  
  // Check user agent for mobile indicators
  const mobileRegex = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  const isMobileUA = mobileRegex.test(navigator.userAgent);
  
  // Additional check for touch capability and screen size
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth <= 768; // Mobile breakpoint
  
  // Must be mobile UA AND (touch capable OR small screen)
  return isMobileUA && (isTouchDevice || isSmallScreen);
};

export const isPhantomAppBrowser = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check if we're in Phantom's in-app browser
  const phantom = (window as any).phantom;
  return !!(phantom?.solana?.isPhantom);
};

export const isPeraAppBrowser = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check if we're in Pera Wallet's in-app browser
  const peraWallet = (window as any).PeraWallet;
  const algorand = (window as any).algorand;
  
  return !!(peraWallet || algorand);
};

export const needsWalletAppGuidance = (walletType: 'solana' | 'algorand'): boolean => {
  // CRITICAL: Only apply to mobile devices
  const mobile = isMobileDevice();
  if (!mobile) {
    console.log('🖥️ Desktop detected - skipping mobile wallet guidance');
    return false;
  }
  
  console.log('📱 Mobile device detected - checking wallet app browser status');
  
  if (walletType === 'solana') {
    const inPhantomApp = isPhantomAppBrowser();
    console.log(`🟣 Phantom app browser: ${inPhantomApp}`);
    return !inPhantomApp;
  }
  
  if (walletType === 'algorand') {
    const inPeraApp = isPeraAppBrowser();
    console.log(`🟡 Pera app browser: ${inPeraApp}`);
    return !inPeraApp;
  }
  
  return false;
};

// Common mobile wallet connection error patterns
export const MOBILE_CONNECTION_ERRORS = [
  'user rejected',
  'wallet not found',
  'connection failed',
  'no provider',
  'wallet_requestPermissions',
  'user denied',
  'connection_error',
  'wallet_connect_modal_closed'
];

export const isMobileConnectionError = (error: Error): boolean => {
  const errorMessage = error.message.toLowerCase();
  return MOBILE_CONNECTION_ERRORS.some(pattern => 
    errorMessage.includes(pattern.toLowerCase())
  );
};
