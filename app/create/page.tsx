'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, Shield, CheckCircle, AlertTriangle, CreditCard } from 'lucide-react';
import Link from 'next/link';
import TokenFormNew from '@/components/TokenFormNew';
import TokenPreviewLive from '@/components/TokenPreviewLive';
import WalletConnectionManager from '@/components/WalletConnectionManager';
import { getCreditsBalance } from '@/lib/credit-system';
import { useWalletAuth } from '@/components/providers/WalletAuthProvider';
import { useToast } from '@/hooks/use-toast';
import { isMobile } from '@/lib/mobile-wallet-utils';
import MobileWalletModal from '@/components/MobileWalletModal';
import PeraWalletAppHandler from '@/components/PeraWalletAppHandler';

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
    <PeraWalletAppHandler>
      <div className="min-h-screen snarbles-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 snarbles-body-muted hover:text-white transition-colors mb-6 snarbles-glass-subtle px-4 py-2 rounded-xl border-0"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
            <div>
              <h1 className="snarbles-heading text-4xl font-bold mb-2 snarbles-gradient-text-multi">Create Your Token</h1>
              <p className="snarbles-body text-xl max-w-2xl">
                Turn your idea into a real token in minutes. Simple, secure, and professional.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              {/* Wallet Connection Manager */}
              <div className="flex-1 sm:flex-initial">
                <WalletConnectionManager className="w-full sm:w-auto" />
              </div>
              
              {/* Credits Display */}
              {!isLoading && (
                <div className="snarbles-card p-4 min-w-[200px] snarbles-border-glow">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl snarbles-gradient-green flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="snarbles-body-small text-gray-400">Your Credits</div>
                      <div className="snarbles-heading text-xl font-bold">
                        {userCredits !== null ? formatCredits(userCredits) : 'Loading...'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="snarbles-card-premium p-6 mb-8 snarbles-glow-green">
            <div className="flex items-center justify-between mb-4">
              <h3 className="snarbles-heading text-lg font-semibold">Token Setup Progress</h3>
              <span className="snarbles-heading text-lg font-bold text-green-400">{progressPercentage}%</span>
            </div>
            
            <div className="w-full snarbles-glass-subtle rounded-full h-3 mb-4 overflow-hidden">
              <div 
                className="snarbles-gradient-green h-3 rounded-full transition-all duration-500 shadow-lg shadow-green-500/50"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300 ${tokenData.name?.length >= 3 ? 'snarbles-gradient-green text-white' : 'snarbles-glass-subtle text-gray-400'}`}>
                <CheckCircle className="w-5 h-5" />
                <span className="text-xs font-medium">Name</span>
              </div>
              <div className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300 ${tokenData.symbol?.length >= 2 ? 'snarbles-gradient-blue text-white' : 'snarbles-glass-subtle text-gray-400'}`}>
                <CheckCircle className="w-5 h-5" />
                <span className="text-xs font-medium">Symbol</span>
              </div>
              <div className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300 ${tokenData.description?.length >= 10 ? 'snarbles-gradient-purple text-white' : 'snarbles-glass-subtle text-gray-400'}`}>
                <CheckCircle className="w-5 h-5" />
                <span className="text-xs font-medium">Description</span>
              </div>
              <div className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300 ${tokenData.totalSupply && parseFloat(tokenData.totalSupply) > 0 ? 'snarbles-gradient-orange text-white' : 'snarbles-glass-subtle text-gray-400'}`}>
                <CheckCircle className="w-5 h-5" />
                <span className="text-xs font-medium">Supply</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Wallet Connection Alert */}
        {!isAuthenticated && isMobileDevice && (
          <div className="mb-8">
            <div className="snarbles-card p-6 snarbles-glow-blue">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl snarbles-gradient-blue flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="snarbles-heading text-lg font-semibold text-blue-400 mb-2">
                    Connect Your Mobile Wallet
                  </h3>
                  <p className="snarbles-body text-gray-300 mb-4">
                    To create tokens on mobile, you'll need to connect your wallet first. 
                    We support Phantom (Solana) and Pera (Algorand) mobile apps.
                  </p>
                  <button
                    onClick={() => setShowMobileWalletModal(true)}
                    className="snarbles-btn-primary"
                  >
                    Connect Mobile Wallet
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form - Order last on mobile, first on desktop */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <TokenFormNew 
              tokenData={tokenData}
              setTokenData={setTokenData}
            />
          </div>

          {/* Sidebar - Order first on mobile, last on desktop */}
          <div className="space-y-6 order-1 lg:order-2">
            {/* Live Preview */}
            <TokenPreviewLive tokenData={tokenData} />
            
            {/* Safety Features */}
            <div className="snarbles-card-premium p-6 snarbles-glow-green">
              <h3 className="snarbles-heading text-lg font-bold mb-6 flex items-center gap-2">
                <Shield className="w-6 h-6 text-green-400" />
                Why Choose Snarbles?
              </h3>
              
              <div className="space-y-4">
                {safetyFeatures.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-xl snarbles-glass-subtle hover:border-green-500/30 transition-all duration-300">
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl snarbles-gradient-green flex items-center justify-center">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="snarbles-heading font-semibold mb-1 text-green-400">{feature.title}</h4>
                        <p className="snarbles-body-small text-gray-300">{feature.description}</p>
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
                <div className="pt-3 border-t border-gray-600/50">
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
    </PeraWalletAppHandler>
  );
}