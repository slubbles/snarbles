'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  Coins
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
  getNetworksByWalletType,
  getAvailableNetworks
} from '@/lib/multi-wallet-usdt-system';

interface USDTTopUpProps {
  walletAddress: string;
  onCreditsUpdated?: () => void;
}

export default function USDTTopUp({ walletAddress, onCreditsUpdated }: USDTTopUpProps) {
  const [networks, setNetworks] = useState<USDTNetwork[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<USDTNetwork | null>(null);
  const [usdtAmount, setUsdtAmount] = useState<string>('10');
  const [creditsAmount, setCreditsAmount] = useState<string>('10');
  const [inputMode, setInputMode] = useState<'usdt' | 'credits'>('usdt');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [paymentHistory, setPaymentHistory] = useState<USDTPaymentTransaction[]>([]);
  const { toast } = useToast();

  // Preset amounts
  const presetAmounts = [
    { usdt: 10, credits: 10, popular: false },
    { usdt: 25, credits: 25, popular: false },
    { usdt: 50, credits: 50, popular: true },
    { usdt: 100, credits: 100, popular: false },
    { usdt: 250, credits: 250, popular: false }
  ];

  useEffect(() => {
    loadPaymentOptions();
    loadPaymentHistory();
  }, [walletAddress]);

  const loadPaymentOptions = async () => {
    setIsLoading(true);
    try {
      // Use legacy EVM-only networks for backward compatibility
      // For multi-wallet support, use MultiWalletUSDTTopUp component instead
      const networks = await getUSDTPaymentOptions({ metamask: true });
      setNetworks(networks);
      
      // Default to most popular network (Polygon)
      const defaultNetwork = networks.find(n => n.name === 'polygon') || networks[0];
      setSelectedNetwork(defaultNetwork);
    } catch (error) {
      console.error('Error loading payment options:', error);
      toast({
        title: "Error",
        description: "Failed to load payment options",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadPaymentHistory = async () => {
    try {
      const result = await getUSDTPaymentHistory(walletAddress);
      setPaymentHistory(result);
    } catch (error) {
      console.error('Error loading payment history:', error);
    }
  };

  const handleUSDTAmountChange = (value: string) => {
    setUsdtAmount(value);
    setCreditsAmount(calculateCreditsFromUSDT(parseFloat(value) || 0).toString());
    setInputMode('usdt');
  };

  const handleCreditsAmountChange = (value: string) => {
    setCreditsAmount(value);
    setUsdtAmount(calculateUSDTFromCredits(parseFloat(value) || 0).toString());
    setInputMode('credits');
  };

  const handlePresetAmount = (preset: typeof presetAmounts[0]) => {
    setUsdtAmount(preset.usdt.toString());
    setCreditsAmount(preset.credits.toString());
    setInputMode('usdt');
  };

  const handleInitiatePayment = async () => {
    if (!selectedNetwork || !usdtAmount || parseFloat(usdtAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid USDT amount",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      // For EVM networks, generate manual payment instructions
      const paymentInstructions = generatePaymentInstructions(
        selectedNetwork,
        parseFloat(usdtAmount)
      );
      
      setPaymentDetails(paymentInstructions);
      setShowPaymentDialog(true);
      
      toast({
        title: "Payment Instructions Generated",
        description: "Follow the instructions to complete your USDT payment",
        variant: "default"
      });
    } catch (error) {
      console.error('Error initiating payment:', error);
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : 'Failed to initiate payment',
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Copied to clipboard"
    });
  };

    const getStatusBadge = (status: 'pending' | 'confirmed' | 'failed') => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="border-primary/30 text-muted-foreground"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'confirmed':
        return <Badge variant="default" className="bg-primary/10 text-primary border-primary/20"><CheckCircle className="w-3 h-3 mr-1" />Confirmed</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card className="snarbles-glass border-primary/20">
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading payment options...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="topup" className="w-full">
        <TabsList className="grid w-full grid-cols-2 snarbles-glass-subtle">
          <TabsTrigger value="topup" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Top Up Credits</TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Payment History</TabsTrigger>
        </TabsList>

        <TabsContent value="topup" className="space-y-6">
          {/* Network Selection */}
          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-primary" />
                Choose Network
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {networks.map((network) => (
                  <button
                    key={network.name}
                    onClick={() => setSelectedNetwork(network)}
                    className={`
                      relative p-4 rounded-lg border-2 transition-all text-left
                      ${selectedNetwork?.name === network.name 
                        ? 'border-primary bg-primary/10' 
                        : 'border-muted hover:border-primary/50'
                      }
                    `}
                  >
                    {network.name === 'polygon' && (
                      <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs">
                        Popular
                      </Badge>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">💰</div>
                      <div>
                        <div className="font-semibold">{network.displayName}</div>
                        <div className="text-sm text-muted-foreground">Chain ID: {network.chainId}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Amount Selection */}
          <Card className="border-2 border-muted">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Payment Amount
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Preset Amounts */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Quick Select</Label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {presetAmounts.map((preset, index) => (
                    <button
                      key={index}
                      onClick={() => handlePresetAmount(preset)}
                      className={`
                        relative p-3 rounded-lg border transition-all text-center
                        ${usdtAmount === preset.usdt.toString() 
                          ? 'border-primary bg-primary/10' 
                          : 'border-muted hover:border-primary/50'
                        }
                      `}
                    >
                      {preset.popular && (
                        <Badge className="absolute -top-1 -right-1 bg-primary text-white text-xs scale-75">
                          Best
                        </Badge>
                      )}
                      <div className="font-semibold">${preset.usdt}</div>
                      <div className="text-xs text-muted-foreground">{preset.credits} credits</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Amount */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="usdt-amount">USDT Amount</Label>
                  <Input
                    id="usdt-amount"
                    type="number"
                    placeholder="10.00"
                    value={usdtAmount}
                    onChange={(e) => handleUSDTAmountChange(e.target.value)}
                    min="5"
                    max="1000"
                    step="0.01"
                  />
                </div>
                <div>
                  <Label htmlFor="credits-amount">Credits Received</Label>
                  <Input
                    id="credits-amount"
                    type="number"
                    placeholder="10"
                    value={creditsAmount}
                    onChange={(e) => handleCreditsAmountChange(e.target.value)}
                    min="5"
                    max="1000"
                  />
                </div>
              </div>

              {/* Exchange Rate Info */}
              <div className="flex items-center justify-center p-3 snarbles-glass-subtle rounded-lg">
                <div className="text-center">
                  <div className="text-sm font-medium text-foreground">Exchange Rate</div>
                  <div className="text-lg font-bold text-primary">1 USDT = 1 Credit</div>
                </div>
              </div>

              {/* Payment Summary */}
              {selectedNetwork && parseFloat(usdtAmount) > 0 && (
                <Card className="snarbles-glass-subtle border-primary/10">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Payment Method:</span>
                        <span className="text-sm font-medium">{selectedNetwork.displayName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Amount:</span>
                        <span className="text-sm font-medium">{usdtAmount} USDT</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Gas Fee:</span>
                        <span className="text-sm font-medium">Gas: Variable</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Credits Received:</span>
                        <span className="text-sm font-bold text-primary">{calculateCreditsFromUSDT(parseFloat(usdtAmount))} credits</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Pay Button */}
              <Button
                onClick={handleInitiatePayment}
                disabled={!selectedNetwork || !usdtAmount || parseFloat(usdtAmount) <= 0 || isProcessing}
                className="w-full h-12 text-lg snarbles-gradient-red text-white font-semibold hover:scale-[1.02] transition-all duration-200"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Pay {usdtAmount} USDT
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Features */}
          <Card className="snarbles-glass border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Shield className="w-5 h-5 text-primary" />
                Why Pay with USDT?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <div className="font-medium">Multiple Networks</div>
                    <div className="text-sm text-muted-foreground">
                      Choose from 6 different blockchains for lowest fees
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <div className="font-medium">Stable Value</div>
                    <div className="text-sm text-muted-foreground">
                      USDT maintains consistent 1:1 credit conversion
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <div className="font-medium">Fast Processing</div>
                    <div className="text-sm text-muted-foreground">
                      Credits added within minutes of confirmation
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card className="border-2 border-muted">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-muted-foreground" />
                USDT Payment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {paymentHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Coins className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No USDT payments yet</p>
                  <p className="text-sm text-muted-foreground">Your payment history will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {paymentHistory.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">
                          💰
                        </div>
                        <div>
                          <div className="font-medium">{payment.usdtAmount} USDT</div>
                          <div className="text-sm text-muted-foreground">
                            {networks.find(n => n.id === payment.networkId)?.displayName || payment.networkId}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{payment.creditsAwarded} credits</div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(payment.status)}
                          {payment.transactionHash && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const network = networks.find(n => n.id === payment.networkId);
                                if (network) {
                                  window.open(`${network.explorerUrl}/tx/${payment.transactionHash}`, '_blank');
                                }
                              }}
                            >
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Complete USDT Payment
            </DialogTitle>
            <DialogDescription>
              Send USDT to the address below to receive your credits
            </DialogDescription>
          </DialogHeader>

          {paymentDetails && (
            <div className="space-y-4">
              {/* Payment Summary */}
              <Card className="snarbles-glass border-primary/20">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Amount to Send</div>
                      <div className="text-xl font-bold">{paymentDetails.usdtAmount} USDT</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Credits to Receive</div>
                      <div className="text-xl font-bold text-primary">{paymentDetails.creditsToReceive}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Receiver Address */}
              <div>
                <Label className="text-sm font-medium">Send USDT to this address:</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    value={paymentDetails.receiverAddress}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(paymentDetails.receiverAddress)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Network Info */}
              <div>
                <Label className="text-sm font-medium">Network & Contract:</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm">
                    <div><strong>Network:</strong> {paymentDetails.network.displayName}</div>
                    <div><strong>Contract:</strong> {paymentDetails.contractAddress}</div>
                    <div><strong>Gas Estimate:</strong> Variable (estimated during transaction)</div>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div>
                <Label className="text-sm font-medium">Instructions:</Label>
                <div className="mt-1 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-sm space-y-1">
                    {[
                      `1. Send exactly ${paymentDetails.amount} USDT to the receiver address`,
                      `2. Use the correct contract address: ${paymentDetails.contractAddress}`,
                      `3. Ensure you have enough network tokens for gas fees`,
                      `4. Transaction will be confirmed automatically`
                    ].map((instruction: string, index: number) => (
                      <div key={index}>{instruction}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Close
            </Button>
            <Button onClick={() => {
              const network = paymentDetails?.network;
              if (network) {
                window.open(network.explorerUrl, '_blank');
              }
            }}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Explorer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
