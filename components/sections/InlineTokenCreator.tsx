'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  Wallet,
  Sparkles,
  Globe,
  Shield
} from 'lucide-react';
import Link from 'next/link';

export default function InlineTokenCreator() {
  const [tokenName, setTokenName] = useState('');
  const [previewActive, setPreviewActive] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (tokenName.length > 0) {
      setPreviewActive(true);
      setStep(2);
    } else {
      setPreviewActive(false);
      setStep(1);
    }
  }, [tokenName]);

  const features = [
    { icon: Clock, text: 'Deploy in 30 seconds', color: 'text-green-500' },
    { icon: Shield, text: 'Enterprise security', color: 'text-blue-500' },
    { icon: Globe, text: 'Multi-chain support', color: 'text-purple-500' },
    { icon: CheckCircle, text: 'No coding required', color: 'text-emerald-500' }
  ];

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 mb-6 rounded-full text-sm font-medium"
               style={{ 
                 backgroundColor: 'rgba(239, 68, 68, 0.1)',
                 border: '1px solid rgba(239, 68, 68, 0.3)',
                 color: 'rgb(239, 68, 68)'
               }}>
            <Sparkles className="w-4 h-4 mr-2" />
            TRY IT NOW
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            See Your Token Come to Life
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Type a name below and watch your token preview generate instantly. 
            <span className="text-foreground font-semibold"> No wallet required for preview.</span>
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left side - Interactive Form */}
          <div className="space-y-8">
            <Card 
              className="p-8"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <div className="space-y-6">
                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      step >= 1 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                    }`}>
                      1
                    </div>
                    <span className="text-foreground font-semibold">Token Name</span>
                  </div>
                  <Input
                    placeholder="Enter your token name (e.g., CommunityToken)"
                    value={tokenName}
                    onChange={(e) => setTokenName(e.target.value)}
                    className="h-12 text-lg"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: 'rgb(254, 254, 235)'
                    }}
                  />
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      step >= 2 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                    }`}>
                      2
                    </div>
                    <span className={`font-semibold ${step >= 2 ? 'text-foreground' : 'text-muted-foreground'}`}>
                      Connect Wallet
                    </span>
                  </div>
                  <div className="p-4 rounded-lg border border-dashed border-muted-foreground/30">
                    <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                      <Wallet className="w-5 h-5" />
                      <span>Wallet connection required for deployment</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <span className="text-muted-foreground font-semibold">Deploy</span>
                  </div>
                  <div className="p-4 rounded-lg border border-dashed border-muted-foreground/30">
                    <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                      <Zap className="w-5 h-5" />
                      <span>One-click deployment</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="flex items-center space-x-3 p-4 rounded-lg"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <feature.icon className={`w-5 h-5 ${feature.color}`} />
                  <span className="text-sm text-muted-foreground">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right side - Live Preview */}
          <div className="lg:sticky lg:top-8">
            <Card 
              className={`p-8 transition-all duration-500 ${
                previewActive ? 'ring-2 ring-primary/50 shadow-lg shadow-primary/20' : ''
              }`}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <div className="text-center space-y-6">
                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold"
                     style={{ 
                       background: 'linear-gradient(to right, rgb(239, 68, 68), rgb(220, 38, 38))',
                       color: 'rgb(255, 255, 255)'
                     }}>
                  <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                  LIVE PREVIEW
                </div>

                <div className="text-sm text-muted-foreground mb-4">
                  Your Token Preview
                </div>

                {/* Token Circle */}
                <div className="relative w-32 h-32 mx-auto mb-6">
                  <div 
                    className="w-32 h-32 rounded-full flex items-center justify-center text-2xl font-bold text-white relative overflow-hidden"
                    style={{ 
                      background: previewActive 
                        ? 'linear-gradient(135deg, rgb(239, 68, 68) 0%, rgb(220, 38, 38) 100%)'
                        : 'rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    {tokenName ? tokenName.slice(0, 3).toUpperCase() : '???'}
                    {previewActive && (
                      <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping"></div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-foreground">
                    {tokenName || 'Your Token Name'}
                  </h3>
                  <div className="text-sm text-muted-foreground">
                    Symbol: {tokenName ? tokenName.slice(0, 4).toUpperCase() : 'SYMBOL'}
                  </div>
                  
                  {previewActive && (
                    <div className="space-y-2">
                      <Badge 
                        className="text-xs"
                        style={{
                          backgroundColor: 'rgba(34, 197, 94, 0.2)',
                          color: 'rgb(34, 197, 94)',
                          border: '1px solid rgba(34, 197, 94, 0.3)'
                        }}
                      >
                        Ready to Deploy
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        Estimated deploy time: 15-30 seconds
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <div className="pt-6">
                  {previewActive ? (
                    <Link href="/create">
                      <Button 
                        size="lg" 
                        className="w-full hover:scale-105 transition-all duration-300"
                        style={{
                          background: 'linear-gradient(135deg, rgb(239, 68, 68) 0%, rgb(220, 38, 38) 100%)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: 'rgb(255, 255, 255)',
                          fontWeight: 600
                        }}
                      >
                        <Zap className="mr-2 h-4 w-4" />
                        Deploy This Token
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Enter a token name to see preview
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
