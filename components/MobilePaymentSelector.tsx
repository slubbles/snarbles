'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { CreditCard, Wallet, AlertCircle, Info, CheckCircle, Smartphone, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useWalletAuth } from '@/components/providers/WalletAuthProvider';
import { useToast } from '@/hooks/use-toast';
import { usePaymentState, usePaymentSelectors } from '@/hooks/usePaymentState';
import { isMobile } from '@/lib/mobile-wallet-utils';
import { getAlgorandClient } from '@/lib/algorand';

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
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isLoadingCredits, setIsLoadingCredits] = useState(false);
  const { walletAddress } = useWalletAuth();
  const { toast } = useToast();
  
  // Use centralized payment state
  const {
    selectedMethod,
    userCredits,
    walletBalance,
    setSelectedMethod,
    setWalletBalance,
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

  // Function to fetch real ALGO balance
  const fetchRealAlgoBalance = async (address: string, networkName: string): Promise<number> => {
    try {
      if (!networkName.includes('algorand')) {
        console.log(`ℹ️ [Mobile] Not an Algorand network (${networkName}), returning 0 balance`);
        return 0;
      }
      
      console.log(`🔄 [Mobile] Fetching ALGO balance for address: ${address} on network: ${networkName}`);
      const algodClient = getAlgorandClient(networkName);
      
      // Test connection first
      await algodClient.status().do();
      console.log(`✅ [Mobile] Connected to Algorand network: ${networkName}`);
      
      const accountInfo = await algodClient.accountInformation(address).do();
      
      // Convert from microALGOs to ALGOs (1 ALGO = 1,000,000 microALGOs)
      const algoBalance = Number(accountInfo.amount) / 1000000;
      console.log(`✅ [Mobile] Real ALGO balance fetched: ${algoBalance} ALGO for address ${address.substring(0, 8)}...`);
      console.log(`📊 [Mobile] Account details:`, {
        address: address.substring(0, 8) + '...',
        microAlgos: accountInfo.amount,
        algos: algoBalance,
        minBalance: Number(accountInfo.minBalance) / 1000000
      });
      
      return algoBalance;
    } catch (error) {
      console.error('❌ [Mobile] Error fetching ALGO balance:', error);
      
      // Provide more specific error information
      if (error instanceof Error) {
        if (error.message.includes('account does not exist')) {
          console.warn('⚠️ [Mobile] Account not found on network - may need to fund the account first');
        } else if (error.message.includes('network')) {
          console.warn('⚠️ [Mobile] Network connection issue - please check internet connection');
        }
      }
      
      return 0;
    }
  };

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
      
      setIsLoadingCredits(true);
      try {
        const { getCreditsBalance } = await import('@/lib/credit-system');
        const result = await getCreditsBalance(walletAddress);
        
        if (result.success) {
          const credits = result.balance || 0;
          const finalCredits = credits === 0 ? 10 : credits;
          setUserCredits(finalCredits);
          console.log(`🔄 [Mobile] Loaded user credits: ${finalCredits} (original: ${credits})`);
        } else {
          setUserCredits(10);
          console.log('🔄 [Mobile] Credit system unavailable, using demo credits: 10');
        }
      } catch (error) {
        console.error('❌ [Mobile] Failed to load user credits:', error);
        setUserCredits(10);
        console.log('🔄 [Mobile] Credit system error, using demo credits: 10');
      } finally {
        setIsLoadingCredits(false);
      }
    };

    loadUserCredits();
  }, [walletAddress, setUserCredits]);

  // Load wallet balance
  useEffect(() => {
    const loadWalletBalance = async () => {
      if (!walletAddress || !isAlgorandNetwork) {
        setWalletBalance(null);
        return;
      }
      
      setIsLoadingBalance(true);
      try {
        console.log(`🔄 [Mobile] Fetching real ALGO balance for ${walletAddress} on ${network}...`);
        const realBalance = await fetchRealAlgoBalance(walletAddress, network);
        setWalletBalance(realBalance);
        console.log(`✅ [Mobile] ALGO balance loaded: ${realBalance} ALGO`);
      } catch (error) {
        console.error('[Mobile] Failed to load wallet balance:', error);
        setWalletBalance(null);
      } finally {
        setIsLoadingBalance(false);
      }
    };

    loadWalletBalance();
  }, [walletAddress, isAlgorandNetwork, network, setWalletBalance]);

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
              ? 'border-primary glass-card shadow-md' 
              : 'border-border hover:border-muted-foreground hover:shadow-sm'
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
                ? 'border-primary bg-primary' 
                : 'border-muted-foreground'
              }
            `}>
              {selectedMethod === 'credits' && (
                <div className="w-3 h-3 bg-white rounded-full" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="font-semibold text-base">Pay with Credits</span>
                {hasEnoughCredits && (
                  <Badge variant="secondary" className="text-xs px-2 py-1">
                    ✨ Best
                  </Badge>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                Instant • No blockchain fees • Simple
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 glass-card border border-border">
                  <span className="text-sm font-medium">Available:</span>
                  <span className={`text-sm font-bold ${hasEnoughCredits ? 'text-primary' : 'text-red-500'}`}>
                    {isLoadingCredits ? (
                      <span className="flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Loading...
                      </span>
                    ) : (
                      `${userCredits.toLocaleString()} credits`
                    )}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Required:</span>
                  <span className="text-sm font-bold text-foreground">
                    {creditsRequired.toLocaleString()} credits
                  </span>
                </div>
              </div>
              
              {!hasEnoughCredits && (
                <div className="mt-3 p-3 glass-card border border-red-500/30">
                  <p className="text-sm text-red-500 font-medium">
                    Need {(creditsRequired - userCredits).toLocaleString()} more credits
                  </p>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="h-auto p-0 mt-1 text-red-500 font-medium"
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
                ? 'border-primary glass-card shadow-md' 
                : 'border-border hover:border-muted-foreground hover:shadow-sm'
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
                  ? 'border-primary bg-primary' 
                  : 'border-muted-foreground'
                }
              `}>
                {selectedMethod === 'algo_direct' && (
                  <div className="w-3 h-3 bg-white rounded-full" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="font-semibold text-base">Pay with ALGO</span>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                  Direct blockchain payment • Supports platform
                </p>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 glass-card border border-border">
                    <span className="text-sm font-medium">Wallet:</span>
                    <span className={`text-sm font-bold ${hasEnoughAlgo ? 'text-primary' : 'text-red-500'} flex items-center gap-1`}>
                      {isLoadingBalance ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Loading...
                        </>
                      ) : walletBalance !== null ? (
                        `${walletBalance.toFixed(6)} ALGO`
                      ) : (
                        'Failed to load'
                      )}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Required:</span>
                    <span className="text-sm font-bold text-foreground">
                      {algoRequired.toFixed(6)} ALGO
                    </span>
                  </div>
                </div>
                
                {walletAddress && walletBalance !== null && !hasEnoughAlgo && (
                  <div className="mt-3 p-3 glass-card border border-red-500/30">
                    <p className="text-sm text-red-500 font-medium">
                      Need {(algoRequired - walletBalance).toFixed(6)} more ALGO
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Wallet Connection Prompt - Mobile Optimized */}
        {!walletAddress && (
          <Alert className="border-primary/30 glass-card">
            <AlertCircle className="w-5 h-5" />
            <AlertDescription>
              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-primary mb-1">
                    Wallet Required for Payment
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Connect your wallet to see available payment options and balances.
                  </p>
                </div>
                
                <Button 
                  size="sm" 
                  className="w-full button-enhanced"
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
          <div className="glass-card p-4 border border-primary/20">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span className="font-semibold text-base">Payment Ready</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-muted/50 rounded-lg p-3 border border-border">
                <div className="text-muted-foreground mb-1">Method</div>
                <div className="font-bold">
                  {selectedMethod === 'credits' ? 'Credits' : 'ALGO'}
                </div>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-3 border border-border">
                <div className="text-muted-foreground mb-1">Cost</div>
                <div className="font-bold">
                  {selectedMethod === 'credits' 
                    ? `${creditsRequired} credits` 
                    : `${algoRequired} ALGO`
                  }
                </div>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-3 border border-border col-span-2">
                <div className="text-muted-foreground mb-1">Network</div>
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
