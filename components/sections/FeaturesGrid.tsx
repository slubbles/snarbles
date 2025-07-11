'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Shield, 
  Code, 
  Globe,
  Clock,
  CreditCard,
  Users,
  TrendingUp,
  Sparkles,
  CheckCircle,
  ArrowRight,
  Star
} from 'lucide-react';

const features = [
  {
    id: 'no-code',
    title: 'No-Code Creation',
    description: 'Create professional tokens without writing a single line of code. Our intuitive interface handles all the complexity.',
    icon: Zap,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    badge: 'Most Popular',
    badgeColor: 'bg-red-500/20 text-red-400'
  },
  {
    id: 'multi-chain',
    title: 'Multi-Chain Support',
    description: 'Deploy on Algorand mainnet and Solana devnet/testnet. More networks coming soon.',
    icon: Globe,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20'
  },
  {
    id: 'instant',
    title: '30-Second Deployment',
    description: 'From idea to live token in under 30 seconds. The fastest token creation platform available.',
    icon: Clock,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20'
  },
  {
    id: 'secure',
    title: 'Bank-Grade Security',
    description: 'Audited smart contracts, secure wallet integration, and enterprise-level infrastructure.',
    icon: Shield,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    badge: 'Audited',
    badgeColor: 'bg-purple-500/20 text-purple-400'
  },
  {
    id: 'credit-system',
    title: 'Flexible Pricing',
    description: 'Pay-as-you-go credit system. Top up with USDT and only pay for what you create.',
    icon: CreditCard,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/20'
  },
  {
    id: 'dashboard',
    title: 'Powerful Dashboard',
    description: 'Track all your tokens, monitor performance, and manage your portfolio from one place.',
    icon: TrendingUp,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/20'
  }
];

const stats = [
  { label: '99.7% Uptime', value: 'Reliable' },
  { label: '< 30s Creation', value: 'Fast' },
  { label: '24/7 Support', value: 'Supported' },
  { label: 'Zero Coding', value: 'Simple' }
];

export default function FeaturesGrid() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-gray-900/50" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 bg-red-500/10 border-red-500/20 text-red-400">
            <Sparkles className="w-4 h-4 mr-1" />
            Platform Features
          </Badge>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Everything You Need to{' '}
            <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
              Create Tokens
            </span>
          </h2>
          
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Professional-grade token creation made simple. No technical knowledge required, 
            just bring your vision and we'll handle the rest.
          </p>
          
          {/* Quick Stats */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
            {stats.map((stat, index) => (
              <div key={index} className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={feature.id}
                className={`
                  group p-8 bg-black/40 backdrop-blur-xl border ${feature.borderColor}
                  hover:bg-black/60 transition-all duration-500 cursor-pointer
                  hover:scale-105 hover:shadow-2xl relative overflow-hidden
                `}
                style={{
                  animationDelay: `${index * 100}ms`
                }}
              >
                {/* Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -skew-x-12 -translate-x-full group-hover:translate-x-full" />
                
                {/* Badge */}
                {feature.badge && (
                  <div className="absolute top-4 right-4">
                    <Badge className={`text-xs ${feature.badgeColor} border-0`}>
                      {feature.badge}
                    </Badge>
                  </div>
                )}
                
                {/* Icon */}
                <div className={`
                  p-4 rounded-2xl ${feature.bgColor} w-fit mb-6
                  group-hover:scale-110 transition-transform duration-300
                `}>
                  <Icon className={`w-8 h-8 ${feature.color}`} />
                </div>
                
                {/* Content */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-white group-hover:text-white transition-colors">
                    {feature.title}
                  </h3>
                  
                  <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                    {feature.description}
                  </p>
                  
                  {/* Learn More Link */}
                  <div className="flex items-center text-sm text-gray-500 group-hover:text-red-400 transition-colors">
                    <span>Learn more</span>
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="text-center bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl p-12">
          <div className="max-w-3xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-red-500/10 rounded-2xl">
                <Star className="w-8 h-8 text-red-400" />
              </div>
            </div>
            
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Ready to Create Your First Token?
            </h3>
            
            <p className="text-lg text-gray-300 mb-8">
              Join thousands of creators who've already launched their tokens. 
              No setup fees, no hidden costs, no technical complexity.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="group bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-red-500/25">
                <Zap className="w-5 h-5 mr-2 inline group-hover:animate-pulse" />
                Start Creating Now
                <ArrowRight className="w-5 h-5 ml-2 inline group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button className="border border-gray-600 text-gray-300 hover:bg-gray-800/50 hover:text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 backdrop-blur-sm">
                View Examples
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 