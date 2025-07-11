'use client';

import { Coins, Settings, BarChart3, Shield, Wallet, Users, Headphones, Code } from 'lucide-react';

export default function FeaturesSection() {
  const features = [
    {
      icon: Coins,
      title: 'Instant Token Creation',
      description: 'Deploy tokens in under 30 seconds with our simple interface—no coding required.',
      color: 'text-red-500'
    },
    {
      icon: Settings,
      title: 'Easy Management',
      description: 'Control supply, permissions, and distribution with intuitive tools.',
      color: 'text-blue-500'
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Track holder growth, transactions, and performance metrics.',
      color: 'text-green-500'
    },
    {
      icon: Shield,
      title: 'Secure & Audited',
      description: 'Bank-grade security with automated verification and immutable records.',
      color: 'text-purple-500'
    },
    {
      icon: Wallet,
      title: 'Multi-Chain Support',
      description: 'Deploy on Solana and Algorand with seamless wallet integration.',
      color: 'text-yellow-500'
    },
    {
      icon: Users,
      title: 'Community Tools',
      description: 'Built-in governance, airdrops, and community management features.',
      color: 'text-pink-500'
    },
    {
      icon: Headphones,
      title: '24/7 Support',
      description: 'Expert assistance whenever you need help with your token project.',
      color: 'text-indigo-500'
    },
    {
      icon: Code,
      title: 'Developer API',
      description: 'Integrate token creation into your apps with our powerful API.',
      color: 'text-cyan-500'
    }
  ];

  return (
    <section id="features-section" className="py-20 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Everything You Need to Build & Scale
          </h2>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            From creation to community management, our platform provides all the tools 
            you need for token success.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300"
            >
              <div className="space-y-4">
                <div className={`${feature.color} p-3 rounded-lg bg-gray-50 dark:bg-gray-700 w-fit`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
            Ready to transform your idea into a thriving token ecosystem?
          </p>
          <a 
            href="/create" 
            className="inline-flex items-center px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors duration-200"
          >
            Start Building Now
          </a>
        </div>
      </div>
    </section>
  );
}