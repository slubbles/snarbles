'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { CreditCard, Wallet, AlertCircle, Info, CheckCircle, Smartphone } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useWalletAuth } from '@/components/providers/WalletAuthProvider';
import { useToast } from '@/hooks/use-toast';
import { usePaymentState, usePaymentSelectors } from '@/hooks/usePaymentState';
import { isMobile } from '@/lib/mobile-wallet-utils';

export type PaymentMethod = 'credits' | 'algo_direct';

interface MobilePaymentSelectorProps {
  creditsRequired: number;
  algoRequired: number;
  network: string;
  className?: string;
}

export default function MobilePaymentSelector({
  creditsRequired,
  algoRequired,
  network,
  className = ''
}: MobilePaymentSelectorProps) {
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const { walletAddress } = useWalletAuth();
  const { toast } = useToast();
  
  // Use centralized payment state
  const {
    selectedMethod,
    userCredits,
    walletBalance,
    setSelectedMethod,
    setNetwork,
    setIsConnected,
    setUserCredits
  } = usePaymentState();
  
  // Use payment selectors with dynamic values
  const hasEnoughCredits = userCredits >= creditsRequired;
  const hasEnoughAlgo = walletBalance !== null && walletBalance >= algoRequired;
  const {
    isAlgorandNetwork
  } = usePaymentSelectors();

  useEffect(() => {
    setIsMobileDevice(isMobile());
  }, []);

  // Update network when prop changes
  useEffect(() => {
    setNetwork(network.includes('algorand') ? 'algorand' : 'solana');
  }, [network, setNetwork]);

  // Update connection state
  useEffect(() => {
    setIsConnected(!!walletAddress);
  }, [walletAddress, setIsConnected]);

  // Load user credits
  useEffect(() => {
    const loadUserCredits = async () => {
      if (!walletAddress) {
        setUserCredits(0);
        return;
      }
      
      try {
        const { getCreditsBalance } = await import('@/lib/credit-system');
        const result = await getCreditsBalance(walletAddress);
        
        if (result.success) {
          const credits = result.balance || 0;
          const finalCredits = credits === 0 ? 10 : credits;
          setUserCredits(finalCredits);
        } else {
          setUserCredits(10);
        }
      } catch (error) {
        console.error('Failed to load user credits:', error);
        setUserCredits(10);
      }
    };

    loadUserCredits();
  }, [walletAddress, setUserCredits]);

  const handlePaymentSelect = (method: PaymentMethod) => {
    if (method === 'credits' && !hasEnoughCredits) {
      toast({
        title: "Insufficient Credits",
        description: `You need ${creditsRequired - userCredits} more credits to use this payment method.`,
        variant: "destructive",
      });
      return;
    }

    if (method === 'algo_direct' && !hasEnoughAlgo) {
      toast({
        title: "Insufficient ALGO",
        description: `You need ${(algoRequired - (walletBalance || 0)).toFixed(3)} more ALGO to use this payment method.`,
        variant: "destructive",
      });
      return;
    }

    setSelectedMethod(method);
    toast({
      title: "Payment Method Selected",
      description: method === 'credits' ? "Credits payment selected" : "Direct ALGO payment selected",
    });
  };

  return (
    <Card 
      className={`w-full ${className}`} 
      data-testid="mobile-payment-selector"
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {isMobileDevice && <Smartphone className="w-5 h-5" />}
          <CreditCard className="w-5 h-5" />
          Payment Method
        </CardTitle>
        {isMobileDevice && (
          <p className="text-sm text-muted-foreground">
            Tap to select your preferred payment method
          </p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        
        {/* Credits Payment Option - Mobile Optimized */}
        <div 
          className={`
            border-2 rounded-xl p-4 cursor-pointer transition-all duration-200
            ${selectedMethod === 'credits' 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 shadow-md' 
              : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 hover:shadow-sm'
            }
            ${!hasEnoughCredits ? 'opacity-60' : ''}
            min-h-[100px] active:scale-[0.98]
          `}
          onClick={() => handlePaymentSelect('credits')}
          data-testid="mobile-payment-credits"
        >
          <div className="flex items-start gap-4">
            <div className={`
              w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 flex-shrink-0
              ${selectedMethod === 'credits' 
                ? 'border-blue-500 bg-blue-500' 
                : 'border-gray-300 dark:border-gray-600'
              }
            `}>
              {selectedMethod === 'credits' && (
                <div className="w-3 h-3 bg-white rounded-full" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <span className="font-semibold text-base">Pay with Credits</span>
                {hasEnoughCredits && (
                  <Badge variant="secondary" className="text-xs px-2 py-1">
                    ✨ Best
                  </Badge>
                )}
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
                Instant • No blockchain fees • Simple
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg border">
                  <span className="text-sm font-medium">Available:</span>
                  <span className={`text-sm font-bold ${hasEnoughCredits ? 'text-green-600' : 'text-red-600'}`}>
                    {userCredits.toLocaleString()} credits
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <span className="text-sm font-medium">Required:</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {creditsRequired.toLocaleString()} credits
                  </span>
                </div>
              </div>
              
              {!hasEnoughCredits && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                    Need {(creditsRequired - userCredits).toLocaleString()} more credits
                  </p>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="h-auto p-0 mt-1 text-red-600 dark:text-red-400 font-medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      toast({
                        title: "Get More Credits",
                        description: "Visit the credits page to purchase more credits.",
                      });
                    }}
                  >
                    Get more credits →
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Direct ALGO Payment Option - Mobile Optimized */}
        {isAlgorandNetwork && (
          <div 
            className={`
              border-2 rounded-xl p-4 cursor-pointer transition-all duration-200
              ${selectedMethod === 'algo_direct' 
                ? 'border-green-500 bg-green-50 dark:bg-green-950/20 shadow-md' 
                : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 hover:shadow-sm'
              }
              ${!walletAddress || !hasEnoughAlgo ? 'opacity-60' : ''}
              min-h-[100px] active:scale-[0.98]
            `}
            onClick={() => walletAddress && handlePaymentSelect('algo_direct')}
            data-testid="mobile-payment-algo"
          >
            <div className="flex items-start gap-4">
              <div className={`
                w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 flex-shrink-0
                ${selectedMethod === 'algo_direct' 
                  ? 'border-green-500 bg-green-500' 
                  : 'border-gray-300 dark:border-gray-600'
                }
              `}>
                {selectedMethod === 'algo_direct' && (
                  <div className="w-3 h-3 bg-white rounded-full" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="font-semibold text-base">Pay with ALGO</span>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
                  Direct blockchain payment • Supports platform
                </p>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg border">
                    <span className="text-sm font-medium">Wallet:</span>
                    <span className={`text-sm font-bold ${hasEnoughAlgo ? 'text-green-600' : 'text-red-600'}`}>
                      {walletBalance !== null ? `${walletBalance.toFixed(3)} ALGO` : 'Loading...'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <span className="text-sm font-medium">Required:</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {algoRequired.toFixed(3)} ALGO
                    </span>
                  </div>
                </div>
                
                {walletAddress && walletBalance !== null && !hasEnoughAlgo && (
                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                      Need {(algoRequired - walletBalance).toFixed(3)} more ALGO
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Wallet Connection Prompt - Mobile Optimized */}
        {!walletAddress && (
          <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
            <AlertCircle className="w-5 h-5" />
            <AlertDescription>
              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-amber-800 dark:text-amber-200 mb-1">
                    Wallet Required for Payment
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Connect your wallet to see available payment options and balances.
                  </p>
                </div>
                
                <Button 
                  size="sm" 
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white border-0"
                  onClick={() => {
                    toast({
                      title: "Connect Wallet",
                      description: "Use the wallet connection button at the top of the page to connect your wallet.",
                    });
                  }}
                  data-testid="mobile-connect-wallet-prompt"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Connect Wallet
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Payment Summary - Mobile Optimized */}
        {selectedMethod && walletAddress && (
          <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950/20 dark:to-green-950/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-base">Payment Ready</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border">
                <div className="text-gray-600 dark:text-gray-400 mb-1">Method</div>
                <div className="font-bold">
                  {selectedMethod === 'credits' ? 'Credits' : 'ALGO'}
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border">
                <div className="text-gray-600 dark:text-gray-400 mb-1">Cost</div>
                <div className="font-bold">
                  {selectedMethod === 'credits' 
                    ? `${creditsRequired} credits` 
                    : `${algoRequired} ALGO`
                  }
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border col-span-2">
                <div className="text-gray-600 dark:text-gray-400 mb-1">Network</div>
                <div className="font-bold capitalize">
                  {network.replace('-', ' ')}
                </div>
              </div>
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
