'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Sparkles, Shield, CheckCircle, AlertTriangle, CreditCard } from 'lucide-react';
import Link from 'next/link';
import TokenFormNew from '@/components/TokenFormNew';
import TokenPreviewLive from '@/components/TokenPreviewLive';
import MultiWalletConnectionManager from '@/components/MultiWalletConnectionManager';
import { getCreditsBalance } from '@/lib/credit-system';
import { useWalletAuth } from '@/components/providers/WalletAuthProvider';
import { useToast } from '@/hooks/use-toast';
import { isMobile } from '@/lib/mobile-wallet-utils';
import MobileWalletModal from '@/components/MobileWalletModal';
import SolanaMobileWalletManager from '@/components/SolanaMobileWalletManager';
import PeraWalletAppHandler from '@/components/PeraWalletAppHandler';

export default function CreateTokenPage() {
  const searchParams = useSearchParams();
  const networkParam = searchParams.get('network');
  
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
    network: networkParam || 'algorand-testnet' // Use URL parameter if available
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
        {/* Header - Improved for user-friendliness */}
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
              {/* Multi-Wallet Connection Manager - Primary CTA */}
              <div className="flex-1 sm:flex-initial">
                <MultiWalletConnectionManager 
                  className="w-full sm:w-auto snarbles-btn-primary"
                  preferredNetwork={tokenData.network.startsWith('solana') ? 'solana' : 'algorand'}
                  onConnectionChange={(connected, walletType, address) => {
                    if (connected && walletType) {
                      // Auto-switch network based on connected wallet
                      if (walletType === 'solana' && !tokenData.network.startsWith('solana')) {
                        setTokenData(prev => ({ ...prev, network: 'solana-devnet' }));
                      } else if (walletType === 'algorand' && tokenData.network.startsWith('solana')) {
                        setTokenData(prev => ({ ...prev, network: 'algorand-testnet' }));
                      }
                    }
                  }}
                />
              </div>
              
              {/* Credits Display - Enhanced visibility */}
              {!isLoading && (
                <div className="snarbles-card-premium p-4 min-w-[200px] snarbles-glow-green">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl snarbles-gradient-green flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="snarbles-body-small text-green-400">Your Credits</div>
                      <div className="snarbles-heading text-xl font-bold text-white">
                        {userCredits !== null ? formatCredits(userCredits) : 'Loading...'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Progress Bar - More prominent and informative */}
          <div className="snarbles-card-premium p-6 mb-8 snarbles-glow-green border-green-500/30">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="snarbles-heading text-xl font-bold text-green-400 mb-2">Token Setup Progress</h3>
                <p className="snarbles-body-small text-gray-300">Complete all fields to create your token</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="snarbles-heading text-2xl font-bold text-green-400">{progressPercentage}%</div>
                  <div className="snarbles-body-small text-gray-400">Complete</div>
                </div>
                <div className="w-16 h-16 relative">
                  <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-gray-700"
                      d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      className="text-green-400"
                      d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray={`${progressPercentage}, 100`}
                    />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="w-full snarbles-glass-subtle rounded-full h-3 mb-6 overflow-hidden">
              <div 
                className="snarbles-gradient-green h-3 rounded-full transition-all duration-500 shadow-lg shadow-green-500/50"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-300 ${tokenData.name?.length >= 3 ? 'snarbles-gradient-green text-white shadow-lg' : 'snarbles-glass-subtle text-gray-400 border border-gray-600/50'}`}>
                <CheckCircle className="w-6 h-6" />
                <span className="text-sm font-semibold">Name</span>
                <span className="text-xs opacity-75">{tokenData.name?.length >= 3 ? 'Complete' : 'Required'}</span>
              </div>
              <div className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-300 ${tokenData.symbol?.length >= 2 ? 'snarbles-gradient-blue text-white shadow-lg' : 'snarbles-glass-subtle text-gray-400 border border-gray-600/50'}`}>
                <CheckCircle className="w-6 h-6" />
                <span className="text-sm font-semibold">Symbol</span>
                <span className="text-xs opacity-75">{tokenData.symbol?.length >= 2 ? 'Complete' : 'Required'}</span>
              </div>
              <div className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-300 ${tokenData.description?.length >= 10 ? 'snarbles-gradient-purple text-white shadow-lg' : 'snarbles-glass-subtle text-gray-400 border border-gray-600/50'}`}>
                <CheckCircle className="w-6 h-6" />
                <span className="text-sm font-semibold">Description</span>
                <span className="text-xs opacity-75">{tokenData.description?.length >= 10 ? 'Complete' : 'Min 10 chars'}</span>
              </div>
              <div className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-300 ${tokenData.totalSupply && parseFloat(tokenData.totalSupply) > 0 ? 'snarbles-gradient-orange text-white shadow-lg' : 'snarbles-glass-subtle text-gray-400 border border-gray-600/50'}`}>
                <CheckCircle className="w-6 h-6" />
                <span className="text-sm font-semibold">Supply</span>
                <span className="text-xs opacity-75">{tokenData.totalSupply && parseFloat(tokenData.totalSupply) > 0 ? 'Complete' : 'Required'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Wallet Connection Alert - Enhanced with better design */}
        {!isAuthenticated && isMobileDevice && (
          <div className="mb-8">
            <div className="snarbles-card-premium p-6 snarbles-glow-blue border-blue-500/30">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl snarbles-gradient-blue flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="snarbles-heading text-xl font-bold text-blue-400 mb-2">
                    Connect Your Mobile Wallet
                  </h3>
                  <p className="snarbles-body text-gray-300 mb-4">
                    To create tokens on mobile, connect your wallet first. We support Phantom (Solana) and Pera (Algorand) mobile apps.
                  </p>
                  <button
                    onClick={() => setShowMobileWalletModal(true)}
                    className="snarbles-btn-primary text-white px-6 py-3 rounded-xl font-semibold"
                  >
                    Connect Mobile Wallet
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Solana Mobile Wallet Manager - Show for Solana networks */}
        {isMobileDevice && tokenData.network.startsWith('solana') && (
          <div className="mb-8">
            <SolanaMobileWalletManager 
              onConnectionChange={(connected) => {
                if (connected) {
                  toast({
                    title: "Solana Wallet Connected",
                    description: "Ready to create tokens on Solana!",
                    duration: 3000,
                  });
                }
              }}
              showInstructions={!isAuthenticated}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar - Order first on mobile for better UX, last on desktop */}
          <div className="space-y-6 order-1 lg:order-2">
            {/* Live Preview - Most important for user feedback */}
            <TokenPreviewLive tokenData={tokenData} />
            
            {/* Safety Features - Build trust */}
            <div className="snarbles-card-premium p-6 snarbles-glow-green border-green-500/30">
              <h3 className="snarbles-heading text-xl font-bold mb-6 flex items-center gap-2">
                <Shield className="w-6 h-6 text-green-400" />
                Why Choose Snarbles?
              </h3>
              
              <div className="space-y-4">
                {safetyFeatures.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div key={index} className="flex items-start gap-3 p-4 rounded-xl snarbles-glass-subtle hover:border-green-500/30 transition-all duration-300 border border-transparent">
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

            {/* Pricing Info - Transparent pricing */}
            <div className="snarbles-card p-6 border-orange-500/30">
              <h3 className="snarbles-heading-4 mb-4 flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-orange-400" />
                Transparent Pricing
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 rounded-xl snarbles-glass-subtle">
                  <span className="snarbles-body text-gray-300">Testnet (Free)</span>
                  <span className="snarbles-status-live font-bold text-green-400">FREE</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl snarbles-glass-subtle">
                  <span className="snarbles-body text-gray-300">Algorand Mainnet</span>
                  <span className="snarbles-body font-semibold text-orange-400">5 credits</span>
                </div>
                <div className="pt-3 border-t border-gray-600/50">
                  <p className="snarbles-body-small text-gray-400">
                    Start with testnet to experiment, then deploy to mainnet when ready.
                  </p>
                </div>
              </div>
            </div>

            {/* Need Help - Support section */}
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

          {/* Main Form - Order last on mobile, first on desktop */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <TokenFormNew 
              tokenData={tokenData}
              setTokenData={setTokenData}
            />
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