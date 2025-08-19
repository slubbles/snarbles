'use client';

import { useState, useEffect } from 'react';
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider';
import { DashboardLayout } from '@/components/dashboard/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  TrendingUp, 
  PieChart, 
  BarChart3,
  RefreshCw,
  Loader2,
  Trophy,
  Target,
  Activity,
  ArrowLeft
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAlgorandEnhancedTokenInfo } from '@/lib/algorand-data';
import Link from 'next/link';
import {
  PieChart as RechartsPieChart,
  BarChart as RechartsBarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Pie,
  Legend
} from 'recharts';

interface TokenHolder {
  address: string;
  balance: number;
  percentage: number;
  rank: number;
  isCreator?: boolean;
}

interface HolderAnalytics {
  totalHolders: number;
  averageHolding: number;
  medianHolding: number;
  concentration: number;
  distribution: {
    whales: number; // >10%
    dolphins: number; // 1-10%
    minnows: number; // <1%
  };
}

export default function AlgorandHoldersPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedToken, setSelectedToken] = useState<any>(null);
  const [tokens, setTokens] = useState<any[]>([]);
  const [holders, setHolders] = useState<TokenHolder[]>([]);
  const [analytics, setAnalytics] = useState<HolderAnalytics | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const { toast } = useToast();
  const { 
    connected, 
    address: walletAddress, 
    selectedNetwork 
  } = useAlgorandWallet();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load user's tokens
  const loadTokens = async () => {
    if (!walletAddress || !connected) return;

    try {
      setLoading(true);
      const result = await getAlgorandEnhancedTokenInfo(walletAddress, selectedNetwork);
      if (result.success && result.data) {
        setTokens(result.data);
        if (result.data.length > 0 && !selectedToken) {
          setSelectedToken(result.data[0]);
        }
      }
    } catch (error) {
      console.error('Error loading tokens:', error);
      toast({
        title: "Error",
        description: "Failed to load tokens",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate mock holder data (in real implementation, this would call Algorand Explorer API)
  const generateMockHolders = (token: any): TokenHolder[] => {
    const totalSupply = parseFloat(token.balance) * 100; // Simulate total supply
    const holderCount = Math.floor(Math.random() * 500) + 50;
    
    const mockHolders: TokenHolder[] = [];
    let remainingSupply = totalSupply;
    
    for (let i = 0; i < Math.min(holderCount, 100); i++) {
      const isCreator = i === 0;
      const maxHolding = isCreator ? remainingSupply * 0.3 : remainingSupply * 0.1;
      const balance = Math.random() * maxHolding;
      const percentage = (balance / totalSupply) * 100;
      
      mockHolders.push({
        address: `${token.creator?.slice(0, 6) || 'ALGO'}...${Math.random().toString(36).slice(-6).toUpperCase()}`,
        balance,
        percentage,
        rank: i + 1,
        isCreator
      });
      
      remainingSupply -= balance;
    }
    
    return mockHolders.sort((a, b) => b.balance - a.balance).map((holder, index) => ({
      ...holder,
      rank: index + 1
    }));
  };

  // Calculate analytics from holder data
  const calculateAnalytics = (holderData: TokenHolder[]): HolderAnalytics => {
    const totalHolders = holderData.length;
    const balances = holderData.map(h => h.balance);
    const averageHolding = balances.reduce((a, b) => a + b, 0) / totalHolders;
    const medianHolding = balances.sort((a, b) => a - b)[Math.floor(totalHolders / 2)];
    
    const whales = holderData.filter(h => h.percentage >= 10).length;
    const dolphins = holderData.filter(h => h.percentage >= 1 && h.percentage < 10).length;
    const minnows = holderData.filter(h => h.percentage < 1).length;
    
    const top10Concentration = holderData.slice(0, 10).reduce((sum, h) => sum + h.percentage, 0);
    
    return {
      totalHolders,
      averageHolding,
      medianHolding,
      concentration: top10Concentration,
      distribution: { whales, dolphins, minnows }
    };
  };

  // Prepare chart data
  const getDistributionChartData = () => {
    if (!analytics) return [];
    return [
      { name: 'Whales (>10%)', value: analytics.distribution.whales, color: '#3b82f6', emoji: '🐋' },
      { name: 'Dolphins (1-10%)', value: analytics.distribution.dolphins, color: '#10b981', emoji: '🐬' },
      { name: 'Minnows (<1%)', value: analytics.distribution.minnows, color: '#8b5cf6', emoji: '🐟' }
    ];
  };

  const getTopHoldersChartData = () => {
    if (!holders.length) return [];
    return holders.slice(0, 10).map((holder, index) => ({
      name: `#${index + 1}`,
      address: holder.address,
      percentage: holder.percentage,
      balance: holder.balance,
      isCreator: holder.isCreator
    }));
  };

  // Export functions
  const exportToCSV = () => {
    if (!holders.length || !selectedToken) return;

    const csvData = holders.map(holder => ({
      Rank: holder.rank,
      Address: holder.address,
      Balance: holder.balance.toFixed(6),
      Percentage: holder.percentage.toFixed(4),
      'Token Symbol': selectedToken.symbol,
      'Is Creator': holder.isCreator ? 'Yes' : 'No'
    }));

    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedToken.symbol}_holders_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: `Exported ${holders.length} holders to CSV`,
    });
  };

  const exportToJSON = () => {
    if (!holders.length || !selectedToken || !analytics) return;

    const exportData = {
      metadata: {
        tokenName: selectedToken.name,
        tokenSymbol: selectedToken.symbol,
        assetId: selectedToken.assetId,
        exportDate: new Date().toISOString(),
        totalHolders: analytics.totalHolders
      },
      analytics: {
        totalHolders: analytics.totalHolders,
        averageHolding: analytics.averageHolding,
        medianHolding: analytics.medianHolding,
        concentration: analytics.concentration,
        distribution: analytics.distribution
      },
      holders: holders.map(holder => ({
        rank: holder.rank,
        address: holder.address,
        balance: holder.balance,
        percentage: holder.percentage,
        isCreator: holder.isCreator
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedToken.symbol}_holders_analysis_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful", 
      description: `Exported complete analysis to JSON`,
    });
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {payload[0].dataKey === 'value' ? `${data.value} holders` : `${data.percentage.toFixed(2)}%`}
          </p>
          {data.emoji && <p className="text-lg">{data.emoji}</p>}
        </div>
      );
    }
    return null;
  };

  // Load holder data for selected token
  const loadHolderData = async () => {
    if (!selectedToken) return;

    try {
      setRefreshing(true);
      
      // In real implementation, this would call Algorand Explorer API
      // For now, we generate mock data
      const mockHolders = generateMockHolders(selectedToken);
      setHolders(mockHolders);
      setAnalytics(calculateAnalytics(mockHolders));
      
      toast({
        title: "Data Updated",
        description: `Loaded holder data for ${selectedToken.symbol}`,
      });
      
    } catch (error) {
      console.error('Error loading holder data:', error);
      toast({
        title: "Error",
        description: "Failed to load holder data",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (connected && walletAddress) {
      loadTokens();
    }
  }, [connected, walletAddress, selectedNetwork]);

  useEffect(() => {
    if (selectedToken) {
      loadHolderData();
    }
  }, [selectedToken]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!connected || !walletAddress) {
    return (
      <DashboardLayout 
        network="algorand" 
        walletAddress={undefined}
        isConnected={false}
        isAdmin={false}
      >
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <Users className="w-16 h-16 mx-auto text-primary mb-4" />
              <CardTitle>Connect Wallet</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center">
                Connect your Algorand wallet to view token holder analytics
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      network="algorand" 
      walletAddress={walletAddress}
      isConnected={connected}
      isAdmin={false}
    >
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/algorand">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Token Holder Analytics</h1>
                <p className="text-muted-foreground">Analyze token distribution and holder behavior</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={loadHolderData}
                disabled={refreshing || !selectedToken}
                variant="outline"
              >
                {refreshing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Refresh Data
              </Button>

              {/* Export Buttons */}
              {holders.length > 0 && (
                <>
                  <Button
                    onClick={exportToCSV}
                    variant="outline"
                    className="hidden sm:flex"
                  >
                    📊 CSV
                  </Button>
                  <Button
                    onClick={exportToJSON}
                    variant="outline"
                    className="hidden sm:flex"
                  >
                    📋 JSON
                  </Button>
                  
                  {/* Mobile Export Menu */}
                  <div className="sm:hidden">
                    <Button variant="outline" className="px-3">
                      📁
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Token Selection */}
          {tokens.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Select Token to Analyze
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tokens.slice(0, 6).map((token) => (
                    <button
                      key={token.assetId}
                      onClick={() => setSelectedToken(token)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        selectedToken?.assetId === token.assetId
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{token.name}</p>
                          <p className="text-sm text-muted-foreground">{token.symbol}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading token data...</p>
            </div>
          )}

          {/* No Tokens */}
          {!loading && tokens.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No Tokens Found</h3>
                <p className="text-muted-foreground mb-4">
                  Create some tokens first to view holder analytics
                </p>
                <Link href="/create">
                  <Button className="bg-primary hover:bg-primary/90">
                    Create Your First Token
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Analytics Dashboard */}
          {selectedToken && analytics && (
            <div className="space-y-6">
              
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Holders</p>
                        <p className="text-2xl font-bold text-foreground">{analytics.totalHolders}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Avg. Holding</p>
                        <p className="text-2xl font-bold text-foreground">{analytics.averageHolding.toFixed(2)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <PieChart className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Top 10 Concentration</p>
                        <p className="text-2xl font-bold text-foreground">{analytics.concentration.toFixed(1)}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                        <BarChart3 className="w-6 h-6 text-orange-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Distribution</p>
                        <div className="flex gap-1 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            🐋 {analytics.distribution.whales}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            🐬 {analytics.distribution.dolphins}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            🐟 {analytics.distribution.minnows}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Analytics */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="holders">Top Holders</TabsTrigger>
                  <TabsTrigger value="distribution">Distribution</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Distribution Pie Chart */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <PieChart className="w-5 h-5" />
                          Holder Distribution
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                              <Pie
                                data={getDistributionChartData()}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={120}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {getDistributionChartData().map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip content={<CustomTooltip />} />
                              <Legend 
                                formatter={(value, entry: any) => `${entry.payload.emoji} ${value}`}
                              />
                            </RechartsPieChart>
                          </ResponsiveContainer>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 mt-4">
                          <div className="text-center p-3 bg-blue-500/10 rounded-lg">
                            <div className="text-2xl mb-1">🐋</div>
                            <div className="font-semibold text-blue-400">{analytics?.distribution.whales || 0}</div>
                            <div className="text-xs text-muted-foreground">Whales</div>
                          </div>
                          <div className="text-center p-3 bg-green-500/10 rounded-lg">
                            <div className="text-2xl mb-1">🐬</div>
                            <div className="font-semibold text-green-400">{analytics?.distribution.dolphins || 0}</div>
                            <div className="text-xs text-muted-foreground">Dolphins</div>
                          </div>
                          <div className="text-center p-3 bg-purple-500/10 rounded-lg">
                            <div className="text-2xl mb-1">🐟</div>
                            <div className="font-semibold text-purple-400">{analytics?.distribution.minnows || 0}</div>
                            <div className="text-xs text-muted-foreground">Minnows</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Top Holders Bar Chart */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="w-5 h-5" />
                          Top 10 Holders
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsBarChart data={getTopHoldersChartData()}>
                              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                              <XAxis 
                                dataKey="name" 
                                className="text-muted-foreground"
                                fontSize={12}
                              />
                              <YAxis 
                                className="text-muted-foreground"
                                fontSize={12}
                                tickFormatter={(value) => `${value.toFixed(1)}%`}
                              />
                              <Tooltip 
                                content={({ active, payload, label }) => {
                                  if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                                        <p className="font-medium text-foreground">{label}</p>
                                        <p className="text-sm text-muted-foreground font-mono">
                                          {data.address}
                                        </p>
                                        <p className="text-sm text-primary">
                                          {data.percentage.toFixed(2)}% ({data.balance.toFixed(2)} tokens)
                                        </p>
                                        {data.isCreator && (
                                          <Badge variant="default" className="text-xs mt-1">Creator</Badge>
                                        )}
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Bar 
                                dataKey="percentage" 
                                fill="#3b82f6"
                                radius={[4, 4, 0, 0]}
                              >
                                {getTopHoldersChartData().map((entry, index) => (
                                  <Cell 
                                    key={`cell-${index}`} 
                                    fill={entry.isCreator ? "#10b981" : "#3b82f6"} 
                                  />
                                ))}
                              </Bar>
                            </RechartsBarChart>
                          </ResponsiveContainer>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-4 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-500 rounded"></div>
                            <span className="text-muted-foreground">Regular Holders</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded"></div>
                            <span className="text-muted-foreground">Token Creator</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Concentration Analysis */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Concentration Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-4">
                          <h4 className="font-semibold text-foreground">Concentration Metrics</h4>
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-muted-foreground">Top 10 Concentration</span>
                                <span className="font-medium">{analytics?.concentration.toFixed(1)}%</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-300 ${
                                    (analytics?.concentration || 0) > 70 ? 'bg-red-500' : 
                                    (analytics?.concentration || 0) > 50 ? 'bg-yellow-500' : 'bg-green-500'
                                  }`}
                                  style={{ width: `${Math.min(analytics?.concentration || 0, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                            
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Average Holding:</span>
                              <span className="font-medium">{analytics?.averageHolding.toFixed(2)} {selectedToken?.symbol}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Median Holding:</span>
                              <span className="font-medium">{analytics?.medianHolding.toFixed(2)} {selectedToken?.symbol}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <h4 className="font-semibold text-foreground">Health Indicators</h4>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                              <span className="text-muted-foreground">Decentralization:</span>
                              <Badge variant={(analytics?.concentration || 0) < 50 ? "default" : "destructive"}>
                                {(analytics?.concentration || 0) < 50 ? "✅ Good" : "⚠️ Concentrated"}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                              <span className="text-muted-foreground">Holder Diversity:</span>
                              <Badge variant={(analytics?.totalHolders || 0) > 100 ? "default" : "secondary"}>
                                {(analytics?.totalHolders || 0) > 100 ? "� High" : "📊 Growing"}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                              <span className="text-muted-foreground">Distribution:</span>
                              <Badge variant="outline">
                                {analytics?.distribution.whales === 0 ? "🎯 Distributed" : "🐋 Whale Present"}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="font-semibold text-foreground">Key Insights</h4>
                          <div className="space-y-2 text-sm">
                            {analytics && (
                              <>
                                <div className="p-3 bg-blue-500/10 rounded-lg border-l-4 border-blue-500">
                                  <p className="text-blue-700 dark:text-blue-300">
                                    {analytics.distribution.whales > 0 
                                      ? `${analytics.distribution.whales} whale(s) control significant portions`
                                      : "No whales detected - good distribution"}
                                  </p>
                                </div>
                                <div className="p-3 bg-green-500/10 rounded-lg border-l-4 border-green-500">
                                  <p className="text-green-700 dark:text-green-300">
                                    {analytics.totalHolders} total holders with average of {analytics.averageHolding.toFixed(2)} tokens
                                  </p>
                                </div>
                                {analytics.concentration > 70 && (
                                  <div className="p-3 bg-yellow-500/10 rounded-lg border-l-4 border-yellow-500">
                                    <p className="text-yellow-700 dark:text-yellow-300">
                                      High concentration detected - consider broader distribution
                                    </p>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="holders" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="w-5 h-5" />
                        Top Token Holders
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {holders.slice(0, 10).map((holder) => (
                          <div
                            key={holder.address}
                            className="flex items-center justify-between p-3 bg-background/50 rounded-lg border"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-sm">
                                #{holder.rank}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-foreground font-mono">
                                    {holder.address}
                                  </p>
                                  {holder.isCreator && (
                                    <Badge variant="default" className="text-xs">Creator</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {holder.percentage.toFixed(2)}% of total supply
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-foreground">
                                {holder.balance.toFixed(2)}
                              </p>
                              <p className="text-sm text-muted-foreground">{selectedToken.symbol}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="distribution" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Distribution Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h4 className="font-semibold text-foreground">Holding Statistics</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Average Holding:</span>
                              <span className="font-medium">{analytics.averageHolding.toFixed(2)} {selectedToken.symbol}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Median Holding:</span>
                              <span className="font-medium">{analytics.medianHolding.toFixed(2)} {selectedToken.symbol}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Top 10 Concentration:</span>
                              <span className="font-medium">{analytics.concentration.toFixed(1)}%</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <h4 className="font-semibold text-foreground">Health Indicators</h4>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Decentralization:</span>
                              <Badge variant={analytics.concentration < 50 ? "default" : "destructive"}>
                                {analytics.concentration < 50 ? "Good" : "Concentrated"}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Holder Diversity:</span>
                              <Badge variant={analytics.totalHolders > 100 ? "default" : "secondary"}>
                                {analytics.totalHolders > 100 ? "High" : "Growing"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
