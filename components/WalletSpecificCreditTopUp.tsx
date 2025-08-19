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
  addCreditTransaction,
  updateCreditsBalance
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
import USDTPaymentConfirmationModal from '@/components/USDTPaymentConfirmationModal';
import PaymentProcessingModal from '@/components/PaymentProcessingModal';

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
  const [configurationError, setConfigurationError] = useState<string | null>(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState<boolean>(false);
  const [showProcessingModal, setShowProcessingModal] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<'checking' | 'signing' | 'submitting' | 'confirming' | 'recording' | 'completed' | 'error'>('checking');
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  
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
    
    console.log('🔄 Loading user balance for:', walletAddress);
    setIsLoading(true);
    try {
      const result = await getCreditsBalance(walletAddress);
      console.log('📊 Balance query result:', result);
      if (result.success) {
        console.log('✅ Setting user balance to:', result.balance || 0);
        setUserBalance(result.balance || 0);
      } else {
        console.error('❌ Failed to get balance:', result.error);
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
      console.log('🔍 Loading wallet balances for:', walletType, walletAddress);
      
      if (walletType === 'algorand') {
        // Check ALGO balance
        if (algorandWallet.address) {
          setNativeBalance(algorandWallet.balance || 0);
          console.log('💰 ALGO balance:', algorandWallet.balance);
        }

        // Check USDt balance and opt-in status
        console.log('🔍 Fetching Algorand USDt balance for mainnet...');
        const usdtBalResult = await getAlgorandUSDTBalance(walletAddress, false);
        console.log('📊 USDt balance result:', usdtBalResult);
        if (usdtBalResult.success) {
          setUSDTBalance(usdtBalResult.balance);
          console.log('✅ USDt balance set to:', usdtBalResult.balance);
          
          // Use the optedIn status from the balance check result
          const userOptedIn = usdtBalResult.optedIn || false;
          setIsOptedIn(userOptedIn);
          console.log('✅ Opt-in status set to:', userOptedIn);
        } else {
          console.error('❌ Failed to get USDt balance:', usdtBalResult.error);
          
          // Check if it's a configuration error
          if (usdtBalResult.error?.includes('Configuration not set up')) {
            setConfigurationError('Development Mode: USDT payments are not fully configured for this environment. This is normal for development.');
          }
          
          // Fallback: explicitly check opt-in status only if balance check failed
          console.log('🔍 Fallback: Checking USDt opt-in status...');
          const optInResult = await isOptedInToUSDT(walletAddress, false);
          console.log('📊 Opt-in result:', optInResult);
          if (optInResult.success) {
            setIsOptedIn(optInResult.optedIn);
            console.log('✅ Opt-in status set to:', optInResult.optedIn);
          } else {
            console.error('❌ Failed to check opt-in status');
          }
        }
        
        // Estimate fee
        const feeResult = await estimateAlgorandUSDTFee(false);
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
          newBalance: result.newBalance || userBalance,
          paymentMethod: 'ALGO'
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

  const handleUSDTPaymentClick = () => {
    const amount = parseFloat(usdtAmount);
    if (amount <= 0 || amount > usdtBalance) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid USDT amount",
        variant: "destructive",
      });
      return;
    }

    if (!walletAddress || !walletType) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    // Show confirmation modal
    setShowConfirmationModal(true);
  };

  const handleUSDTPayment = async () => {
    // Close confirmation modal and start processing
    setShowConfirmationModal(false);
    setShowProcessingModal(true);
    setProcessingStep('checking');
    setProcessingError(null);
    setTransactionHash(null);

    const amount = parseFloat(usdtAmount);

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

        // Check if user is opted in to USDt using the improved balance check
        setProcessingStep('checking');
        
        if (!walletAddress) {
          throw new Error('Wallet address is not available');
        }
        
        const balanceCheck = await getAlgorandUSDTBalance(walletAddress, false);
        
        if (!balanceCheck.success) {
          throw new Error('Failed to check USDt balance and opt-in status');
        }
        
        // User is opted in if the balance check returned optedIn: true
        const userOptedIn = balanceCheck.optedIn || false;
        console.log('✅ User opt-in status from balance check:', userOptedIn);
        
        if (!userOptedIn) {
          throw new Error('USDt opt-in required. Please opt-in to USDt first using your wallet\'s asset management feature.');
        }
        
        // Start wallet signing step
        setProcessingStep('signing');

        const result = await executeAlgorandUSDTTransfer(
          walletInterface,
          amount,
          false // Use mainnet for production credit purchases
        );

        if (result.success) {
          setTransactionHash(result.transactionHash || null);
          setProcessingStep('submitting');
          
          // Small delay to show submitting step
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          setProcessingStep('confirming');
          
          // Small delay to show confirming step
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          setProcessingStep('recording');

          // Add transaction to database
          console.log('💾 Recording transaction in database...');
          try {
            const dbResult = await addCreditTransaction(
              walletAddress,
              'purchase',
              amount,
              `USDT credit purchase - ${amount} credits`,
              {
                transactionHash: result.transactionHash,
                paymentMethod: 'usdt',
                paymentAddress: walletAddress,
                status: 'completed'
              }
            );
            console.log('💾 Database transaction result:', dbResult);
            
            // Update user balance after successful transaction
            if (dbResult.success) {
              console.log('💰 Updating user balance...');
              const newBalance = userBalance + amount;
              const balanceUpdateResult = await updateCreditsBalance(walletAddress, newBalance);
              console.log('💰 Balance update result:', balanceUpdateResult);
              
              if (balanceUpdateResult.success) {
                console.log('✅ User balance updated successfully to:', newBalance);
                // Update local state immediately
                setUserBalance(newBalance);
              } else {
                console.error('❌ Failed to update balance:', balanceUpdateResult.error);
              }
            }
          } catch (dbError) {
            console.error('Failed to record transaction in database:', dbError);
            // Continue anyway since the payment succeeded
          }

          setProcessingStep('completed');
          
          // Small delay before showing success
          await new Promise(resolve => setTimeout(resolve, 1000));

          console.log('🔄 Refreshing balances and showing success modal...');
          
          // Calculate the new balance for the success modal
          const estimatedNewBalance = userBalance + amount;
          
          // Close processing modal and show success modal
          setShowProcessingModal(false);
          setSuccessDetails({
            algoAmount: amount, // USDT amount
            creditsReceived: amount, // 1:1 ratio for USDT
            bonusCredits: 0,
            transactionId: result.transactionHash,
            newBalance: estimatedNewBalance, // Show the updated balance
            paymentMethod: 'USDT'
          });
          setShowSuccessModal(true);
          
          // Refresh balances and credits
          console.log('📊 Refreshing user balance...');
          await loadUserBalance();
          console.log('💰 Refreshing wallet balances...');
          await loadWalletBalances();
          onCreditsUpdated?.();
          
          // Reset form
          setUSDTAmount('10');
          setCreditsAmount('10');
          
          console.log('✅ USDT payment process completed successfully!');
        } else {
          throw new Error(result.error || 'Payment failed');
        }

      } else if (walletType === 'solana') {
        // Solana implementation (no opt-in required)
        throw new Error('SPL-USDT payments will be available soon');
      } else {
        throw new Error('Unsupported wallet type');
      }
      
    } catch (error) {
      console.error('USDT payment error:', error);
      setProcessingError(error instanceof Error ? error.message : 'Unknown error occurred');
      setProcessingStep('error');
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

  // Show loading state while wallet is connecting
  if (isLoading && !walletAddress) {
    return (
      <Card className="glass-card">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-3">Loading Wallet...</h3>
          <p className="text-muted-foreground">
            Checking wallet connection status
          </p>
        </CardContent>
      </Card>
    );
  }

  // Show connect wallet message when not authenticated
  if (!isAuthenticated || !walletAddress || !walletType || !walletInfo) {
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
          {/* Debug info for development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-3 bg-gray-800 rounded text-xs text-left">
              <p>Debug: isAuthenticated = {String(isAuthenticated)}</p>
              <p>Debug: walletAddress = {walletAddress || 'null'}</p>
              <p>Debug: walletType = {walletType || 'null'}</p>
              <p>Debug: walletInfo = {walletInfo ? 'present' : 'null'}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-10">
      {/* Enhanced Current Balance Section */}
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
            Your Wallet Balance
          </CardTitle>
          <p className="text-muted-foreground text-lg">Monitor your available resources across all supported assets</p>
        </CardHeader>
        
        <CardContent className="relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Credits Balance */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300 opacity-50" />
              <div className="relative text-center p-8 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl hover:scale-[1.02] transition-all duration-300 backdrop-blur-sm">
                <div className="text-4xl font-bold text-primary mb-3 tabular-nums">{userBalance}</div>
                <div className="text-sm text-primary/80 font-semibold uppercase tracking-wider">Credits Available</div>
                <div className="mt-2 text-xs text-muted-foreground">Ready to use</div>
              </div>
            </div>
            
            {/* Native Currency Balance */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-blue-500/10 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300 opacity-50" />
              <div className="relative text-center p-8 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/20 rounded-2xl hover:scale-[1.02] transition-all duration-300 backdrop-blur-sm">
                <div className="text-3xl font-bold text-blue-400 mb-3 tabular-nums">{nativeBalance.toFixed(3)}</div>
                <div className="text-sm text-blue-400/80 font-semibold uppercase tracking-wider">{walletInfo.nativeCurrency} Balance</div>
                <div className="mt-2 text-xs text-muted-foreground">For purchases</div>
              </div>
            </div>
            
            {/* USDT Balance */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-green-500/10 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300 opacity-50" />
              <div className="relative text-center p-8 bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent border border-green-500/20 rounded-2xl hover:scale-[1.02] transition-all duration-300 backdrop-blur-sm">
                <div className="text-3xl font-bold text-green-400 mb-3 tabular-nums">{usdtBalance.toFixed(2)}</div>
                <div className="text-sm text-green-400/80 font-semibold uppercase tracking-wider">{walletInfo.stablecoin} Balance</div>
                <div className="mt-2 text-xs text-muted-foreground">Stable value</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Error Alert */}
      {configurationError && (
        <Alert className="border-yellow-500/20 bg-yellow-500/5">
          <Info className="h-4 w-4 text-yellow-500" />
          <AlertDescription className="text-yellow-200">
            {configurationError}
          </AlertDescription>
        </Alert>
      )}

      {/* Enhanced Payment Options - Modern Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        {/* Native Currency Packages */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-green-500/5 via-background to-emerald-500/5 border-green-500/20">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-transparent to-emerald-500/10 opacity-30" />
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-500" />
          
          <CardHeader className="relative pb-8">
            <CardTitle className="text-2xl font-bold text-foreground flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 w-12 h-12 bg-green-500/30 rounded-full blur-lg animate-pulse" />
                <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                  <span className="text-2xl">{walletInfo.icon}</span>
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold">{walletInfo.nativeCurrency} Packages</div>
                <p className="text-green-400 text-sm font-medium">Direct payments • Instant delivery</p>
              </div>
            </CardTitle>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Purchase credits using {walletInfo.nativeCurrency} directly from your {walletInfo.name} wallet
            </p>
          </CardHeader>
          
          <CardContent className="relative space-y-6">
            {PRICING.packages.map((pkg, index) => (
              <Card key={index} className={`relative group transition-all duration-300 hover:scale-[1.02] ${
                pkg.popular 
                  ? 'border-primary/40 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent shadow-lg shadow-primary/20' 
                  : 'border-border/50 hover:border-green-500/30 bg-gradient-to-r from-muted/5 to-transparent hover:shadow-lg hover:shadow-green-500/10'
              }`}>
                {pkg.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <Badge className="bg-gradient-to-r from-primary to-primary/80 text-white font-bold px-4 py-1 shadow-lg animate-pulse">
                      🔥 Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-3">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-foreground">{pkg.credits}</span>
                        <span className="text-lg text-muted-foreground">Credits</span>
                      </div>
                      
                      {pkg.bonus > 0 && (
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 font-semibold">
                            <Zap className="w-3 h-3 mr-1" />
                            +{pkg.bonus} Bonus Credits
                          </Badge>
                        </div>
                      )}
                      
                      <div className="text-sm text-muted-foreground">
                        Perfect for {Math.floor(pkg.credits / 10)} token{Math.floor(pkg.credits / 10) !== 1 ? 's' : ''}
                      </div>
                    </div>
                    
                    <div className="text-right space-y-4">
                      <div className="space-y-1">
                        <div className="text-2xl font-bold text-primary">
                          {pkg.priceALGO} {walletInfo.nativeCurrency}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ≈ ${(pkg.priceALGO * 0.15).toFixed(2)} USD
                        </div>
                      </div>
                      
                      <Button 
                        onClick={() => handleNativePayment(index)}
                        disabled={isPurchasing || nativeBalance < pkg.priceALGO}
                        className={`font-semibold transition-all duration-300 ${
                          pkg.popular 
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
                            Buy Now
                          </>
                        )}
                      </Button>
                      {nativeBalance < pkg.priceALGO && (
                        <p className="text-xs text-destructive font-medium">
                          Insufficient balance
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {/* Enhanced Custom Amount Section */}
            <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-lg text-foreground flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary" />
                    Custom Amount
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCustomInput(!showCustomInput)}
                    className="text-primary border-primary/30 hover:bg-primary/10"
                  >
                    {showCustomInput ? 'Hide Options' : 'Show Custom'}
                  </Button>
                </div>
                
                {showCustomInput && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <Label htmlFor="custom-algo" className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Coins className="w-4 h-4" />
                        {walletInfo.nativeCurrency} Amount (Min: 1 {walletInfo.nativeCurrency})
                      </Label>
                      <Input
                        id="custom-algo"
                        type="number"
                        value={customAlgoAmount}
                        onChange={(e) => setCustomAlgoAmount(e.target.value)}
                        placeholder={`Enter ${walletInfo.nativeCurrency} amount`}
                        min="1"
                        max={nativeBalance}
                        className="bg-background/50 border-primary/20 text-foreground text-lg h-12 focus:ring-2 focus:ring-primary/30"
                      />
                      {customAlgoAmount && parseFloat(customAlgoAmount) >= 1 && (
                        <Card className="border-primary/20 bg-gradient-to-r from-primary/10 to-transparent">
                          <CardContent className="p-4">
                            <div className="text-sm text-muted-foreground mb-3 font-semibold">Credits Preview:</div>
                            {(() => {
                              const calculation = calculateCreditsFromAlgo(parseFloat(customAlgoAmount));
                              return (
                                <div className="space-y-2 text-sm">
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
                                  <div className="border-t border-primary/20 pt-2 flex justify-between font-bold text-lg">
                                    <span>Total Credits:</span>
                                    <span className="text-primary">{calculation.total}</span>
                                  </div>
                                </div>
                              );
                            })()}
                          </CardContent>
                        </Card>
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
                      className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-white font-bold py-4 text-lg shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 hover:scale-[1.02]"
                      size="lg"
                    >
                      {isPurchasing ? (
                        <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                      ) : (
                        <>
                          <Zap className="w-5 h-5 mr-3" />
                          Buy {customAlgoAmount || '0'} {walletInfo.nativeCurrency} Worth
                        </>
                      )}
                    </Button>
                    {customAlgoAmount && parseFloat(customAlgoAmount) > nativeBalance && (
                      <p className="text-xs text-destructive text-center font-medium bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                        Insufficient balance (Available: {nativeBalance.toFixed(2)} {walletInfo.nativeCurrency})
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        {/* Enhanced USDT Payment Section */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500/5 via-background to-cyan-500/5 border-blue-500/20">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-cyan-500/10 opacity-30" />
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
          
          <CardHeader className="relative pb-8">
            <CardTitle className="text-2xl font-bold text-foreground flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 w-12 h-12 bg-blue-500/30 rounded-full blur-lg animate-pulse" />
                <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold">{walletInfo.stablecoin} Payments</div>
                <p className="text-blue-400 text-sm font-medium">Stable value • 1:1 credit ratio</p>
              </div>
            </CardTitle>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Pay with {walletInfo.stablecoin} for guaranteed 1:1 credit conversion. Perfect for precise amounts.
            </p>
          </CardHeader>
          
          <CardContent className="relative space-y-8">
            {walletType === 'algorand' && !isOptedIn && (
              <Alert className="border-blue-500/30 bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <Info className="h-4 w-4 text-blue-400" />
                  </div>
                  <AlertDescription className="text-blue-300 font-medium">
                    First-time USDt user? We'll automatically enable USDt payments in one simple step.
                  </AlertDescription>
                </div>
              </Alert>
            )}

            {/* Amount Input Section */}
            <Card className="border-blue-500/20 bg-gradient-to-r from-blue-500/5 to-transparent">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <Label htmlFor="usdt-amount" className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Coins className="w-5 h-5" />
                    {walletInfo.stablecoin} Amount
                  </Label>
                  
                  <div className="relative">
                    <Input
                      id="usdt-amount"
                      type="number"
                      value={usdtAmount}
                      onChange={(e) => setUSDTAmount(e.target.value)}
                      placeholder={`Enter ${walletInfo.stablecoin} amount`}
                      min="1"
                      max={usdtBalance}
                      className="bg-background/50 border-blue-500/20 text-foreground text-xl h-14 pl-12 focus:ring-2 focus:ring-blue-500/30"
                    />
                    <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400" />
                  </div>
                  
                  {/* Balance and Credits Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-background/30 rounded-lg border border-blue-500/20">
                      <div className="text-xs text-muted-foreground font-medium">Available Balance</div>
                      <div className="text-lg font-bold text-blue-400">{usdtBalance.toFixed(2)} {walletInfo.stablecoin}</div>
                    </div>
                    <div className="p-4 bg-background/30 rounded-lg border border-green-500/20">
                      <div className="text-xs text-muted-foreground font-medium">Credits You'll Get</div>
                      <div className="text-lg font-bold text-green-400">{creditsAmount}</div>
                    </div>
                  </div>
                  
                  {/* Quick Amount Buttons */}
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-muted-foreground">Quick Select:</div>
                    <div className="grid grid-cols-4 gap-2">
                      {[10, 25, 50, 100].map((amount) => (
                        <Button
                          key={amount}
                          variant="outline"
                          size="sm"
                          onClick={() => setUSDTAmount(amount.toString())}
                          className={`border-blue-500/30 hover:bg-blue-500/10 ${
                            usdtAmount === amount.toString() ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : ''
                          }`}
                          disabled={amount > usdtBalance}
                        >
                          ${amount}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleUSDTPaymentClick}
                  disabled={
                    isPurchasing || 
                    parseFloat(usdtAmount) <= 0 || 
                    parseFloat(usdtAmount) > usdtBalance
                  }
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-4 text-lg shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 hover:scale-[1.02]"
                  size="lg"
                >
                  {isPurchasing ? (
                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                  ) : (
                    <>
                      <DollarSign className="w-5 h-5 mr-3" />
                      Pay {usdtAmount || '0'} {walletInfo.stablecoin}
                    </>
                  )}
                </Button>
                
                {parseFloat(usdtAmount) > usdtBalance && (
                  <p className="text-xs text-destructive text-center font-medium bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                    Insufficient balance (Available: {usdtBalance.toFixed(2)} {walletInfo.stablecoin})
                  </p>
                )}
                
                {estimatedFee > 0 && (
                  <div className="text-xs text-muted-foreground text-center">
                    Estimated network fee: {estimatedFee.toFixed(4)} {walletInfo.nativeCurrency}
                  </div>
                )}
              </CardContent>
            </Card>
          </CardContent>
        </Card>

      {/* Enhanced Benefits Section */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-green-500/5 via-background to-emerald-500/5 border-green-500/20">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-transparent to-emerald-500/10 opacity-30" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-500" />
        
        <CardHeader className="relative pb-8">
          <CardTitle className="text-2xl font-bold text-foreground flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 w-12 h-12 bg-green-500/30 rounded-full blur-lg animate-pulse" />
              <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                <Zap className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold">Why Use Credits?</div>
              <p className="text-green-400 text-sm font-medium">Benefits • Features • Advantages</p>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-6 rounded-2xl bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/20 hover:scale-[1.02] transition-all duration-300">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-foreground mb-2">Instant Token Creation</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    Create tokens immediately without waiting for payment confirmations. Your credits are ready to use instantly.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 hover:scale-[1.02] transition-all duration-300">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-foreground mb-2">Secure & Reliable</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    All payments are processed on-chain with full transparency. Credits never expire and are always available.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 hover:scale-[1.02] transition-all duration-300">
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-foreground mb-2">Cost Effective</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    Better rates with bulk purchases and bonus credits. Save money compared to individual payments.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-6 rounded-2xl bg-gradient-to-br from-yellow-500/10 to-transparent border border-yellow-500/20 hover:scale-[1.02] transition-all duration-300">
                <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                  <Coins className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-foreground mb-2">Multi-Chain Support</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    Use credits across all supported networks. One credit system for Algorand, Solana, and more.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Feature Highlights */}
          <div className="mt-10 p-6 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl">
            <h4 className="font-bold text-xl text-foreground mb-4 text-center">Platform Highlights</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="space-y-2">
                <div className="text-2xl font-bold text-primary">10</div>
                <div className="text-sm text-muted-foreground">Credits per Token</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-green-400">1:1</div>
                <div className="text-sm text-muted-foreground">USDT to Credit Ratio</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-blue-400">∞</div>
                <div className="text-sm text-muted-foreground">Credit Expiration</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-purple-400">24/7</div>
                <div className="text-sm text-muted-foreground">Platform Availability</div>
              </div>
            </div>
          </div>
        
          <div className="space-y-4">
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

      {/* USDT Payment Confirmation Modal */}
      <USDTPaymentConfirmationModal
        isOpen={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
        onConfirm={handleUSDTPayment}
        paymentDetails={{
          amount: parseFloat(usdtAmount),
          currency: walletInfo?.stablecoin || 'USDT',
          creditsReceived: parseFloat(usdtAmount),
          estimatedFee: estimatedFee,
          nativeCurrency: walletInfo?.nativeCurrency || 'ALGO',
          walletAddress: walletAddress || ''
        }}
        isProcessing={isPurchasing}
      />

      {/* Payment Processing Modal */}
      <PaymentProcessingModal
        isOpen={showProcessingModal}
        onClose={() => {
          setShowProcessingModal(false);
          setProcessingStep('checking');
          setProcessingError(null);
          setTransactionHash(null);
        }}
        currentStep={processingStep}
        error={processingError || undefined}
        transactionHash={transactionHash || undefined}
        paymentDetails={transactionHash ? {
          amount: parseFloat(usdtAmount),
          currency: walletInfo?.stablecoin || 'USDT',
          creditsReceived: parseFloat(usdtAmount)
        } : undefined}
      />
    </div>
  );
}
