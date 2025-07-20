'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { isPeraMobileBrowser } from '@/lib/mobile-wallet-utils';

interface PeraWalletAppHandlerProps {
  children: React.ReactNode;
}

export default function PeraWalletAppHandler({ children }: PeraWalletAppHandlerProps) {
  const [isPeraApp, setIsPeraApp] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const initializePeraAppHandler = () => {
      const isInPeraApp = isPeraMobileBrowser();
      setIsPeraApp(isInPeraApp);
      
      if (isInPeraApp) {
        console.log('🔷 Pera wallet app browser detected');
        
        // Add special handling for Pera app browser
        const handleNetworkChange = () => {
          console.log('🌐 Network state changed in Pera app');
          
          // Check connectivity after a delay
          setTimeout(() => {
            if (!navigator.onLine) {
              toast({
                title: "Connection Issue",
                description: "Please check your internet connection and try again.",
                variant: "destructive",
                duration: 5000,
              });
            }
          }, 1000);
        };

        const handleVisibilityChange = () => {
          if (!document.hidden && isInPeraApp) {
            console.log('🔄 Pera app returned to foreground');
            
            // Re-check connection when app comes back to foreground
            setTimeout(() => {
              if (navigator.onLine) {
                console.log('✅ Network connection restored');
              }
            }, 1000);
          }
        };

        // Listen for network and visibility changes
        window.addEventListener('online', handleNetworkChange);
        window.addEventListener('offline', handleNetworkChange);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Enhanced error handling for Pera app
        window.addEventListener('error', (event) => {
          if (event.error?.message?.includes('network') || 
              event.error?.message?.includes('internet') ||
              event.error?.message?.includes('connectivity')) {
            console.error('🚨 Network error detected in Pera app:', event.error);
            
            toast({
              title: "Network Error",
              description: "Connection issue detected. Please check your internet and try again.",
              variant: "destructive",
              duration: 8000,
            });
          }
        });

        // Cleanup
        return () => {
          window.removeEventListener('online', handleNetworkChange);
          window.removeEventListener('offline', handleNetworkChange);
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
      }
      
      setIsInitialized(true);
    };

    initializePeraAppHandler();
  }, [toast]);

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Initializing wallet connection...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      
      {/* Show Pera app specific indicators */}
      {isPeraApp && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="glass-card p-3 flex items-center gap-2 text-xs">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span className="text-blue-400">Pera Wallet App</span>
          </div>
        </div>
      )}
    </>
  );
}
