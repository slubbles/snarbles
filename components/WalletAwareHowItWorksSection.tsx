'use client';

import { Wallet, Settings, BarChart3, Rocket, CreditCard, DollarSign } from 'lucide-react';
import { useWalletAuth } from '@/components/providers/WalletAuthProvider';

export default function WalletAwareHowItWorksSection() {
  const { walletType, isAuthenticated } = useWalletAuth();
  
  const getWalletSpecificSteps = () => {
    if (walletType === 'algorand') {
      return [
        {
          number: '01',
          icon: Wallet,
          title: 'Connect Pera Wallet',
          description: 'Connect your Pera wallet to access the Algorand ecosystem.',
          detail: 'Compatible with Pera mobile and web wallet'
        },
        {
          number: '02',
          icon: CreditCard,
          title: 'Top up with ALGO or USDt',
          description: 'Choose direct ALGO payment or purchase credits with USDt.',
          detail: 'USDt (Asset ID: 312769) natively supported'
        },
        {
          number: '03',
          icon: Settings,
          title: 'Create Algorand Token',
          description: 'Design your ASA token with custom properties and metadata.',
          detail: 'Mainnet: 5 credits | Testnet: Free'
        },
        {
          number: '04',
          icon: Rocket,
          title: 'Deploy to Algorand',
          description: 'Instant deployment to Algorand mainnet or testnet.',
          detail: 'Pure Proof-of-Stake, carbon negative'
        },
      ];
    } else if (walletType === 'solana') {
      return [
        {
          number: '01',
          icon: Wallet,
          title: 'Connect Phantom Wallet',
          description: 'Connect your Phantom wallet to access the Solana ecosystem.',
          detail: 'Compatible with Phantom mobile and browser extension'
        },
        {
          number: '02',
          icon: DollarSign,
          title: 'Top up with SOL or USDT',
          description: 'Choose direct SOL payment or purchase credits with SPL-USDT.',
          detail: 'SPL-USDT natively supported for flexible amounts'
        },
        {
          number: '03',
          icon: Settings,
          title: 'Create SPL Token',
          description: 'Design your SPL token with advanced features and metadata.',
          detail: 'Mainnet: 5 credits | Devnet: Free'
        },
        {
          number: '04',
          icon: Rocket,
          title: 'Deploy to Solana',
          description: 'Lightning-fast deployment to Solana mainnet or devnet.',
          detail: 'High throughput, low fees'
        },
      ];
    }
    
    // Default generic steps for non-authenticated users
    return [
      {
        number: '01',
        icon: Wallet,
        title: 'Connect Your Wallet',
        description: 'Connect your Pera (Algorand) or Phantom (Solana) wallet.',
        detail: 'Choose your preferred blockchain ecosystem'
      },
      {
        number: '02',
        icon: CreditCard,
        title: 'Choose Payment Method',
        description: 'Pay with native currency or stablecoins for flexibility.',
        detail: 'ALGO/USDt on Algorand, SOL/USDT on Solana'
      },
      {
        number: '03',
        icon: Settings,
        title: 'Design Your Token',
        description: 'Create tokens with custom properties across both networks.',
        detail: 'ASA tokens on Algorand, SPL tokens on Solana'
      },
      {
        number: '04',
        icon: Rocket,
        title: 'Deploy Instantly',
        description: 'One-click deployment to your chosen blockchain network.',
        detail: 'Fast, secure, and cost-effective'
      },
    ];
  };

  const steps = getWalletSpecificSteps();
  
  const getWalletInfo = () => {
    if (walletType === 'algorand') {
      return {
        name: 'Algorand Ecosystem',
        icon: '🔺',
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30'
      };
    } else if (walletType === 'solana') {
      return {
        name: 'Solana Ecosystem',
        icon: '👻',
        color: 'text-purple-500',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/30'
      };
    }
    return {
      name: 'Multi-Chain Platform',
      icon: '🚀',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/30'
    };
  };

  const walletInfo = getWalletInfo();

  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          {isAuthenticated && walletType && (
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className={`text-2xl ${walletInfo.color}`}>{walletInfo.icon}</div>
              <span className={`text-lg font-semibold ${walletInfo.color}`}>
                {walletInfo.name}
              </span>
            </div>
          )}
          <h2 className="text-4xl font-bold text-foreground mb-4 tracking-tight">
            {isAuthenticated ? 'Your Token Creation Journey' : 'How It Works'}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {isAuthenticated 
              ? `Create tokens in the ${walletInfo.name.split(' ')[0]} ecosystem with these simple steps`
              : 'From wallet connection to deployed token in four guided steps'
            }
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="relative mb-6">
                <div className={`p-6 inline-block rounded-lg border ${walletInfo.bgColor} ${walletInfo.borderColor} transition-all duration-300 hover:scale-105`}>
                  <div className={`text-3xl font-bold mb-4 ${walletInfo.color}`}>
                    {step.number}
                  </div>
                  <step.icon className={`w-8 h-8 mx-auto ${walletInfo.color}`} />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                {step.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-2">
                {step.description}
              </p>
              <p className={`text-xs ${walletInfo.color} font-medium`}>
                {step.detail}
              </p>
            </div>
          ))}
        </div>

        {!isAuthenticated && (
          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-6">
              Ready to create your first token?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className={`p-4 rounded-lg border ${walletInfo.bgColor} ${walletInfo.borderColor} flex items-center gap-3`}>
                <span className="text-2xl">🔺</span>
                <div className="text-left">
                  <div className="font-semibold text-foreground">Algorand Network</div>
                  <div className="text-sm text-muted-foreground">Connect Pera Wallet</div>
                </div>
              </div>
              <div className={`p-4 rounded-lg border ${walletInfo.bgColor} ${walletInfo.borderColor} flex items-center gap-3`}>
                <span className="text-2xl">👻</span>
                <div className="text-left">
                  <div className="font-semibold text-foreground">Solana Network</div>
                  <div className="text-sm text-muted-foreground">Connect Phantom Wallet</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
