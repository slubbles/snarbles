'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { 
  TrendingUp, 
  Users, 
  Zap, 
  DollarSign,
  ArrowUpRight,
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
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20'
  },
  {
    id: 'users',
    value: 2274,
    label: 'Happy Creators',
    subtitle: 'Worldwide',
    icon: Users,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20'
  },
  {
    id: 'value',
    value: 687000,
    label: 'Total Value',
    subtitle: 'USD equivalent',
    icon: DollarSign,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
    prefix: '$',
    format: 'currency'
  },
  {
    id: 'success',
    value: 96.7,
    label: 'Success Rate',
    subtitle: 'Deployment success',
    icon: CheckCircle,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
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
    let start = 0;
    const increment = value / (duration / 16);
    
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
    <section id="stats-section" className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900/50 to-black/30" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Platform{' '}
            <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
              Performance
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
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
                className={`
                  p-6 bg-black/40 backdrop-blur-xl border ${stat.borderColor} 
                  hover:bg-black/60 transition-all duration-500 group
                  hover:scale-105 hover:shadow-2xl
                `}
                style={{
                  animationDelay: `${index * 150}ms`
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-2xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                </div>
                
                <div className="space-y-2">
                  <div className={`text-3xl font-bold text-white ${stat.color}`}>
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
                  <div className="text-white font-semibold">
                    {stat.label}
                  </div>
                  <div className="text-sm text-gray-400">
                    {stat.subtitle}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Additional Stats */}
        <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {additionalStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div 
                  key={index}
                  className="text-center space-y-3 group"
                >
                  <div className="flex justify-center mb-2">
                    <div className="p-2 bg-gray-800/50 rounded-xl group-hover:bg-red-500/20 transition-colors duration-300">
                      <Icon className="w-5 h-5 text-gray-400 group-hover:text-red-400 transition-colors duration-300" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-white">
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

        {/* Trust Badges */}
        <div className="mt-16 text-center">
          <p className="text-gray-400 mb-8">Powered by industry-leading technology</p>
          <div className="flex justify-center items-center space-x-12 opacity-60">
            <div className="text-gray-400 font-semibold">Algorand</div>
            <div className="text-gray-400 font-semibold">Solana</div>
            <div className="text-gray-400 font-semibold">Supabase</div>
            <div className="text-gray-400 font-semibold">Vercel</div>
          </div>
        </div>
      </div>
    </section>
  );
} 