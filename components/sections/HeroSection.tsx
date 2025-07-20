'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Play, CheckCircle, TrendingUp, Zap, Sparkles } from 'lucide-react';
import Link from 'next/link';

const stats = [
  { value: '8,392', label: 'innovators trust Snarbles', icon: Zap },
  { value: 'Total Value: $2.4M', label: 'Active Users: 8,392', icon: TrendingUp },
  { value: 'Tokens Created: 12,847', label: 'Wallet Ready', icon: CheckCircle },
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
    <section className="hero-section min-h-screen flex items-center relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-red-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-600/5 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left side - Main content */}
          <div className="text-center lg:text-left">
            {/* Launch badge - exact match */}
            <div className="inline-flex items-center px-4 py-2 mb-8 rounded-full text-sm font-medium"
                 style={{ 
                   backgroundColor: 'rgba(239, 68, 68, 0.1)',
                   border: '1px solid rgba(239, 68, 68, 0.3)',
                   color: 'rgb(239, 68, 68)'
                 }}>
              <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
              LAUNCH YOUR VISION
            </div>
            
            {/* Main heading - exact match */}
            <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight"
                style={{ color: 'rgb(254, 254, 235)' }}>
              Turn Your Idea<br />
              Into a <span style={{ color: 'rgb(239, 68, 68)' }}>Real Token</span><br />
              in 30 Seconds
            </h1>
            
            {/* Description - exact match */}
            <p className="text-xl mb-8 max-w-lg mx-auto lg:mx-0"
               style={{ color: 'rgb(166, 166, 166)' }}>
              Join thousands of creators who've already launched successful tokens.{' '}
              <span style={{ color: 'rgb(254, 254, 235)', fontWeight: 600 }}>
                No coding, no complexity
              </span>
              —just your vision brought to life.
            </p>
            
            {/* Creator avatars - exact match */}
            <div className="flex items-center justify-center lg:justify-start mb-8">
              <div className="flex -space-x-3">
                {['K', 'A', 'T', 'M', 'S'].map((letter, i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-white text-sm font-bold"
                       style={{ backgroundColor: 'rgb(239, 68, 68)' }}>
                    {letter}
                  </div>
                ))}
              </div>
              <div className="ml-4 text-left">
                <div className="font-semibold" style={{ color: 'rgb(254, 254, 235)' }}>
                  8,392
                </div>
                <div className="text-sm" style={{ color: 'rgb(166, 166, 166)' }}>
                  innovators trust Snarbles
                </div>
              </div>
            </div>
            
            {/* CTA buttons - exact match */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
              <Link href="/create">
                <Button 
                  size="lg" 
                  className="button-enhanced hover:shadow-xl transition-all duration-300 relative z-10"
                  style={{
                    background: 'linear-gradient(135deg, rgb(239, 68, 68) 0%, rgb(220, 38, 38) 100%)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    boxShadow: 'rgba(239, 68, 68, 0.4) 0px 10px 30px 0px, rgba(239, 68, 68, 0.2) 0px 0px 0px 1px',
                    color: 'rgb(255, 255, 255)',
                    fontWeight: 600,
                    padding: '16px 32px',
                    fontSize: '18px',
                    width: '100%',
                    maxWidth: '300px'
                  }}
                >
                  <Zap className="mr-2 h-5 w-5" />
                  Create Your Token Now
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="lg" 
                onClick={() => window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_blank')}
                className="hover:shadow-lg transition-all duration-300 relative z-10"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '2px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '12px',
                  boxShadow: 'rgba(0, 0, 0, 0.1) 0px 8px 24px 0px',
                  color: 'rgb(254, 254, 235)',
                  fontWeight: 600,
                  padding: '16px 32px',
                  fontSize: '18px',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>
            
            {/* Feature badges - exact match */}
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
              <div className="flex items-center px-4 py-2 rounded-full"
                   style={{ 
                     backgroundColor: 'rgba(34, 197, 94, 0.2)',
                     color: 'rgb(34, 197, 94)'
                   }}>
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                No coding required
              </div>
              <div className="flex items-center px-4 py-2 rounded-full"
                   style={{ 
                     backgroundColor: 'rgba(34, 197, 94, 0.2)',
                     color: 'rgb(34, 197, 94)'
                   }}>
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Deploy in 30 seconds
              </div>
            </div>
          </div>
          
          {/* Right side - Token preview card - exact match */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              {/* Live badge - exact match */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full text-sm font-bold flex items-center z-20"
                   style={{ 
                     background: 'linear-gradient(to right, rgb(239, 68, 68), rgb(220, 38, 38))',
                     color: 'rgb(255, 255, 255)'
                   }}>
                <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                LIVE
              </div>
              
              {/* Token preview card - exact match */}
              <div className="snarbles-card-premium p-8 max-w-md mx-auto relative overflow-hidden snarbles-glow-green">
                <div className="absolute top-0 left-0 right-0 px-4 py-2 text-center text-sm font-semibold"
                     style={{ 
                       background: 'linear-gradient(to right, rgb(239, 68, 68), rgb(220, 38, 38))',
                       color: 'rgb(255, 255, 255)'
                     }}>
                  🔥 Total Value: $2.4M
                </div>
                
                <div className="mt-8 text-center">
                  <div className="text-sm mb-2" style={{ color: 'rgb(166, 166, 166)' }}>
                    LIVE PREVIEW
                  </div>
                  <div className="text-xs mb-6 flex items-center justify-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span style={{ color: 'rgb(34, 197, 94)' }}>Wallet Ready</span>
                  </div>
                  
                  <div className="text-xl font-bold mb-6" style={{ color: 'rgb(254, 254, 235)' }}>
                    Your Token
                  </div>
                  
                  {/* Token circle - exact match */}
                  <div className="token-preview-circle relative w-32 h-32 mx-auto mb-6">
                    YOU
                    <div className="absolute inset-0 rounded-full border-2 border-red-500/30 animate-ping"></div>
                  </div>
                  
                  {/* Action buttons - exact match */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {['Transfer', 'Mint', 'Trade', 'Analyze'].map((action) => (
                      <button key={action} 
                              className="py-3 px-4 rounded-lg font-medium transition-colors"
                              style={{
                                backgroundColor: 'rgb(8, 8, 8)',
                                border: '1px solid rgb(20, 20, 20)',
                                color: 'rgb(166, 166, 166)',
                                borderRadius: '10px'
                              }}>
                        {action}...
                      </button>
                    ))}
                  </div>
                  
                  <div className="text-sm" style={{ color: 'rgb(166, 166, 166)' }}>
                    → Deploy in seconds
                  </div>
                </div>
              </div>
              
              {/* Testimonial - exact match */}
              <div className="absolute -bottom-8 -left-8 snarbles-card p-4 max-w-xs hidden lg:block">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                       style={{ background: 'linear-gradient(to br, rgb(34, 197, 94), rgb(22, 163, 74))' }}>
                    J
                  </div>
                  <div>
                    <div className="text-sm" style={{ color: 'rgb(34, 197, 94)' }}>
                      "Launched our community token in just 28 seconds"
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'rgb(166, 166, 166)' }}>
                      - Jamie, Community Lead
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}