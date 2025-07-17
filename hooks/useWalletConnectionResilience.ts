'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { usePaymentState } from '@/hooks/usePaymentState';

export interface WalletConnectionConfig {
  maxRetries: number;
  retryDelay: number;
  timeoutMs: number;
  autoReconnect: boolean;
}

export interface WalletConnectionResult {
  success: boolean;
  error?: string;
  walletAddress?: string;
  balance?: number;
}

const defaultConfig: WalletConnectionConfig = {
  maxRetries: 3,
  retryDelay: 2000,
  timeoutMs: 30000,
  autoReconnect: true
};

export function useWalletConnectionResilience(config: Partial<WalletConnectionConfig> = {}) {
  const finalConfig = { ...defaultConfig, ...config };
  const { toast } = useToast();
  const { setIsConnected, setWalletBalance, setError, setNetwork } = usePaymentState();
  
  const connectionAttemptsRef = useRef(0);
  const isConnectingRef = useRef(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Enhanced wallet detection with timeout
  const detectWalletWithTimeout = useCallback(async (
    walletType: 'phantom' | 'pera' | 'solflare',
    timeoutMs: number = finalConfig.timeoutMs
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve(false);
      }, timeoutMs);

      const checkWallet = () => {
        let detected = false;
        
        switch (walletType) {
          case 'phantom':
            detected = !!(window as any).phantom?.solana;
            break;
          case 'pera':
            detected = !!(window as any).PeraWalletConnect;
            break;
          case 'solflare':
            detected = !!(window as any).solflare;
            break;
        }

        if (detected) {
          clearTimeout(timeout);
          resolve(true);
        }
      };

      // Check immediately
      checkWallet();
      
      // Poll every 100ms for wallet detection
      const interval = setInterval(checkWallet, 100);
      
      // Clear interval when timeout triggers
      setTimeout(() => {
        clearInterval(interval);
      }, timeoutMs);
    });
  }, [finalConfig.timeoutMs]);

  // Enhanced connection with retry logic
  const connectWalletWithRetry = useCallback(async (
    walletType: 'phantom' | 'pera' | 'solflare',
    connectFunction: () => Promise<WalletConnectionResult>
  ): Promise<WalletConnectionResult> => {
    if (isConnectingRef.current) {
      return { success: false, error: 'Connection already in progress' };
    }

    isConnectingRef.current = true;
    connectionAttemptsRef.current = 0;

    const attemptConnection = async (): Promise<WalletConnectionResult> => {
      try {
        connectionAttemptsRef.current += 1;
        
        // Check if wallet is still available
        const isDetected = await detectWalletWithTimeout(walletType, 5000);
        if (!isDetected) {
          throw new Error(`${walletType} wallet not detected`);
        }

        // Attempt connection
        const result = await Promise.race([
          connectFunction(),
          new Promise<WalletConnectionResult>((_, reject) => {
            setTimeout(() => reject(new Error('Connection timeout')), finalConfig.timeoutMs);
          })
        ]);

        if (result.success) {
          setIsConnected(true);
          setWalletBalance(result.balance || null);
          setNetwork(walletType === 'pera' ? 'algorand' : 'solana');
          setError(null);
          connectionAttemptsRef.current = 0;
          
          toast({
            title: "Wallet Connected",
            description: `Successfully connected to ${walletType} wallet`,
            variant: "default",
          });
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Connection failed';
        
        if (connectionAttemptsRef.current < finalConfig.maxRetries) {
          console.log(`Connection attempt ${connectionAttemptsRef.current} failed, retrying...`);
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, finalConfig.retryDelay));
          
          return attemptConnection();
        } else {
          // Max retries reached
          setError(errorMessage);
          setIsConnected(false);
          
          toast({
            title: "Connection Failed",
            description: `Failed to connect to ${walletType} after ${finalConfig.maxRetries} attempts`,
            variant: "destructive",
          });
          
          return { success: false, error: errorMessage };
        }
      }
    };

    const result = await attemptConnection();
    isConnectingRef.current = false;
    
    return result;
  }, [finalConfig, detectWalletWithTimeout, setIsConnected, setWalletBalance, setNetwork, setError, toast]);

  // Auto-reconnection logic
  const scheduleReconnection = useCallback((walletType: 'phantom' | 'pera' | 'solflare') => {
    if (!finalConfig.autoReconnect) return;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    reconnectTimeoutRef.current = setTimeout(async () => {
      try {
        console.log(`Attempting auto-reconnection to ${walletType}...`);
        
        const isDetected = await detectWalletWithTimeout(walletType, 5000);
        if (isDetected) {
          // Wallet is available again, attempt reconnection
          // This would need to be implemented based on the specific wallet type
          console.log(`${walletType} wallet detected, attempting reconnection...`);
        }
      } catch (error) {
        console.error('Auto-reconnection failed:', error);
      }
    }, finalConfig.retryDelay * 2);
  }, [finalConfig.autoReconnect, finalConfig.retryDelay, detectWalletWithTimeout]);

  // Handle connection loss
  const handleConnectionLoss = useCallback((walletType: 'phantom' | 'pera' | 'solflare') => {
    setIsConnected(false);
    setWalletBalance(null);
    setError('Wallet connection lost');
    
    toast({
      title: "Connection Lost",
      description: `${walletType} wallet connection was lost`,
      variant: "destructive",
    });
    
    scheduleReconnection(walletType);
  }, [setIsConnected, setWalletBalance, setError, toast, scheduleReconnection]);

  // Deep link handling for mobile wallets
  const handleMobileDeepLink = useCallback((walletType: 'phantom' | 'pera') => {
    const isMobile = /Mobile|Android|iPhone|iPad/.test(navigator.userAgent);
    
    if (!isMobile) return false;
    
    try {
      let deepLink = '';
      const currentUrl = window.location.href;
      
      switch (walletType) {
        case 'phantom':
          deepLink = `https://phantom.app/ul/browse/${encodeURIComponent(currentUrl)}`;
          break;
        case 'pera':
          deepLink = `perawallet://walletconnect?uri=${encodeURIComponent(currentUrl)}`;
          break;
      }
      
      window.location.href = deepLink;
      
      // Fallback to app store after delay
      setTimeout(() => {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        if (walletType === 'phantom') {
          if (isIOS) {
            window.location.href = 'https://apps.apple.com/us/app/phantom-solana-wallet/id1598432977';
          } else {
            window.location.href = 'https://play.google.com/store/apps/details?id=app.phantom';
          }
        } else if (walletType === 'pera') {
          if (isIOS) {
            window.location.href = 'https://apps.apple.com/us/app/pera-algo-wallet/id1459898525';
          } else {
            window.location.href = 'https://play.google.com/store/apps/details?id=com.algorand.android';
          }
        }
      }, 3000);
      
      return true;
    } catch (error) {
      console.error('Deep link failed:', error);
      return false;
    }
  }, []);

  // Clear timeouts on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    detectWalletWithTimeout,
    connectWalletWithRetry,
    handleConnectionLoss,
    handleMobileDeepLink,
    isConnecting: isConnectingRef.current,
    connectionAttempts: connectionAttemptsRef.current
  };
}
