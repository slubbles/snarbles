'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Wallet, AlertCircle, CheckCircle, Info, Zap, Shield } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useWalletAuth } from '@/components/providers/WalletAuthProvider';
import { useToast } from '@/hooks/use-toast';

export type PaymentMethod = 'credits' | 'algo_direct';

interface PaymentSelectorProps {
  selectedMethod: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
  userCredits: number;
  creditsRequired: number;
  algoRequired: number;
  network: string;
  className?: string;
}

export default function PaymentSelector({
  selectedMethod,
  onMethodChange,
  userCredits,
  creditsRequired,
  algoRequired,
  network,
  className = ''
}: PaymentSelectorProps) {
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const { walletAddress, walletType } = useWalletAuth();
  const { toast } = useToast();

  // Check if methods are available
  const hasEnoughCredits = userCredits >= creditsRequired;
  const hasEnoughAlgo = walletBalance !== null && walletBalance >= algoRequired;
  const isAlgorandNetwork = network.includes('algorand');

  // Load wallet balance
  useEffect(() => {
    const loadWalletBalance = async () => {
      if (!walletAddress || !isAlgorandNetwork) return;
      
      setIsLoadingBalance(true);
      try {
        // Mock balance check - replace with actual implementation
        await new Promise(resolve => setTimeout(resolve, 1000));
        setWalletBalance(25.5); // Mock balance
      } catch (error) {
        console.error('Error loading wallet balance:', error);
        setWalletBalance(null);
      } finally {
        setIsLoadingBalance(false);
      }
    };

    loadWalletBalance();
  }, [walletAddress, isAlgorandNetwork]);

  const paymentMethods = [
    {
      id: 'credits' as PaymentMethod,
      name: 'Credits',
      description: 'Use your Snarbles credits',
      icon: CreditCard,
      available: hasEnoughCredits,
      cost: `${creditsRequired} credits`,
      balance: `${userCredits} available`,
      recommended: true,
      disabled: !hasEnoughCredits
    },
    {
      id: 'algo_direct' as PaymentMethod,
      name: 'Direct ALGO Payment',
      description: 'Pay directly from your wallet',
      icon: Wallet,
      available: hasEnoughAlgo,
      cost: `${algoRequired} ALGO`,
      balance: isLoadingBalance ? 'Loading...' : walletBalance !== null ? `${walletBalance} ALGO` : 'Connect wallet',
      recommended: false,
      disabled: !isAlgorandNetwork || !hasEnoughAlgo
    }
  ];

  return (
    <Card className={`border-2 border-muted transition-all duration-200 ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" />
          Payment Method
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <RadioGroup
          value={selectedMethod}
          onValueChange={(value) => onMethodChange(value as PaymentMethod)}
          className="space-y-4"
        >
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            
            return (
              <div key={method.id} className="relative">
                <div className={`
                  border-2 rounded-lg p-4 transition-all duration-200 cursor-pointer
                  ${selectedMethod === method.id 
                    ? 'ring-2 ring-primary border-primary bg-primary/5' 
                    : 'border-muted hover:border-primary/50'
                  }
                  ${method.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}>
                  <div className="flex items-start gap-3">
                    <RadioGroupItem 
                      value={method.id} 
                      id={method.id}
                      disabled={method.disabled}
                      className="mt-1"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <Label 
                        htmlFor={method.id} 
                        className={`
                          flex items-center gap-2 font-medium mb-1 cursor-pointer
                          ${method.disabled ? 'text-muted-foreground' : 'text-foreground'}
                        `}
                      >
                        <Icon className="w-4 h-4" />
                        {method.name}
                        {method.recommended && (
                          <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-400 border-green-500/20">
                            Recommended
                          </Badge>
                        )}
                      </Label>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        {method.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-semibold text-foreground">
                            {method.cost}
                          </span>
                          {method.available && (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          )}
                        </div>
                        
                        <span className="text-sm text-muted-foreground">
                          {method.balance}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </RadioGroup>

        <Separator className="bg-muted" />

        {/* Payment Method Info */}
        <div className="space-y-3">
          {selectedMethod === 'credits' && (
            <Alert className="border-blue-500/20 bg-blue-500/10">
              <Info className="w-4 h-4 text-blue-400" />
              <AlertDescription className="text-blue-300">
                <strong>Credits:</strong> Fast and convenient. Credits are pre-paid tokens that make deployment instant.
              </AlertDescription>
            </Alert>
          )}
          
          {selectedMethod === 'algo_direct' && (
            <Alert className="border-orange-500/20 bg-orange-500/10">
              <Info className="w-4 h-4 text-orange-400" />
              <AlertDescription className="text-orange-300">
                <strong>Direct ALGO Payment:</strong> Pay directly from your wallet. Transaction requires wallet approval.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Insufficient Funds Warnings */}
        {selectedMethod === 'credits' && !hasEnoughCredits && (
          <Alert className="border-red-500/20 bg-red-500/10">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <AlertDescription className="text-red-300">
              <strong>Insufficient Credits:</strong> You need {creditsRequired} credits but only have {userCredits}.
              <Button 
                variant="link" 
                className="p-0 h-auto text-red-300 hover:text-red-200 ml-2"
                onClick={() => {
                  toast({
                    title: "Top Up Credits",
                    description: "Redirecting to credit top-up...",
                  });
                }}
              >
                Top up credits →
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {selectedMethod === 'algo_direct' && !isAlgorandNetwork && (
          <Alert className="border-yellow-500/20 bg-yellow-500/10">
            <AlertCircle className="w-4 h-4 text-yellow-400" />
            <AlertDescription className="text-yellow-300">
              <strong>Network Mismatch:</strong> ALGO payments are only available for Algorand networks.
            </AlertDescription>
          </Alert>
        )}

        {selectedMethod === 'algo_direct' && isAlgorandNetwork && !hasEnoughAlgo && (
          <Alert className="border-red-500/20 bg-red-500/10">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <AlertDescription className="text-red-300">
              <strong>Insufficient ALGO:</strong> You need {algoRequired} ALGO but only have {walletBalance || 0}.
            </AlertDescription>
          </Alert>
        )}

        {/* Pricing Comparison */}
        <div className="border-2 border-muted rounded-lg p-4 bg-muted/5">
          <h4 className="text-base font-semibold mb-3">💰 Pricing Comparison</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Credits</span>
              <span className="text-base font-semibold">{creditsRequired} credits</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Direct ALGO</span>
              <span className="text-base font-semibold">{algoRequired} ALGO</span>
            </div>
            <Separator className="bg-muted" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-green-400">Savings with Credits</span>
              <span className="text-base font-semibold text-green-400">
                {((algoRequired - (creditsRequired * 2)) / algoRequired * 100).toFixed(0)}% off
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

  useEffect(() => {
    if (walletAddress) {
      loadPaymentOptions();
    }
  }, [walletAddress, network]);

  const loadPaymentOptions = async () => {
    if (!walletAddress) return;
    
    setIsLoading(true);
    try {
      const result = await getPaymentOptions(network, walletAddress);
      if (result.success && result.options) {
        setPaymentOptions(result.options);
        setSelectedMethod(result.options.recommended_method);
      } else {
        throw new Error(result.error || 'Failed to load payment options');
      }
    } catch (error) {
      console.error('Error loading payment options:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payment options',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
    if (paymentOptions) {
      const paymentInfo = method === 'credits' ? paymentOptions.credits : paymentOptions.direct_algo;
      onPaymentMethodSelected(method, paymentInfo);
    }
  };

  const handlePurchaseCredits = async (algoAmount: number) => {
    if (!walletAddress || walletType !== 'algorand') {
      toast({
        title: 'Error',
        description: 'Algorand wallet required for ALGO payments',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    try {
      // This would need to be implemented with actual wallet signing
      // For now, we'll simulate the process
      toast({
        title: 'Processing Payment',
        description: 'Please approve the transaction in your wallet...',
      });

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: 'Credits Purchased',
        description: `Successfully purchased credits with ${algoAmount} ALGO`,
      });

      // Reload payment options to reflect new balance
      await loadPaymentOptions();
      setShowCreditsPurchase(false);
      
      onPaymentCompleted?.(true, { method: 'credits_purchase', amount: algoAmount });
    } catch (error) {
      console.error('Error purchasing credits:', error);
      toast({
        title: 'Purchase Failed',
        description: 'Failed to purchase credits. Please try again.',
        variant: 'destructive'
      });
      onPaymentCompleted?.(false, { error: error });
    } finally {
      setIsProcessing(false);
    }
  };

  const isMainnet = network.includes('mainnet');

  if (isLoading) {
    return (
      <div className=\"snarbles-card p-6\">
        <div className=\"animate-pulse space-y-4\">
          <div className=\"h-4 bg-gray-700 rounded w-3/4\"></div>
          <div className=\"h-4 bg-gray-700 rounded w-1/2\"></div>
          <div className=\"h-10 bg-gray-700 rounded\"></div>
        </div>
      </div>
    );
  }

  if (!paymentOptions) {
    return (
      <Alert className=\"snarbles-card border-red-500/20 bg-red-500/10\">
        <AlertCircle className=\"w-4 h-4\" />
        <AlertDescription>
          Failed to load payment options. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className=\"space-y-6\">
      {/* Payment Method Selection */}
      <div className=\"snarbles-card p-6\">
        <div className=\"mb-6\">
          <h3 className=\"snarbles-heading-4 mb-2\">Choose Payment Method</h3>
          <p className=\"snarbles-body-small text-gray-400\">
            {isMainnet ? 'Select how you want to pay for token creation' : 'Token creation is free on testnet'}
          </p>
        </div>

        {!isMainnet ? (
          <Alert className=\"border-green-500/20 bg-green-500/10\">
            <CheckCircle className=\"w-4 h-4 text-green-400\" />
            <AlertDescription className=\"text-green-300\">
              <strong>Testnet Deployment - Free</strong>
              <br />
              No payment required for testnet token creation
            </AlertDescription>
          </Alert>
        ) : (
          <Tabs value={selectedMethod} onValueChange={(value) => handlePaymentMethodSelect(value as PaymentMethod)}>
            <TabsList className=\"grid w-full grid-cols-2 bg-gray-800 border-gray-700\">
              <TabsTrigger 
                value=\"credits\" 
                className=\"data-[state=active]:bg-red-600 data-[state=active]:text-white\"
              >
                <CreditCard className=\"w-4 h-4 mr-2\" />
                Credits
              </TabsTrigger>
              <TabsTrigger 
                value=\"direct_algo\"
                className=\"data-[state=active]:bg-blue-600 data-[state=active]:text-white\"
              >
                <Wallet className=\"w-4 h-4 mr-2\" />
                Direct ALGO
              </TabsTrigger>
            </TabsList>

            <TabsContent value=\"credits\" className=\"space-y-4 mt-6\">
              <Card className=\"snarbles-card border-red-500/20\">
                <CardHeader className=\"pb-3\">
                  <div className=\"flex items-center justify-between\">
                    <div className=\"flex items-center gap-3\">
                      <div className=\"w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center\">
                        <CreditCard className=\"w-5 h-5 text-red-400\" />
                      </div>
                      <div>
                        <h4 className=\"snarbles-heading-5\">Credits System</h4>
                        <p className=\"snarbles-body-small text-gray-400\">Use your credit balance</p>
                      </div>
                    </div>
                    <Badge variant=\"outline\" className=\"border-red-500/20 text-red-400\">
                      Recommended
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className=\"space-y-4\">
                  <div className=\"flex items-center justify-between\">
                    <span className=\"snarbles-body\">Cost</span>
                    <span className=\"snarbles-body font-semibold\">{paymentOptions.credits.amount} credits</span>
                  </div>
                  <div className=\"flex items-center justify-between\">
                    <span className=\"snarbles-body\">Your Balance</span>
                    <span className={`snarbles-body font-semibold ${
                      paymentOptions.user_credits_balance >= paymentOptions.credits.amount 
                        ? 'text-green-400' 
                        : 'text-red-400'
                    }`}>
                      {paymentOptions.user_credits_balance} credits
                    </span>
                  </div>
                  
                  {paymentOptions.user_credits_balance < paymentOptions.credits.amount && (
                    <Alert className=\"border-orange-500/20 bg-orange-500/10\">
                      <AlertCircle className=\"w-4 h-4 text-orange-400\" />
                      <AlertDescription className=\"text-orange-300\">
                        <strong>Insufficient Credits</strong>
                        <br />
                        You need {paymentOptions.credits.amount - paymentOptions.user_credits_balance} more credits
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <Button
                    onClick={() => setShowCreditsPurchase(true)}
                    variant=\"outline\"
                    className=\"w-full border-red-500/20 hover:bg-red-500/10\"
                  >
                    <TrendingUp className=\"w-4 h-4 mr-2\" />
                    Purchase More Credits
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value=\"direct_algo\" className=\"space-y-4 mt-6\">
              <Card className=\"snarbles-card border-blue-500/20\">
                <CardHeader className=\"pb-3\">
                  <div className=\"flex items-center justify-between\">
                    <div className=\"flex items-center gap-3\">
                      <div className=\"w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center\">
                        <Wallet className=\"w-5 h-5 text-blue-400\" />
                      </div>
                      <div>
                        <h4 className=\"snarbles-heading-5\">Direct ALGO Payment</h4>
                        <p className=\"snarbles-body-small text-gray-400\">Pay directly from your wallet</p>
                      </div>
                    </div>
                    <Badge variant=\"outline\" className=\"border-blue-500/20 text-blue-400\">
                      Direct
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className=\"space-y-4\">
                  <div className=\"flex items-center justify-between\">
                    <span className=\"snarbles-body\">Cost</span>
                    <span className=\"snarbles-body font-semibold\">{paymentOptions.direct_algo.amount} ALGO</span>
                  </div>
                  <div className=\"flex items-center justify-between\">
                    <span className=\"snarbles-body\">Your Balance</span>
                    <span className={`snarbles-body font-semibold ${
                      (paymentOptions.user_algo_balance || 0) >= paymentOptions.direct_algo.amount 
                        ? 'text-green-400' 
                        : 'text-red-400'
                    }`}>
                      {paymentOptions.user_algo_balance?.toFixed(2) || '0.00'} ALGO
                    </span>
                  </div>
                  <div className=\"flex items-center justify-between\">
                    <span className=\"snarbles-body-small text-gray-400\">Est. USD</span>
                    <span className=\"snarbles-body-small text-gray-400\">
                      ${paymentOptions.direct_algo.estimated_cost_usd?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  
                  {(paymentOptions.user_algo_balance || 0) < paymentOptions.direct_algo.amount && (
                    <Alert className=\"border-orange-500/20 bg-orange-500/10\">
                      <AlertCircle className=\"w-4 h-4 text-orange-400\" />
                      <AlertDescription className=\"text-orange-300\">
                        <strong>Insufficient ALGO</strong>
                        <br />
                        You need {(paymentOptions.direct_algo.amount - (paymentOptions.user_algo_balance || 0)).toFixed(2)} more ALGO
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <div className=\"flex items-center gap-2 text-sm text-gray-400\">
                    <Shield className=\"w-4 h-4\" />
                    <span>Secure blockchain payment</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Credits Purchase Modal */}
      {showCreditsPurchase && (
        <div className=\"snarbles-card p-6 border-green-500/20\">
          <div className=\"mb-4\">
            <h4 className=\"snarbles-heading-5 mb-2\">Purchase Credits</h4>
            <p className=\"snarbles-body-small text-gray-400\">
              Buy credits with ALGO at a rate of 1 ALGO = 0.5 credits
            </p>
          </div>
          
          <div className=\"grid grid-cols-1 md:grid-cols-3 gap-4 mb-6\">
            {[
              { algo: 10, credits: 5, popular: true },
              { algo: 20, credits: 10, popular: false },
              { algo: 50, credits: 25, popular: false }
            ].map((option) => (
              <Card 
                key={option.algo}
                className={`snarbles-card cursor-pointer transition-all hover:border-green-500/40 ${
                  option.popular ? 'border-green-500/30 bg-green-500/5' : 'border-gray-700'
                }`}
                onClick={() => handlePurchaseCredits(option.algo)}
              >
                <CardContent className=\"p-4 text-center\">
                  {option.popular && (
                    <Badge className=\"mb-2 bg-green-500/20 text-green-400 border-green-500/20\">
                      Popular
                    </Badge>
                  )}
                  <div className=\"text-2xl font-bold text-green-400 mb-1\">{option.credits}</div>
                  <div className=\"text-sm text-gray-400 mb-2\">credits</div>
                  <div className=\"text-lg font-semibold\">{option.algo} ALGO</div>
                  <div className=\"text-xs text-gray-500\">
                    ≈ ${(option.algo * 0.15).toFixed(2)} USD
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className=\"flex gap-3\">
            <Button
              onClick={() => setShowCreditsPurchase(false)}
              variant=\"outline\"
              className=\"flex-1\"
            >
              Cancel
            </Button>
            <Button
              onClick={() => handlePurchaseCredits(10)}
              className=\"flex-1 bg-green-600 hover:bg-green-700\"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <div className=\"animate-spin rounded-full w-4 h-4 border-b-2 border-white mr-2\"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Zap className=\"w-4 h-4 mr-2\" />
                  Purchase Credits
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
