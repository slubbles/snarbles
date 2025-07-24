'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, 
  Wallet, 
  TrendingUp, 
  Zap, 
  Shield,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Coins
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWalletAuth } from '@/components/providers/WalletAuthProvider';
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider';
import { getCreditsBalance } from '@/lib/credit-system';
import { purchaseCreditsWithAlgo, PRICING } from '@/lib/enhanced-payment-system';
import USDTTopUp from '@/components/USDTTopUp';

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
      // Use real wallet signing from provider
      const { signTransaction } = useAlgorandWallet();
      
      if (!signTransaction) {
        throw new Error('Wallet signing function not available');
      }

      const result = await purchaseCreditsWithAlgo(
        walletAddress,
        algoAmount,
        signTransaction
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

  if (!isAuthenticated) {
    return (
      <Card className="border-2 border-muted">
        <CardContent className="p-6 text-center">
          <Wallet className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
          <p className="text-muted-foreground">
            Connect your Algorand wallet to purchase credits
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Balance */}
      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Your Credits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary mb-2">
            {isLoading ? 'Loading...' : userBalance}
          </div>
          <p className="text-sm text-muted-foreground">
            Credits can be used for token creation and advanced features
          </p>
        </CardContent>
      </Card>

      {/* Payment Method Tabs */}
      <Tabs defaultValue="usdt" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="usdt" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Pay with USDT
          </TabsTrigger>
          <TabsTrigger value="algo" className="flex items-center gap-2">
            <Coins className="w-4 h-4" />
            Pay with ALGO
          </TabsTrigger>
        </TabsList>

        {/* USDT Payment Tab */}
        <TabsContent value="usdt" className="space-y-4">
          <Card className="border-2 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <DollarSign className="w-5 h-5" />
                Top Up with USDT
              </CardTitle>
              <p className="text-sm text-green-600">
                Pay with USDT from multiple networks - all funds go to: <br />
                <code className="text-xs bg-green-100 px-2 py-1 rounded">0x9ca8362c35db2649614cd4029ab0067d285660ef</code>
              </p>
            </CardHeader>
            <CardContent>
              <USDTTopUp 
                walletAddress={walletAddress || ''} 
                onCreditsUpdated={loadUserBalance}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ALGO Payment Tab */}
        <TabsContent value="algo" className="space-y-4">
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Coins className="w-5 h-5" />
                Purchase with ALGO
              </CardTitle>
              <p className="text-sm text-blue-600">
                Direct payment with Algorand (ALGO) - requires Algorand wallet connection
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {purchaseOptions.map((option, index) => (
                  <div key={index} className="relative">
                    <div className={`
                      border-2 rounded-lg p-4 transition-all duration-200
                      ${option.popular ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'}
                    `}>
                      {option.popular && (
                        <Badge className="absolute -top-2 left-4 bg-primary text-primary-foreground">
                          Most Popular
                        </Badge>
                      )}
                      
                      <div className="text-center space-y-2">
                        <div className="text-2xl font-bold text-foreground">
                          {option.credits + option.bonus}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Credits
                        </div>
                        
                        {option.bonus > 0 && (
                          <div className="text-xs text-green-400">
                            +{option.bonus} bonus credits
                          </div>
                        )}
                        
                        <div className="text-lg font-semibold text-primary">
                          {option.algo} ALGO
                        </div>
                        
                        <Button 
                          onClick={() => handlePurchaseCredits(option.algo)}
                          disabled={isPurchasing || walletType !== 'algorand'}
                          className="w-full"
                          variant={option.popular ? "default" : "outline"}
                        >
                          {isPurchasing ? 'Processing...' : 'Purchase'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {walletType !== 'algorand' && (
                <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-yellow-600">
                      Algorand wallet required to purchase credits with ALGO
                    </span>
                  </div>
                </div>
              )}

              <div className="mt-4 text-sm text-muted-foreground">
                <p>Exchange Rate: 1 credit = {PRICING.CREDIT_TO_ALGO_RATE} ALGO • 1 ALGO = {PRICING.ALGO_TO_CREDIT_RATE} credits</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Features */}
      <Card className="border-2 border-muted">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-500" />
            Why Use Credits?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <div className="font-medium">Instant Deployment</div>
                <div className="text-sm text-muted-foreground">
                  No waiting for blockchain confirmations
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <div className="font-medium">Cost Effective</div>
                <div className="text-sm text-muted-foreground">
                  Save 50% compared to direct ALGO payments
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <div className="font-medium">Bulk Purchases</div>
                <div className="text-sm text-muted-foreground">
                  Buy credits in advance for multiple tokens
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
