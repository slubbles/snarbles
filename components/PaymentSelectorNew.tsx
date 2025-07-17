'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Wallet, AlertCircle, Info } from 'lucide-react';
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
    setNetwork
  } = usePaymentState();
  
  // Use payment selectors
  const {
    hasEnoughCredits,
    hasEnoughAlgo,
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
    setSelectedMethod(method);
  };

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
        <RadioGroup value={selectedMethod || ''} onValueChange={handleMethodChange}>
          {paymentMethods.map((method) => (
            <div key={method.id} className="space-y-2">
              <div 
                className={`
                  glass-card p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                  min-h-[80px] touch-manipulation
                  ${selectedMethod === method.id 
                    ? 'border-[rgb(239,68,68)] bg-[rgb(239,68,68)]/10' 
                    : 'border-[rgb(38,38,38)] hover:border-[rgb(163,163,163)]'
                  }
                  ${method.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                onClick={() => !method.disabled && handleMethodChange(method.id)}
                style={{
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation'
                }}
              >
                <div className={`
                  flex items-center gap-3 pointer-events-none
                  ${method.disabled ? 'cursor-not-allowed' : ''}
                `}>
                  <RadioGroupItem 
                    id={method.id}
                    value={method.id}
                    disabled={method.disabled}
                    className="text-[rgb(239,68,68)] border-[rgb(163,163,163)] pointer-events-none"
                  />
                  
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`
                      p-2 rounded-lg 
                      ${method.id === 'credits' ? 'bg-[rgb(239,68,68)]/20' : 'bg-[rgb(38,38,38)]'}
                    `}>
                      <method.icon className={`
                        w-5 h-5 
                        ${method.id === 'credits' ? 'text-[rgb(239,68,68)]' : 'text-[rgb(163,163,163)]'}
                      `} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`
                          text-base font-semibold
                          ${method.disabled ? 'text-[rgb(163,163,163)]' : 'text-[rgb(254,254,235)]'}
                        `}>
                          {method.name}
                        </span>
                        
                        {method.recommended && (
                          <Badge className="bg-[rgb(239,68,68)] text-[rgb(254,254,235)] text-xs">
                            Recommended
                          </Badge>
                        )}
                      </div>
                      
                      <p className="snarbles-body text-sm text-[rgb(163,163,163)] mt-1">
                        {method.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Payment Details */}
                  <div className="mt-3 pt-3 border-t border-[rgb(38,38,38)] grid grid-cols-2 gap-4 text-sm w-full">
                    <div>
                      <span className="snarbles-body text-[rgb(163,163,163)]">Cost:</span>
                      <span className="snarbles-heading ml-2 text-[rgb(254,254,235)]">{method.cost}</span>
                    </div>
                    <div>
                      <span className="snarbles-body text-[rgb(163,163,163)]">Balance:</span>
                      <span className={`ml-2 font-medium ${method.available ? 'text-green-400' : 'text-red-400'}`}>
                        {method.balance}
                      </span>
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
