'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, Shield, CheckCircle, AlertTriangle, CreditCard } from 'lucide-react';
import Link from 'next/link';
import TokenFormNew from '@/components/TokenFormNew';
import { getCreditsBalance } from '@/lib/credit-system';
import { useWalletAuth } from '@/components/providers/WalletAuthProvider';
import { useToast } from '@/hooks/use-toast';
import { isMobile } from '@/lib/mobile-wallet-utils';
import MobileWalletModal from '@/components/MobileWalletModal';

export default function CreateTokenPage() {
  const [tokenData, setTokenData] = useState({
    name: '',
    symbol: '',
    description: '',
    totalSupply: '1000000',
    decimals: '9',
    logoUrl: '',
    website: '',
    twitter: '',
    github: '',
    mintable: true,
    burnable: false,
    pausable: false,
    network: 'algorand-testnet'
  });

  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showMobileWalletModal, setShowMobileWalletModal] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const { toast } = useToast();
  const { user, isAuthenticated, walletAddress } = useWalletAuth();

  useEffect(() => {
    setIsMobileDevice(isMobile());
    loadUserCredits();
  }, [walletAddress]);

  const loadUserCredits = async () => {
    if (!walletAddress) {
      setIsLoading(false);
      return;
    }

    try {
      const result = await getCreditsBalance(walletAddress);
      if (result.success) {
        setUserCredits(result.balance || 0);
      }
    } catch (error) {
      console.error('Error loading credits:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCredits = (credits: number): string => {
    return credits.toString();
  };

  const progressPercentage = Math.round(
    (Object.values({
      name: tokenData.name?.length >= 3,
      symbol: tokenData.symbol?.length >= 2,
      description: tokenData.description?.length >= 10,
      supply: tokenData.totalSupply && parseFloat(tokenData.totalSupply) > 0
    }).filter(Boolean).length / 4) * 100
  );

  const safetyFeatures = [
    {
      icon: Shield,
      title: 'Audited Smart Contracts',
      description: 'All tokens use verified, secure smart contracts'
    },
    {
      icon: CheckCircle,
      title: 'No Hidden Fees',
      description: 'Transparent pricing with no surprise costs'
    },
    {
      icon: Sparkles,
      title: 'Instant Deployment',
      description: 'Your token goes live in seconds, not hours'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Create Your Token</h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Turn your idea into a real token in minutes. Simple, secure, and professional.
              </p>
            </div>
            
            {/* Credits Display */}
            {!isLoading && (
              <div className="glass-card p-4 min-w-[200px]">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-primary" />
                  <div>
                    <div className="text-sm text-muted-foreground">Your Credits</div>
                    <div className="text-xl font-bold text-foreground">
                      {userCredits !== null ? formatCredits(userCredits) : 'Loading...'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="glass-card p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Token Setup Progress</h3>
              <span className="text-lg font-bold text-green-400">{progressPercentage}%</span>
            </div>
            
            <div className="w-full bg-muted rounded-full h-2 mb-4">
              <div 
                className="bg-gradient-to-r from-primary to-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className={`flex flex-col items-center gap-2 ${tokenData.name?.length >= 3 ? 'text-green-400' : 'text-muted-foreground'}`}>
                <CheckCircle className="w-5 h-5" />
                <span className="text-xs">Name</span>
              </div>
              <div className={`flex flex-col items-center gap-2 ${tokenData.symbol?.length >= 2 ? 'text-green-400' : 'text-muted-foreground'}`}>
                <CheckCircle className="w-5 h-5" />
                <span className="text-xs">Symbol</span>
              </div>
              <div className={`flex flex-col items-center gap-2 ${tokenData.description?.length >= 10 ? 'text-green-400' : 'text-muted-foreground'}`}>
                <CheckCircle className="w-5 h-5" />
                <span className="text-xs">Description</span>
              </div>
              <div className={`flex flex-col items-center gap-2 ${tokenData.totalSupply && parseFloat(tokenData.totalSupply) > 0 ? 'text-green-400' : 'text-muted-foreground'}`}>
                <CheckCircle className="w-5 h-5" />
                <span className="text-xs">Supply</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Wallet Connection Alert */}
        {!isAuthenticated && isMobileDevice && (
          <div className="mb-8">
            <div className="glass-card p-6 border-blue-500/20 bg-blue-500/5">
              <div className="flex items-start gap-3">
                <CreditCard className="w-6 h-6 text-blue-400 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-blue-400 mb-2">
                    Connect Your Mobile Wallet
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    To create tokens on mobile, you'll need to connect your wallet first. 
                    We support Phantom (Solana) and Pera (Algorand) mobile apps.
                  </p>
                  <button
                    onClick={() => setShowMobileWalletModal(true)}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-all duration-200"
                  >
                    Connect Mobile Wallet
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <TokenFormNew 
              tokenData={tokenData}
              setTokenData={setTokenData}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Safety Features */}
            <div className="snarbles-card p-6">
              <h3 className="snarbles-heading-4 mb-6 flex items-center gap-2">
                <Shield className="w-6 h-6 text-green-400" />
                Why Choose Snarbles?
              </h3>
              
              <div className="space-y-4">
                {safetyFeatures.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div key={index} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
                        <Icon className="w-4 h-4 text-green-400" />
                      </div>
                      <div>
                        <h4 className="snarbles-body font-semibold mb-1">{feature.title}</h4>
                        <p className="snarbles-body-small text-gray-400">{feature.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pricing Info */}
            <div className="snarbles-card p-6">
              <h3 className="snarbles-heading-4 mb-4 flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-blue-400" />
                Pricing
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="snarbles-body text-gray-300">Testnet (Free)</span>
                  <span className="snarbles-status-live">Free</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="snarbles-body text-gray-300">Algorand Mainnet</span>
                  <span className="snarbles-body font-semibold">5 credits</span>
                </div>
                <div className="pt-3 border-t border-gray-700">
                  <p className="snarbles-body-small text-gray-400">
                    Start with testnet to experiment, then deploy to mainnet when ready.
                  </p>
                </div>
              </div>
            </div>

            {/* Need Help */}
            <div className="snarbles-card p-6 bg-blue-500/5 border-blue-500/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="snarbles-heading-5 mb-2 text-blue-400">Need Help?</h4>
                  <p className="snarbles-body-small text-gray-300 mb-3">
                    First time creating a token? Check out our guide or join our community.
                  </p>
                  <div className="flex flex-col gap-2">
                    <Link href="/support" className="snarbles-btn-secondary text-sm py-2 px-4">
                      View Guide
                    </Link>
                    <Link href="/support" className="text-blue-400 hover:text-blue-300 text-sm">
                      Join Discord →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Wallet Modal */}
      <MobileWalletModal
        isOpen={showMobileWalletModal}
        onClose={() => setShowMobileWalletModal(false)}
        onWalletConnect={(walletType, connected) => {
          if (connected) {
            toast({
              title: "Wallet Connected",
              description: `Successfully connected to ${walletType === 'phantom' ? 'Phantom' : 'Pera'} wallet`,
              duration: 3000,
            });
          }
        }}
      />
    </div>
  );
}