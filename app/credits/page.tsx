'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Wallet, 
  TrendingUp, 
  Zap, 
  Shield,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  History,
  Star,
  Gift,
  Sparkles,
  Coins
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWalletAuth } from '@/components/providers/WalletAuthProvider';
import { useRouter } from 'next/navigation';
import WalletSpecificCreditTopUp from '@/components/WalletSpecificCreditTopUp';
import CreditHistory from '@/components/CreditHistory';
import { isMobile } from '@/lib/mobile-wallet-utils';

export default function CreditsPage() {
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const { toast } = useToast();
  const { walletAddress, isAuthenticated } = useWalletAuth();
  const router = useRouter();

  // Check if mobile on component mount
  useState(() => {
    setIsMobileDevice(isMobile());
  });

  const navigateBack = () => {
    router.back();
  };

  const creditBenefits = [
    {
      icon: <Zap className="w-5 h-5 text-yellow-400" />,
      title: "Instant Deployment",
      description: "Deploy tokens immediately without waiting for blockchain confirmations",
      highlight: "Lightning Fast"
    },
    {
      icon: <Shield className="w-5 h-5 text-green-400" />,
      title: "Cost Effective",
      description: "Save up to 50% compared to direct payments with bulk purchases",
      highlight: "Save 50%"
    },
    {
      icon: <Sparkles className="w-5 h-5 text-purple-400" />,
      title: "Never Expire",
      description: "Your credits remain in your account permanently with no time limits",
      highlight: "Permanent"
    },
    {
      icon: <Gift className="w-5 h-5 text-blue-400" />,
      title: "Bonus Credits",
      description: "Get bonus credits with larger purchases - more value for your investment",
      highlight: "Bonus Included"
    }
  ];

  const useCases = [
    {
      title: "Single Token",
      cost: "5 credits",
      description: "Perfect for testing or single project",
      example: "Create one token on Algorand mainnet",
      recommended: false,
      icon: <Coins className="w-5 h-5 text-blue-400" />
    },
    {
      title: "Small Business",
      cost: "25-50 credits",
      description: "Ideal for multiple projects or iterations",
      example: "5-10 tokens with room for testing",
      recommended: true,
      icon: <TrendingUp className="w-5 h-5 text-green-400" />
    },
    {
      title: "Enterprise",
      cost: "100+ credits",
      description: "Bulk token creation with maximum savings",
      example: "20+ tokens with bonus credits included",
      recommended: false,
      icon: <Star className="w-5 h-5 text-purple-400" />
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {/* Header Section */}
        <div className="flex items-center gap-4 mb-12">
          <Button
            variant="ghost"
            size="sm"
            onClick={navigateBack}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-2">
              Credits & Top-Up
            </h1>
            <p className="text-xl text-muted-foreground">
              Purchase credits to deploy tokens on mainnet networks
            </p>
          </div>
        </div>

        {!isAuthenticated ? (
          /* Wallet Connection Required */
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="glass-card max-w-md w-full">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Wallet className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Connect Your Wallet</h2>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Connect your wallet to view your credit balance and purchase additional credits
                </p>
                <Button 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3"
                  onClick={() => {
                    toast({
                      title: "Connect Wallet",
                      description: "Use the wallet connection button in the navigation bar",
                      duration: 3000,
                    });
                  }}
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Connect Wallet
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            {/* Main Content - Credit Top-Up */}
            <div className="xl:col-span-3 space-y-8">
              {/* Direct Payment Options - No Tabs */}
              <div className="space-y-6">
                {/* Wallet-Specific Credit Top-Up Component */}
                <WalletSpecificCreditTopUp />
                
                {/* Transaction History */}
                <Card className="glass-card border-purple-500/10">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                        <History className="w-4 h-4 text-purple-400" />
                      </div>
                      Recent Transactions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CreditHistory />
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Enhanced Sidebar */}
            <div className="xl:col-span-1 space-y-6">
              {/* Credit Benefits */}
              <Card className="glass-card border-primary/10">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Star className="w-4 h-4 text-primary" />
                    </div>
                    Why Use Credits?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {creditBenefits.map((benefit, index) => (
                    <div key={index} className="relative group">
                      <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/20 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center flex-shrink-0">
                          {benefit.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-foreground text-sm">
                              {benefit.title}
                            </h4>
                            <Badge variant="secondary" className="text-xs">
                              {benefit.highlight}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {benefit.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Use Cases */}
              <Card className="glass-card border-green-500/10">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                    </div>
                    Credit Use Cases
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {useCases.map((useCase, index) => (
                    <div key={index} className={`relative p-4 rounded-lg border transition-all hover:scale-[1.02] ${
                      useCase.recommended 
                        ? 'border-primary/30 bg-primary/5' 
                        : 'border-border bg-muted/10'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {useCase.icon}
                          <h4 className="font-semibold text-foreground text-sm">
                            {useCase.title}
                          </h4>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge 
                            variant={useCase.recommended ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {useCase.cost}
                          </Badge>
                          {useCase.recommended && (
                            <Badge variant="outline" className="text-xs text-primary border-primary/30">
                              Popular
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
                        {useCase.description}
                      </p>
                      <p className="text-xs text-muted-foreground/80 italic">
                        Example: {useCase.example}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Pricing Info */}
              <Card className="glass-card border-blue-500/10">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-blue-400" />
                    </div>
                    Pricing Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/10">
                      <span className="text-sm text-muted-foreground">Exchange Rate:</span>
                      <span className="font-semibold text-foreground">1 USDT = 1 credit</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-green-500/5">
                      <span className="text-sm text-muted-foreground">Mainnet Token:</span>
                      <span className="font-semibold text-green-400">5 credits</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-blue-500/5">
                      <span className="text-sm text-muted-foreground">Testnet Token:</span>
                      <span className="font-semibold text-blue-400">FREE</span>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-border">
                    <div className="flex items-center gap-2 text-sm text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      <span>Credits never expire</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Help & Support */}
              <Card className="glass-card border-purple-500/10">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 text-purple-400" />
                    </div>
                    Need Help?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Having trouble with credit purchases or token creation?
                  </p>
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start text-left"
                      onClick={() => router.push('/support')}
                    >
                      📚 Documentation
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start text-left"
                      onClick={() => router.push('/contact')}
                    >
                      💬 Contact Support
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
