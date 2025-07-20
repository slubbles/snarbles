'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Wallet, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useWalletAuth } from '@/components/providers/WalletAuthProvider';
import { useToast } from '@/hooks/use-toast';
import { usePaymentState, usePaymentSelectors } from '@/hooks/usePaymentState';

export type PaymentMethod = 'credits' | 'algo_direct';

interface PaymentSelectorNewProps {
  creditsRequired: number;
  algoRequired: number;
  network: string;
  className?: string;
}

export default function PaymentSelectorNew({
  creditsRequired,
  algoRequired,
  network,
  className = ''
}: PaymentSelectorNewProps) {
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const { walletAddress } = useWalletAuth();
  const { toast } = useToast();
  
  // Use centralized payment state
  const {
    selectedMethod,
    userCredits,
    walletBalance,
    setSelectedMethod,
    setWalletBalance,
    setIsConnected,
    setNetwork,
    setUserCredits
  } = usePaymentState();
  
  // Use payment selectors with dynamic values
  const hasEnoughCredits = userCredits >= creditsRequired;
  const hasEnoughAlgo = walletBalance !== null && walletBalance >= algoRequired;
  const {
    isAlgorandNetwork
  } = usePaymentSelectors();

  // Update network when prop changes
  useEffect(() => {
    setNetwork(network.includes('algorand') ? 'algorand' : 'solana');
  }, [network, setNetwork]);

  // Update connection state
  useEffect(() => {
    setIsConnected(!!walletAddress);
  }, [walletAddress, setIsConnected]);

  // Auto-select credits if available and no method is selected
  useEffect(() => {
    if (!selectedMethod && userCredits >= creditsRequired && walletAddress) {
      console.log('Auto-selecting credits payment method');
      setSelectedMethod('credits');
    }
  }, [selectedMethod, userCredits, creditsRequired, walletAddress, setSelectedMethod]);

  // Load user credits
  useEffect(() => {
    const loadUserCredits = async () => {
      if (!walletAddress) {
        setUserCredits(0);
        return;
      }
      
      try {
        // Import the credit system function
        const { getCreditsBalance } = await import('@/lib/credit-system');
        const result = await getCreditsBalance(walletAddress);
        
        if (result.success) {
          const credits = result.balance || 0;
          // For demo purposes, give users some credits if they have none
          const finalCredits = credits === 0 ? 10 : credits;
          setUserCredits(finalCredits);
          console.log(`Loaded user credits: ${finalCredits} (original: ${credits})`);
        } else {
          // Give demo credits even if credit system fails
          setUserCredits(10);
          console.log('Credit system unavailable, using demo credits: 10');
        }
      } catch (error) {
        console.error('Failed to load user credits:', error);
        // Give demo credits even if credit system fails
        setUserCredits(10);
        console.log('Credit system error, using demo credits: 10');
      }
    };

    loadUserCredits();
  }, [walletAddress, setUserCredits]);

  // Load wallet balance
  useEffect(() => {
    const loadWalletBalance = async () => {
      if (!walletAddress || !isAlgorandNetwork) return;
      
      setIsLoadingBalance(true);
      try {
        // Mock balance loading - replace with actual implementation
        const balance = Math.random() * 100; // Mock balance
        setWalletBalance(balance);
      } catch (error) {
        console.error('Failed to load wallet balance:', error);
        setWalletBalance(null);
      } finally {
        setIsLoadingBalance(false);
      }
    };

    loadWalletBalance();
  }, [walletAddress, isAlgorandNetwork, setWalletBalance]);

  // Handle method change
  const handleMethodChange = (method: PaymentMethod) => {
    console.log('Payment method changed to:', method);
    console.log('Current state before change:', { selectedMethod, userCredits, walletBalance });
    setSelectedMethod(method);
    toast({
      title: "Payment Method Selected",
      description: `Selected ${method === 'credits' ? 'Credits' : 'Direct ALGO Payment'}`,
      duration: 2000,
    });
  };

  // Debug logging
  useEffect(() => {
    console.log('PaymentSelectorNew state:', {
      selectedMethod,
      userCredits,
      walletBalance,
      walletAddress,
      isAlgorandNetwork,
      hasEnoughCredits,
      hasEnoughAlgo
    });
  }, [selectedMethod, userCredits, walletBalance, walletAddress, isAlgorandNetwork, hasEnoughCredits, hasEnoughAlgo]);

  // Payment method configurations
  const paymentMethods = [
    {
      id: 'credits' as const,
      name: 'Credits',
      description: 'Fast and convenient payment using your credit balance',
      icon: CreditCard,
      available: hasEnoughCredits,
      cost: `${creditsRequired} credits`,
      balance: `${userCredits} credits`,
      recommended: true,
      disabled: !hasEnoughCredits
    },
    {
      id: 'algo_direct' as const,
      name: 'Direct ALGO Payment',
      description: 'Pay directly from your Algorand wallet',
      icon: Wallet,
      available: hasEnoughAlgo,
      cost: `${algoRequired} ALGO`,
      balance: isLoadingBalance ? 'Loading...' : walletBalance !== null ? `${walletBalance} ALGO` : 'Connect wallet',
      recommended: false,
      disabled: !isAlgorandNetwork || !hasEnoughAlgo
    }
  ];

  return (
    <Card className={`glass-card snarbles-card border-2 border-[rgb(38,38,38)] transition-all duration-200 ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="snarbles-heading text-lg font-semibold flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-[rgb(239,68,68)]" />
          Payment Method
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Selection Status */}
        {!selectedMethod && (
          <Alert className="border-yellow-500/20 bg-yellow-500/10">
            <AlertCircle className="w-4 h-4 text-yellow-400" />
            <AlertDescription className="text-yellow-300">
              <strong>Select Payment Method:</strong> Choose how you want to pay for token creation.
            </AlertDescription>
          </Alert>
        )}
        
        {selectedMethod && (
          <Alert className="border-green-500/20 bg-green-500/10">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <AlertDescription className="text-green-300">
              <strong>Selected:</strong> {selectedMethod === 'credits' ? 'Credits Payment' : 'Direct ALGO Payment'}
            </AlertDescription>
          </Alert>
        )}
        
        <RadioGroup value={selectedMethod || ''} onValueChange={handleMethodChange} className="space-y-3">
          {paymentMethods.map((method) => (
            <div key={method.id} className="relative">
              <div 
                className={`
                  glass-card p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                  ${selectedMethod === method.id 
                    ? 'border-[rgb(239,68,68)] bg-[rgb(239,68,68)]/10 shadow-lg shadow-red-500/20' 
                    : 'border-[rgb(38,38,38)] hover:border-[rgb(163,163,163)] hover:bg-[rgb(38,38,38)]/20'
                  }
                  ${method.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}
                `}
                onClick={() => {
                  if (!method.disabled) {
                    handleMethodChange(method.id);
                  }
                }}
              >
                <div className="flex items-start gap-3 w-full">
                  <RadioGroupItem 
                    id={method.id}
                    value={method.id}
                    disabled={method.disabled}
                    className="text-[rgb(239,68,68)] border-[rgb(163,163,163)] mt-1 pointer-events-none"
                    checked={selectedMethod === method.id}
                  />
                  
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className={`
                        p-2 rounded-lg transition-all duration-200
                        ${method.id === 'credits' ? 'bg-[rgb(239,68,68)]/20' : 'bg-[rgb(38,38,38)]'}
                        ${selectedMethod === method.id ? 'shadow-lg' : ''}
                      `}>
                        <method.icon className={`
                          w-5 h-5 transition-colors duration-200
                          ${method.id === 'credits' ? 'text-[rgb(239,68,68)]' : 'text-[rgb(163,163,163)]'}
                          ${selectedMethod === method.id && method.id === 'credits' ? 'text-white' : ''}
                        `} />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`
                            text-base font-semibold transition-colors duration-200
                            ${method.disabled ? 'text-[rgb(163,163,163)]' : 'text-[rgb(254,254,235)]'}
                            ${selectedMethod === method.id ? 'text-white' : ''}
                          `}>
                            {method.name}
                          </span>
                          
                          {method.recommended && (
                            <Badge className="bg-[rgb(239,68,68)] text-[rgb(254,254,235)] text-xs animate-pulse">
                              Recommended
                            </Badge>
                          )}
                          
                          {selectedMethod === method.id && (
                            <Badge className="bg-green-500 text-white text-xs">
                              Selected
                            </Badge>
                          )}
                        </div>
                        
                        <p className={`
                          text-sm mt-1 transition-colors duration-200
                          ${selectedMethod === method.id ? 'text-gray-200' : 'text-[rgb(163,163,163)]'}
                        `}>
                          {method.description}
                        </p>
                      </div>
                    </div>
                    
                    {/* Payment Details */}
                    <div className={`
                      pt-3 border-t grid grid-cols-2 gap-4 text-sm transition-colors duration-200
                      ${selectedMethod === method.id ? 'border-gray-500' : 'border-[rgb(38,38,38)]'}
                    `}>
                      <div>
                        <span className={`
                          transition-colors duration-200
                          ${selectedMethod === method.id ? 'text-gray-300' : 'text-[rgb(163,163,163)]'}
                        `}>Cost:</span>
                        <span className={`
                          ml-2 font-semibold transition-colors duration-200
                          ${selectedMethod === method.id ? 'text-white' : 'text-[rgb(254,254,235)]'}
                        `}>{method.cost}</span>
                      </div>
                      <div>
                        <span className={`
                          transition-colors duration-200
                          ${selectedMethod === method.id ? 'text-gray-300' : 'text-[rgb(163,163,163)]'}
                        `}>Balance:</span>
                        <span className={`ml-2 font-medium ${method.available ? 'text-green-400' : 'text-red-400'}`}>
                          {method.balance}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </RadioGroup>

        <Separator className="bg-[rgb(38,38,38)]" />

        {/* Method Information */}
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

        {/* Debug Panel (only show if not in production) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="glass-card border-2 border-purple-500/20 rounded-lg p-4 bg-purple-500/5">
            <h4 className="text-purple-400 font-semibold mb-3">🔧 Debug Info</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Selected Method:</span>
                <span className="text-white">{selectedMethod || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">User Credits:</span>
                <span className="text-white">{userCredits}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Wallet Balance:</span>
                <span className="text-white">{walletBalance || 'N/A'} ALGO</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Has Enough Credits:</span>
                <span className={hasEnoughCredits ? 'text-green-400' : 'text-red-400'}>
                  {hasEnoughCredits ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Has Enough ALGO:</span>
                <span className={hasEnoughAlgo ? 'text-green-400' : 'text-red-400'}>
                  {hasEnoughAlgo ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Wallet Connected:</span>
                <span className={walletAddress ? 'text-green-400' : 'text-red-400'}>
                  {walletAddress ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-purple-500/20">
              <button
                onClick={() => {
                  console.log('Testing payment method selection...');
                  handleMethodChange('credits');
                }}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded text-sm transition-colors"
              >
                Test Select Credits
              </button>
            </div>
          </div>
        )}

        {/* Pricing Comparison */}
        <div className="glass-card border-2 border-[rgb(38,38,38)] rounded-lg p-4 bg-[rgb(38,38,38)]/5">
          <h4 className="snarbles-heading text-base font-semibold mb-3">💰 Pricing Comparison</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="snarbles-body text-sm text-[rgb(163,163,163)]">Credits</span>
              <span className="snarbles-heading text-base font-semibold">{creditsRequired} credits</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="snarbles-body text-sm text-[rgb(163,163,163)]">Direct ALGO</span>
              <span className="snarbles-heading text-base font-semibold">{algoRequired} ALGO</span>
            </div>
            <Separator className="bg-[rgb(38,38,38)]" />
            <div className="flex justify-between items-center">
              <span className="snarbles-body text-sm text-green-400">Savings with Credits</span>
              <span className="snarbles-heading text-base font-semibold text-green-400">
                {((algoRequired - (creditsRequired * 2)) / algoRequired * 100).toFixed(0)}% off
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
