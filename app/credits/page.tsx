'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CreditCard, 
  Wallet, 
  ArrowLeft,
  History,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWalletAuth } from '@/components/providers/WalletAuthProvider';
import { useRouter } from 'next/navigation';
import WalletSpecificCreditTopUp from '@/components/WalletSpecificCreditTopUp';
import LimitedTransactionHistory from '@/components/credits/LimitedTransactionHistory';
import CreditsInfoSummary from '@/components/credits/CreditsInfoSummary';
import { isMobile } from '@/lib/mobile-wallet-utils';

export default function CreditsPage() {
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [forceUpdate, setForceUpdate] = useState(0);
  const { toast } = useToast();
  const { walletAddress, isAuthenticated, isLoading: walletLoading } = useWalletAuth();
  const router = useRouter();

  // Check if mobile on component mount
  useEffect(() => {
    setIsMobileDevice(isMobile());
  }, []);

  // Handle loading states properly
  useEffect(() => {
    // Wait for wallet auth to finish loading
    if (!walletLoading) {
      // Add a small delay to ensure state synchronization
      const timer = setTimeout(() => {
        setIsPageLoading(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [walletLoading]);

  // Force re-render when authentication state changes
  useEffect(() => {
    console.log('🔄 Credits page: Auth state changed', { isAuthenticated, walletAddress });
    setForceUpdate(prev => prev + 1);
  }, [isAuthenticated, walletAddress]);

  const navigateBack = () => {
    router.back();
  };

  // Show loading spinner while wallet auth is loading
  if (isPageLoading || walletLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading credits page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {/* Header Section */}
        <div className="flex items-center gap-4 mb-12">
          <Button
            variant="ghost"
            size="sm"
            onClick={navigateBack}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-2">
              Credits & Top-Up
            </h1>
            <p className="text-xl text-muted-foreground">
              Purchase credits to deploy tokens on mainnet networks
            </p>
          </div>
        </div>

        {!isAuthenticated ? (
          /* Wallet Connection Required */
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="glass-card max-w-md w-full">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Wallet className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Connect Your Wallet</h2>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Connect your wallet to view your credit balance and purchase additional credits
                </p>
                <Button 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3"
                  onClick={() => {
                    toast({
                      title: "Connect Wallet",
                      description: "Use the wallet connection button in the navigation bar",
                      duration: 3000,
                    });
                  }}
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Connect Wallet
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Credit Management Interface */
          <div className="space-y-8" key={forceUpdate}>
            {/* Success message for wallet connection */}
            {isAuthenticated && walletAddress && (
              <div className="mb-6">
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-green-400 font-semibold">
                      Wallet Connected: {walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Credit Top-Up Section */}
            <WalletSpecificCreditTopUp 
              onCreditsUpdated={() => setForceUpdate(prev => prev + 1)}
            />
            
            {/* Limited Transaction History */}
            <LimitedTransactionHistory />
            
            {/* Credits Info Summary at Bottom */}
            <CreditsInfoSummary />
          </div>
        )}
      </div>
    </div>
  );
}
