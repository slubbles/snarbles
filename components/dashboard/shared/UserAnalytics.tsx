'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  TrendingUp, 
  Activity, 
  Calendar, 
  Users,
  Coins,
  ArrowUp,
  ArrowDown,
  DollarSign,
  Clock
} from 'lucide-react';

interface UserAnalyticsData {
  walletAddress: string;
  network: 'solana' | 'algorand';
  totalTokens: number;
  totalTransactions: number;
  totalFeesSpent: number;
  portfolioValue?: number;
  analytics: {
    tokenCreationOverTime: Array<{ date: string; count: number }>;
    transactionTypes: Array<{ type: string; count: number; color: string }>;
    topTokens: Array<{ name: string; symbol: string; transactions: number; holders?: number }>;
    monthlyActivity: Array<{ month: string; transactions: number; tokens: number }>;
  };
}

interface UserAnalyticsProps {
  data: UserAnalyticsData;
  timeRange: '7d' | '30d' | '90d' | '1y';
  onTimeRangeChange: (range: '7d' | '30d' | '90d' | '1y') => void;
}

const CHART_COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function UserAnalytics({ data, timeRange, onTimeRangeChange }: UserAnalyticsProps) {
  const formatValue = (value: number, prefix = '') => {
    if (value >= 1e9) return `${prefix}${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `${prefix}${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `${prefix}${(value / 1e3).toFixed(2)}K`;
    return `${prefix}${value.toFixed(2)}`;
  };

  const getNetworkColor = (network: string) => {
    return network === 'solana' ? 'text-purple-400' : 'text-green-400';
  };

  const calculateGrowth = (data: Array<{ date: string; count: number }>) => {
    if (data.length < 2) return 0;
    const recent = data.slice(-7).reduce((sum, item) => sum + item.count, 0);
    const previous = data.slice(-14, -7).reduce((sum, item) => sum + item.count, 0);
    if (previous === 0) return recent > 0 ? 100 : 0;
    return ((recent - previous) / previous) * 100;
  };

  const growth = calculateGrowth(data.analytics.tokenCreationOverTime);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tokens</p>
                <p className={`text-2xl font-bold ${getNetworkColor(data.network)}`}>
                  {data.totalTokens}
                </p>
              </div>
              <Coins className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Transactions</p>
                <p className="text-2xl font-bold text-blue-400">{data.totalTransactions}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fees Spent</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {formatValue(data.totalFeesSpent, data.network === 'solana' ? '◎' : 'Ⱥ')}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Growth (7d)</p>
                <div className="flex items-center gap-1">
                  <p className={`text-2xl font-bold ${growth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {growth.toFixed(1)}%
                  </p>
                  {growth >= 0 ? (
                    <ArrowUp className="h-4 w-4 text-green-400" />
                  ) : (
                    <ArrowDown className="h-4 w-4 text-red-400" />
                  )}
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-foreground">Analytics Overview</h3>
        <div className="flex gap-2">
          {(['7d', '30d', '90d', '1y'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => onTimeRangeChange(range)}
            >
              {range}
            </Button>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Token Creation Over Time */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Token Creation Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.analytics.tokenCreationOverTime}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                />
                <RechartsTooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke={data.network === 'solana' ? '#8b5cf6' : '#10b981'}
                  strokeWidth={2}
                  dot={{ fill: data.network === 'solana' ? '#8b5cf6' : '#10b981', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Transaction Types */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Transaction Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.analytics.transactionTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {data.analytics.transactionTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Activity */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Monthly Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.analytics.monthlyActivity}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="month" 
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                />
                <RechartsTooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="transactions" fill="#06b6d4" name="Transactions" />
                <Bar dataKey="tokens" fill="#10b981" name="Tokens Created" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Tokens */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Most Active Tokens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.analytics.topTokens.map((token, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{token.name}</p>
                      <p className="text-sm text-muted-foreground">{token.symbol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground">{token.transactions}</p>
                    <p className="text-xs text-muted-foreground">transactions</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
