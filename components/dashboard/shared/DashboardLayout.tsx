'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LayoutDashboard, 
  Coins, 
  BarChart3, 
  History, 
  Settings,
  Plus,
  Wallet,
  Network,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  network: 'solana' | 'algorand';
  walletAddress?: string;
  isConnected: boolean;
  onRefresh?: () => void;
  stats?: {
    totalTokens: number;
    totalTransactions: number;
    portfolioValue?: number;
  };
}

interface NavigationItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

export function DashboardLayout({ 
  children, 
  network, 
  walletAddress, 
  isConnected,
  onRefresh,
  stats 
}: DashboardLayoutProps) {
  const pathname = usePathname();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
  };

  const networkConfig = {
    solana: {
      name: 'Solana',
      color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      symbol: 'SOL',
      basePath: '/dashboard/solana'
    },
    algorand: {
      name: 'Algorand',
      color: 'bg-green-500/10 text-green-400 border-green-500/20',
      symbol: 'ALGO',
      basePath: '/dashboard/algorand'
    }
  };

  const config = networkConfig[network];

  const navigationItems: NavigationItem[] = [
    {
      label: 'Overview',
      href: config.basePath,
      icon: LayoutDashboard
    },
    {
      label: network === 'solana' ? 'Tokens' : 'Assets',
      href: `${config.basePath}/${network === 'solana' ? 'tokens' : 'assets'}`,
      icon: Coins,
      badge: stats?.totalTokens?.toString()
    },
    {
      label: 'Analytics',
      href: `${config.basePath}/analytics`,
      icon: BarChart3
    },
    {
      label: 'Transactions',
      href: `${config.basePath}/transactions`,
      icon: History,
      badge: stats?.totalTransactions?.toString()
    }
  ];

  const isActiveLink = (href: string) => {
    if (href === config.basePath) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="glass-card p-8 text-center max-w-md">
          <CardContent>
            <Wallet className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Connect Your {config.name} Wallet
            </h2>
            <p className="text-muted-foreground mb-6">
              Connect your wallet to access the {config.name} dashboard and manage your {network === 'solana' ? 'tokens' : 'assets'}.
            </p>
            <Link href="/dashboard">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Link>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-3">
                <Badge className={config.color}>
                  <Network className="h-3 w-3 mr-1" />
                  {config.name}
                </Badge>
                {walletAddress && (
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-mono text-muted-foreground">
                      {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {stats && (
                <div className="hidden md:flex items-center gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-muted-foreground">Tokens</p>
                    <p className="font-semibold text-foreground">{stats.totalTokens}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">Transactions</p>
                    <p className="font-semibold text-foreground">{stats.totalTransactions}</p>
                  </div>
                </div>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>

              <Link href="/create">
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Token
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="border-b border-border bg-card/30 backdrop-blur supports-[backdrop-filter]:bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 py-4">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveLink(item.href);
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  {item.badge && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
