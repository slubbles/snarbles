'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Zap, Shield, Sparkles, CheckCircle, TrendingUp } from 'lucide-react';
import Link from 'next/link';

const stats = [
  { value: '3,481', label: 'Tokens Created', icon: Zap },
  { value: '2,274', label: 'Happy Creators', icon: CheckCircle },
  { value: '$0.7M', label: 'Total Value', icon: TrendingUp },
  { value: '26.9%', label: 'Success Rate', icon: Sparkles },
];

const trustBadges = [
  { name: 'Algorand', logo: '/algorand_full_logo_white.png' },
  { name: 'Solana', logo: '/wallet-connect.svg' },
  { name: 'Supabase', logo: '/supabase-logo-wordmark--dark.png' },
];

export default function HeroSection() {
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setAnimationPhase(prev => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900 to-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(239,68,68,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(16,185,129,0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.06),transparent_50%)]" />
      </div>

      {/* Animated Grid */}
      <div className="absolute inset-0 opacity-20">
        <div className="h-full w-full bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="space-y-8 animate-fade-in">
          {/* Status Badge */}
          <div>
            <Badge 
              variant="outline" 
              className="bg-green-500/10 border-green-500/20 text-green-400 px-4 py-2 text-sm font-medium"
            >
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
              Platform Live - Ready for Token Creation
            </Badge>
          </div>

          {/* Main Headline */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight">
              <span className="block text-white">Turn Your Idea</span>
              <span className="block">
                Into a{' '}
                <span className="bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent">
                  Real Token
                </span>
              </span>
              <span className="block text-white">in 30 Seconds</span>
            </h1>
            
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Join thousands of creators who've already launched their tokens with{' '}
              <span className="text-white font-semibold">no coding</span>,{' '}
              <span className="text-white font-semibold">no complexity</span>.
              Professional-grade tokens made simple.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/create">
              <Button 
                size="lg" 
                className="group bg-red-500 hover:bg-red-600 text-white px-8 py-6 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-red-500/25 transition-all duration-300 transform hover:scale-105"
              >
                <Zap className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                Create Your Token
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            
            <Link href="/dashboard">
              <Button 
                variant="outline" 
                size="lg"
                className="border-gray-600 text-gray-300 hover:bg-gray-800/50 hover:text-white px-8 py-6 text-lg rounded-2xl backdrop-blur-sm"
              >
                View Dashboard
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="pt-8">
            <p className="text-sm text-gray-400 mb-4">Trusted by thousands, powered by</p>
            <div className="flex justify-center items-center space-x-8 opacity-60 hover:opacity-80 transition-opacity">
              {trustBadges.map((badge, index) => (
                <div key={index} className="h-8 flex items-center">
                  <span className="text-gray-400 text-sm font-medium">{badge.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-6xl px-4">
        <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="text-center space-y-2"
                >
                  <div className="flex justify-center">
                    <Icon className="w-6 h-6 text-red-400" />
                  </div>
                  <div className="text-2xl lg:text-3xl font-bold text-white">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-400">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Token Preview Animation */}
      <div className="absolute top-1/2 right-8 transform -translate-y-1/2 hidden xl:block">
        <div className="relative animate-bounce">
          <div className="w-48 h-48 bg-gradient-to-br from-red-500/20 to-blue-500/20 rounded-3xl backdrop-blur-xl border border-white/10 p-6 flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">YOU</span>
            </div>
            <div className="text-center space-y-1">
              <div className="text-white font-semibold">Your Token</div>
              <div className="text-gray-400 text-sm">Ready in 30s</div>
            </div>
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
              <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
              <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Security Badge */}
      <div className="absolute top-8 right-8 hidden lg:block">
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl px-4 py-3 backdrop-blur-sm">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-green-400" />
            <span className="text-green-400 font-medium text-sm">Audited & Secure</span>
          </div>
        </div>
      </div>
    </section>
  );
} 