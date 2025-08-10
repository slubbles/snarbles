'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Shield, 
  Coins, 
  TrendingUp,
  ArrowRight,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreditsInfoSummary() {
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();

  const benefits = [
    { icon: <Zap className="w-4 h-4" />, text: "Instant token creation" },
    { icon: <Shield className="w-4 h-4" />, text: "No expiration" },
    { icon: <Coins className="w-4 h-4" />, text: "Bulk discounts" },
    { icon: <TrendingUp className="w-4 h-4" />, text: "Multi-chain support" }
  ];

  return (
    <Card className="glass-card border-primary/10 mt-8">
      <CardContent className="p-4 lg:p-6">
        {/* Always Visible Summary */}
        <div className="space-y-4">
          {/* Title */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                <Zap className="w-3 h-3 text-primary" />
              </div>
              <h3 className="font-bold text-foreground text-lg">Credits Benefits</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-muted-foreground hover:text-foreground"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Benefits Grid - Always Visible on Mobile */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="text-primary flex-shrink-0">
                  {benefit.icon}
                </div>
                <span className="text-xs lg:text-sm">{benefit.text}</span>
              </div>
            ))}
          </div>

          {/* Quick Guide - Always Visible */}
          <div className="border-t border-border pt-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="secondary" className="text-xs">💡 Quick Guide</Badge>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div><span className="text-blue-400">ALGO:</span> 1 ALGO = 2 Credits</div>
                  <div><span className="text-green-400">USDT:</span> 1 USDT = 1 Credit</div>
                </div>
              </div>
              
              <div className="flex flex-col lg:flex-row gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/dashboard')}
                  className="text-xs h-8 lg:h-9"
                >
                  <ArrowRight className="w-3 h-3 mr-1" />
                  View Dashboard
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/support')}
                  className="text-xs h-8 lg:h-9"
                >
                  <HelpCircle className="w-3 h-3 mr-1" />
                  Get Help
                </Button>
              </div>
            </div>
          </div>

          {/* Expandable Content */}
          {isExpanded && (
            <div className="border-t border-border pt-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
              {/* Use Cases */}
              <div>
                <h4 className="font-medium text-foreground mb-2 text-sm">Perfect for:</h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <span>Token creation (10 credits)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    <span>Testing (Free on testnet)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                    <span>Bulk operations (Discounts apply)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                    <span>Enterprise projects</span>
                  </div>
                </div>
              </div>

              {/* Pricing Tiers */}
              <div>
                <h4 className="font-medium text-foreground mb-2 text-sm">Pricing Tiers:</h4>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 text-xs">
                  <div className="bg-muted/20 rounded-lg p-2">
                    <div className="font-medium text-green-400">Starter</div>
                    <div className="text-muted-foreground">20 Credits = 10 ALGO</div>
                  </div>
                  <div className="bg-muted/20 rounded-lg p-2">
                    <div className="font-medium text-blue-400">Popular</div>
                    <div className="text-muted-foreground">45 Credits = 20 ALGO</div>
                  </div>
                  <div className="bg-muted/20 rounded-lg p-2">
                    <div className="font-medium text-purple-400">Pro</div>
                    <div className="text-muted-foreground">110 Credits = 50 ALGO</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
