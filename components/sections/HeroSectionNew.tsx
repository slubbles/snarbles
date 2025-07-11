'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Shield, Zap, CheckCircle } from 'lucide-react';

export default function HeroSectionNew() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const stats = [
    { number: '3,481', label: 'Tokens Created' },
    { number: '2,274', label: 'Active Creators' },
    { number: '$0.7M', label: 'Total Value' },
    { number: '26.9%', label: 'Success Rate' }
  ];

  const trustIndicators = [
    'No coding required',
    'Deploy in 30 seconds',
    'Multi-chain support',
    'Secure & audited'
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />
      
      {/* Animated Background Circles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <div className="snarbles-container relative z-10">
        <div className="text-center space-y-8">
          {/* Main Headline */}
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h1 className="snarbles-heading-1 max-w-4xl mx-auto leading-tight">
              Turn Your Idea Into a{' '}
              <span className="snarbles-gradient-text">Real Token</span>
              <br />
              in 30 Seconds
            </h1>
          </div>

          {/* Subtitle */}
          <div className={`transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <p className="snarbles-body-large max-w-2xl mx-auto">
              Join thousands of creators who've already launched
              successful tokens. No coding, no complexity, just pure innovation.
            </p>
          </div>

          {/* Trust Indicators */}
          <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="flex flex-wrap justify-center gap-6 mb-8">
              {trustIndicators.map((indicator, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="snarbles-body-small text-gray-300">{indicator}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Buttons */}
          <div className={`transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link href="/create" className="snarbles-btn-primary group">
                <Sparkles className="w-5 h-5" />
                Create Your Token
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              
              <Link href="/dashboard" className="snarbles-btn-secondary group">
                <Shield className="w-5 h-5" />
                View Dashboard
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className={`transition-all duration-1000 delay-600 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="snarbles-heading-3 snarbles-gradient-text mb-1">
                    {stat.number}
                  </div>
                  <div className="snarbles-body-small text-gray-400">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Token Preview Card */}
          <div className={`transition-all duration-1000 delay-800 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="max-w-md mx-auto mt-16">
              <div className="snarbles-card p-6 text-left">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">YOU</span>
                  </div>
                  <div>
                    <h3 className="snarbles-heading-5 mb-1">Your Token</h3>
                    <p className="snarbles-body-small text-gray-400">$YOUR</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="snarbles-body-small text-gray-400">Supply</span>
                    <span className="snarbles-body-small">1,000,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="snarbles-body-small text-gray-400">Network</span>
                    <span className="snarbles-status-live">
                      <div className="w-2 h-2 bg-white rounded-full" />
                      Live
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="snarbles-body-small text-gray-400">Value</span>
                    <span className="snarbles-body-small text-green-400">$12,400</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-700">
                  <button className="w-full snarbles-btn-secondary text-sm py-2">
                    <Zap className="w-4 h-4" />
                    Deploy Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="w-6 h-10 border border-white/20 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </section>
  );
} 