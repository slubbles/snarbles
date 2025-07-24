/**
 * Enhanced USDT Payment Modal with Automated Transaction Signing
 * 
 * Supports both automated wallet transactions and manual payment fallback
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Wallet, 
  Copy, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle, 
  Loader, 
  Zap,
  CreditCard,
  Shield,
  DollarSign
} from 'lucide-react';

// Import our EVM wallet integration
import {
  connectEVMWallet,
  executeUSDTTransfer,
  getUSDTBalance,
  estimateUSDTTransferGas,
  switchToNetwork,
  isValidEVMAddress,
  getNetworkByChainId,
  EVMWalletInterface,
  USDTTransactionOptions,
  USDTTransactionResult,
  EVMWalletError
} from '@/lib/evm-wallet-integration';

import {
  USDT_RECEIVER_ADDRESS,
  SUPPORTED_USDT_NETWORKS,
  USDT_PRICING,
  calculateCreditsFromUSDT,
  validateUSDTAmount,
  generatePaymentInstructions,
  saveUSDTPaymentRecord,
  USDTNetwork
} from '@/lib/usdt-payment-system';

interface USDTPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentComplete: (credits: number) => void;
  userId: string;
  currentCredits: number;
}

type PaymentMethod = 'automated' | 'manual';
type TransactionStage = 'idle' | 'connecting' | 'preparing' | 'switching' | 'checking' | 'estimating' | 'signing' | 'confirming' | 'completed' | 'error';

interface WalletState {
  connected: boolean;
  wallet?: EVMWalletInterface;
  currentNetwork?: USDTNetwork;
  usdtBalance?: number;
  error?: string;
}

interface TransactionProgress {
  stage: TransactionStage;
  message: string;
  progress: number;
}

export default function USDTPaymentModal({ 
  isOpen, 
  onClose, 
  onPaymentComplete, 
  userId, 
  currentCredits 
}: USDTPaymentModalProps) {
  // Simple toast function replacement
  const showToast = (title: string, description: string, variant?: 'default' | 'destructive') => {
    console.log(`Toast [${variant || 'default'}]: ${title} - ${description}`);
    // In a real implementation, this would trigger a toast notification
  };
  
  // State management
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('automated');
  const [selectedNetwork, setSelectedNetwork] = useState<USDTNetwork>(SUPPORTED_USDT_NETWORKS[0]);
  const [amount, setAmount] = useState<string>('');
  const [walletState, setWalletState] = useState<WalletState>({ connected: false });
  const [transactionProgress, setTransactionProgress] = useState<TransactionProgress>({
    stage: 'idle',
    message: '',
    progress: 0
  });
  const [gasEstimate, setGasEstimate] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Derived values
  const amountNumber = parseFloat(amount) || 0;
  const creditsToReceive = calculateCreditsFromUSDT(amountNumber);
  const amountValidation = validateUSDTAmount(amountNumber);
  const isValidAmount = amount && amountValidation.valid;

  // Progress stage mapping
  const stageProgress: Record<TransactionStage, number> = {
    idle: 0,
    connecting: 10,
    preparing: 20,
    switching: 30,
    checking: 40,
    estimating: 60,
    signing: 80,
    confirming: 90,
    completed: 100,
    error: 0
  };

  // Update progress when stage changes
  useEffect(() => {
    setTransactionProgress(prev => ({
      ...prev,
      progress: stageProgress[prev.stage]
    }));
  }, [transactionProgress.stage]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setTransactionProgress({ stage: 'idle', message: '', progress: 0 });
      setGasEstimate(null);
    }
  }, [isOpen]);

  // Progress callback for transaction updates
  const handleTransactionProgress = useCallback((stage: string, message: string) => {
    setTransactionProgress({
      stage: stage as TransactionStage,
      message,
      progress: stageProgress[stage as TransactionStage] || 0
    });
  }, []);

  // Connect to user's wallet
  const handleConnectWallet = async () => {
    try {
      setTransactionProgress({ stage: 'connecting', message: 'Connecting to wallet...', progress: 10 });
      
      const wallet = await connectEVMWallet();
      
      // Detect current network
      const currentNetwork = getNetworkByChainId(wallet.chainId);
      
      setWalletState({
        connected: true,
        wallet,
        currentNetwork: currentNetwork || undefined,
        error: undefined
      });

      setTransactionProgress({ stage: 'idle', message: '', progress: 0 });
      
      showToast(
        "Wallet Connected",
        `Connected to ${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`
      );

    } catch (error) {
      const errorMessage = error instanceof EVMWalletError ? error.message : 'Failed to connect wallet';
      setWalletState({ connected: false, error: errorMessage });
      setTransactionProgress({ stage: 'error', message: errorMessage, progress: 0 });
      
      showToast(
        "Connection Failed",
        errorMessage,
        "destructive"
      );
    }
  };

  // Check USDT balance and estimate gas
  const checkBalanceAndEstimateGas = async () => {
    if (!walletState.wallet || !isValidAmount) return;

    try {
      setTransactionProgress({ stage: 'checking', message: 'Checking USDT balance...', progress: 40 });
      
      // Get USDT balance
      const { balance } = await getUSDTBalance(walletState.wallet, selectedNetwork);
      
      setWalletState(prev => ({ ...prev, usdtBalance: balance }));

      if (balance < amountNumber) {
        throw new EVMWalletError(`Insufficient USDT balance. You have ${balance} USDT, but need ${amountNumber} USDT.`);
      }

      setTransactionProgress({ stage: 'estimating', message: 'Estimating gas costs...', progress: 60 });

      // Estimate gas costs
      const estimate = await estimateUSDTTransferGas(walletState.wallet, {
        network: selectedNetwork,
        amount: amountNumber,
        recipient: USDT_RECEIVER_ADDRESS
      });

      setGasEstimate(estimate);
      setTransactionProgress({ stage: 'idle', message: '', progress: 0 });

    } catch (error) {
      const errorMessage = error instanceof EVMWalletError ? error.message : 'Failed to check balance';
      setTransactionProgress({ stage: 'error', message: errorMessage, progress: 0 });
      
      showToast(
        "Balance Check Failed",
        errorMessage,
        "destructive"
      );
    }
  };

  // Execute automated USDT transfer
  const handleAutomatedPayment = async () => {
    if (!walletState.wallet || !isValidAmount) return;

    try {
      const options: USDTTransactionOptions = {
        network: selectedNetwork,
        amount: amountNumber,
        recipient: USDT_RECEIVER_ADDRESS,
        gasLimit: gasEstimate?.gasLimit,
        gasPrice: gasEstimate?.gasPrice
      };

      const result: USDTTransactionResult = await executeUSDTTransfer(
        walletState.wallet,
        options,
        handleTransactionProgress
      );

      if (result.success && result.transactionHash) {
        // Save payment record
        await saveUSDTPaymentRecord({
          userId,
          networkName: selectedNetwork.name,
          transactionHash: result.transactionHash,
          fromAddress: walletState.wallet.address,
          toAddress: USDT_RECEIVER_ADDRESS,
          amount: amountNumber,
          creditsAwarded: creditsToReceive,
          status: 'confirmed',
          confirmations: 1
        });

        // Complete the payment
        onPaymentComplete(creditsToReceive);
        
        showToast(
          "Payment Successful!",
          `${creditsToReceive} credits added to your account`
        );

        onClose();

      } else {
        throw new EVMWalletError(result.error || 'Transaction failed');
      }

    } catch (error) {
      const errorMessage = error instanceof EVMWalletError ? error.message : 'Transaction failed';
      setTransactionProgress({ stage: 'error', message: errorMessage, progress: 0 });
      
      showToast(
        "Transaction Failed",
        errorMessage,
        "destructive"
      );
    }
  };

  // Switch to selected network
  const handleSwitchNetwork = async () => {
    if (!walletState.wallet) return;

    try {
      setTransactionProgress({ stage: 'switching', message: `Switching to ${selectedNetwork.displayName}...`, progress: 30 });
      
      await switchToNetwork(selectedNetwork);
      
      // Update wallet state
      setWalletState(prev => ({ 
        ...prev, 
        currentNetwork: selectedNetwork 
      }));

      setTransactionProgress({ stage: 'idle', message: '', progress: 0 });
      
      showToast(
        "Network Switched",
        `Now connected to ${selectedNetwork.displayName}`
      );

    } catch (error) {
      const errorMessage = error instanceof EVMWalletError ? error.message : 'Failed to switch network';
      setTransactionProgress({ stage: 'error', message: errorMessage, progress: 0 });
    }
  };

  // Copy address to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      showToast(
        "Copied!",
        "Address copied to clipboard"
      );
    } catch (error) {
      showToast(
        "Copy Failed",
        "Failed to copy to clipboard",
        "destructive"
      );
    }
  };

  // Quick amount selection
  const handleQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount.toString());
  };

  // Get payment instructions for manual payment
  const paymentInstructions = generatePaymentInstructions(selectedNetwork, amountNumber);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-card border-border bg-background">
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <DollarSign className="h-5 w-5 text-primary" />
            Top Up with USDT
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Add credits to your account using USDT from multiple blockchain networks
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          {/* Current Balance Display */}
          <div className="glass-card border-primary/20 p-4 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Current Balance</p>
                <p className="text-2xl font-bold text-foreground">{currentCredits} Credits</p>
              </div>
              {isValidAmount && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">After Payment</p>
                  <p className="text-2xl font-bold text-primary">
                    {currentCredits + creditsToReceive} Credits
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Network Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Select Network</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {SUPPORTED_USDT_NETWORKS.map((network) => (
                <Button
                  key={network.name}
                  variant={selectedNetwork.name === network.name ? 'default' : 'outline'}
                  onClick={() => setSelectedNetwork(network)}
                  className={`h-auto p-3 text-left transition-all ${
                    selectedNetwork.name === network.name 
                      ? 'bg-primary hover:bg-primary/90 text-primary-foreground border-primary' 
                      : 'glass-card border-border hover:border-primary/50 hover:bg-primary/5'
                  }`}
                  disabled={transactionProgress.stage !== 'idle'}
                >
                  <div>
                    <div className="font-medium text-sm">{network.displayName}</div>
                    <div className="text-xs opacity-60">
                      Chain ID: {network.chainId}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Amount (USDT)</label>
            <div className="space-y-2">
              <Input
                type="number"
                placeholder="Enter USDT amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={transactionProgress.stage !== 'idle'}
                min={USDT_PRICING.MIN_USDT_AMOUNT}
                max={USDT_PRICING.MAX_USDT_AMOUNT}
                step="0.01"
                className="glass-card bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
              />
              
              {/* Quick Amount Buttons */}
              <div className="flex gap-2 flex-wrap">
                {USDT_PRICING.QUICK_AMOUNTS.map((quickAmount) => (
                  <Button
                    key={quickAmount}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAmount(quickAmount)}
                    disabled={transactionProgress.stage !== 'idle'}
                    className="glass-card border-border hover:border-primary/50 hover:bg-primary/5 text-foreground"
                  >
                    ${quickAmount}
                  </Button>
                ))}
              </div>

              {/* Amount Validation */}
              {amount && !amountValidation.valid && (
                <Alert className="glass-card border-red-500/50 bg-red-500/10">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-red-300">{amountValidation.error}</AlertDescription>
                </Alert>
              )}

              {/* Credits Preview */}
              {isValidAmount && (
                <div className="glass-card p-3 bg-primary/10 border-primary/30 rounded-lg">
                  <p className="text-sm text-foreground">
                    You will receive <span className="font-bold text-primary">{creditsToReceive} credits</span> for ${amount} USDT
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Method Tabs */}
          <Tabs value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
            <TabsList className="grid w-full grid-cols-2 glass-card bg-muted/10">
              <TabsTrigger value="automated" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Zap className="h-4 w-4" />
                One-Click Payment
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <CreditCard className="h-4 w-4" />
                Manual Transfer
              </TabsTrigger>
            </TabsList>

            {/* Automated Payment Tab */}
            <TabsContent value="automated" className="space-y-4 mt-4">
              {!walletState.connected ? (
                <div className="text-center py-6">
                  <div className="glass-card border-primary/20 p-8 rounded-lg">
                    <Wallet className="h-12 w-12 mx-auto text-primary mb-4" />
                    <h3 className="text-lg font-medium mb-2 text-foreground">Connect Your Wallet</h3>
                    <p className="text-muted-foreground mb-4">
                      Connect MetaMask or another Web3 wallet to send USDT with one click
                    </p>
                    <Button 
                      onClick={handleConnectWallet}
                      disabled={transactionProgress.stage !== 'idle'}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2"
                    >
                      {transactionProgress.stage === 'connecting' ? (
                        <Loader className="h-4 w-4 animate-spin" />
                      ) : (
                        <Wallet className="h-4 w-4" />
                      )}
                      Connect Wallet
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Wallet Info */}
                  <div className="glass-card p-4 bg-primary/10 border-primary/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span className="font-medium text-foreground">Wallet Connected</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {walletState.wallet?.address.slice(0, 6)}...{walletState.wallet?.address.slice(-4)}
                    </p>
                    {walletState.currentNetwork && (
                      <p className="text-sm text-muted-foreground">
                        Network: {walletState.currentNetwork.displayName}
                      </p>
                    )}
                    {walletState.usdtBalance !== undefined && (
                      <p className="text-sm text-muted-foreground">
                        USDT Balance: {walletState.usdtBalance.toFixed(2)} USDT
                      </p>
                    )}
                  </div>

                  {/* Network Mismatch Warning */}
                  {walletState.currentNetwork?.chainId !== selectedNetwork.chainId && (
                    <Alert className="glass-card border-orange-500/50 bg-orange-500/10">
                      <AlertCircle className="h-4 w-4 text-orange-400" />
                      <AlertDescription className="text-orange-300">
                        Please switch to {selectedNetwork.displayName} to continue
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Gas Estimate */}
                  {gasEstimate && (
                    <div className="glass-card p-3 bg-blue-500/10 border-blue-500/30 rounded-lg">
                      <p className="text-sm text-foreground">
                        Estimated gas cost: {gasEstimate.estimatedCost} {selectedNetwork.nativeCurrency.symbol}
                      </p>
                    </div>
                  )}

                  {/* Transaction Progress */}
                  {transactionProgress.stage !== 'idle' && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Loader className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-sm text-foreground">{transactionProgress.message}</span>
                      </div>
                      <Progress value={transactionProgress.progress} className="w-full bg-muted/20" />
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Manual Payment Tab */}
            <TabsContent value="manual" className="space-y-4 mt-4">
              {isValidAmount ? (
                <div className="space-y-4">
                  <Alert className="glass-card border-yellow-500/50 bg-yellow-500/10">
                    <Shield className="h-4 w-4 text-yellow-400" />
                    <AlertDescription className="text-yellow-300">
                      {paymentInstructions.warning}
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    <h4 className="font-medium text-foreground">{paymentInstructions.title}</h4>
                    <div className="space-y-2">
                      {paymentInstructions.steps.map((step, index) => (
                        <div key={index} className="flex gap-3">
                          <Badge variant="outline" className="shrink-0 border-primary/50 text-primary">
                            {index + 1}
                          </Badge>
                          <p className="text-sm text-muted-foreground">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="glass-card p-4 bg-muted/5 border-border rounded-lg">
                    <p className="text-sm font-medium mb-2 text-foreground">Recipient Address:</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 p-2 glass-card bg-background border-border rounded text-sm break-all text-foreground font-mono">
                        {USDT_RECEIVER_ADDRESS}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(USDT_RECEIVER_ADDRESS)}
                        className="glass-card border-border hover:border-primary/50 hover:bg-primary/5"
                      >
                        {copied ? <CheckCircle className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => window.open(paymentInstructions.explorerLink, '_blank')}
                    className="w-full flex items-center gap-2 glass-card border-border hover:border-primary/50 hover:bg-primary/5 text-foreground"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View on Block Explorer
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <p>Enter a valid USDT amount to see payment instructions</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="flex gap-3 border-t border-border p-6">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="flex-1 glass-card border-border hover:border-primary/50 hover:bg-primary/5 text-foreground"
          >
            Cancel
          </Button>
          
          {paymentMethod === 'automated' && walletState.connected && (
            <>
              {walletState.currentNetwork?.chainId !== selectedNetwork.chainId ? (
                <Button 
                  onClick={handleSwitchNetwork}
                  disabled={transactionProgress.stage !== 'idle'}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Switch to {selectedNetwork.displayName}
                </Button>
              ) : !gasEstimate ? (
                <Button 
                  onClick={checkBalanceAndEstimateGas}
                  disabled={!isValidAmount || transactionProgress.stage !== 'idle'}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Check Balance & Estimate Gas
                </Button>
              ) : (
                <Button 
                  onClick={handleAutomatedPayment}
                  disabled={!isValidAmount || transactionProgress.stage !== 'idle'}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {transactionProgress.stage !== 'idle' ? (
                    <Loader className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  Send ${amount} USDT
                </Button>
              )}
            </>
          )}

          {paymentMethod === 'automated' && !walletState.connected && (
            <Button 
              onClick={handleConnectWallet}
              disabled={transactionProgress.stage !== 'idle'}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Connect Wallet
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
