'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  ComposedChart, ReferenceLine
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Activity, DollarSign, Users, 
  Coins, Zap, Clock, AlertTriangle, CheckCircle,
  RefreshCw, Download, Settings, Filter, Calendar
} from 'lucide-react';
import { useRealTimeData } from '@/lib/real-time-data';

// Enhanced interfaces
export interface AdvancedPortfolioMetrics {
  totalValue: number;
  totalChange24h: number;
  totalChangePercent24h: number;
  totalTokens: number;
  activeTokens: number;
  totalHolders: number;
  avgHoldersPerToken: number;
  totalTransactions: number;
  avgTransactionValue: number;
  volatilityScore: number;
  riskScore: 'Low' | 'Medium' | 'High';
  liquidityScore: number;
  diversificationIndex: number;
  performance: {
    day: number;
    week: number;
    month: number;
    quarter: number;
    year: number;
  };
}

export interface EnhancedTokenAnalytics {
  tokenId: string;
  name: string;
  symbol: string;
  network: 'algorand' | 'solana';
  metrics: {
    currentValue: number;
    totalSupply: number;
    circulatingSupply: number;
    holders: number;
    transactions24h: number;
    volume24h: number;
    marketCap: number;
    fdv: number; // Fully Diluted Valuation
    liquidityUSD: number;
    priceChange: {
      '1h': number;
      '24h': number;
      '7d': number;
      '30d': number;
    };
    technicalIndicators: {
      rsi: number;
      sma20: number;
      sma50: number;
      bollinger: { upper: number; middle: number; lower: number };
      macd: { signal: number; histogram: number };
    };
    socialMetrics: {
      mentions: number;
      sentiment: number; // -1 to 1
      influencerScore: number;
    };
    riskMetrics: {
      volatility30d: number;
      sharpeRatio: number;
      maxDrawdown: number;
      betaCoefficient: number;
    };
  };
  predictions: {
    priceTarget7d: number;
    priceTarget30d: number;
    confidence: number;
    signals: Array<{
      type: 'bullish' | 'bearish' | 'neutral';
      strength: number;
      reason: string;
    }>;
  };
}

export interface MarketComparison {
  tokenSymbol: string;
  vs: {
    market: number; // vs overall market
    sector: number; // vs similar tokens
    peers: Array<{
      symbol: string;
      correlation: number;
      performance: number;
    }>;
  };
}

interface SuperAdvancedAnalyticsProps {
  tokens: any[];
  network: 'algorand' | 'solana' | 'all';
  walletAddress: string;
  timeframe: '1h' | '24h' | '7d' | '30d' | '90d' | '1y' | 'all';
  onTimeframeChange: (timeframe: '1h' | '24h' | '7d' | '30d' | '90d' | '1y' | 'all') => void;
}

export default function SuperAdvancedAnalytics({
  tokens,
  network,
  walletAddress,
  timeframe,
  onTimeframeChange
}: SuperAdvancedAnalyticsProps) {
  const [activeSection, setActiveSection] = useState<'overview' | 'performance' | 'risk' | 'predictions' | 'comparison'>('overview');
  const [selectedTokens, setSelectedTokens] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'simple' | 'advanced' | 'professional'>('advanced');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds

  // Real-time data hooks
  const { 
    data: portfolioMetrics, 
    loading: portfolioLoading, 
    refresh: refreshPortfolio 
  } = useRealTimeData<AdvancedPortfolioMetrics>(
    `portfolio:${network}:${walletAddress}`,
    () => fetchPortfolioMetrics(walletAddress, network, timeframe),
    { enabled: !!walletAddress }
  );

  const { 
    data: tokenAnalytics, 
    loading: analyticsLoading 
  } = useRealTimeData<EnhancedTokenAnalytics[]>(
    `token_analytics:${network}:${walletAddress}`,
    () => fetchTokenAnalytics(tokens, network, timeframe),
    { enabled: tokens.length > 0 }
  );

  const { 
    data: marketComparison, 
    loading: comparisonLoading 
  } = useRealTimeData<MarketComparison[]>(
    `market_comparison:${network}`,
    () => fetchMarketComparison(tokens, network),
    { enabled: tokens.length > 0 }
  );

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refreshPortfolio();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refreshPortfolio]);

  // Mock data fetchers (replace with real API calls)
  async function fetchPortfolioMetrics(address: string, net: string, tf: string): Promise<AdvancedPortfolioMetrics> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      totalValue: Math.random() * 100000,
      totalChange24h: (Math.random() - 0.5) * 10000,
      totalChangePercent24h: (Math.random() - 0.5) * 20,
      totalTokens: tokens.length,
      activeTokens: Math.floor(tokens.length * 0.8),
      totalHolders: Math.floor(Math.random() * 1000),
      avgHoldersPerToken: Math.floor(Math.random() * 50),
      totalTransactions: Math.floor(Math.random() * 5000),
      avgTransactionValue: Math.random() * 1000,
      volatilityScore: Math.random() * 100,
      riskScore: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)] as any,
      liquidityScore: Math.random() * 100,
      diversificationIndex: Math.random() * 100,
      performance: {
        day: (Math.random() - 0.5) * 10,
        week: (Math.random() - 0.5) * 20,
        month: (Math.random() - 0.5) * 30,
        quarter: (Math.random() - 0.5) * 50,
        year: (Math.random() - 0.5) * 100
      }
    };
  }

  async function fetchTokenAnalytics(tkns: any[], net: string, tf: string): Promise<EnhancedTokenAnalytics[]> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return tkns.map(token => ({
      tokenId: token.id,
      name: token.name,
      symbol: token.symbol,
      network: net as any,
      metrics: {
        currentValue: Math.random() * 1000,
        totalSupply: token.totalSupply || Math.random() * 1000000,
        circulatingSupply: Math.random() * 900000,
        holders: Math.floor(Math.random() * 500),
        transactions24h: Math.floor(Math.random() * 100),
        volume24h: Math.random() * 50000,
        marketCap: Math.random() * 1000000,
        fdv: Math.random() * 1200000,
        liquidityUSD: Math.random() * 100000,
        priceChange: {
          '1h': (Math.random() - 0.5) * 5,
          '24h': (Math.random() - 0.5) * 20,
          '7d': (Math.random() - 0.5) * 30,
          '30d': (Math.random() - 0.5) * 50
        },
        technicalIndicators: {
          rsi: Math.random() * 100,
          sma20: Math.random() * 100,
          sma50: Math.random() * 100,
          bollinger: {
            upper: Math.random() * 120,
            middle: Math.random() * 100,
            lower: Math.random() * 80
          },
          macd: {
            signal: (Math.random() - 0.5) * 10,
            histogram: (Math.random() - 0.5) * 5
          }
        },
        socialMetrics: {
          mentions: Math.floor(Math.random() * 1000),
          sentiment: (Math.random() - 0.5) * 2,
          influencerScore: Math.random() * 100
        },
        riskMetrics: {
          volatility30d: Math.random() * 50,
          sharpeRatio: (Math.random() - 0.3) * 3,
          maxDrawdown: Math.random() * -30,
          betaCoefficient: Math.random() * 2
        }
      },
      predictions: {
        priceTarget7d: Math.random() * 150,
        priceTarget30d: Math.random() * 200,
        confidence: Math.random() * 100,
        signals: [
          {
            type: ['bullish', 'bearish', 'neutral'][Math.floor(Math.random() * 3)] as any,
            strength: Math.random() * 100,
            reason: 'Technical analysis indicates potential movement'
          }
        ]
      }
    }));
  }

  async function fetchMarketComparison(tkns: any[], net: string): Promise<MarketComparison[]> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return tkns.map(token => ({
      tokenSymbol: token.symbol,
      vs: {
        market: (Math.random() - 0.5) * 30,
        sector: (Math.random() - 0.5) * 20,
        peers: [
          {
            symbol: 'PEER1',
            correlation: Math.random(),
            performance: (Math.random() - 0.5) * 25
          },
          {
            symbol: 'PEER2',
            correlation: Math.random(),
            performance: (Math.random() - 0.5) * 25
          }
        ]
      }
    }));
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    const formatted = value.toFixed(2);
    return `${value >= 0 ? '+' : ''}${formatted}%`;
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'text-green-500';
      case 'Medium': return 'text-yellow-500';
      case 'High': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const generateChartData = (days: number) => {
    return Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      value: Math.random() * 10000 + 5000,
      volume: Math.random() * 50000,
      transactions: Math.floor(Math.random() * 100),
      holders: Math.floor(Math.random() * 50) + 100
    }));
  };

  if (portfolioLoading && !portfolioMetrics) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="glass-card">
              <CardContent className="p-6">
                <div className="h-20 bg-muted/20 animate-pulse rounded-lg"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Super Advanced Analytics</h2>
          <p className="text-muted-foreground">
            Professional-grade portfolio insights and predictions
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {/* Timeframe Selector */}
          <div className="flex items-center gap-1 border rounded-lg p-1">
            {(['1h', '24h', '7d', '30d', '90d', '1y', 'all'] as const).map((period) => (
              <Button
                key={period}
                variant={timeframe === period ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onTimeframeChange(period)}
                className="h-8 px-3"
              >
                {period}
              </Button>
            ))}
          </div>
          
          {/* View Mode */}
          <div className="flex items-center gap-1 border rounded-lg p-1">
            {(['simple', 'advanced', 'professional'] as const).map((mode) => (
              <Button
                key={mode}
                variant={viewMode === mode ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode(mode)}
                className="h-8 px-3 capitalize"
              >
                {mode}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={refreshPortfolio}
            disabled={portfolioLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${portfolioLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      {portfolioMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-card border-blue-500/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(portfolioMetrics.totalValue)}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {portfolioMetrics.totalChangePercent24h >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                )}
                {formatPercentage(portfolioMetrics.totalChangePercent24h)}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-green-500/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Tokens</CardTitle>
              <Coins className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{portfolioMetrics.activeTokens}</div>
              <div className="text-xs text-muted-foreground">
                of {portfolioMetrics.totalTokens} total
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-purple-500/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
              <AlertTriangle className={`h-4 w-4 ${getRiskColor(portfolioMetrics.riskScore)}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getRiskColor(portfolioMetrics.riskScore)}`}>
                {portfolioMetrics.riskScore}
              </div>
              <div className="text-xs text-muted-foreground">
                Volatility: {portfolioMetrics.volatilityScore.toFixed(1)}%
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-orange-500/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Holders</CardTitle>
              <Users className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{portfolioMetrics.totalHolders.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">
                Avg: {portfolioMetrics.avgHoldersPerToken} per token
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Advanced Analytics Tabs */}
      <Tabs value={activeSection} onValueChange={(value: any) => setActiveSection(value)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 h-12">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="risk" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Risk Analysis
          </TabsTrigger>
          <TabsTrigger value="predictions" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Predictions
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Comparison
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Portfolio Performance Chart */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Portfolio Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={generateChartData(30)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                  <XAxis dataKey="date" stroke="currentColor" opacity={0.5} />
                  <YAxis stroke="currentColor" opacity={0.5} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    fill="#76f935" 
                    fillOpacity={0.2}
                    stroke="#76f935"
                    strokeWidth={2}
                  />
                  <Bar dataKey="transactions" fill="#3b82f6" opacity={0.6} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {portfolioMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {Object.entries(portfolioMetrics.performance).map(([period, value]) => (
                <Card key={period} className="glass-card">
                  <CardContent className="p-4 text-center">
                    <div className="text-sm text-muted-foreground capitalize mb-1">{period}</div>
                    <div className={`text-xl font-bold ${value >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {formatPercentage(value)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="risk" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk Metrics */}
            {portfolioMetrics && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Risk Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Volatility Score</span>
                    <Badge variant="outline">{portfolioMetrics.volatilityScore.toFixed(1)}%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Liquidity Score</span>
                    <Badge variant="outline">{portfolioMetrics.liquidityScore.toFixed(1)}/100</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Diversification Index</span>
                    <Badge variant="outline">{portfolioMetrics.diversificationIndex.toFixed(1)}/100</Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>AI Predictions & Signals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Zap className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Coming Soon</h3>
                <p className="text-muted-foreground">
                  AI-powered price predictions and trading signals will be available in the next update.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Market Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Market Analysis</h3>
                <p className="text-muted-foreground">
                  Detailed market comparison and peer analysis features coming soon.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
