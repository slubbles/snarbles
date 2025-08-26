'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Coins,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWalletAuth } from '@/components/providers/WalletAuthProvider';
import CreditTopUpSuccessModal from '@/components/CreditTopUpSuccessModal';
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider';
import { getCreditsBalance } from '@/lib/credit-system';
import { purchaseCreditsWithAlgo, PRICING } from '@/lib/enhanced-payment-system';
import MultiWalletUSDTTopUp from '@/components/MultiWalletUSDTTopUp';

interface CreditTopUpProps {
  onClose?: () => void;
}

export default function CreditTopUp({ onClose }: CreditTopUpProps = {}) {
  const [userBalance, setUserBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successDetails, setSuccessDetails] = useState<any>(null);
  const { toast } = useToast();
  const { walletAddress, walletType, isAuthenticated } = useWalletAuth();
  const { signTransaction, network } = useAlgorandWallet();

  useEffect(() => {
    let isMounted = true;
    
    if (walletAddress) {
      loadUserBalance(isMounted);
    }
    
    return () => {
      isMounted = false;
    };
  }, [walletAddress]);

  const loadUserBalance = async (isMounted = true) => {
    if (!walletAddress) return;
    
    setIsLoading(true);
    try {
      const result = await getCreditsBalance(walletAddress);
      if (result.success && isMounted) {
        setUserBalance(result.balance || 0);
      }
    } catch (error) {
      console.error('Error loading balance:', error);
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  };

  const handleUSDTTopUpSuccess = (details: any) => {
    setSuccessDetails(details);
    setShowSuccessModal(true);
    
    toast({
      title: "Credits Purchased Successfully!",
      description: `You received ${details.creditsReceived} credits with ${details.algoAmount} USDT`,
    });
    
    // Reload balance
    loadUserBalance();
  };

  const handleTopUpAgain = () => {
    // Reset to USDT tab for easy top-up again
    setShowSuccessModal(false);
    // We could add logic here to focus on a specific tab or amount
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
      if (!signTransaction) {
        throw new Error('Wallet signing function not available');
      }

      const result = await purchaseCreditsWithAlgo(
        walletAddress,
        algoAmount,
        signTransaction,
        false, // isCustomAmount
        network || 'algorand-mainnet' // Pass the current network
      );

      if (result.success) {
        // Set success modal details for confetti display
        setSuccessDetails({
          algoAmount: algoAmount,
          creditsReceived: result.details?.creditsReceived || 0,
          bonusCredits: result.details?.bonusCredits || 0,
          transactionId: result.details?.transactionId || '',
          paymentMethod: 'ALGO'
        });
        setShowSuccessModal(true);
        
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

  const purchaseOptions = useMemo(() => [
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
  ], []);

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
    <div className="space-y-10">
      {/* Enhanced Current Balance */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-blue-500/5 border-primary/20">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-blue-500/10 opacity-50" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-blue-500 to-purple-500" />
        
        <CardHeader className="relative pb-6">
          <CardTitle className="text-2xl font-bold text-foreground flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 w-12 h-12 bg-primary/30 rounded-full blur-lg animate-pulse" />
              <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/30">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
            </div>
            Your Credits Balance
          </CardTitle>
        </CardHeader>
        
        <CardContent className="relative">
          <div className="text-center space-y-4">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
              <div className="relative text-5xl font-bold text-primary tabular-nums">
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="w-12 h-12 animate-spin" />
                  </div>
                ) : (
                  userBalance
                )}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-lg text-primary/80 font-semibold uppercase tracking-wider">Credits Available</div>
              <p className="text-muted-foreground max-w-md mx-auto">
                Credits can be used for token creation and advanced features across all supported networks
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Payment Method Tabs */}
      <Tabs defaultValue="usdt" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-14 bg-gradient-to-r from-muted/50 to-muted/30 backdrop-blur-sm border border-border/50">
          <TabsTrigger 
            value="usdt" 
            className="flex items-center gap-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/90 data-[state=active]:text-white font-semibold text-lg transition-all duration-300"
          >
            <DollarSign className="w-5 h-5" />
            Pay with USDT
          </TabsTrigger>
          <TabsTrigger 
            value="algo" 
            className="flex items-center gap-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/90 data-[state=active]:text-white font-semibold text-lg transition-all duration-300"
          >
            <Coins className="w-5 h-5" />
            Pay with ALGO
          </TabsTrigger>
        </TabsList>

        {/* Enhanced USDT Payment Tab */}
        <TabsContent value="usdt" className="space-y-6 mt-8">
          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500/5 via-background to-cyan-500/5 border-blue-500/20">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-cyan-500/10 opacity-30" />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
            
            <CardHeader className="relative">
              <CardTitle className="flex items-center gap-4 text-2xl">
                <div className="relative">
                  <div className="absolute inset-0 w-10 h-10 bg-blue-500/30 rounded-full blur-lg animate-pulse" />
                  <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold">Top Up with USDT</div>
                  <p className="text-blue-400 text-sm font-medium">1 USDT = 1 Credit • Multiple networks supported</p>
                </div>
              </CardTitle>
              <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-blue-300 text-sm">
                  <strong>Payment Address:</strong> <br />
                  <code className="text-xs bg-blue-500/20 border border-blue-500/30 px-2 py-1 rounded font-mono">
                    0x9ca8362c35db2649614cd4029ab0067d285660ef
                  </code>
                </p>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <MultiWalletUSDTTopUp 
                userAddress={walletAddress || ''} 
                onCreditsUpdated={loadUserBalance}
                onTopUpSuccess={handleUSDTTopUpSuccess}
                onClose={onClose}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enhanced ALGO Payment Tab */}
        <TabsContent value="algo" className="space-y-6 mt-8">
          <Card className="relative overflow-hidden bg-gradient-to-br from-green-500/5 via-background to-emerald-500/5 border-green-500/20">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-transparent to-emerald-500/10 opacity-30" />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-500" />
            
            <CardHeader className="relative">
              <CardTitle className="flex items-center gap-4 text-2xl">
                <div className="relative">
                  <div className="absolute inset-0 w-10 h-10 bg-green-500/30 rounded-full blur-lg animate-pulse" />
                  <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                    <Coins className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold">Purchase with ALGO</div>
                  <p className="text-green-400 text-sm font-medium">Direct payment • Instant delivery • Bonus credits available</p>
                </div>
              </CardTitle>
              <p className="text-muted-foreground text-lg">
                Direct payment with Algorand (ALGO) - requires Algorand wallet connection
              </p>
            </CardHeader>
            
            <CardContent className="relative space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {purchaseOptions.map((option, index) => (
                  <Card 
                    key={index} 
                    className={`relative group cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                      option.popular 
                        ? 'border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent shadow-lg shadow-primary/20' 
                        : 'border-border/50 hover:border-green-500/30 bg-gradient-to-br from-green-500/5 to-transparent hover:shadow-lg hover:shadow-green-500/10'
                    }`}
                    onClick={() => handlePurchaseCredits(option.algo)}
                  >
                    {option.popular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                        <Badge className="bg-gradient-to-r from-primary to-primary/80 text-white font-bold px-4 py-1 shadow-lg animate-pulse">
                          🔥 Most Popular
                        </Badge>
                      </div>
                    )}
                    
                    <CardContent className="p-6 text-center space-y-4">
                      <div className="space-y-2">
                        <div className="text-3xl font-bold text-foreground">
                          {option.credits + option.bonus}
                        </div>
                        <div className="text-sm text-muted-foreground uppercase tracking-wider font-medium">
                          Total Credits
                        </div>
                        
                        {option.bonus > 0 && (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 font-semibold">
                            <Zap className="w-3 h-3 mr-1" />
                            +{option.bonus} bonus credits
                          </Badge>
                        )}
                        
                        <div className="text-lg font-semibold text-primary">
                          {option.algo} ALGO
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          ≈ ${(option.algo * 0.15).toFixed(2)} USD
                        </div>
                      </div>
                      
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePurchaseCredits(option.algo);
                        }}
                        disabled={isPurchasing || walletType !== 'algorand'}
                        className={`w-full font-semibold transition-all duration-300 ${
                          option.popular 
                            ? 'bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:scale-105' 
                            : 'bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 hover:border-green-500/50'
                        }`}
                        size="lg"
                      >
                        {isPurchasing ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <>
                            <Coins className="w-4 h-4 mr-2" />
                            Purchase
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {walletType !== 'algorand' && (
                <Card className="border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 to-orange-500/10">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-yellow-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-yellow-400 mb-1">Algorand Wallet Required</h4>
                        <p className="text-sm text-yellow-300/80">
                          Connect your Algorand wallet (Pera Wallet) to purchase credits with ALGO
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="text-center text-sm text-muted-foreground p-4 bg-muted/10 rounded-lg border border-border/50">
                <p><strong>Exchange Rate:</strong> 1 credit = {PRICING.CREDIT_TO_ALGO_RATE} ALGO • 1 ALGO = {PRICING.ALGO_TO_CREDIT_RATE} credits</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Success Modal with Confetti */}
      <CreditTopUpSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        onTopUpAgain={handleTopUpAgain}
        topUpDetails={successDetails || {
          algoAmount: 0,
          creditsReceived: 0,
          bonusCredits: 0,
          transactionId: '',
          paymentMethod: 'ALGO'
        }}
      />
    </div>
  );
}
