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
