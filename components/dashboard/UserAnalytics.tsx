'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown,
  Coins, 
  Users, 
  Activity, 
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  DollarSign,
  RefreshCw,
  Download,
  Share,
  Eye,
  Clock,
  Zap,
  Target,
  Award,
  Sparkles,
  Plus,
  Send,
  Flame
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getPlatformAnalytics, trackEvent } from '@/lib/analytics';

interface Token {
  id: string;
  name: string;
  symbol: string;
  totalSupply: number;
  currentSupply: number;
  holders: number;
  transfers: number;
  createdAt: string;
  lastActivity: string;
  network: 'algorand' | 'solana';
  assetId?: number;
  mintAddress?: string;
  metadata?: {
    description?: string;
    image?: string;
  };
  performance: {
    dailyTransfers: number;
    weeklyGrowth: number;
    holderGrowth: number;
    liquidityScore: number;
  };
}

interface UserAnalyticsData {
  totalTokensCreated: number;
  totalValueLocked: number;
  totalHolders: number;
  totalTransactions: number;
  successRate: number;
  averageHolders: number;
  mostPopularToken: Token | null;
  recentActivity: Array<{
    type: 'creation' | 'transfer' | 'mint' | 'burn';
    tokenName: string;
    timestamp: string;
    amount?: number;
    recipient?: string;
  }>;
  performanceMetrics: {
    labels: string[];
    tokensCreated: number[];
    totalTransactions: number[];
    holderGrowth: number[];
  };
  tokenDistribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  networkStats: {
    algorand: number;
    solana: number;
  };
}

interface UserAnalyticsProps {
  userAddress: string;
  tokens: Token[];
  network: 'algorand' | 'solana' | 'all';
  timeframe: '24h' | '7d' | '30d' | '90d' | '1y';
  onTimeframeChange: (timeframe: '24h' | '7d' | '30d' | '90d' | '1y') => void;
  isLoading?: boolean;
}

export default function UserAnalytics({
  userAddress,
  tokens,
  network,
  timeframe,
  onTimeframeChange,
  isLoading = false
}: UserAnalyticsProps) {
  const [analyticsData, setAnalyticsData] = useState<UserAnalyticsData | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<'tokens' | 'transactions' | 'holders'>('tokens');
  const { toast } = useToast();

  useEffect(() => {
    if (userAddress && tokens.length > 0) {
      loadUserAnalytics();
    }
  }, [userAddress, tokens, timeframe, network]);

  const loadUserAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      // Track analytics view
      await trackEvent('user_analytics_view', {
        network,
        timeframe,
        tokenCount: tokens.length
      }, userAddress);

      // Calculate analytics from tokens data
      const analytics = calculateUserAnalytics(tokens);
      setAnalyticsData(analytics);
    } catch (error) {
      console.error('Error loading user analytics:', error);
      toast({
        title: "Analytics Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const calculateUserAnalytics = (userTokens: Token[]): UserAnalyticsData => {
    // Filter tokens by network if specified
    const filteredTokens = network === 'all' ? userTokens : userTokens.filter(t => t.network === network);
    
    // Calculate basic metrics
    const totalTokensCreated = filteredTokens.length;
    const totalHolders = filteredTokens.reduce((sum, token) => sum + token.holders, 0);
    const totalTransactions = filteredTokens.reduce((sum, token) => sum + token.transfers, 0);
    const totalValueLocked = filteredTokens.reduce((sum, token) => sum + (token.currentSupply * 0.01), 0); // Mock TVL
    
    // Find most popular token
    const mostPopularToken = filteredTokens.reduce((prev, current) => 
      (prev?.holders || 0) > current.holders ? prev : current, filteredTokens[0] || null
    );

    // Generate performance metrics (mock data for demo)
    const performanceMetrics = generatePerformanceData(timeframe);
    
    // Token distribution by holders
    const tokenDistribution = filteredTokens.slice(0, 5).map((token, index) => ({
      name: token.symbol,
      value: token.holders,
      color: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'][index]
    }));

    // Network distribution
    const networkStats = {
      algorand: userTokens.filter(t => t.network === 'algorand').length,
      solana: userTokens.filter(t => t.network === 'solana').length
    };

    // Generate recent activity (mock data)
    const recentActivity = generateRecentActivity(filteredTokens);

    return {
      totalTokensCreated,
      totalValueLocked,
      totalHolders,
      totalTransactions,
      successRate: 95, // Mock success rate
      averageHolders: totalTokensCreated > 0 ? Math.round(totalHolders / totalTokensCreated) : 0,
      mostPopularToken,
      recentActivity,
      performanceMetrics,
      tokenDistribution,
      networkStats
    };
  };

  const generatePerformanceData = (timeframe: string) => {
    const dataPoints = timeframe === '24h' ? 24 : timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : 365;
    const labels = [];
    const tokensCreated = [];
    const totalTransactions = [];
    const holderGrowth = [];

    for (let i = 0; i < dataPoints; i++) {
      labels.push(timeframe === '24h' ? `${i}h` : `Day ${i + 1}`);
      tokensCreated.push(Math.floor(Math.random() * 5) + (i % 7 === 0 ? 2 : 0));
      totalTransactions.push(Math.floor(Math.random() * 50) + 10);
      holderGrowth.push(Math.floor(Math.random() * 20) + 5);
    }

    return { labels, tokensCreated, totalTransactions, holderGrowth };
  };

  const generateRecentActivity = (tokens: Token[]) => {
    const activities = [];
    const types = ['creation', 'transfer', 'mint', 'burn'] as const;
    
    for (let i = 0; i < 10; i++) {
      const token = tokens[Math.floor(Math.random() * tokens.length)];
      if (!token) continue;
      
      const type = types[Math.floor(Math.random() * types.length)];
      activities.push({
        type,
        tokenName: token.name,
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        amount: type === 'transfer' || type === 'mint' ? Math.floor(Math.random() * 1000) : undefined,
        recipient: type === 'transfer' ? `${userAddress.slice(0, 8)}...${userAddress.slice(-4)}` : undefined
      });
    }
    
    return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const exportAnalytics = () => {
    if (!analyticsData) return;
    
    const exportData = {
      user: userAddress,
      timeframe,
      network,
      exportDate: new Date().toISOString(),
      ...analyticsData
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user-analytics-${timeframe}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Analytics Exported",
      description: "Analytics data has been downloaded",
    });
  };

  const MetricCard = ({ title, value, change, icon: Icon, color }: any) => (
    <Card className="snarbles-glass-subtle">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="snarbles-body-muted text-sm">{title}</p>
            <p className="snarbles-heading text-2xl font-bold mt-1">{value}</p>
            {change !== undefined && (
              <div className={`flex items-center gap-1 mt-2 text-sm ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{Math.abs(change)}%</span>
              </div>
            )}
          </div>
          <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loadingAnalytics || !analyticsData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="snarbles-heading text-xl">Loading Analytics...</p>
            <p className="snarbles-body-muted">Analyzing your token portfolio</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="snarbles-heading text-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl snarbles-gradient-purple flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            User Analytics
          </h2>
          <p className="snarbles-body-muted">Comprehensive insights into your token portfolio</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeframe} onValueChange={onTimeframeChange}>
            <SelectTrigger className="w-32 snarbles-glass-subtle">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24 Hours</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportAnalytics} variant="outline" className="snarbles-btn-secondary">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={loadUserAnalytics} disabled={loadingAnalytics} variant="outline" className="snarbles-btn-secondary">
            <RefreshCw className={`w-4 h-4 mr-2 ${loadingAnalytics ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Tokens Created"
          value={analyticsData.totalTokensCreated}
          change={12}
          icon={Coins}
          color="snarbles-gradient-blue"
        />
        <MetricCard
          title="Total Holders"
          value={analyticsData.totalHolders.toLocaleString()}
          change={8}
          icon={Users}
          color="snarbles-gradient-green"
        />
        <MetricCard
          title="Total Transactions"
          value={analyticsData.totalTransactions.toLocaleString()}
          change={-2}
          icon={Activity}
          color="snarbles-gradient-purple"
        />
        <MetricCard
          title="Success Rate"
          value={`${analyticsData.successRate}%`}
          change={3}
          icon={Target}
          color="snarbles-gradient-orange"
        />
      </div>

      {/* Performance Charts */}
      <Card className="snarbles-card-premium">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="snarbles-heading text-xl flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              Performance Overview
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={selectedMetric} onValueChange={(value: any) => setSelectedMetric(value)}>
                <SelectTrigger className="w-40 snarbles-glass-subtle">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tokens">Tokens Created</SelectItem>
                  <SelectItem value="transactions">Transactions</SelectItem>
                  <SelectItem value="holders">Holder Growth</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsData.performanceMetrics.labels.map((label, index) => ({
                name: label,
                value: selectedMetric === 'tokens' ? analyticsData.performanceMetrics.tokensCreated[index] :
                       selectedMetric === 'transactions' ? analyticsData.performanceMetrics.totalTransactions[index] :
                       analyticsData.performanceMetrics.holderGrowth[index]
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(17, 24, 39, 0.8)',
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3B82F6"
                  fill="url(#colorGradient)"
                  strokeWidth={2}
                />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Token Distribution */}
        <Card className="snarbles-card">
          <CardHeader>
            <CardTitle className="snarbles-heading text-lg flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-purple-400" />
              Token Distribution by Holders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData.tokenDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {analyticsData.tokenDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Network Distribution */}
        <Card className="snarbles-card">
          <CardHeader>
            <CardTitle className="snarbles-heading text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-400" />
              Network Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                  <span className="snarbles-body">Algorand</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="snarbles-body font-semibold">{analyticsData.networkStats.algorand}</span>
                  <Badge variant="outline" className="text-blue-400 border-blue-400">
                    {((analyticsData.networkStats.algorand / (analyticsData.networkStats.algorand + analyticsData.networkStats.solana)) * 100).toFixed(1)}%
                  </Badge>
                </div>
              </div>
              <Progress 
                value={(analyticsData.networkStats.algorand / (analyticsData.networkStats.algorand + analyticsData.networkStats.solana)) * 100} 
                className="h-2"
              />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                  <span className="snarbles-body">Solana</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="snarbles-body font-semibold">{analyticsData.networkStats.solana}</span>
                  <Badge variant="outline" className="text-purple-400 border-purple-400">
                    {((analyticsData.networkStats.solana / (analyticsData.networkStats.algorand + analyticsData.networkStats.solana)) * 100).toFixed(1)}%
                  </Badge>
                </div>
              </div>
              <Progress 
                value={(analyticsData.networkStats.solana / (analyticsData.networkStats.algorand + analyticsData.networkStats.solana)) * 100} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Most Popular Token */}
      {analyticsData.mostPopularToken && (
        <Card className="snarbles-card-premium">
          <CardHeader>
            <CardTitle className="snarbles-heading text-lg flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-400" />
              Most Popular Token
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl snarbles-gradient-yellow flex items-center justify-center">
                  <Coins className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="snarbles-heading text-xl">{analyticsData.mostPopularToken.name}</h3>
                  <p className="snarbles-body-muted">{analyticsData.mostPopularToken.symbol}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-blue-400" />
                      <span className="snarbles-body text-sm">{analyticsData.mostPopularToken.holders} holders</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Activity className="w-4 h-4 text-green-400" />
                      <span className="snarbles-body text-sm">{analyticsData.mostPopularToken.transfers} transfers</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="outline" className="text-green-400 border-green-400 mb-2">
                  Top Performer
                </Badge>
                <p className="snarbles-body-muted text-sm">
                  {((analyticsData.mostPopularToken.holders / analyticsData.totalHolders) * 100).toFixed(1)}% of total holders
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card className="snarbles-card">
        <CardHeader>
          <CardTitle className="snarbles-heading text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-400" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {analyticsData.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 snarbles-glass-subtle rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    activity.type === 'creation' ? 'bg-green-500/20 text-green-400' :
                    activity.type === 'transfer' ? 'bg-blue-500/20 text-blue-400' :
                    activity.type === 'mint' ? 'bg-purple-500/20 text-purple-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {activity.type === 'creation' ? <Plus className="w-4 h-4" /> :
                     activity.type === 'transfer' ? <Send className="w-4 h-4" /> :
                     activity.type === 'mint' ? <Coins className="w-4 h-4" /> :
                     <Flame className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="snarbles-body text-sm font-medium">
                      {activity.type === 'creation' ? `Created ${activity.tokenName}` :
                       activity.type === 'transfer' ? `Transferred ${activity.amount} ${activity.tokenName}` :
                       activity.type === 'mint' ? `Minted ${activity.amount} ${activity.tokenName}` :
                       `Burned ${activity.amount} ${activity.tokenName}`}
                    </p>
                    <p className="snarbles-body-muted text-xs">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {activity.type}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
