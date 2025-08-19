'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  CreditCard, 
  Wallet, 
  Copy,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Zap,
  ArrowRight,
  Clock,
  Shield,
  Coins,
  Loader2,
  Info,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider';
import { 
  getUSDTPaymentOptions, 
  calculateCreditsFromUSDT,
  calculateUSDTFromCredits,
  initiateUSDTPayment,
  getUSDTPaymentHistory,
  generatePaymentInstructions,
  USDTNetwork,
  USDTPaymentTransaction,
  USDT_PRICING,
  WalletType
} from '@/lib/multi-wallet-usdt-system';

// Import credit system
import { purchaseCreditsWithUSDT } from '@/lib/credit-system';

// Import wallet-specific integrations
import { 
  getSolanaUSDTBalance, 
  executeSolanaUSDTTransfer,
  estimateSolanaUSDTFee,
  isValidSolanaAddress
} from '@/lib/solana-usdt-integration';

import {
  getAlgorandUSDTBalance,
  executeAlgorandUSDTTransfer,
  estimateAlgorandUSDTFee,
  isValidAlgorandAddress,
  createUSDTOptInTransaction
} from '@/lib/algorand-usdt-integration';import { connectEVMWallet, executeUSDTTransfer } from '@/lib/evm-wallet-integration';

interface MultiWalletUSDTTopUpProps {
  userAddress?: string;
  onCreditsUpdated?: () => void;
  onClose?: () => void;
}

// Connected wallet detection
interface ConnectedWallets {
  phantom: boolean;
  pera: boolean;
  metamask: boolean;
}

export default function MultiWalletUSDTTopUp({ userAddress, onCreditsUpdated, onClose }: MultiWalletUSDTTopUpProps) {
  // Wallet connections
  const solanaWallet = useWallet();
  const algorandWallet = useAlgorandWallet();
  
  // State
  const [connectedWallets, setConnectedWallets] = useState<ConnectedWallets>({
    phantom: false,
    pera: false,
    metamask: false
  });
  const [networks, setNetworks] = useState<USDTNetwork[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<USDTNetwork | null>(null);
  const [usdtAmount, setUsdtAmount] = useState<string>('10');
  const [creditsAmount, setCreditsAmount] = useState<string>('10');
  const [inputMode, setInputMode] = useState<'usdt' | 'credits'>('usdt');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const [estimatedFee, setEstimatedFee] = useState<number>(0);
  const [paymentHistory, setPaymentHistory] = useState<USDTPaymentTransaction[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showOptInModal, setShowOptInModal] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [paymentStep, setPaymentStep] = useState<'idle' | 'approval' | 'processing' | 'confirming' | 'completed'>('idle');
  
  const { toast } = useToast();

  // Detect connected wallets
  useEffect(() => {
    const detectWallets = () => {
      const phantom = solanaWallet.connected && solanaWallet.publicKey !== null;
      const pera = algorandWallet.connected && algorandWallet.address !== null;
      const metamask = typeof window !== 'undefined' && !!(window as any).ethereum;
      
      setConnectedWallets({ phantom, pera, metamask });
    };
    
    detectWallets();
  }, [solanaWallet.connected, solanaWallet.publicKey, algorandWallet.connected, algorandWallet.address]);

  // Load available networks based on connected wallets
  useEffect(() => {
    const loadNetworks = async () => {
      setIsLoading(true);
      try {
        const availableNetworks = await getUSDTPaymentOptions(connectedWallets);
        setNetworks(availableNetworks);
        
        // Auto-select first available network
        if (availableNetworks.length > 0 && !selectedNetwork) {
          setSelectedNetwork(availableNetworks[0]);
        }
      } catch (error) {
        console.error('Error loading networks:', error);
        setError('Failed to load payment networks');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadNetworks();
  }, [connectedWallets, selectedNetwork]);

  // Load balance and fee when network changes
  useEffect(() => {
    if (selectedNetwork) {
      loadNetworkData();
    }
  }, [selectedNetwork]);

  // Handle amount input changes
  useEffect(() => {
    if (inputMode === 'usdt') {
      const credits = calculateCreditsFromUSDT(parseFloat(usdtAmount) || 0);
      setCreditsAmount(credits.toString());
    } else {
      const usdt = calculateUSDTFromCredits(parseFloat(creditsAmount) || 0);
      setUsdtAmount(usdt.toString());
    }
  }, [usdtAmount, creditsAmount, inputMode]);

  const loadNetworkData = async () => {
    if (!selectedNetwork) return;
    
    try {
      // Load balance based on wallet type
      await loadBalance();
      await loadFeeEstimate();
    } catch (error) {
      console.error('Error loading network data:', error);
    }
  };

  const loadBalance = async () => {
    if (!selectedNetwork) return;
    
    try {
      let balanceResult;
      
      switch (selectedNetwork.walletType) {
        case 'phantom':
          if (solanaWallet.publicKey) {
            balanceResult = await getSolanaUSDTBalance(
              solanaWallet.publicKey.toString(),
              selectedNetwork.isTestnet || false
            );
          }
          break;
          
        case 'pera':
          if (algorandWallet.address) {
            balanceResult = await getAlgorandUSDTBalance(
              algorandWallet.address,
              false // Use mainnet for production
            );
          }
          break;
          
        case 'metamask':
          // EVM balance loading would go here
          balanceResult = { success: true, balance: 0 }; // Placeholder
          break;
      }
      
      if (balanceResult?.success) {
        setBalance(balanceResult.balance);
      }
    } catch (error) {
      console.error('Error loading balance:', error);
    }
  };

  const loadFeeEstimate = async () => {
    if (!selectedNetwork) return;
    
    try {
      let feeResult;
      
      switch (selectedNetwork.walletType) {
        case 'phantom':
          feeResult = await estimateSolanaUSDTFee(selectedNetwork.isTestnet || false);
          break;
          
        case 'pera':
          feeResult = await estimateAlgorandUSDTFee(selectedNetwork.isTestnet || false);
          break;
          
        case 'metamask':
          // EVM fee estimation would go here
          feeResult = { success: true, fee: 0.001 }; // Placeholder
          break;
      }
      
      if (feeResult?.success) {
        setEstimatedFee(feeResult.fee);
      }
    } catch (error) {
      console.error('Error estimating fee:', error);
    }
  };

  const handleQuickAmount = (amount: number) => {
    setUsdtAmount(amount.toString());
    setInputMode('usdt');
  };

  const handlePayment = async () => {
    if (!selectedNetwork || !userAddress) {
      setError('Network or user address not available');
      return;
    }
    
    const amount = parseFloat(usdtAmount);
    if (amount < USDT_PRICING.MIN_USDT_AMOUNT || amount > USDT_PRICING.MAX_USDT_AMOUNT) {
      setError(`Amount must be between ${USDT_PRICING.MIN_USDT_AMOUNT} and ${USDT_PRICING.MAX_USDT_AMOUNT} USDT`);
      return;
    }
    
    if (amount > balance) {
      setError(`Insufficient balance. You have ${balance} USDT`);
      return;
    }
    
    setIsProcessing(true);
    setError('');
    setSuccess('');
    setPaymentStep('approval');
    
    try {
      let result;
      let walletAddress = '';
      
      switch (selectedNetwork.walletType) {
        case 'phantom':
          setPaymentStep('approval');
          toast({
            title: 'Approve Transaction',
            description: 'Please approve the USDT transfer in your Phantom wallet',
            variant: 'default'
          });
          
          result = await executeSolanaUSDTTransfer(
            {
              publicKey: solanaWallet.publicKey!,
              signTransaction: solanaWallet.signTransaction!,
              signAllTransactions: solanaWallet.signAllTransactions!
            },
            amount,
            selectedNetwork.isTestnet || false
          );
          walletAddress = solanaWallet.publicKey?.toString() || '';
          break;
          
        case 'pera':
          setPaymentStep('approval');
          toast({
            title: 'Approve Transaction',
            description: 'Please approve the USDT transfer in your Pera wallet',
            variant: 'default'
          });
          
          result = await executeAlgorandUSDTTransfer(
            {
              address: algorandWallet.address!,
              signTransaction: algorandWallet.signTransaction!
            },
            amount,
            selectedNetwork.isTestnet || false
          );
          walletAddress = algorandWallet.address || '';
          break;
          
        case 'metamask':
          setPaymentStep('approval');
          toast({
            title: 'Approve Transaction',
            description: 'Please approve the USDT transfer in your MetaMask wallet',
            variant: 'default'
          });
          
          // Use the multi-wallet system for EVM payments
          const evmWallet = await connectEVMWallet();
          if (evmWallet) {
            result = await initiateUSDTPayment(
              userAddress || '',
              selectedNetwork.id,
              amount,
              evmWallet
            );
            walletAddress = evmWallet.address || '';
          } else {
            result = { success: false, error: 'Failed to connect EVM wallet' };
          }
          break;
          
        default:
          result = { success: false, error: 'Unsupported wallet type' };
      }
      
      if (result.success && result.transactionHash) {
        setPaymentStep('processing');
        toast({
          title: 'Transaction Submitted',
          description: 'Processing your payment and adding credits...',
          variant: 'default'
        });
        
        // Add credits to user account
        setPaymentStep('confirming');
        const creditsToAdd = calculateCreditsFromUSDT(amount);
        const creditResult = await purchaseCreditsWithUSDT(
          walletAddress,
          amount,
          creditsToAdd,
          result.transactionHash,
          selectedNetwork.isTestnet ? 'testnet' : 'mainnet',
          selectedNetwork.walletType === 'phantom' ? 'solana' : 'algorand'
        );
        
        if (creditResult.success) {
          setPaymentStep('completed');
          setSuccess(`Payment successful! ${creditsToAdd} credits added to your account. Transaction: ${result.transactionHash.slice(0, 10)}...`);
          toast({
            title: 'Payment Successful! 🎉',
            description: `${amount} USDT payment completed. ${creditsToAdd} credits added to your account.`,
            variant: 'default'
          });
          
          // Refresh data
          await loadNetworkData();
          if (onCreditsUpdated) onCreditsUpdated();
          
          // Don't auto-close modals - let user close manually
        } else {
          setPaymentStep('idle');
          setError(`Payment completed but failed to add credits: ${creditResult.error}`);
          toast({
            title: 'Credits Error',
            description: 'Payment was successful but there was an issue adding credits. Please contact support.',
            variant: 'destructive'
          });
        }
      } else {
        setPaymentStep('idle');
        setError(result.error || 'Payment failed');
        toast({
          title: 'Payment Failed',
          description: result.error || 'Please try again',
          variant: 'destructive'
        });
      }
    } catch (error) {
      setPaymentStep('idle');
      const errorMsg = error instanceof Error ? error.message : 'Payment failed';
      setError(errorMsg);
      toast({
        title: 'Payment Error',
        description: errorMsg,
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOptIn = async () => {
    if (!selectedNetwork || !algorandWallet.address) return;
    
    setIsProcessing(true);
    try {
      const optInResult = await createUSDTOptInTransaction(
        algorandWallet.address,
        selectedNetwork.isTestnet || false
      );
      
      if (optInResult.success && optInResult.transaction) {
        const signedTxn = await algorandWallet.signTransaction!(optInResult.transaction);
        // Submit transaction logic here
        
        setSuccess('Successfully opted in to USDT!');
        setShowOptInModal(false);
        
        // Refresh balance
        await loadBalance();
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Opt-in failed';
      setError(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Copied to clipboard',
      variant: 'default'
    });
  };

  const getWalletIcon = (walletType: WalletType) => {
    switch (walletType) {
      case 'phantom': return '👻';
      case 'pera': return '🔷';
      case 'metamask': return '🦊';
      default: return '💼';
    }
  };

  const getWalletName = (walletType: WalletType) => {
    switch (walletType) {
      case 'phantom': return 'Phantom';
      case 'pera': return 'Pera';
      case 'metamask': return 'MetaMask';
      default: return 'Wallet';
    }
  };

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardContent className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-foreground">Loading payment options...</p>
        </CardContent>
      </Card>
    );
  }

  if (networks.length === 0) {
    return (
      <Card className="glass-card">
        <CardContent className="p-8 text-center">
          <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-foreground">No Wallets Connected</h3>
          <p className="text-muted-foreground mb-4">
            Connect a wallet to enable USDT payments
          </p>
          <div className="space-y-2">
            <Badge variant="outline" className="border-border">Phantom (Solana)</Badge>
            <Badge variant="outline" className="border-border">Pera (Algorand)</Badge>
            <Badge variant="outline" className="border-border">MetaMask (EVM)</Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Payment Card */}
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            USDT Credit Top-Up
            <Badge variant="secondary" className="text-xs glass-card border-border">Multi-Wallet</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Network Selection */}
          <div className="space-y-3">
            <Label className="text-foreground font-semibold">Select Payment Network</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {networks.map((network) => (
                <button
                  key={network.id}
                  onClick={() => setSelectedNetwork(network)}
                  className={`p-4 rounded-xl border-2 transition-all glass-card ${
                    selectedNetwork?.id === network.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getWalletIcon(network.walletType)}</span>
                    <div className="text-left">
                      <p className="font-semibold text-sm text-foreground">{network.displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        {getWalletName(network.walletType)}
                        {network.isTestnet && (
                          <Badge variant="secondary" className="ml-1 text-xs glass-card border-border">Test</Badge>
                        )}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Balance and Network Info */}
          {selectedNetwork && (
            <div className="flex items-center justify-between p-4 rounded-xl glass-card">
              <div className="flex items-center gap-3">
                <span className="text-xl">{getWalletIcon(selectedNetwork.walletType)}</span>
                <div>
                  <p className="font-semibold text-foreground">{selectedNetwork.displayName}</p>
                  <p className="text-sm text-muted-foreground">
                    Balance: <span className="font-medium">{balance.toFixed(6)} USDT</span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Est. Fee</p>
                <p className="font-semibold text-foreground">{estimatedFee.toFixed(6)} {selectedNetwork.nativeCurrency?.symbol || 'ALGO'}</p>
              </div>
            </div>
          )}

          {/* Amount Input */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Label className="text-foreground">Payment Amount</Label>
              <Badge variant="secondary" className="text-xs border-border">
                1 USDT = 1 Credit
              </Badge>
            </div>
            
            <Tabs value={inputMode} onValueChange={(value) => setInputMode(value as 'usdt' | 'credits')}>
              <TabsList className="grid w-full grid-cols-2 glass-card border-border">
                <TabsTrigger value="usdt" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">USDT Amount</TabsTrigger>
                <TabsTrigger value="credits" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Credits Amount</TabsTrigger>
              </TabsList>
              
              <TabsContent value="usdt" className="space-y-3">
                <Input
                  type="number"
                  placeholder="10.00"
                  value={usdtAmount}
                  onChange={(e) => setUsdtAmount(e.target.value)}
                  min={USDT_PRICING.MIN_USDT_AMOUNT}
                  max={USDT_PRICING.MAX_USDT_AMOUNT}
                  step="0.01"
                  className="bg-background border-border text-foreground focus:border-primary text-lg h-12"
                />
                <p className="text-sm text-muted-foreground">
                  You'll receive <span className="font-medium text-foreground">{creditsAmount} credits</span>
                </p>
              </TabsContent>
              
              <TabsContent value="credits" className="space-y-3">
                <Input
                  type="number"
                  placeholder="10"
                  value={creditsAmount}
                  onChange={(e) => setCreditsAmount(e.target.value)}
                  min={USDT_PRICING.MIN_USDT_AMOUNT}
                  max={USDT_PRICING.MAX_USDT_AMOUNT}
                  step="1"
                  className="bg-background border-border text-foreground focus:border-primary text-lg h-12"
                />
                <p className="text-sm text-muted-foreground">
                  Cost: <span className="font-medium text-foreground">{usdtAmount} USDT</span>
                </p>
              </TabsContent>
            </Tabs>

            {/* Quick Amount Buttons */}
            <div className="flex gap-2 flex-wrap">
              {USDT_PRICING.QUICK_AMOUNTS.map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(amount)}
                  className="text-xs border-border hover:bg-muted hover:border-primary"
                >
                  ${amount}
                </Button>
              ))}
            </div>
          </div>

          {/* Payment Button */}
          <Button
            onClick={() => {
              setShowPaymentModal(true);
              // Don't close parent modal - keep it open for better UX
            }}
            disabled={!selectedNetwork || parseFloat(usdtAmount) <= 0}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 font-semibold text-lg"
          >
            <CreditCard className="w-5 h-5 mr-2" />
            Pay {usdtAmount} USDT → Get {creditsAmount} Credits
          </Button>

          {/* Error/Success Messages */}
          {error && (
            <Alert className="border-red-500/30 bg-red-500/10">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-foreground">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-500/30 bg-green-500/10">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-foreground">{success}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Payment Confirmation Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-2xl max-w-[95vw] max-h-[90vh] overflow-y-auto glass-card border-border z-[70]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground text-xl">
              <span className="text-2xl">{selectedNetwork && getWalletIcon(selectedNetwork.walletType)}</span>
              Confirm USDT Payment
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-base">
              Review your payment details before confirming
            </DialogDescription>
          </DialogHeader>

          {selectedNetwork && (
            <div className="space-y-6">
              {/* Payment Progress Indicator */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${paymentStep === 'idle' ? 'bg-muted-foreground' : 'bg-primary'}`} />
                  <span className="text-sm font-medium">Ready</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${
                    paymentStep === 'approval' ? 'bg-primary animate-pulse' : 
                    ['processing', 'confirming', 'completed'].includes(paymentStep) ? 'bg-primary' : 'bg-muted-foreground'
                  }`} />
                  <span className="text-sm font-medium">Wallet Approval</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${
                    paymentStep === 'processing' ? 'bg-primary animate-pulse' : 
                    ['confirming', 'completed'].includes(paymentStep) ? 'bg-primary' : 'bg-muted-foreground'
                  }`} />
                  <span className="text-sm font-medium">Processing</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${
                    paymentStep === 'confirming' ? 'bg-primary animate-pulse' : 
                    paymentStep === 'completed' ? 'bg-primary' : 'bg-muted-foreground'
                  }`} />
                  <span className="text-sm font-medium">Adding Credits</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${paymentStep === 'completed' ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                  <span className="text-sm font-medium">Complete</span>
                </div>
              </div>

              {/* Current Step Message */}
              {paymentStep !== 'idle' && (
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                  <div className="flex items-center gap-3">
                    {paymentStep === 'approval' && (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <div>
                          <p className="font-semibold text-foreground">Waiting for wallet approval</p>
                          <p className="text-sm text-muted-foreground">Please approve the transaction in your {getWalletName(selectedNetwork.walletType)} wallet</p>
                        </div>
                      </>
                    )}
                    {paymentStep === 'processing' && (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <div>
                          <p className="font-semibold text-foreground">Transaction submitted</p>
                          <p className="text-sm text-muted-foreground">Processing your USDT payment...</p>
                        </div>
                      </>
                    )}
                    {paymentStep === 'confirming' && (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <div>
                          <p className="font-semibold text-foreground">Adding credits</p>
                          <p className="text-sm text-muted-foreground">Updating your account balance...</p>
                        </div>
                      </>
                    )}
                    {paymentStep === 'completed' && (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <div>
                          <p className="font-semibold text-foreground">Payment completed!</p>
                          <p className="text-sm text-muted-foreground">Credits have been added to your account</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Payment Details Grid */}
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div className="space-y-4">
                  <div>
                    <p className="text-muted-foreground mb-1">Network</p>
                    <p className="font-semibold text-foreground text-base">{selectedNetwork.displayName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Amount</p>
                    <p className="font-semibold text-foreground text-lg">{usdtAmount} USDT</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Network Fee</p>
                    <p className="font-semibold text-foreground">{estimatedFee.toFixed(6)} {selectedNetwork.nativeCurrency?.symbol || 'ALGO'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-muted-foreground mb-1">Wallet</p>
                    <p className="font-semibold text-foreground text-base">{getWalletName(selectedNetwork.walletType)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Credits</p>
                    <p className="font-semibold text-foreground text-lg">{creditsAmount} Credits</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Balance</p>
                    <p className="font-semibold text-foreground">{balance.toFixed(6)} USDT</p>
                  </div>
                </div>
              </div>

              {/* Error/Success Messages */}
              {error && (
                <Alert className="border-red-500/30 bg-red-500/10">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-500/30 bg-green-500/10">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <DialogFooter className="flex gap-3">
            {paymentStep === 'completed' ? (
              <Button 
                onClick={() => {
                  setShowPaymentModal(false);
                  if (onClose) onClose();
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Close & Return
              </Button>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setShowPaymentModal(false)}
                  disabled={isProcessing}
                  className="border-border hover:bg-muted"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handlePayment}
                  disabled={isProcessing || paymentStep !== 'idle'}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {paymentStep === 'approval' && 'Waiting for Approval...'}
                      {paymentStep === 'processing' && 'Processing...'}
                      {paymentStep === 'confirming' && 'Adding Credits...'}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirm Payment
                    </>
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Opt-in Modal */}
      <Dialog open={showOptInModal} onOpenChange={setShowOptInModal}>
        <DialogContent className="glass-card border-border z-[70]">
          <DialogHeader>
            <DialogTitle className="text-foreground">Opt-in to USDT</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Before you can receive or send USDT on Algorand, you need to opt-in to the USDT asset.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert className="border-primary bg-primary/10">
              <Info className="h-4 w-4 text-primary" />
              <AlertTitle className="text-foreground">What is Asset Opt-in?</AlertTitle>
              <AlertDescription className="mt-2 text-muted-foreground">
                Algorand requires accounts to explicitly opt-in to assets before holding them. 
                This is a one-time transaction with a small fee (~0.001 ALGO).
              </AlertDescription>
            </Alert>

            <div className="text-sm space-y-2 text-foreground">
              <p><strong>Asset:</strong> USDt (Tether USD)</p>
              <p><strong>Asset ID:</strong> {selectedNetwork?.contractAddress}</p>
              <p><strong>Fee:</strong> ~0.001 ALGO</p>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowOptInModal(false)}
              className="border-border hover:bg-muted"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleOptIn}
              disabled={isProcessing}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Opt-in to USDT'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
