'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { 
  TrendingUp, 
  Users, 
  Zap, 
  DollarSign,
  CheckCircle,
  Sparkles,
  Globe
} from 'lucide-react';

const mainStats = [
  {
    id: 'tokens',
    value: 3481,
    label: 'Tokens Created',
    subtitle: 'Across all networks',
    icon: Zap,
    color: 'text-primary'
  },
  {
    id: 'users',
    value: 2274,
    label: 'Happy Creators',
    subtitle: 'Worldwide',
    icon: Users,
    color: 'text-blue-500'
  },
  {
    id: 'value',
    value: 687000,
    label: 'Total Value',
    subtitle: 'USD equivalent',
    icon: DollarSign,
    color: 'text-green-500',
    prefix: '$',
    format: 'currency'
  },
  {
    id: 'success',
    value: 96.7,
    label: 'Success Rate',
    subtitle: 'Deployment success',
    icon: CheckCircle,
    color: 'text-emerald-500',
    suffix: '%'
  }
];

const additionalStats = [
  { label: 'Networks Supported', value: '2+', icon: Globe },
  { label: 'Avg. Creation Time', value: '< 30s', icon: Zap },
  { label: 'Customer Rating', value: '4.9/5', icon: Sparkles },
  { label: 'Uptime', value: '99.9%', icon: TrendingUp }
];

function formatNumber(num: number, format?: string): string {
  if (format === 'currency') {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}K`;
    }
    return num.toLocaleString();
  }
  
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toLocaleString();
}

function AnimatedCounter({ 
  value, 
  duration = 2000,
  format,
  prefix,
  suffix 
}: { 
  value: number;
  duration?: number;
  format?: string;
  prefix?: string;
  suffix?: string;
}) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const increment = value / (duration / 16);
    let start = 0;
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCurrent(value);
        clearInterval(timer);
      } else {
        setCurrent(start);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value, duration]);

  const formattedValue = formatNumber(current, format);
  
  return (
    <span>
      {prefix}{formattedValue}{suffix}
    </span>
  );
}

export default function StatsSection() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById('stats-section');
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section id="stats-section" className="py-16 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Platform{' '}
            <span className="bg-gradient-to-r from-primary/90 to-primary bg-clip-text text-transparent">
              Performance
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Real-time metrics showcasing the trust and success of our token creation platform
          </p>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {mainStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card 
                key={stat.id}
                className="p-6 bg-card/50 backdrop-blur-sm border-border hover:bg-card/70 transition-all duration-300 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-lg bg-muted/50 group-hover:bg-muted/70 transition-colors duration-300">
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-foreground">
                    {isVisible ? (
                      <AnimatedCounter 
                        value={stat.value}
                        format={stat.format}
                        prefix={stat.prefix}
                        suffix={stat.suffix}
                      />
                    ) : (
                      '0'
                    )}
                  </div>
                  <div className="text-foreground font-medium">
                    {stat.label}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.subtitle}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Additional Stats */}
        <div className="bg-card/30 backdrop-blur-sm border border-border rounded-lg p-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {additionalStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div 
                  key={index}
                  className="text-center space-y-3 group"
                >
                  <div className="flex justify-center mb-2">
                    <div className="p-2 bg-muted/50 rounded-lg group-hover:bg-primary/20 transition-colors duration-300">
                      <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                    </div>
                  </div>
                  <div className="text-xl font-bold text-foreground">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-6">Powered by industry-leading technology</p>
          <div className="flex justify-center items-center space-x-8 opacity-60">
            <div className="text-muted-foreground font-medium">Algorand</div>
            <div className="text-muted-foreground font-medium">Solana</div>
            <div className="text-muted-foreground font-medium">Supabase</div>
            <div className="text-muted-foreground font-medium">Vercel</div>
          </div>
        </div>
      </div>
    </section>
  );
}
