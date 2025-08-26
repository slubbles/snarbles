'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Wallet, 
  ArrowLeft,
  History,
  Loader2,
  CheckCircle,
  Zap,
  Shield,
  AlertCircle,
  DollarSign,
  Coins
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWalletAuth } from '@/components/providers/WalletAuthProvider';
import { useRouter } from 'next/navigation';
import CreditTopUpNew from '@/components/CreditTopUpNew';
import LimitedTransactionHistory from '@/components/credits/LimitedTransactionHistory';
import { isMobile } from '@/lib/mobile-wallet-utils';
import { getCreditsBalance } from '@/lib/credit-system';
import MultiWalletUSDTTopUp from '@/components/MultiWalletUSDTTopUp';

export default function CreditsPage() {
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { walletAddress, isAuthenticated, isLoading: walletLoading } = useWalletAuth();
  const router = useRouter();

  // Check if mobile on component mount
  useEffect(() => {
    setIsMobileDevice(isMobile());
  }, []);

  // Handle loading states properly
  useEffect(() => {
    // Wait for wallet auth to finish loading
    if (!walletLoading) {
      // Add a small delay to ensure state synchronization
      const timer = setTimeout(() => {
        setIsPageLoading(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [walletLoading]);

  // Force re-render when authentication state changes
  useEffect(() => {
    console.log('🔄 Credits page: Auth state changed', { isAuthenticated, walletAddress });
    setForceUpdate(prev => prev + 1);
  }, [isAuthenticated, walletAddress]);

  // Load user credits balance
  const loadUserBalance = async (isMounted: boolean = true) => {
    if (!walletAddress) {
      setUserBalance(0);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const result = await getCreditsBalance(walletAddress);
      if (isMounted) {
        setUserBalance(result.success ? (result.balance || 0) : 0);
      }
    } catch (error) {
      console.error('Error loading credits balance:', error);
      if (isMounted) {
        setUserBalance(0);
      }
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  };

  // Load balance when wallet address changes
  useEffect(() => {
    let isMounted = true;
    
    if (walletAddress) {
      loadUserBalance(isMounted);
    } else {
      setUserBalance(0);
      setIsLoading(false);
    }
    
    return () => {
      isMounted = false;
    };
  }, [walletAddress]);

  const navigateBack = () => {
    router.back();
  };

  // Show loading spinner while wallet auth is loading
  if (isPageLoading || walletLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading credits page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Hero Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/3 via-transparent to-blue-500/3 opacity-30" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/8 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-2000" />
        
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-5">
          <div style={{
            backgroundImage: `linear-gradient(rgba(239, 68, 68, 0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(239, 68, 68, 0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }} className="w-full h-full" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {/* Modern Header Section */}
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={navigateBack}
              className="text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-105 bg-muted/20 hover:bg-muted/40 backdrop-blur-sm border border-border/50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
          
          <div className="text-center space-y-6">
            {/* Icon with Glow Effect */}
            <div className="relative mx-auto w-20 h-20 mb-6">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
              <div className="relative w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-lg shadow-primary/30">
                <CreditCard className="w-10 h-10 text-white" />
              </div>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Credits & Top-Up
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Power your token creation journey with our flexible credit system. 
                <span className="text-primary font-semibold"> Deploy tokens instantly</span> across multiple blockchain networks.
              </p>
              
              {/* Quick Stats Banner */}
              <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
                <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium text-green-400">Instant Deployment</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-blue-400">Secure Payments</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full">
                  <Zap className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium text-purple-400">Multi-Chain Support</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {!isAuthenticated ? (
          /* Enhanced Wallet Connection Card */
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="relative max-w-lg w-full overflow-hidden">
              {/* Animated Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5" />
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(239,68,68,0.05)_50%,transparent_75%)] animate-pulse" />
              
              <CardContent className="relative p-12 text-center">
                {/* Animated Wallet Icon */}
                <div className="relative mx-auto mb-8">
                  <div className="absolute inset-0 w-24 h-24 bg-primary/20 rounded-full blur-xl animate-ping" />
                  <div className="relative w-24 h-24 mx-auto bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center border border-primary/20 backdrop-blur-sm">
                    <Wallet className="w-12 h-12 text-primary animate-pulse" />
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-foreground mb-3 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                      Connect Your Wallet
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-sm mx-auto leading-relaxed">
                      Securely connect your wallet to view your credit balance and purchase additional credits
                    </p>
                  </div>
                  
                  {/* Feature Pills */}
                  <div className="flex flex-wrap justify-center gap-3 my-6">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full text-sm">
                      <CheckCircle className="w-3 h-3 text-green-400" />
                      <span className="text-green-400">Non-Custodial</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-sm">
                      <Shield className="w-3 h-3 text-blue-400" />
                      <span className="text-blue-400">Secure</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full text-sm">
                      <Zap className="w-3 h-3 text-purple-400" />
                      <span className="text-purple-400">Instant</span>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground font-semibold py-4 text-lg shadow-lg shadow-primary/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/40"
                    onClick={() => {
                      toast({
                        title: "Connect Wallet",
                        description: "Use the wallet connection button in the navigation bar",
                        duration: 3000,
                      });
                    }}
                  >
                    <Wallet className="w-5 h-5 mr-3" />
                    Connect Wallet to Continue
                  </Button>
                  
                  <p className="text-xs text-muted-foreground/70 mt-4">
                    Supports Algorand (Pera), Solana (Phantom, Solflare) & more
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Enhanced Credit Management Interface */
          <div className="space-y-12" key={forceUpdate}>
            {/* Modern Success Message */}
            {isAuthenticated && walletAddress && (
              <div className="mb-10 px-4">
                <Card className="relative overflow-hidden border-green-500/30 bg-gradient-to-r from-green-500/10 via-green-500/5 to-transparent max-w-4xl mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-transparent to-transparent opacity-50" />
                  <CardContent className="relative p-8 md:p-10">
                    <div className="flex items-center justify-center gap-6">
                      <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center backdrop-blur-sm flex-shrink-0">
                        <CheckCircle className="w-7 h-7 text-green-400 animate-pulse" />
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <h3 className="text-xl font-semibold text-green-400 mb-2">Wallet Connected Successfully</h3>
                        <p className="text-green-300/80 text-base">
                          {walletAddress.slice(0, 12)}...{walletAddress.slice(-8)} • Ready to manage credits
                        </p>
                      </div>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 px-4 py-2 text-sm flex-shrink-0">
                        Connected
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Enhanced Credit Sections */}
            <div className="space-y-10">
              {/* Current Balance Card */}
              <Card className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-blue-500/5 border-primary/20 max-w-4xl mx-auto">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-blue-500/10 opacity-50" />
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-blue-500 to-purple-500" />
                
                <CardHeader className="relative pb-4">
                  <CardTitle className="text-2xl font-bold text-foreground flex items-center gap-4 justify-center">
                    <div className="relative">
                      <div className="absolute inset-0 w-12 h-12 bg-primary/30 rounded-full blur-lg animate-pulse" />
                      <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/30">
                        <CreditCard className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    Your Credits Balance
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="relative text-center pb-8">
                  <div className="space-y-4">
                    <div className="relative inline-block">
                      <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                      <div className="relative text-5xl font-bold text-primary tabular-nums">
                        {isLoading ? (
                          <div className="flex items-center justify-center">
                            <Loader2 className="w-12 h-12 animate-spin" />
                          </div>
                        ) : (
                          userBalance || 0
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-lg text-primary/80 font-semibold uppercase tracking-wider">Credits Available</div>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        Credits can be used for token creation and advanced features across all supported networks
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Methods Section Header */}
              <div className="text-center space-y-3 max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold text-foreground">Choose Your Payment Method</h2>
                <p className="text-muted-foreground text-lg">Select your preferred payment option to purchase credits instantly</p>
              </div>

              {/* Two Payment Cards Side by Side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
                
                {/* ALGO Payment Card */}
                <Card className="relative overflow-hidden bg-gradient-to-br from-green-500/10 via-background to-emerald-500/10 border-green-500/30 shadow-lg shadow-green-500/20 h-fit">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-transparent to-emerald-500/10 opacity-40" />
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-500" />
                  
                  {/* Featured Badge */}
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold px-4 py-1 shadow-lg">
                      ⚡ Instant & Direct
                    </Badge>
                  </div>
                  
                  <CardHeader className="relative pt-8 pb-6">
                    <CardTitle className="flex items-center gap-4 text-2xl justify-center">
                      <div className="relative">
                        <div className="absolute inset-0 w-12 h-12 bg-green-500/30 rounded-full blur-lg animate-pulse" />
                        <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                          <Coins className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">Pay with ALGO</div>
                        <p className="text-green-400 text-sm font-medium">Direct payment • Instant delivery • Bonus credits</p>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="relative space-y-6 pb-8">
                    {/* Purchase Options */}
                    <div className="space-y-4">
                      {[
                        { algo: 5, credits: 33, bonus: 8, popular: false },
                        { algo: 10, credits: 67, bonus: 17, popular: true },
                        { algo: 25, credits: 167, bonus: 42, popular: false },
                        { algo: 50, credits: 333, bonus: 83, popular: false }
                      ].map((option, index) => (
                        <Card 
                          key={index} 
                          className={`relative group cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                            option.popular 
                              ? 'border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent shadow-lg shadow-primary/20' 
                              : 'border-border/50 hover:border-green-500/30 bg-gradient-to-br from-green-500/5 to-transparent hover:shadow-lg hover:shadow-green-500/10'
                          }`}
                        >
                          {option.popular && (
                            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-10">
                              <Badge className="bg-gradient-to-r from-primary to-primary/80 text-white font-bold px-3 py-1 shadow-lg animate-pulse text-xs">
                                🔥 Most Popular
                              </Badge>
                            </div>
                          )}
                          
                          <CardContent className="p-4 text-center space-y-3">
                            <div className="space-y-2">
                              <div className="text-2xl font-bold text-foreground">
                                {option.credits + option.bonus}
                              </div>
                              <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                                Total Credits
                              </div>
                              
                              {option.bonus > 0 && (
                                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 font-semibold text-xs">
                                  <Zap className="w-3 h-3 mr-1" />
                                  +{option.bonus} bonus
                                </Badge>
                              )}
                              
                              <div className="text-lg font-semibold text-primary">
                                {option.algo} ALGO
                              </div>
                              
                              <div className="text-xs text-muted-foreground">
                                ≈ ${(option.algo * 0.15).toFixed(2)} USD
                              </div>
                            </div>
                            
                            <Button 
                              className={`w-full font-semibold transition-all duration-300 text-sm ${
                                option.popular 
                                  ? 'bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:scale-105' 
                                  : 'bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 hover:border-green-500/50'
                              }`}
                              size="lg"
                            >
                              <Coins className="w-4 h-4 mr-2" />
                              Purchase Now
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    
                    {/* Feature Benefits */}
                    <div className="space-y-3 p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
                      <h4 className="font-semibold text-green-400 text-center">Why Choose ALGO?</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="text-muted-foreground">Lightning fast transactions (3.3s)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="text-muted-foreground">Minimal fees (~$0.001)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="text-muted-foreground">Instant credit delivery</span>
                        </div>
                      </div>
                    </div>
                    
                    {!isAuthenticated && (
                      <Card className="border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 to-orange-500/10">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                              <AlertCircle className="w-5 h-5 text-yellow-400" />
                            </div>
                            <div className="text-center">
                              <h4 className="font-semibold text-yellow-400 mb-1">Algorand Wallet Required</h4>
                              <p className="text-xs text-yellow-300/80">
                                Connect your Algorand wallet (Pera Wallet) to purchase credits with ALGO
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </CardContent>
                </Card>

                {/* USDT Payment Card */}
                <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 via-background to-cyan-500/10 border-blue-500/30 shadow-lg shadow-blue-500/20 h-fit">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-cyan-500/10 opacity-40" />
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
                  
                  <CardHeader className="relative pt-6 pb-6">
                    <CardTitle className="flex items-center gap-4 text-2xl justify-center">
                      <div className="relative">
                        <div className="absolute inset-0 w-12 h-12 bg-blue-500/30 rounded-full blur-lg animate-pulse" />
                        <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                          <DollarSign className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">Pay with USDT</div>
                        <p className="text-blue-400 text-sm font-medium">1 USDT = 1 Credit • Multiple networks supported</p>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="relative space-y-6 pb-8">
                    {/* Payment Address Info */}
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <p className="text-blue-300 text-sm text-center">
                        <strong>Payment Address:</strong> <br />
                        <code className="text-xs bg-blue-500/20 border border-blue-500/30 px-2 py-1 rounded font-mono break-all mt-2 inline-block">
                          0x9ca8362c35db2649614cd4029ab0067d285660ef
                        </code>
                      </p>
                    </div>

                    {/* Multi-Wallet Interface Container */}
                    <div className="min-h-[400px] flex items-center justify-center">
                      <div className="w-full">
                        <MultiWalletUSDTTopUp 
                          userAddress={walletAddress || ''} 
                          onCreditsUpdated={loadUserBalance}
                        />
                      </div>
                    </div>

                    {/* Feature Benefits */}
                    <div className="space-y-3 p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                      <h4 className="font-semibold text-blue-400 text-center">Why Choose USDT?</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-blue-400" />
                          <span className="text-muted-foreground">Stable 1:1 credit conversion</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-blue-400" />
                          <span className="text-muted-foreground">Multiple blockchain support</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-blue-400" />
                          <span className="text-muted-foreground">Widely accepted stablecoin</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 gap-8 mt-10">
                {/* Transaction History with Better Design */}
                <Card className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5" />
                  <CardHeader className="relative">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <History className="w-5 h-5 text-blue-400" />
                      </div>
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <LimitedTransactionHistory />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
