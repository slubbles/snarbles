// Mobile wallet utility functions
export const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const isIOS = () => {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

export const isAndroid = () => {
  if (typeof window === 'undefined') return false;
  return /Android/.test(navigator.userAgent);
};

export const isInAppBrowser = () => {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('instagram') || ua.includes('fbav') || ua.includes('twitter');
};

// Check if user is in a mobile wallet's in-app browser
export const isPhantomMobileBrowser = () => {
  if (typeof window === 'undefined') return false;
  return !!(window as any).phantom?.solana?.isPhantom && isMobile();
};

export const isPeraMobileBrowser = () => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isPeraApp = userAgent.includes('pera') || 
                   userAgent.includes('algorand') ||
                   !!(window as any).algorand ||
                   userAgent.includes('wallet');
  
  // Additional check for Pera wallet app browser context
  const isInAppBrowser = userAgent.includes('wv') || // WebView indicator
                        userAgent.includes('version/') && userAgent.includes('mobile');
  
  return isMobile() && (isPeraApp || (isInAppBrowser && !!(window as any).algorand));
};

// Deep link generators
export const generatePhantomDeepLink = (dappUrl: string) => {
  const encodedUrl = encodeURIComponent(dappUrl);
  return `https://phantom.app/ul/browse/${encodedUrl}?ref=snarbles`;
};

export const generatePeraDeepLink = (dappUrl: string) => {
  const encodedUrl = encodeURIComponent(dappUrl);
  return `perawallet://walletconnect?uri=${encodedUrl}`;
};

// App store links
export const PHANTOM_APP_STORE_LINKS = {
  ios: 'https://apps.apple.com/us/app/phantom-solana-wallet/id1598432977',
  android: 'https://play.google.com/store/apps/details?id=app.phantom',
};

export const PERA_APP_STORE_LINKS = {
  ios: 'https://apps.apple.com/us/app/pera-algo-wallet/id1459898525',
  android: 'https://play.google.com/store/apps/details?id=com.algorand.android',
};

// Mobile wallet connection flow
export const shouldUseMobileFlow = (walletType: 'phantom' | 'pera') => {
  if (!isMobile()) return false;
  
  // If already in the wallet's mobile browser, use standard flow
  if (walletType === 'phantom' && isPhantomMobileBrowser()) return false;
  if (walletType === 'pera' && isPeraMobileBrowser()) return false;
  
  return true;
};

// Generate current page URL for deep linking
export const getCurrentPageUrl = () => {
  if (typeof window === 'undefined') return 'https://snarbles.xyz';
  return window.location.href;
};

// Mobile-specific wallet connection attempt
export const attemptMobileWalletConnection = async (
  walletType: 'phantom' | 'pera',
  fallbackToAppStore = true
) => {
  const currentUrl = getCurrentPageUrl();
  
  if (walletType === 'phantom') {
    const deepLink = generatePhantomDeepLink(currentUrl);
    
    try {
      // Try to open the wallet app
      window.location.href = deepLink;
      
      // If that fails after a timeout, redirect to app store
      if (fallbackToAppStore) {
        setTimeout(() => {
          const appStoreLink = isIOS() 
            ? PHANTOM_APP_STORE_LINKS.ios 
            : PHANTOM_APP_STORE_LINKS.android;
          window.location.href = appStoreLink;
        }, 3000);
      }
      
      return { success: true, method: 'deeplink' };
    } catch (error) {
      console.error('Failed to open Phantom app:', error);
      return { success: false, error: 'Failed to open Phantom app' };
    }
  }
  
  if (walletType === 'pera') {
    try {
      // Check network connectivity first
      if (!navigator.onLine) {
        return { success: false, error: 'No internet connection available' };
      }
      
      // For Pera, we'll use WalletConnect protocol with enhanced error handling
      const deepLink = generatePeraDeepLink(currentUrl);
      console.log('🔗 Opening Pera wallet with deep link:', deepLink);
      
      // Use window.location.href for better compatibility in Pera app browser
      window.location.href = deepLink;
      
      // Add fallback timeout for app opening
      const openPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout opening Pera app'));
        }, 10000); // 10 second timeout
        
        // Clear timeout if page visibility changes (app opened)
        const handleVisibilityChange = () => {
          if (document.hidden) {
            clearTimeout(timeout);
            resolve(true);
          }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Also resolve if focus changes
        const handleBlur = () => {
          clearTimeout(timeout);
          resolve(true);
          window.removeEventListener('blur', handleBlur);
        };
        
        window.addEventListener('blur', handleBlur);
      });
      
      await openPromise;
      
      // Fallback to app store if needed
      if (fallbackToAppStore) {
        setTimeout(() => {
          const appStoreLink = isIOS() 
            ? PERA_APP_STORE_LINKS.ios 
            : PERA_APP_STORE_LINKS.android;
          window.location.href = appStoreLink;
        }, 3000);
      }
      
      return { success: true, method: 'deeplink' };
    } catch (error) {
      console.error('Failed to open Pera app:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to open Pera app' 
      };
    }
  }
  
  return { success: false, error: 'Unsupported wallet type' };
};
