'use client';

import { createRealAlgorandToken } from '@/lib/real-algorand-token-creation-v2';

/**
 * Enhanced mobile-optimized token creation with comprehensive error handling
 */
export async function createTokenWithMobileOptimizations(
  tokenData: any,
  selectedNetwork: string,
  algorandWallet: any,
  onStatusUpdate: (status: any) => void
): Promise<any> {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  try {
    // Mobile-specific pre-validation
    if (isMobile) {
      onStatusUpdate({ 
        status: 'preparing', 
        message: 'Preparing mobile wallet connection...',
        step: 1,
        totalSteps: 6
      });
      
      // Check wallet connectivity
      if (!algorandWallet.connected) {
        throw new Error('Please connect your Algorand wallet first');
      }

      // Check if wallet app is available (mobile-specific)
      const hasWalletExtension = typeof (window as any).AlgoSigner !== 'undefined' || 
                                typeof (window as any).algorand !== 'undefined';
      
      if (!hasWalletExtension) {
        onStatusUpdate({ 
          status: 'preparing', 
          message: 'Opening wallet app...',
          step: 2,
          totalSteps: 6,
          mobileHint: 'Your wallet app should open automatically. If not, please open it manually.'
        });
      }
    }

    onStatusUpdate({ 
      status: 'signing', 
      message: isMobile ? 'Please approve in your wallet app' : 'Please sign the transaction',
      step: 3,
      totalSteps: 6,
      mobileHint: isMobile ? 'Check your wallet app for the transaction approval screen' : undefined
    });

    // Create the token with real Algorand integration
    const result = await createRealAlgorandToken(
      {
        ...tokenData,
        network: selectedNetwork
      },
      (status: string) => {
        // Map Algorand-specific status messages to transaction status types
        let mappedStatus = 'preparing';
        if (status.toLowerCase().includes('validating') || status.toLowerCase().includes('preparing')) {
          mappedStatus = 'preparing';
        } else if (status.toLowerCase().includes('signature') || status.toLowerCase().includes('wallet')) {
          mappedStatus = 'signing';
        } else if (status.toLowerCase().includes('submitting') || status.toLowerCase().includes('broadcasting')) {
          mappedStatus = 'broadcasting';
        } else if (status.toLowerCase().includes('confirmation') || status.toLowerCase().includes('waiting')) {
          mappedStatus = 'confirming';
        } else if (status.toLowerCase().includes('success') || status.toLowerCase().includes('completed')) {
          mappedStatus = 'success';
        }
        
        onStatusUpdate({
          status: mappedStatus,
          message: status,
          step: 4,
          totalSteps: 6,
          mobileHint: isMobile && mappedStatus === 'confirming'
            ? 'Transaction submitted! This may take a few moments to confirm on the blockchain.'
            : undefined
        });
      },
      algorandWallet
    );

    onStatusUpdate({ 
      status: 'success', 
      message: 'Token created successfully!',
      step: 6,
      totalSteps: 6,
      mobileHint: isMobile ? 'Your token is now live on the Algorand blockchain!' : undefined
    });

    return result;
    
  } catch (error) {
    console.error('Mobile-optimized token creation failed:', error);
    
    // Enhanced mobile error handling
    let userFriendlyMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    let mobileHint = '';
    
    if (isMobile) {
      if (userFriendlyMessage.includes('rejected')) {
        userFriendlyMessage = 'Transaction was cancelled in your wallet app';
        mobileHint = 'Please try again and approve the transaction in your wallet app';
      } else if (userFriendlyMessage.includes('timeout')) {
        userFriendlyMessage = 'Wallet connection timed out';
        mobileHint = 'Please make sure your wallet app is open and try again';
      } else if (userFriendlyMessage.includes('network')) {
        userFriendlyMessage = 'Network connection issue';
        mobileHint = 'Please check your internet connection and try again';
      } else if (userFriendlyMessage.includes('insufficient')) {
        userFriendlyMessage = 'Insufficient balance for transaction fees';
        mobileHint = 'You need at least 0.001 ALGO to create a token';
      }
    }
    
    onStatusUpdate({ 
      status: 'error', 
      message: userFriendlyMessage,
      mobileHint: isMobile ? mobileHint : undefined,
      error: error instanceof Error ? error : new Error(userFriendlyMessage)
    });
    
    throw error;
  }
}

/**
 * Mobile-specific wallet connection validation
 */
export function validateMobileWalletConnection(algorandWallet: any): { isValid: boolean; message?: string; hint?: string } {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (!algorandWallet.connected) {
    return {
      isValid: false,
      message: 'Wallet not connected',
      hint: isMobile ? 'Please connect your mobile wallet app first' : 'Please connect your Algorand wallet'
    };
  }
  
  if (!algorandWallet.address) {
    return {
      isValid: false,
      message: 'No wallet address found',
      hint: isMobile ? 'Please ensure your wallet app is properly set up' : 'Please check your wallet connection'
    };
  }
  
  if (algorandWallet.balance !== null && algorandWallet.balance < 0.001) {
    return {
      isValid: false,
      message: 'Insufficient balance for transaction fees',
      hint: isMobile ? 'You need at least 0.001 ALGO to create tokens' : 'Please add ALGO to your wallet for transaction fees'
    };
  }
  
  return { isValid: true };
}

/**
 * Get mobile-optimized transaction settings
 */
export function getMobileTransactionSettings(network: string) {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  return {
    // Slightly higher timeout for mobile wallet apps
    timeout: isMobile ? 120000 : 60000, // 2 minutes vs 1 minute
    
    // More frequent status updates for mobile UX
    statusUpdateInterval: isMobile ? 1000 : 2000, // 1 second vs 2 seconds
    
    // Mobile-friendly confirmation requirements
    confirmations: network.includes('testnet') ? 1 : 2,
    
    // Retry settings optimized for mobile
    maxRetries: isMobile ? 3 : 2,
    retryDelay: isMobile ? 3000 : 2000,
  };
}
