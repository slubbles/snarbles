import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Star, Zap, Shield, Users, Crown } from 'lucide-react';

interface PricingTier {
  id: string;
  name: string;
  price: number;
  priceDisplay: string;
  description: string;
  features: string[];
  recommended?: boolean;
  popular?: boolean;
  icon: React.ComponentType<any>;
  color: string;
}

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTier: (tier: PricingTier) => void;
  selectedNetwork: string;
}

export function PricingModal({ isOpen, onClose, onSelectTier, selectedNetwork }: PricingModalProps) {
  const [selectedTier, setSelectedTier] = useState<PricingTier | null>(null);

  const tiers: PricingTier[] = [
    {
      id: 'basic',
      name: 'Basic',
      price: 0.01, // ~$3-5 in crypto
      priceDisplay: '$3-5',
      description: 'Perfect for testing and simple tokens',
      icon: Zap,
      color: 'from-blue-500 to-blue-600',
      features: [
        'Token creation',
        'Basic dashboard',
        'Community support',
        'Standard features (mint/burn/pause)',
        'Explorer integration'
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 0.03, // ~$10-15 in crypto
      priceDisplay: '$10-15',
      description: 'Advanced features for serious projects',
      icon: Star,
      color: 'from-purple-500 to-purple-600',
      popular: true,
      features: [
        'Everything in Basic',
        'Advanced analytics',
        'Custom metadata',
        'Priority support',
        'Tokenomics tools',
        'Bulk operations',
        'API access'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 0.1, // ~$50+ in crypto
      priceDisplay: '$50+',
      description: 'Full-featured solution for businesses',
      icon: Crown,
      color: 'from-red-500 to-red-600',
      recommended: true,
      features: [
        'Everything in Pro',
        'White-label solution',
        'Custom branding',
        'Dedicated support',
        'Multi-sig integration',
        'Governance features',
        'Custom contracts',
        'Team management'
      ]
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Choose Your Plan</h2>
              <p className="text-muted-foreground mt-1">
                Select the plan that best fits your needs on {selectedNetwork}
              </p>
            </div>
            <Button variant="ghost" onClick={onClose}>✕</Button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tiers.map((tier) => {
              const Icon = tier.icon;
              const isSelected = selectedTier?.id === tier.id;
              
              return (
                <Card 
                  key={tier.id} 
                  className={`relative cursor-pointer transition-all duration-300 ${
                    isSelected 
                      ? 'ring-2 ring-red-500 scale-105' 
                      : 'hover:scale-105 hover:shadow-lg'
                  } ${tier.popular ? 'border-purple-500/50' : ''} ${tier.recommended ? 'border-red-500/50' : ''}`}
                  onClick={() => setSelectedTier(tier)}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-purple-500 text-white">Most Popular</Badge>
                    </div>
                  )}
                  {tier.recommended && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-red-500 text-white">Recommended</Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-4">
                    <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${tier.color} flex items-center justify-center mb-4 shadow-lg`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-xl">{tier.name}</CardTitle>
                    <div className="space-y-1">
                      <div className="text-3xl font-bold text-foreground">
                        {tier.priceDisplay}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        + network fees
                      </div>
                    </div>
                    <CardDescription className="mt-2">
                      {tier.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <ul className="space-y-3">
                      {tier.features.map((feature, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-8 flex justify-center space-x-4">
            <Button variant="outline" onClick={onClose} className="px-8">
              Cancel
            </Button>
            <Button 
              onClick={() => selectedTier && onSelectTier(selectedTier)}
              disabled={!selectedTier}
              className="px-8 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
            >
              Continue with {selectedTier?.name || 'Selected Plan'}
            </Button>
          </div>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>💡 All plans include our core token creation features</p>
            <p>🔒 Secure, audited smart contracts with zero security incidents</p>
            <p>⚡ Deploy in under 60 seconds</p>
          </div>
        </div>
      </div>
    </div>
  );
}
