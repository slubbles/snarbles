'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Gift
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWalletAuth } from '@/components/providers/WalletAuthProvider';
import { useRouter } from 'next/navigation';
import CreditTopUpNew from '@/components/CreditTopUpNew';
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
      icon: <Zap className="w-6 h-6 text-yellow-400" />,
      title: "Instant Deployment",
      description: "Deploy tokens immediately without waiting for blockchain confirmations"
    },
    {
      icon: <Shield className="w-6 h-6 text-green-400" />,
      title: "Cost Effective",
      description: "Save up to 50% compared to direct ALGO payments"
    },
    {
      icon: <Star className="w-6 h-6 text-blue-400" />,
      title: "Never Expire",
      description: "Your credits remain in your account permanently"
    },
    {
      icon: <Gift className="w-6 h-6 text-purple-400" />,
      title: "Bonus Credits",
      description: "Get bonus credits with larger purchases"
    }
  ];

  const useCases = [
    {
      title: "Single Token",
      cost: "5 credits",
      description: "Perfect for testing or single project",
      example: "Create one token on Algorand mainnet"
    },
    {
      title: "Small Business",
      cost: "25-50 credits",
      description: "Ideal for multiple projects or iterations",
      example: "5-10 tokens with room for testing"
    },
    {
      title: "Enterprise",
      cost: "100+ credits",
      description: "Bulk token creation with maximum savings",
      example: "20+ tokens with bonus credits included"
    }
  ];

  return (
    <div className="min-h-screen snarbles-background">
      <div className="snarbles-container py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={navigateBack}
            className="snarbles-btn-secondary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="snarbles-heading-2">Credits & Top-Up</h1>
            <p className="snarbles-body text-gray-400">
              Purchase credits to deploy tokens on mainnet networks
            </p>
          </div>
        </div>

        {!isAuthenticated ? (
          /* Wallet Connection Required */
          <Card className="snarbles-card">
            <CardContent className="p-12 text-center">
              <Wallet className="w-20 h-20 mx-auto mb-6 text-gray-400" />
              <h2 className="snarbles-heading-3 mb-4">Connect Your Wallet</h2>
              <p className="snarbles-body text-gray-400 mb-6 max-w-md mx-auto">
                Connect your Algorand wallet to view your credit balance and purchase additional credits
              </p>
              <Button 
                className="snarbles-btn-primary"
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
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content - Credit Top-Up */}
            <div className="lg:col-span-2 space-y-6">
              <Tabs defaultValue="purchase" className="w-full">
                <TabsList className="grid w-full grid-cols-2 snarbles-glass-subtle">
                  <TabsTrigger value="purchase" className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Purchase Credits
                  </TabsTrigger>
                  <TabsTrigger value="history" className="flex items-center gap-2">
                    <History className="w-4 h-4" />
                    Transaction History
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="purchase" className="space-y-6 mt-6">
                  {/* Credit Top-Up Component */}
                  <CreditTopUpNew />
                </TabsContent>
                
                <TabsContent value="history" className="space-y-6 mt-6">
                  {/* Transaction History Component */}
                  <CreditHistory />
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar - Info & Benefits */}
            <div className="space-y-6">
              {/* Credit Benefits */}
              <Card className="snarbles-card">
                <CardHeader>
                  <CardTitle className="snarbles-heading-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-400" />
                    Why Use Credits?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {creditBenefits.map((benefit, index) => (
                    <div key={index} className="flex items-start gap-3">
                      {benefit.icon}
                      <div>
                        <h4 className="snarbles-heading font-semibold mb-1">
                          {benefit.title}
                        </h4>
                        <p className="snarbles-body-small text-gray-400">
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Use Cases */}
              <Card className="snarbles-card">
                <CardHeader>
                  <CardTitle className="snarbles-heading-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    Credit Use Cases
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {useCases.map((useCase, index) => (
                    <div key={index} className="snarbles-glass-subtle p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="snarbles-heading font-semibold">
                          {useCase.title}
                        </h4>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          {useCase.cost}
                        </Badge>
                      </div>
                      <p className="snarbles-body-small text-gray-400 mb-2">
                        {useCase.description}
                      </p>
                      <p className="snarbles-body-small text-gray-500 italic">
                        Example: {useCase.example}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Pricing Info */}
              <Card className="snarbles-card border-blue-500/20">
                <CardHeader>
                  <CardTitle className="snarbles-heading-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-400" />
                    Pricing Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="snarbles-body text-gray-400">Exchange Rate:</span>
                    <span className="snarbles-heading font-semibold">1 ALGO = 2 credits</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="snarbles-body text-gray-400">Mainnet Token:</span>
                    <span className="snarbles-heading font-semibold text-green-400">5 credits</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="snarbles-body text-gray-400">Testnet Token:</span>
                    <span className="snarbles-heading font-semibold text-blue-400">FREE</span>
                  </div>
                  <div className="pt-3 border-t border-gray-700">
                    <div className="flex items-center gap-2 text-sm text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      <span>Credits never expire</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Help & Support */}
              <Card className="snarbles-card border-purple-500/20">
                <CardHeader>
                  <CardTitle className="snarbles-heading-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-purple-400" />
                    Need Help?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="snarbles-body-small text-gray-400">
                    Having trouble with credit purchases or token creation?
                  </p>
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start"
                      onClick={() => router.push('/support')}
                    >
                      📚 Documentation
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start"
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
