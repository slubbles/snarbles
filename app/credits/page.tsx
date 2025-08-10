'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CreditCard, 
  Wallet, 
  ArrowLeft,
  History
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
  const { toast } = useToast();
  const { walletAddress, isAuthenticated } = useWalletAuth();
  const router = useRouter();

  // Check if mobile on component mount
  useState(() => {
    setIsMobileDevice(isMobile());
  });

  const navigateBack = () => {
    router.back();
  };

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
          /* New Mobile-First Layout */
          <div className="space-y-8">
            {/* Credit Top-Up Section */}
            <WalletSpecificCreditTopUp />
            
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
