'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Wallet, 
  TrendingUp, 
  Zap, 
  Shield,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWalletAuth } from '@/components/providers/WalletAuthProvider';
import { getCreditsBalance, purchaseCreditsWithAlgo, PRICING } from '@/lib/enhanced-payment-system';

export default function CreditTopUp() {
  const [userBalance, setUserBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const { toast } = useToast();
  const { walletAddress, walletType, isAuthenticated } = useWalletAuth();

  useEffect(() => {
    if (walletAddress) {
      loadUserBalance();
    }
  }, [walletAddress]);

  const loadUserBalance = async () => {
    if (!walletAddress) return;
    
    setIsLoading(true);
    try {
      const result = await getCreditsBalance(walletAddress);
      if (result.success) {
        setUserBalance(result.balance || 0);
      }
    } catch (error) {
      console.error('Error loading balance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchaseCredits = async (algoAmount: number) => {
    if (!walletAddress || walletType !== 'algorand') {
      toast({
        title: "Algorand Wallet Required",
        description: "Please connect an Algorand wallet to purchase credits with ALGO",
        variant: "destructive",
      });
      return;
    }

    setIsPurchasing(true);
    try {
      // Mock signing function - replace with actual wallet signing
      const mockSignTransaction = async (txn: any) => {
        console.log('Signing transaction:', txn);
        // This would use actual wallet signing in production
        return new Uint8Array([1, 2, 3, 4, 5]);
      };

      const result = await purchaseCreditsWithAlgo(
        walletAddress,
        algoAmount,
        mockSignTransaction
      );

      if (result.success) {
        toast({
          title: "Credits Purchased Successfully!",
          description: `You received ${result.details?.creditsReceived} credits for ${algoAmount} ALGO`,
        });
        
        // Reload balance
        await loadUserBalance();
      } else {
        throw new Error(result.error || 'Purchase failed');
      }
    } catch (error) {
      console.error('Error purchasing credits:', error);
      toast({
        title: "Purchase Failed",
        description: error instanceof Error ? error.message : 'Failed to purchase credits',
        variant: "destructive",
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  const purchaseOptions = [
    {
      algo: 5,
      credits: 10,
      bonus: 0,
      popular: false
    },
    {
      algo: 10,
      credits: 20,
      bonus: 0,
      popular: true
    },
    {
      algo: 25,
      credits: 50,
      bonus: 5,
      popular: false
    },
    {
      algo: 50,
      credits: 100,
      bonus: 15,
      popular: false
    }
  ];
      toast({
        title: 'Error',
        description: 'Algorand wallet required for ALGO payments',
        variant: 'destructive'
      });
      return;
    }

    setIsPurchasing(true);
    try {
      toast({
        title: 'Processing Purchase',
        description: 'Please approve the transaction in your wallet...',
      });

      // Simulate the purchase process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const creditsToAdd = Math.floor(algoAmount * 0.5); // 0.5 credits per ALGO
      setUserBalance(prev => prev + creditsToAdd);
      
      toast({
        title: 'Credits Purchased!',
        description: `Successfully purchased ${creditsToAdd} credits with ${algoAmount} ALGO`,
      });
    } catch (error) {
      console.error('Purchase error:', error);
      toast({
        title: 'Purchase Failed',
        description: 'Failed to purchase credits. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="snarbles-card p-8 text-center">
        <Wallet className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h2 className="snarbles-heading-4 mb-2">Connect Your Wallet</h2>
        <p className="snarbles-body text-gray-400">
          Connect your wallet to purchase credits and create tokens
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Balance */}
      <Card className="snarbles-card border-red-500/20">
        <CardHeader>
          <CardTitle className="snarbles-heading-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-red-400" />
            Your Credits Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-4xl font-bold text-red-400 mb-2">
              {isLoading ? '...' : userBalance}
            </div>
            <div className="snarbles-body text-gray-400">Credits Available</div>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Options */}
      <Card className="snarbles-card">
        <CardHeader>
          <CardTitle className="snarbles-heading-4">Purchase Credits</CardTitle>
          <p className="snarbles-body-small text-gray-400">
            Buy credits with ALGO at a rate of 1 ALGO = 0.5 credits
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { algo: 10, credits: 5, popular: true, desc: 'Perfect for 1 token' },
              { algo: 20, credits: 10, popular: false, desc: 'Good for 2 tokens' },
              { algo: 50, credits: 25, popular: false, desc: 'Best value pack' }
            ].map((option) => (
              <Card 
                key={option.algo}
                className={`cursor-pointer transition-all hover:border-green-500/40 ${
                  option.popular 
                    ? 'border-green-500/30 bg-green-500/5' 
                    : 'border-gray-700 hover:border-gray-600'
                }`}
                onClick={() => handlePurchaseCredits(option.algo)}
              >
                <CardContent className="p-4 text-center">
                  {option.popular && (
                    <Badge className="mb-2 bg-green-500/20 text-green-400 border-green-500/20">
                      Most Popular
                    </Badge>
                  )}
                  <div className="text-2xl font-bold text-green-400 mb-1">
                    {option.credits}
                  </div>
                  <div className="text-sm text-gray-400 mb-2">credits</div>
                  <div className="text-lg font-semibold mb-1">
                    {option.algo} ALGO
                  </div>
                  <div className="text-xs text-gray-500 mb-3">
                    ≈ ${(option.algo * 0.15).toFixed(2)} USD
                  </div>
                  <div className="text-xs text-gray-400">
                    {option.desc}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-6 text-center">
            <Button
              onClick={() => handlePurchaseCredits(10)}
              disabled={isPurchasing || walletType !== 'algorand'}
              className="snarbles-btn-primary"
            >
              {isPurchasing ? (
                <>
                  <div className="animate-spin rounded-full w-4 h-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Purchase Credits
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Information */}
      <Card className="snarbles-card border-blue-500/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Shield className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h4 className="snarbles-heading-5 mb-2 text-blue-400">
                Secure Payment System
              </h4>
              <ul className="snarbles-body-small text-gray-300 space-y-1">
                <li>• All payments processed on-chain</li>
                <li>• Credits never expire</li>
                <li>• 1 ALGO = 0.5 credits conversion rate</li>
                <li>• Mainnet token creation costs 5 credits</li>
                <li>• Testnet token creation is free</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 