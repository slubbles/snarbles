'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Users, TrendingUp, CheckCircle, Clock, Globe } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'token_created' | 'milestone' | 'network_activity';
  user: string;
  action: string;
  timestamp: Date;
  value?: string;
  network?: 'Solana' | 'Algorand';
}

const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'token_created',
    user: 'Alex',
    action: 'launched CommunityToken',
    timestamp: new Date(Date.now() - 30000),
    network: 'Solana'
  },
  {
    id: '2',
    type: 'milestone',
    user: 'Platform',
    action: 'reached 10,000 tokens created',
    timestamp: new Date(Date.now() - 120000),
    value: '10,000'
  },
  {
    id: '3',
    type: 'token_created',
    user: 'Maria',
    action: 'deployed GameToken',
    timestamp: new Date(Date.now() - 180000),
    network: 'Algorand'
  },
  {
    id: '4',
    type: 'network_activity',
    user: 'Network',
    action: 'processed 500+ transactions',
    timestamp: new Date(Date.now() - 240000),
    value: '500+'
  },
  {
    id: '5',
    type: 'token_created',
    user: 'David',
    action: 'created NFTToken',
    timestamp: new Date(Date.now() - 300000),
    network: 'Solana'
  }
];

export default function LiveActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>(mockActivities);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activities.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [activities.length]);

  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'token_created':
        return <Zap className="w-4 h-4 text-primary" />;
      case 'milestone':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'network_activity':
        return <Globe className="w-4 h-4 text-blue-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNetworkBadge = (network?: string) => {
    if (!network) return null;
    
    return (
      <Badge 
        variant="secondary" 
        className="text-xs"
        style={{
          backgroundColor: network === 'Solana' ? 'rgba(147, 51, 234, 0.2)' : 'rgba(34, 197, 94, 0.2)',
          color: network === 'Solana' ? 'rgb(147, 51, 234)' : 'rgb(34, 197, 94)',
          border: `1px solid ${network === 'Solana' ? 'rgba(147, 51, 234, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`
        }}
      >
        {network}
      </Badge>
    );
  };

  const formatTimeAgo = (timestamp: Date) => {
    const seconds = Math.floor((Date.now() - timestamp.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <section className="py-12 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-green-500/5 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-primary/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center px-4 py-2 mb-4 rounded-full text-sm font-medium"
               style={{ 
                 backgroundColor: 'rgba(34, 197, 94, 0.1)',
                 border: '1px solid rgba(34, 197, 94, 0.3)',
                 color: 'rgb(34, 197, 94)'
               }}>
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            LIVE ACTIVITY
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Join the Token Revolution
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            See what creators are building right now. Your token could be next in this feed.
          </p>
        </div>

        {/* Live Activity Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.slice(0, 3).map((activity, index) => (
            <Card 
              key={activity.id}
              className={`p-6 transition-all duration-500 hover:scale-105 ${
                index === currentIndex % 3 ? 'ring-2 ring-primary/50 shadow-lg shadow-primary/20' : ''
              }`}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getIcon(activity.type)}
                  <div>
                    <div className="font-semibold text-foreground text-sm">
                      {activity.user}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatTimeAgo(activity.timestamp)}
                    </div>
                  </div>
                </div>
                {getNetworkBadge(activity.network)}
              </div>
              
              <p className="text-muted-foreground text-sm mb-3">
                {activity.action}
              </p>
              
              {activity.value && (
                <div className="text-primary font-bold text-lg">
                  {activity.value}
                </div>
              )}
              
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="w-3 h-3 mr-1" />
                  Real-time update
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary mb-1">3.2K</div>
            <div className="text-sm text-muted-foreground">Tokens Today</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500 mb-1">98.7%</div>
            <div className="text-sm text-muted-foreground">Success Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500 mb-1">15s</div>
            <div className="text-sm text-muted-foreground">Avg Deploy Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-500 mb-1">24/7</div>
            <div className="text-sm text-muted-foreground">Network Uptime</div>
          </div>
        </div>
      </div>
    </section>
  );
}
