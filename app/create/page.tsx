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
import { SmartWalletModal } from '@/components/SmartWalletModal';
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
        
        {/* Smart Wallet Modal */}
        <SmartWalletModal
          isOpen={showMobileWalletModal}
          onClose={() => setShowMobileWalletModal(false)}
        />
      </div>
    </PeraWalletAppHandler>
  );
}