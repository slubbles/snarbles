'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Sparkles, Shield, CheckCircle, AlertTriangle, CreditCard } from 'lucide-react';
import Link from 'next/link';
import TokenFormClean from '@/components/TokenFormClean';
import TokenPreviewClean from '@/components/TokenPreviewClean';
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
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-12">
          
          {/* Mobile-Optimized Header */}
          <div className="text-center mb-8 lg:mb-16">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 lg:mb-8 px-3 py-2 rounded-lg border border-border/50 hover:border-border text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground mb-4 lg:mb-6 leading-tight">
              Create Your{' '}
              <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Token
              </span>
            </h1>
            
            <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed px-4">
              Transform your idea into a real token in 30 seconds. 
              Simple, secure, and professional.
            </p>
            
            {/* Responsive Progress Indicator */}
            <div className="mt-6 lg:mt-8 max-w-sm lg:max-w-md mx-auto">
              <div className="flex items-center justify-between mb-2 lg:mb-3">
                <span className="text-xs lg:text-sm text-muted-foreground">Setup Progress</span>
                <span className="text-xs lg:text-sm font-semibold text-primary">{progressPercentage}%</span>
              </div>
              <div className="w-full bg-muted/30 rounded-full h-1.5 lg:h-2">
                <div 
                  className="bg-gradient-to-r from-primary to-primary/80 h-1.5 lg:h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Mobile-Optimized Wallet Connection */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 lg:gap-4 mb-8 lg:mb-12">
            <MultiWalletConnectionManager 
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground px-6 lg:px-8 py-2.5 lg:py-3 rounded-lg font-semibold transition-colors text-sm lg:text-base"
              preferredNetwork={tokenData.network.startsWith('solana') ? 'solana' : 'algorand'}
              onConnectionChange={(connected, walletType, address) => {
                if (connected && walletType) {
                  if (walletType === 'solana' && !tokenData.network.startsWith('solana')) {
                    setTokenData(prev => ({ ...prev, network: 'solana-devnet' }));
                  } else if (walletType === 'algorand' && tokenData.network.startsWith('solana')) {
                    setTokenData(prev => ({ ...prev, network: 'algorand-testnet' }));
                  }
                }
              }}
            />
            
            {/* Responsive Credits Display */}
            {!isLoading && userCredits !== null && (
              <div className="flex items-center gap-2 px-3 lg:px-4 py-2 bg-muted/30 rounded-lg border border-border text-sm">
                <CreditCard className="w-3 h-3 lg:w-4 lg:h-4 text-muted-foreground" />
                <span className="text-foreground font-medium">
                  {formatCredits(userCredits)} credits
                </span>
              </div>
            )}
          </div>

          {/* Mobile-First Optimized Layout */}
          <div className="max-w-7xl mx-auto">
            {/* Mobile: Stack vertically, Desktop: Side by side */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
              
              {/* Main Form - Takes priority on mobile */}
              <div className="xl:col-span-3 order-1">
                <TokenFormClean 
                  tokenData={tokenData}
                  setTokenData={setTokenData}
                />
              </div>

              {/* Sidebar - Responsive stacking */}
              <div className="xl:col-span-1 order-2 space-y-6">
                
                {/* Mobile-optimized Preview */}
                <div className="lg:sticky lg:top-8">
                  <TokenPreviewClean tokenData={tokenData} />
                </div>
                
                {/* Collapsible Trust Indicators on Mobile */}
                <div className="bg-card border border-border rounded-lg p-4 lg:p-6">
                  <h3 className="text-base lg:text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
                    Why Snarbles?
                  </h3>
                  
                  <div className="space-y-3">
                    {safetyFeatures.map((feature, index) => {
                      const Icon = feature.icon;
                      return (
                        <div key={index} className="flex items-start gap-3 p-2 lg:p-3 rounded-lg hover:bg-muted/50 transition-colors">
                          <Icon className="w-4 h-4 lg:w-5 lg:h-5 text-primary flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-foreground text-xs lg:text-sm">{feature.title}</h4>
                            <p className="text-xs text-muted-foreground hidden sm:block lg:text-xs">{feature.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Simple Pricing */}
                <div className="bg-card border border-border rounded-lg p-4 lg:p-6">
                  <h3 className="text-base lg:text-lg font-semibold text-foreground mb-4">
                    Pricing
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-muted-foreground">Testnet</span>
                      <span className="text-sm font-semibold text-green-500">Free</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-t border-border/50 pt-2">
                      <span className="text-sm text-muted-foreground">Mainnet</span>
                      <span className="text-sm font-semibold text-primary">5 credits</span>
                    </div>
                  </div>
                  
                  {/* Mobile Help Link */}
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <Link 
                      href="/credits" 
                      className="text-xs text-primary hover:text-primary/80 transition-colors"
                    >
                      Need more credits? →
                    </Link>
                  </div>
                </div>
                
                {/* Mobile-only Quick Actions */}
                <div className="xl:hidden bg-muted/30 rounded-lg p-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-3">
                      Ready to deploy your token?
                    </p>
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span>Form validation complete</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile-specific Help Section */}
          {isMobileDevice && (
            <div className="mt-12 bg-card/50 border border-border/50 rounded-lg p-6 max-w-3xl mx-auto">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Creating on Mobile
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Make sure your wallet app is installed for seamless token creation
                </p>
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => setShowMobileWalletModal(true)}
                    className="bg-primary/10 text-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors"
                  >
                    Wallet Help
                  </button>
                  <Link 
                    href="/support" 
                    className="bg-muted/50 text-muted-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
                  >
                    Support
                  </Link>
                </div>
              </div>
            </div>
          )}
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