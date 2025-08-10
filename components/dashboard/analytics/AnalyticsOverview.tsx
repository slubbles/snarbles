'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  Coins,
  DollarSign,
  BarChart3,
  PieChart,
  LineChart,
  RefreshCw
} from 'lucide-react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart as RechartsBarChart,
  Bar
} from 'recharts';
import { supabase } from '@/lib/supabase-client';
import { getAlgorandAccountInfo } from '@/lib/algorand';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

interface AnalyticsOverviewProps {
  network: 'algorand' | 'solana';
  walletAddress?: string;
}

export default function AnalyticsOverview({ network, walletAddress }: AnalyticsOverviewProps) {
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const [stats, setStats] = useState({
    totalValue: 0,
    change24h: 0,
    totalHolders: 0,
    holderGrowth: 0,
    avgTransactionValue: 0,
    transactionGrowth: 0,
    activeTokens: 0,
    totalTokens: 0,
    nativeBalance: 0,
    creditsBalance: 0,
    totalTransactions: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const networkInfo = {
    algorand: {
      name: 'Algorand',
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20'
    },
    solana: {
      name: 'Solana',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20'
    }
  };

  const info = networkInfo[network];

  const calculateRealAnalytics = useCallback(async (showRefreshToast = false) => {
    const refreshing = showRefreshToast;
    if (refreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    
    try {
      if (!walletAddress) return;

      // Get user profile data
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('credits_balance, total_tokens_created')
        .eq('wallet_address', walletAddress)
        .single();

      // Get created tokens
      const { data: tokens } = await supabase
        .from('token_creation_history')
        .select('*')
        .eq('wallet_address', walletAddress)
        .eq('network', network === 'algorand' ? 'algorand-mainnet' : 'solana-devnet');

      // Get credit transactions
      const { data: transactions } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('wallet_address', walletAddress);

      // Get native blockchain balance
      let nativeBalance = 0;
      try {
        if (network === 'algorand') {
          const accountInfo = await getAlgorandAccountInfo(walletAddress, 'algorand-mainnet');
          nativeBalance = accountInfo.balance || 0;
        } else {
          // For Solana, we'll skip for now or add later
          const connection = new Connection('https://api.devnet.solana.com');
          const publicKey = new PublicKey(walletAddress);
          const balance = await connection.getBalance(publicKey);
          nativeBalance = balance / LAMPORTS_PER_SOL;
        }
      } catch (error) {
        console.log('Could not fetch native balance:', error);
        nativeBalance = 0;
      }

      // Calculate basic portfolio value (native token only for now)
      // Using rough estimates: ALGO ~$0.18, SOL ~$100
      const nativePrice = network === 'algorand' ? 0.18 : 100;
      const nativeValueUSD = nativeBalance * nativePrice;

      // Calculate analytics
      const totalTokensCreated = tokens?.length || 0;
      const totalCreditsSpent = transactions
        ?.filter(tx => tx.type === 'usage')
        .reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;

      const recentTokens = tokens?.filter(token => {
        const created = new Date(token.created_at);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return created > thirtyDaysAgo;
      }) || [];

      setStats({
        totalValue: nativeValueUSD, // Start with native balance value
        change24h: 0, // No price history yet
        totalHolders: totalTokensCreated, // Each token has at least the creator
        holderGrowth: recentTokens.length > 0 ? 15.3 : 0, // Mock growth if there are recent tokens
        avgTransactionValue: totalCreditsSpent > 0 ? totalCreditsSpent / (transactions?.length || 1) : 0,
        transactionGrowth: 0, // No historical data yet
        activeTokens: totalTokensCreated, // Assume all are active
        totalTokens: totalTokensCreated,
        nativeBalance,
        creditsBalance: Number(profile?.credits_balance || 0),
        totalTransactions: transactions?.length || 0
      });

    } catch (error) {
      console.error('Error calculating analytics:', error);
    } finally {
      if (refreshing) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [walletAddress, network]);

  // Manual refresh function
  const handleManualRefresh = () => {
    calculateRealAnalytics(true);
  };

  // Set up automatic refresh on component mount and dependency changes
  useEffect(() => {
    if (walletAddress) {
      calculateRealAnalytics();
    }
  }, [calculateRealAnalytics, walletAddress]);

  // Set up page focus refresh
  useEffect(() => {
    const handleFocus = () => {
      if (!document.hidden && walletAddress) {
        console.log('Page focused - refreshing analytics...');
        calculateRealAnalytics();
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && walletAddress) {
        console.log('Page visible - refreshing analytics...');
        calculateRealAnalytics();
      }
    };

    // Listen for focus and visibility changes
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [walletAddress, calculateRealAnalytics]);

  // Mock data - replace with real data
  const portfolioData = [
    { date: '2024-01-01', value: 1000 },
    { date: '2024-01-02', value: 1150 },
    { date: '2024-01-03', value: 1075 },
    { date: '2024-01-04', value: 1200 },
    { date: '2024-01-05', value: 1350 },
    { date: '2024-01-06', value: 1280 },
    { date: '2024-01-07', value: 1420 }
  ];

  const tokenDistribution = [
    { name: 'MAT', value: 35, holders: 245 },
    { name: 'GUT', value: 30, holders: 892 },
    { name: 'RWD', value: 25, holders: 1520 },
    { name: 'Others', value: 10, holders: 156 }
  ];

  const holderGrowth = [
    { month: 'Jan', holders: 150 },
    { month: 'Feb', holders: 280 },
    { month: 'Mar', holders: 520 },
    { month: 'Apr', holders: 890 },
    { month: 'May', holders: 1240 },
    { month: 'Jun', holders: 1650 },
    { month: 'Jul', holders: 2057 }
  ];

  const COLORS = ['#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive insights for your {info.name} token portfolio
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Manual Refresh Button */}
          <Button 
            onClick={handleManualRefresh}
            disabled={isLoading || isRefreshing}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          
          {/* Timeframe Selector */}
          {(['24h', '7d', '30d', '90d'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                timeframe === tf
                  ? `${info.bgColor} ${info.color} ${info.borderColor} border`
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Portfolio Value</p>
                <p className="text-2xl font-bold">${stats.totalValue.toFixed(2)}</p>
                <div className={`flex items-center gap-1 text-sm mt-1 ${
                  stats.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {stats.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {stats.change24h >= 0 ? '+' : ''}{stats.change24h}%
                </div>
              </div>
              <DollarSign className={`w-8 h-8 ${info.color}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Holders</p>
                <p className="text-2xl font-bold">{stats.totalHolders.toLocaleString()}</p>
                <div className={`flex items-center gap-1 text-sm mt-1 ${
                  stats.holderGrowth >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {stats.holderGrowth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {stats.holderGrowth >= 0 ? '+' : ''}{stats.holderGrowth}%
                </div>
              </div>
              <Users className={`w-8 h-8 ${info.color}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Transaction</p>
                <p className="text-2xl font-bold">${stats.avgTransactionValue.toFixed(2)}</p>
                <div className={`flex items-center gap-1 text-sm mt-1 ${
                  stats.transactionGrowth >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {stats.transactionGrowth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {stats.transactionGrowth >= 0 ? '+' : ''}{stats.transactionGrowth}%
                </div>
              </div>
              <Activity className={`w-8 h-8 ${info.color}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Tokens</p>
                <p className="text-2xl font-bold">{stats.activeTokens}/{stats.totalTokens}</p>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 mt-1">
                  {Math.round((stats.activeTokens / stats.totalTokens) * 100)}% Active
                </Badge>
              </div>
              <Coins className={`w-8 h-8 ${info.color}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Portfolio Value Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="w-5 h-5" />
              Portfolio Value Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsLineChart data={portfolioData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={network === 'algorand' ? '#10b981' : '#8b5cf6'} 
                  strokeWidth={2}
                  dot={{ fill: network === 'algorand' ? '#10b981' : '#8b5cf6' }}
                />
              </RechartsLineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Token Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Token Distribution by Market Cap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={tokenDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {tokenDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Holder Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Holder Growth Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <RechartsBarChart data={holderGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
              <Bar 
                dataKey="holders" 
                fill={network === 'algorand' ? '#10b981' : '#8b5cf6'}
                radius={[4, 4, 0, 0]}
              />
            </RechartsBarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Token Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Individual Token Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4">Token</th>
                  <th className="text-right p-4">Market Cap</th>
                  <th className="text-right p-4">Holders</th>
                  <th className="text-right p-4">24h Change</th>
                  <th className="text-right p-4">Volume</th>
                </tr>
              </thead>
              <tbody>
                {tokenDistribution.slice(0, -1).map((token, index) => (
                  <tr key={token.name} className="border-b border-border/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: COLORS[index] + '20' }}
                        >
                          <Coins className="w-4 h-4" style={{ color: COLORS[index] }} />
                        </div>
                        <span className="font-medium">{token.name}</span>
                      </div>
                    </td>
                    <td className="text-right p-4 font-mono">
                      ${(token.value * 10000).toLocaleString()}
                    </td>
                    <td className="text-right p-4">{token.holders}</td>
                    <td className="text-right p-4">
                      <span className={`flex items-center justify-end gap-1 ${
                        Math.random() > 0.5 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {Math.random() > 0.5 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {(Math.random() * 20 - 10).toFixed(1)}%
                      </span>
                    </td>
                    <td className="text-right p-4 font-mono">
                      ${(Math.random() * 50000).toFixed(0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
