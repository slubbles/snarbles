'use client';

import React, { useState, useEffect } from 'react';
import * as algosdk from 'algosdk';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Info,
  ExternalLink,
  Copy,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWalletAuth } from '@/components/providers/WalletAuthProvider';
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider';
import { useWallet } from '@solana/wallet-adapter-react';
import { 
  getCreditsBalance,
  addCreditTransaction 
} from '@/lib/credit-system';
import { 
  purchaseCreditsWithAlgo, 
  PRICING, 
  calculateCreditsFromAlgo 
} from '@/lib/enhanced-payment-system';
import { 
  getAlgorandUSDTBalance, 
  executeAlgorandUSDTTransfer,
  estimateAlgorandUSDTFee,
  isOptedInToUSDT,
  createUSDTOptInTransaction
} from '@/lib/algorand-usdt-integration';
import { 
  getSolanaUSDTBalance, 
  executeSolanaUSDTTransfer,
  estimateSolanaUSDTFee,
  getSolanaBalance
} from '@/lib/solana-usdt-integration';
import { Alert, AlertDescription } from '@/components/ui/alert';
import CreditTopUpSuccessModal from '@/components/CreditTopUpSuccessModal';

interface WalletSpecificCreditTopUpProps {
  userAddress?: string;
  onCreditsUpdated?: () => void;
}

export default function WalletSpecificCreditTopUp({ userAddress, onCreditsUpdated }: WalletSpecificCreditTopUpProps) {
  const [userBalance, setUserBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [usdtBalance, setUSDTBalance] = useState<number>(0);
  const [nativeBalance, setNativeBalance] = useState<number>(0);
  const [usdtAmount, setUSDTAmount] = useState<string>('10');
  const [creditsAmount, setCreditsAmount] = useState<string>('10');
  const [inputMode, setInputMode] = useState<'usdt' | 'credits'>('usdt');
  const [isOptedIn, setIsOptedIn] = useState<boolean>(true);
  const [estimatedFee, setEstimatedFee] = useState<number>(0);
  const [customAlgoAmount, setCustomAlgoAmount] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [successDetails, setSuccessDetails] = useState<any>(null);
  
  const { toast } = useToast();
  const { walletAddress, walletType, isAuthenticated } = useWalletAuth();
  const algorandWallet = useAlgorandWallet();
  const solanaWallet = useWallet();

  useEffect(() => {
    if (walletAddress) {
      loadUserBalance();
      loadWalletBalances();
    }
  }, [walletAddress, walletType]);

  // Update credits when USDT amount changes
  useEffect(() => {
    if (inputMode === 'usdt' && usdtAmount) {
      const credits = Math.floor(parseFloat(usdtAmount));
      setCreditsAmount(credits.toString());
    }
  }, [usdtAmount, inputMode]);

  // Update USDT when credits amount changes
  useEffect(() => {
    if (inputMode === 'credits' && creditsAmount) {
      const usdt = parseFloat(creditsAmount);
      setUSDTAmount(usdt.toString());
    }
  }, [creditsAmount, inputMode]);

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

  const loadWalletBalances = async () => {
    if (!walletAddress || !walletType) return;

    try {
      if (walletType === 'algorand') {
        // Check ALGO balance
        if (algorandWallet.address) {
          setNativeBalance(algorandWallet.balance || 0);
        }

        // Check USDt balance and opt-in status
        const usdtBalResult = await getAlgorandUSDTBalance(walletAddress);
        if (usdtBalResult.success) {
          setUSDTBalance(usdtBalResult.balance);
        }
        
        const optInResult = await isOptedInToUSDT(walletAddress);
        if (optInResult.success) {
          setIsOptedIn(optInResult.optedIn);
        }
        
        // Estimate fee
        const feeResult = await estimateAlgorandUSDTFee();
        if (feeResult.success) {
          setEstimatedFee(feeResult.fee);
        }
      } else if (walletType === 'solana') {
        // Check SOL balance
        if (solanaWallet.publicKey) {
          const solBalance = await getSolanaBalance(walletAddress);
          setNativeBalance(solBalance);
        }

        // Check SPL-USDT balance
        const usdtBalResult = await getSolanaUSDTBalance(walletAddress);
        if (usdtBalResult.success) {
          setUSDTBalance(usdtBalResult.balance);
        }
        
        // Estimate fee
        const feeResult = await estimateSolanaUSDTFee();
        if (feeResult.success) {
          setEstimatedFee(feeResult.fee);
        }
      }
    } catch (error) {
      console.error('Error loading wallet balances:', error);
    }
  };

  const handleNativePayment = async (packageIndex: number | 'custom', customAmount?: number) => {
    if (!walletAddress || !walletType) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    if (walletType !== 'algorand') {
      toast({
        title: "Feature coming soon",
        description: "SOL direct payments will be available soon",
        variant: "destructive",
      });
      return;
    }

    setIsPurchasing(true);
    try {
      let algoAmount: number;
      let isCustom = false;
      
      if (packageIndex === 'custom') {
        if (!customAmount || customAmount < 1) {
          throw new Error('Please enter a valid ALGO amount (minimum 1 ALGO)');
        }
        algoAmount = customAmount;
        isCustom = true;
      } else {
        const pkg = PRICING.packages[packageIndex as number];
        if (!pkg) {
          throw new Error('Invalid package selected');
        }
        algoAmount = pkg.priceALGO;
      }

      const result = await purchaseCreditsWithAlgo(
        walletAddress,
        algoAmount,
        async (txn: algosdk.Transaction) => {
          // REAL wallet signing using Pera Wallet
          if (!algorandWallet.address) {
            throw new Error('Algorand wallet not connected');
          }
          
          console.log('🔐 Signing REAL ALGO transaction with Pera Wallet...');
          // Pass the transaction object directly to the wallet provider
          // The AlgorandWalletProvider will handle the proper encoding
          const signedTxn = await algorandWallet.signTransaction(txn);
          return signedTxn;
        },
        isCustom
      );

      if (result.success) {
        // Show success modal with confetti
        setSuccessDetails({
          algoAmount,
          creditsReceived: result.creditsReceived || 0,
          bonusCredits: result.bonusCredits || 0,
          transactionId: result.transactionHash || '',
          newBalance: result.newBalance || userBalance
        });
        setShowSuccessModal(true);
        
        // Show warning if there was a database issue
        if (result.databaseWarning) {
          toast({
            title: "Database sync pending",
            description: "Payment successful! Credits will appear after database sync.",
            variant: "default",
          });
        }
        
        // Refresh balance
        await loadUserBalance();
        onCreditsUpdated?.();
      } else {
        throw new Error(result.error || 'Purchase failed');
      }
      
    } catch (error) {
      toast({
        title: "Purchase failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleUSDTPayment = async () => {
    if (!walletAddress || !walletType) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(usdtAmount);
    if (amount <= 0 || amount > usdtBalance) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid USDT amount",
        variant: "destructive",
      });
      return;
    }

    setIsPurchasing(true);
    try {
      if (walletType === 'algorand') {
        // Use auto-opt-in functionality for Algorand
        if (!algorandWallet.address) {
          throw new Error('Algorand wallet not properly connected');
        }

        const walletInterface = {
          address: algorandWallet.address,
          signTransaction: async (txn: any) => {
            const signedTxn = await algorandWallet.signTransaction(txn);
            return signedTxn;
          },
          signTransactions: async (txns: any[]) => {
            return await algorandWallet.signTransaction(txns);
          }
        };

        // Check if user is opted in to USDt
        const optInCheck = await isOptedInToUSDT(walletAddress, true);
        if (!optInCheck.success) {
          throw new Error('Failed to check USDt opt-in status');
        }
        
        if (!optInCheck.optedIn) {
          toast({
            title: "USDt Opt-in Required",
            description: "Please opt-in to USDt first using your wallet's asset management feature.",
            variant: "destructive",
          });
          return;
        }
        
        toast({
          title: "Processing Payment",
          description: `Processing ${amount} USDt payment...`,
        });

        const result = await executeAlgorandUSDTTransfer(
          walletInterface,
          amount,
          true // isTestnet - adjust based on your environment
        );

        if (result.success) {
          toast({
            title: "Payment Successful!",
            description: `${amount} credits purchased successfully!`,
          });
          
          // Refresh balances and credits
          await loadUserBalance();
          await loadWalletBalances();
          onCreditsUpdated?.();
          
          // Reset form
          setUSDTAmount('10');
          setCreditsAmount('10');
        } else {
          throw new Error(result.error || 'Payment failed');
        }

      } else if (walletType === 'solana') {
        // Solana implementation (no opt-in required)
        toast({
          title: "Feature coming soon",
          description: "SPL-USDT payments will be available soon",
          variant: "destructive",
        });
      } else {
        throw new Error('Unsupported wallet type');
      }
      
    } catch (error) {
      console.error('USDT payment error:', error);
      toast({
        title: "Payment failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  const getWalletSpecificInfo = () => {
    if (walletType === 'algorand') {
      return {
        name: 'Pera Wallet',
        nativeCurrency: 'ALGO',
        stablecoin: 'USDt',
        stablecoinFull: 'USDt (Algorand)',
        icon: '🔺',
        color: 'text-blue-500'
      };
    } else if (walletType === 'solana') {
      return {
        name: 'Phantom Wallet',
        nativeCurrency: 'SOL',
        stablecoin: 'USDT',
        stablecoinFull: 'SPL-USDT',
        icon: '👻',
        color: 'text-purple-500'
      };
    }
    return null;
  };

  const walletInfo = getWalletSpecificInfo();

  if (!isAuthenticated || !walletInfo) {
    return (
      <Card className="glass-card">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
            <Wallet className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-3">Connect Your Wallet</h3>
          <p className="text-muted-foreground">
            Connect your Pera or Phantom wallet to top up credits
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Current Balance - Enhanced */}
      <Card className="glass-card border-primary/10">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            Current Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-primary/5 border border-primary/10 rounded-xl hover:scale-105 transition-transform">
              <div className="text-3xl font-bold text-primary mb-2">{userBalance}</div>
              <div className="text-sm text-muted-foreground font-medium">Credits Available</div>
            </div>
            <div className="text-center p-6 bg-muted/10 border border-border rounded-xl hover:scale-105 transition-transform">
              <div className="text-2xl font-bold text-foreground mb-2">{nativeBalance.toFixed(3)}</div>
              <div className="text-sm text-muted-foreground font-medium">{walletInfo.nativeCurrency} Balance</div>
            </div>
            <div className="text-center p-6 bg-muted/10 border border-border rounded-xl hover:scale-105 transition-transform">
              <div className="text-2xl font-bold text-foreground mb-2">{usdtBalance.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground font-medium">{walletInfo.stablecoin} Balance</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Payment Options - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ALGO/SOL Direct Payment */}
        <Card className="glass-card border-green-500/10">
          <CardHeader className="pb-6">
            <CardTitle className="text-xl font-bold text-foreground flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <span className="text-xl">{walletInfo.icon}</span>
              </div>
              {walletInfo.nativeCurrency} Credit Packages
            </CardTitle>
            <p className="text-muted-foreground">
              Pay directly with {walletInfo.nativeCurrency} from your {walletInfo.name}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              {PRICING.packages.map((pkg, index) => (
                <Card key={index} className={`relative glass-card border transition-all hover:scale-[1.02] ${
                  pkg.popular 
                    ? 'border-primary/30 bg-primary/5' 
                    : 'border-border hover:border-primary/20'
                }`}>
                  {pkg.popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                      Most Popular
                    </Badge>
                  )}
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-foreground">{pkg.credits} Credits</div>
                        {pkg.bonus > 0 && (
                          <Badge variant="secondary" className="mt-1 bg-green-500/10 text-green-400 border-green-500/20">
                            +{pkg.bonus} Bonus
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-primary mb-2">
                          {pkg.priceALGO} {walletInfo.nativeCurrency}
                        </div>
                        <Button 
                          onClick={() => handleNativePayment(index)}
                          disabled={isPurchasing || nativeBalance < pkg.priceALGO}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                          size="sm"
                        >
                          {isPurchasing ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            `Buy with ${walletInfo.nativeCurrency}`
                          )}
                        </Button>
                        {nativeBalance < pkg.priceALGO && (
                          <p className="text-xs text-destructive mt-2 font-medium">
                            Insufficient balance
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Custom ALGO Amount */}
            <div className="mt-6 p-6 border border-primary/20 rounded-lg bg-primary/5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-foreground">Custom Amount</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCustomInput(!showCustomInput)}
                  className="text-primary border-primary/20"
                >
                  {showCustomInput ? 'Hide' : 'Custom Amount'}
                </Button>
              </div>
              
              {showCustomInput && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label htmlFor="custom-algo" className="text-sm font-semibold text-foreground">
                      {walletInfo.nativeCurrency} Amount (Min: 1 {walletInfo.nativeCurrency})
                    </Label>
                    <Input
                      id="custom-algo"
                      type="number"
                      value={customAlgoAmount}
                      onChange={(e) => setCustomAlgoAmount(e.target.value)}
                      placeholder="Enter ALGO amount"
                      min="1"
                      max={nativeBalance}
                      className="bg-background border-border text-foreground text-lg"
                    />
                    {customAlgoAmount && parseFloat(customAlgoAmount) >= 1 && (
                      <div className="p-3 bg-background/50 rounded-lg border border-border">
                        <div className="text-sm text-muted-foreground mb-2">Credits Breakdown:</div>
                        {(() => {
                          const calculation = calculateCreditsFromAlgo(parseFloat(customAlgoAmount));
                          return (
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span>Base Credits:</span>
                                <span className="font-semibold">{calculation.credits}</span>
                              </div>
                              {calculation.bonus > 0 && (
                                <div className="flex justify-between text-green-400">
                                  <span>Bonus Credits:</span>
                                  <span className="font-semibold">+{calculation.bonus}</span>
                                </div>
                              )}
                              <div className="border-t border-border pt-1 flex justify-between font-bold">
                                <span>Total Credits:</span>
                                <span className="text-primary">{calculation.total}</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  <Button 
                    onClick={() => handleNativePayment('custom', parseFloat(customAlgoAmount))}
                    disabled={
                      isPurchasing || 
                      !customAlgoAmount ||
                      parseFloat(customAlgoAmount) < 1 ||
                      parseFloat(customAlgoAmount) > nativeBalance
                    }
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-4"
                    size="lg"
                  >
                    {isPurchasing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      `Buy with ${customAlgoAmount || '0'} ${walletInfo.nativeCurrency}`
                    )}
                  </Button>
                  {customAlgoAmount && parseFloat(customAlgoAmount) > nativeBalance && (
                    <p className="text-xs text-destructive text-center font-medium">
                      Insufficient balance (Available: {nativeBalance.toFixed(2)} {walletInfo.nativeCurrency})
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* USDT Custom Amount Payment */}
        <Card className="glass-card border-blue-500/10">
          <CardHeader className="pb-6">
            <CardTitle className="text-xl font-bold text-foreground flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-400" />
              </div>
              {walletInfo.stablecoin} Flexible Amount
            </CardTitle>
            <p className="text-muted-foreground">
              Pay any amount with {walletInfo.stablecoin} (1 {walletInfo.stablecoin} = 1 Credit)
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {walletType === 'algorand' && !isOptedIn && (
              <Alert className="border-blue-500/20 bg-blue-500/5">
                <Info className="h-5 w-5 text-blue-500" />
                <AlertDescription className="text-blue-600 dark:text-blue-300">
                  First-time USDt users: We'll automatically enable USDt payments for you in one simple step.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="space-y-3">
                <Label htmlFor="usdt-amount" className="text-sm font-semibold text-foreground">
                  {walletInfo.stablecoin} Amount
                </Label>
                <Input
                  id="usdt-amount"
                  type="number"
                  value={usdtAmount}
                  onChange={(e) => setUSDTAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="1"
                  max={usdtBalance}
                  className="bg-background border-border text-foreground text-lg"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Available: {usdtBalance.toFixed(2)} {walletInfo.stablecoin}</span>
                  <span>Credits: {creditsAmount}</span>
                </div>
              </div>

              <Button 
                onClick={handleUSDTPayment}
                disabled={
                  isPurchasing || 
                  parseFloat(usdtAmount) <= 0 || 
                  parseFloat(usdtAmount) > usdtBalance
                }
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-4"
                size="lg"
              >
                {isPurchasing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : !isOptedIn && walletType === 'algorand' ? (
                  <div className="flex flex-col items-center">
                    <span>Enable {walletInfo.stablecoin} & Pay {usdtAmount} {walletInfo.stablecoin}</span>
                    <span className="text-xs opacity-75">(One-time setup + payment)</span>
                  </div>
                ) : (
                  `Pay ${usdtAmount} ${walletInfo.stablecoin}`
                )}
              </Button>

              <div className="text-center text-xs text-muted-foreground">
                Est. network fee: {estimatedFee.toFixed(4)} {walletInfo.nativeCurrency}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Benefits Section */}
      <Card className="glass-card border-green-500/10">
        <CardHeader className="pb-6">
          <CardTitle className="text-xl font-bold text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-green-400" />
            </div>
            Why Use Credits?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1">Instant Token Creation</h4>
                <p className="text-sm text-muted-foreground">
                  Create tokens immediately without waiting for payments
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1">Never Expire</h4>
                <p className="text-sm text-muted-foreground">
                  Your credits remain in your account permanently
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors">
              <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1">Cost Effective</h4>
                <p className="text-sm text-muted-foreground">
                  Better rates with larger purchases
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors">
              <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                <Coins className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1">Bonus Credits</h4>
                <p className="text-sm text-muted-foreground">
                  Earn extra credits with bulk packages
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success Modal */}
      {successDetails && (
        <CreditTopUpSuccessModal
          isOpen={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false);
            setSuccessDetails(null);
          }}
          topUpDetails={successDetails}
        />
      )}
    </div>
  );
}
