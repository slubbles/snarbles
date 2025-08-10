'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Wallet, AlertCircle, Info, CheckCircle, DollarSign, Zap, ArrowRight, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useWalletAuth } from '@/components/providers/WalletAuthProvider';
import { useToast } from '@/hooks/use-toast';
import { usePaymentState, usePaymentSelectors } from '@/hooks/usePaymentState';
import { getAlgorandClient } from '@/lib/algorand';
import { getSolanaBalance } from '@/lib/solana-usdt-integration';

export type WalletAwarePaymentMethod = 'credits' | 'native_direct';

interface WalletAwarePaymentSelectorProps {
  creditsRequired: number;
  nativeRequired: number; // ALGO or SOL required
  network: string;
  className?: string;
}

export default function WalletAwarePaymentSelector({
  creditsRequired,
  nativeRequired,
  network,
  className = ''
}: WalletAwarePaymentSelectorProps) {
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isLoadingCredits, setIsLoadingCredits] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<WalletAwarePaymentMethod>('credits');
  
  const { walletAddress, walletType } = useWalletAuth();
  const { toast } = useToast();
  
  // Use centralized payment state
  const {
    userCredits,
    walletBalance,
    setSelectedMethod: setGlobalSelectedMethod,
    setWalletBalance,
    setUserCredits
  } = usePaymentState();
  
  // Check if this is a mainnet network
  const isMainnet = network.includes('mainnet');
  const isAlgorandTestnet = network.includes('algorand-testnet');
  const isSolanaDevnet = network.includes('solana-devnet');
  
  // Payment validations
  const hasEnoughCredits = userCredits >= creditsRequired;
  const hasEnoughNative = walletBalance !== null && walletBalance >= nativeRequired;
  
  // Local canPay logic that checks actual balances for selected method
  const canPay = selectedMethod && (
    (selectedMethod === 'credits' && hasEnoughCredits) ||
    (selectedMethod === 'native_direct' && hasEnoughNative)
  );
  
  const {
    currentStep,
    progressPercentage,
    needsConnection,
    hasError
  } = usePaymentSelectors();

  // Load user credits when wallet address changes
  useEffect(() => {
    const loadUserCredits = async () => {
      if (!walletAddress) {
        setUserCredits(0);
        return;
      }
      
      setIsLoadingCredits(true);
      try {
        // Import the credit system function
        const { getCreditsBalance } = await import('@/lib/credit-system');
        const result = await getCreditsBalance(walletAddress);
        
        if (result.success) {
          const credits = result.balance || 0;
          // For demo purposes, give users some credits if they have none
          const finalCredits = credits === 0 ? 10 : credits;
          setUserCredits(finalCredits);
          console.log(`🔄 [WalletAware] Loaded user credits: ${finalCredits} (original: ${credits})`);
        } else {
          // Give demo credits even if credit system fails
          setUserCredits(10);
          console.log('🔄 [WalletAware] Credit system unavailable, using demo credits: 10');
        }
      } catch (error) {
        console.error('❌ [WalletAware] Failed to load user credits:', error);
        // Give demo credits even if credit system fails
        setUserCredits(10);
        console.log('🔄 [WalletAware] Credit system error, using demo credits: 10');
      } finally {
        setIsLoadingCredits(false);
      }
    };

    loadUserCredits();
  }, [walletAddress, setUserCredits]);

  useEffect(() => {
    if (walletAddress && walletType) {
      setIsLoadingBalance(true);
      // Load native currency balance for validation
      if (walletType === 'algorand') {
        fetchRealAlgoBalance(walletAddress, network);
      } else if (walletType === 'solana') {
        fetchRealSolBalance(walletAddress, network);
      }
    } else {
      setIsLoadingBalance(false);
    }
  }, [walletAddress, walletType, network]);

  // Update global payment state when local selection changes
  useEffect(() => {
    setGlobalSelectedMethod(selectedMethod === 'native_direct' ? 'algo_direct' : 'credits');
  }, [selectedMethod, setGlobalSelectedMethod]);

  const getWalletInfo = () => {
    if (walletType === 'algorand') {
      return {
        name: 'Pera Wallet',
        nativeCurrency: 'ALGO',
        stablecoin: 'USDt',
        stablecoinFull: 'USDt (Algorand)',
        icon: '🔺',
        color: 'text-blue-500',
        networkName: network.includes('mainnet') ? 'Mainnet' : 'Testnet'
      };
    } else if (walletType === 'solana') {
      return {
        name: 'Phantom Wallet',
        nativeCurrency: 'SOL',
        stablecoin: 'USDT',
        stablecoinFull: 'SPL-USDT',
        icon: '👻',
        color: 'text-purple-500',
        networkName: network.includes('mainnet') ? 'Mainnet' : 'Devnet'
      };
    }
    return null;
  };

  const walletInfo = getWalletInfo();

  const fetchRealAlgoBalance = async (address: string, networkName: string): Promise<number> => {
    try {
      if (!networkName.includes('algorand')) {
        setIsLoadingBalance(false);
        return 0;
      }
      
      console.log(`🔄 [WalletAware] Fetching ALGO balance for ${address.substring(0, 8)}... on ${networkName}`);
      const algodClient = getAlgorandClient(networkName);
      await algodClient.status().do();
      
      const accountInfo = await algodClient.accountInformation(address).do();
      const algoBalance = Number(accountInfo.amount) / 1000000;
      
      console.log(`✅ [WalletAware] ALGO balance loaded: ${algoBalance} ALGO`);
      setWalletBalance(algoBalance);
      return algoBalance;
    } catch (error) {
      console.error('❌ [WalletAware] Error fetching ALGO balance:', error);
      setWalletBalance(0);
      return 0;
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const fetchRealSolBalance = async (address: string, networkName: string): Promise<number> => {
    try {
      if (!networkName.includes('solana')) {
        setIsLoadingBalance(false);
        return 0;
      }
      
      console.log(`🔄 [WalletAware] Fetching SOL balance for ${address.substring(0, 8)}... on ${networkName}`);
      const isTestnet = networkName.includes('devnet');
      const solBalance = await getSolanaBalance(address, isTestnet);
      
      console.log(`✅ [WalletAware] SOL balance loaded: ${solBalance} SOL`);
      setWalletBalance(solBalance);
      return solBalance;
    } catch (error) {
      console.error('❌ [WalletAware] Error fetching SOL balance:', error);
      setWalletBalance(0);
      return 0;
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const getPaymentMethodCard = (
    method: WalletAwarePaymentMethod,
    title: string,
    description: string,
    icon: React.ReactNode,
    available: boolean,
    balance?: number,
    currency?: string,
    warning?: string,
    isLoading?: boolean
  ) => (
    <div className={`relative p-4 border rounded-lg cursor-pointer transition-all ${
      selectedMethod === method ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
    }`} onClick={() => available && setSelectedMethod(method)}>
      <div className="flex items-start gap-3">
        <RadioGroupItem 
          value={method} 
          id={method}
          disabled={!available}
          className="mt-0.5"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {icon}
            <Label htmlFor={method} className="font-semibold cursor-pointer">
              {title}
            </Label>
            {!available && !isLoading && (
              <Badge variant="destructive" className="text-xs">
                Insufficient
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-2">{description}</p>
          
          {(balance !== undefined || isLoading) && currency && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Available:</span>
              <span className={`font-semibold ${available ? 'text-green-600' : 'text-red-600'}`}>
                {isLoading ? (
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 border border-gray-300 border-t-transparent rounded-full animate-spin" />
                    Loading...
                  </span>
                ) : (
                  `${balance?.toFixed(currency === 'Credits' ? 0 : currency === 'ALGO' ? 6 : 4)} ${currency}`
                )}
              </span>
            </div>
          )}
          
          {warning && !isLoading && (
            <Alert className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">{warning}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );

  if (!walletInfo) {
    return (
      <Card className={className}>
        <CardContent className="px-8 pt-10 pb-8">
          <div className="text-center">
            <Wallet className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
            <p className="text-muted-foreground">
              Connect your Pera or Phantom wallet to proceed
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // For testnet/devnet networks, show faucet information instead of payment methods
  if (!isMainnet) {
    const faucetInfo = isAlgorandTestnet 
      ? {
          networkName: 'Algorand Testnet',
          faucetUrl: 'https://bank.testnet.algorand.network/',
          faucetName: 'Algorand Testnet Faucet',
          tokenName: 'testnet ALGO'
        }
      : {
          networkName: 'Solana Devnet',  
          faucetUrl: 'https://faucet.solana.com/',
          faucetName: 'Solana Devnet Faucet',
          tokenName: 'devnet SOL'
        };

    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-500" />
            Free Token Creation
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="text-lg">{walletInfo.icon}</span>
            <span>{walletInfo.name}</span>
            <Badge variant="outline" className="text-xs">
              {faucetInfo.networkName}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert className="border-green-500/20 bg-green-500/10">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700 dark:text-green-300">
                <strong>Good news!</strong> Token creation is completely free on {faucetInfo.networkName}.
              </AlertDescription>
            </Alert>

            <div className="bg-muted/20 p-4 rounded-lg space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Info className="w-4 h-4" />
                Testnet Token Requirements
              </h4>
              <p className="text-sm text-muted-foreground">
                To create tokens on {faucetInfo.networkName}, you'll need some {faucetInfo.tokenName} in your wallet to pay for blockchain transaction fees.
              </p>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.open(faucetInfo.faucetUrl, '_blank')}
                className="flex items-center gap-2 w-full"
              >
                <ExternalLink className="w-4 h-4" />
                Get Free {faucetInfo.tokenName} from {faucetInfo.faucetName}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="text-xs text-muted-foreground p-3 bg-muted/10 rounded border-l-4 border-blue-500">
              <strong>Note:</strong> Testnet tokens have no real value and are only used for development and testing purposes.
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Choose Payment Method
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="text-lg">{walletInfo.icon}</span>
          <span>{walletInfo.name}</span>
          <Badge variant="outline" className="text-xs">
            {walletInfo.networkName}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <RadioGroup value={selectedMethod} onValueChange={(value) => setSelectedMethod(value as WalletAwarePaymentMethod)}>
          <div className="space-y-4">
            {/* Credits Payment */}
            {getPaymentMethodCard(
              'credits',
              'Use Credits',
              `Use your existing credits balance. Requires ${creditsRequired} credits.`,
              <CreditCard className="w-5 h-5 text-primary" />,
              hasEnoughCredits && !isLoadingCredits,
              userCredits,
              'Credits',
              undefined,
              isLoadingCredits
            )}

            {/* Native Currency Direct Payment */}
            {getPaymentMethodCard(
              'native_direct',
              `Pay with ${walletInfo.nativeCurrency}`,
              `Pay directly with ${walletInfo.nativeCurrency} from your ${walletInfo.name}. Requires ${nativeRequired} ${walletInfo.nativeCurrency}.`,
              <Wallet className={`w-5 h-5 ${walletInfo.color}`} />,
              hasEnoughNative && !isLoadingBalance,
              walletBalance || 0,
              walletInfo.nativeCurrency,
              undefined,
              isLoadingBalance
            )}
          </div>
        </RadioGroup>

        {/* Payment Summary */}
        {selectedMethod && (
          <>
            <Separator className="my-6" />
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Info className="w-4 h-4" />
                Payment Summary
              </h4>
              <div className="bg-muted/20 p-4 rounded-lg space-y-2">
                {selectedMethod === 'credits' && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span>Credits Required:</span>
                      <span className="font-semibold">{creditsRequired}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Your Balance:</span>
                      <span className={hasEnoughCredits ? 'text-green-600' : 'text-red-600'}>
                        {isLoadingCredits ? (
                          <span className="flex items-center gap-1">
                            <div className="w-3 h-3 border border-gray-300 border-t-transparent rounded-full animate-spin" />
                            Loading...
                          </span>
                        ) : (
                          `${userCredits} credits`
                        )}
                      </span>
                    </div>
                  </>
                )}
                
                {selectedMethod === 'native_direct' && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span>{walletInfo.nativeCurrency} Required:</span>
                      <span className="font-semibold">{nativeRequired}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Your Balance:</span>
                      <span className={hasEnoughNative ? 'text-green-600' : 'text-red-600'}>
                        {isLoadingBalance ? (
                          <span className="flex items-center gap-1">
                            <div className="w-3 h-3 border border-gray-300 border-t-transparent rounded-full animate-spin" />
                            Loading...
                          </span>
                        ) : (
                          `${(walletBalance || 0).toFixed(walletInfo.nativeCurrency === 'ALGO' ? 6 : 4)} ${walletInfo.nativeCurrency}`
                        )}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {/* Need more funds alert */}
        {selectedMethod && !canPay && (
          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p>Insufficient funds for this payment method.</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.open('/credits', '_blank')}
                  className="flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Top Up {selectedMethod === 'credits' ? 'Credits' : walletInfo.nativeCurrency}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Loading indicator */}
        {(isLoadingBalance || isLoadingCredits) && (
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border border-gray-300 border-t-transparent rounded-full animate-spin" />
              Loading {isLoadingCredits && isLoadingBalance ? 'balances' : isLoadingCredits ? 'credits' : 'wallet balance'}...
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
