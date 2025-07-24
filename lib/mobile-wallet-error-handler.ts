import { toast } from '@/hooks/use-toast';

// Enhanced error messages for mobile wallet issues
export interface MobileWalletErrorInfo {
  code: string;
  message: string;
  userAction: string;
  severity: 'warning' | 'error' | 'info';
  canRetry: boolean;
  needsWalletRestart?: boolean;
  needsBrowserSwitch?: boolean;
}

// Common mobile wallet error patterns
export const MOBILE_WALLET_ERRORS: Record<string, MobileWalletErrorInfo> = {
  WALLET_NOT_CONNECTED: {
    code: 'WALLET_NOT_CONNECTED',
    message: 'Wallet not connected',
    userAction: 'Please connect your wallet and try again',
    severity: 'warning',
    canRetry: true
  },
  
  INSUFFICIENT_BALANCE: {
    code: 'INSUFFICIENT_BALANCE',
    message: 'Insufficient SOL balance for transaction fees',
    userAction: 'Please add more SOL to your wallet. You need at least 0.02 SOL.',
    severity: 'error',
    canRetry: true
  },
  
  USER_REJECTED: {
    code: 'USER_REJECTED',
    message: 'Transaction was rejected by user',
    userAction: 'Please approve the transaction in your wallet to continue',
    severity: 'warning',
    canRetry: true
  },
  
  SIGNING_TIMEOUT: {
    code: 'SIGNING_TIMEOUT',
    message: 'Transaction signing timed out',
    userAction: 'Please make sure your wallet app is open and responsive, then try again',
    severity: 'error',
    canRetry: true,
    needsWalletRestart: true
  },
  
  NETWORK_ERROR: {
    code: 'NETWORK_ERROR',
    message: 'Network connection error',
    userAction: 'Please check your internet connection and try again',
    severity: 'error',
    canRetry: true
  },
  
  TRANSACTION_EXPIRED: {
    code: 'TRANSACTION_EXPIRED',
    message: 'Transaction expired',
    userAction: 'The transaction took too long to process. Please try creating your token again.',
    severity: 'warning',
    canRetry: true
  },
  
  CONFIRMATION_TIMEOUT: {
    code: 'CONFIRMATION_TIMEOUT',
    message: 'Transaction confirmation timeout',
    userAction: 'Your transaction may still be processing. Please check your wallet in a few minutes.',
    severity: 'warning',
    canRetry: false
  },
  
  WALLET_NOT_SUPPORTED: {
    code: 'WALLET_NOT_SUPPORTED',
    message: 'Wallet not supported on mobile',
    userAction: 'Please install Phantom or OKX wallet app and connect it',
    severity: 'error',
    canRetry: false
  },
  
  IN_APP_BROWSER_ISSUE: {
    code: 'IN_APP_BROWSER_ISSUE',
    message: 'In-app browser compatibility issue',
    userAction: 'Please open this page in your default browser (Safari, Chrome) for better wallet connectivity',
    severity: 'warning',
    canRetry: true,
    needsBrowserSwitch: true
  },
  
  WALLET_CONNECTION_FAILED: {
    code: 'WALLET_CONNECTION_FAILED',
    message: 'Failed to connect to wallet',
    userAction: 'Please restart your wallet app and try connecting again',
    severity: 'error',
    canRetry: true,
    needsWalletRestart: true
  }
};

// Function to classify errors and provide user-friendly messages
export function handleMobileWalletError(error: any): MobileWalletErrorInfo {
  const errorMessage = error?.message || error?.toString() || 'Unknown error';
  const errorCode = error?.code || 'UNKNOWN_ERROR';
  
  // Check for known error patterns
  if (errorCode && MOBILE_WALLET_ERRORS[errorCode]) {
    return MOBILE_WALLET_ERRORS[errorCode];
  }
  
  // Pattern matching for common error messages
  if (errorMessage.toLowerCase().includes('rejected') || errorMessage.includes('4001')) {
    return MOBILE_WALLET_ERRORS.USER_REJECTED;
  }
  
  if (errorMessage.toLowerCase().includes('insufficient')) {
    return MOBILE_WALLET_ERRORS.INSUFFICIENT_BALANCE;
  }
  
  if (errorMessage.toLowerCase().includes('timeout')) {
    return MOBILE_WALLET_ERRORS.SIGNING_TIMEOUT;
  }
  
  if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('connection')) {
    return MOBILE_WALLET_ERRORS.NETWORK_ERROR;
  }
  
  if (errorMessage.toLowerCase().includes('blockhash') || errorMessage.toLowerCase().includes('expired')) {
    return MOBILE_WALLET_ERRORS.TRANSACTION_EXPIRED;
  }
  
  if (errorMessage.toLowerCase().includes('confirmation')) {
    return MOBILE_WALLET_ERRORS.CONFIRMATION_TIMEOUT;
  }
  
  if (errorMessage.toLowerCase().includes('not connected')) {
    return MOBILE_WALLET_ERRORS.WALLET_NOT_CONNECTED;
  }
  
  // Default error info
  return {
    code: 'UNKNOWN_ERROR',
    message: errorMessage,
    userAction: 'Please try again or contact support if the problem persists',
    severity: 'error',
    canRetry: true
  };
}

// Function to show mobile-friendly error toast
export function showMobileWalletError(error: any) {
  const errorInfo = handleMobileWalletError(error);
  
  toast({
    title: errorInfo.severity === 'error' ? 'Error' : 'Warning',
    description: `${errorInfo.message}. ${errorInfo.userAction}`,
    variant: errorInfo.severity === 'error' ? 'destructive' : 'default',
    duration: errorInfo.severity === 'error' ? 8000 : 5000,
  });
  
  return errorInfo;
}

// Function to provide recovery suggestions
export function getMobileWalletRecoverySteps(errorInfo: MobileWalletErrorInfo): string[] {
  const steps: string[] = [];
  
  if (errorInfo.needsWalletRestart) {
    steps.push('Close and restart your wallet app');
    steps.push('Wait a few seconds before reconnecting');
  }
  
  if (errorInfo.needsBrowserSwitch) {
    steps.push('Open this page in your default browser (Safari/Chrome)');
    steps.push('Avoid using in-app browsers from social media');
  }
  
  if (errorInfo.code === 'INSUFFICIENT_BALANCE') {
    steps.push('Add more SOL to your wallet (minimum 0.02 SOL)');
    steps.push('You can get test SOL from faucets for devnet');
  }
  
  if (errorInfo.code === 'WALLET_NOT_SUPPORTED') {
    steps.push('Install Phantom wallet from your app store');
    steps.push('Create or import your Solana wallet');
    steps.push('Return to this page and connect');
  }
  
  if (errorInfo.canRetry) {
    steps.push('Try the operation again');
  } else {
    steps.push('Wait a few minutes and check your wallet');
  }
  
  return steps;
}

// Function to check mobile environment and provide proactive warnings
export function checkMobileEnvironmentAndWarn(): string[] {
  const warnings: string[] = [];
  
  if (typeof window === 'undefined') return warnings;
  
  const userAgent = navigator.userAgent.toLowerCase();
  
  // Check for in-app browsers
  if (userAgent.includes('fbav') || userAgent.includes('instagram') || userAgent.includes('twitter')) {
    warnings.push('You\'re using an in-app browser. For better wallet connectivity, open this page in Safari or Chrome.');
  }
  
  // Check for mobile
  if (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
    // Check for wallet availability
    const hasPhantom = !!(window as any).phantom?.solana?.isPhantom;
    const hasOKX = !!(window as any).okxwallet?.solana;
    
    if (!hasPhantom && !hasOKX) {
      warnings.push('No Solana wallet detected. Please install Phantom or OKX wallet app.');
    }
  }
  
  return warnings;
}

export default {
  handleMobileWalletError,
  showMobileWalletError,
  getMobileWalletRecoverySteps,
  checkMobileEnvironmentAndWarn,
  MOBILE_WALLET_ERRORS
};
