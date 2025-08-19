'use client';

import { useState, useEffect } from 'react';
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider';
import { DashboardLayout } from '@/components/dashboard/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  TrendingUp, 
  ArrowUpDown, 
  Search,
  RefreshCw,
  Loader2,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Calendar,
  ArrowLeft,
  Filter,
  Download,
  PieChart,
  TrendingDown
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAlgorandEnhancedTokenInfo } from '@/lib/algorand-data';
import Link from 'next/link';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
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

interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'create' | 'destroy' | 'freeze' | 'unfreeze';
  amount: number;
  token: {
    symbol: string;
    name: string;
    assetId: string;
  };
  from: string;
  to: string;
  timestamp: Date;
  txHash: string;
  fee: number;
  note?: string;
  confirmed: boolean;
}

interface TransactionStats {
  totalTransactions: number;
  totalVolume: number;
  sent: number;
  received: number;
  avgTransactionSize: number;
  peakDay: string;
}

export default function AlgorandTransactionsPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'send' | 'receive' | 'create'>('all');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [amountFilter, setAmountFilter] = useState({ min: '', max: '' });
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [tokens, setTokens] = useState<any[]>([]);
  const [selectedToken, setSelectedToken] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('recent');

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

  // Generate mock transaction data
  const generateMockTransactions = (token: any): Transaction[] => {
    const transactionTypes: Transaction['type'][] = ['send', 'receive', 'create', 'freeze', 'unfreeze'];
    const mockTransactions: Transaction[] = [];

    for (let i = 0; i < 50; i++) {
      const type = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
      const amount = Math.random() * 1000;
      const timestamp = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Last 30 days
      
      mockTransactions.push({
        id: `tx_${i + 1}`,
        type,
        amount,
        token: {
          symbol: token.symbol,
          name: token.name,
          assetId: token.assetId
        },
        from: type === 'receive' ? `${Math.random().toString(36).slice(-8).toUpperCase()}...${Math.random().toString(36).slice(-4).toUpperCase()}` : walletAddress?.slice(0, 8) + '...' + walletAddress?.slice(-4) || '',
        to: type === 'send' ? `${Math.random().toString(36).slice(-8).toUpperCase()}...${Math.random().toString(36).slice(-4).toUpperCase()}` : walletAddress?.slice(0, 8) + '...' + walletAddress?.slice(-4) || '',
        timestamp,
        txHash: `0x${Math.random().toString(16).slice(2, 18)}...${Math.random().toString(16).slice(2, 6)}`,
        fee: Math.random() * 0.01,
        confirmed: Math.random() > 0.1,
        note: Math.random() > 0.7 ? `Transaction note ${i + 1}` : undefined
      });
    }

    return mockTransactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  // Calculate transaction statistics
  const calculateStats = (txs: Transaction[]): TransactionStats => {
    const sent = txs.filter(tx => tx.type === 'send').reduce((sum, tx) => sum + tx.amount, 0);
    const received = txs.filter(tx => tx.type === 'receive').reduce((sum, tx) => sum + tx.amount, 0);
    const totalVolume = sent + received;
    const avgTransactionSize = totalVolume / txs.length || 0;
    
    // Find peak day
    const dailyVolume: { [key: string]: number } = {};
    txs.forEach(tx => {
      const day = tx.timestamp.toISOString().split('T')[0];
      dailyVolume[day] = (dailyVolume[day] || 0) + tx.amount;
    });
    
    const peakDay = Object.entries(dailyVolume).reduce((a, b) => 
      dailyVolume[a[0]] > dailyVolume[b[0]] ? a : b
    )[0] || new Date().toISOString().split('T')[0];

    return {
      totalTransactions: txs.length,
      totalVolume,
      sent,
      received,
      avgTransactionSize,
      peakDay
    };
  };

  // Prepare chart data
  const getVolumeChartData = () => {
    if (!transactions.length) return [];
    
    // Group transactions by day and calculate daily volume
    const dailyData: { [key: string]: { date: string; volume: number; count: number; sent: number; received: number } } = {};
    
    transactions.forEach(tx => {
      const date = tx.timestamp.toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { date, volume: 0, count: 0, sent: 0, received: 0 };
      }
      dailyData[date].volume += tx.amount;
      dailyData[date].count += 1;
      if (tx.type === 'send') dailyData[date].sent += tx.amount;
      if (tx.type === 'receive') dailyData[date].received += tx.amount;
    });

    return Object.values(dailyData)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-14); // Last 14 days
  };

  const getTransactionTypeChartData = () => {
    if (!transactions.length) return [];
    
    const typeCounts = transactions.reduce((acc, tx) => {
      acc[tx.type] = (acc[tx.type] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const colors = {
      send: '#ef4444',
      receive: '#10b981',
      create: '#3b82f6',
      freeze: '#f59e0b',
      unfreeze: '#8b5cf6',
      destroy: '#6b7280'
    };

    return Object.entries(typeCounts).map(([type, count]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: count,
      color: colors[type as keyof typeof colors] || '#6b7280',
      percentage: ((count / transactions.length) * 100).toFixed(1)
    }));
  };

  const getHourlyActivityData = () => {
    if (!transactions.length) return [];
    
    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      transactions: 0,
      volume: 0
    }));

    transactions.forEach(tx => {
      const hour = tx.timestamp.getHours();
      hourlyData[hour].transactions += 1;
      hourlyData[hour].volume += tx.amount;
    });

    return hourlyData;
  };

  // Export functions
  const exportTransactionsToCSV = () => {
    if (!filteredTransactions.length || !selectedToken) return;

    const csvData = filteredTransactions.map(tx => ({
      'Transaction Hash': tx.txHash,
      'Type': tx.type,
      'Amount': tx.amount.toFixed(6),
      'Token Symbol': tx.token.symbol,
      'From': tx.from,
      'To': tx.to,
      'Fee': tx.fee.toFixed(6),
      'Date': tx.timestamp.toISOString(),
      'Confirmed': tx.confirmed ? 'Yes' : 'No',
      'Note': tx.note || ''
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
    link.setAttribute('download', `${selectedToken.symbol}_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: `Exported ${filteredTransactions.length} transactions to CSV`,
    });
  };

  const exportTransactionsToJSON = () => {
    if (!filteredTransactions.length || !selectedToken || !stats) return;

    const exportData = {
      metadata: {
        tokenName: selectedToken.name,
        tokenSymbol: selectedToken.symbol,
        assetId: selectedToken.assetId,
        exportDate: new Date().toISOString(),
        totalTransactions: stats.totalTransactions,
        filters: {
          type: selectedFilter,
          searchQuery: searchQuery
        }
      },
      analytics: {
        totalTransactions: stats.totalTransactions,
        totalVolume: stats.totalVolume,
        sent: stats.sent,
        received: stats.received,
        avgTransactionSize: stats.avgTransactionSize,
        peakDay: stats.peakDay
      },
      chartData: {
        volumeOverTime: getVolumeChartData(),
        transactionTypes: getTransactionTypeChartData(),
        hourlyActivity: getHourlyActivityData()
      },
      transactions: filteredTransactions.map(tx => ({
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        token: tx.token,
        from: tx.from,
        to: tx.to,
        timestamp: tx.timestamp.toISOString(),
        txHash: tx.txHash,
        fee: tx.fee,
        note: tx.note,
        confirmed: tx.confirmed
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedToken.symbol}_transaction_analysis_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: `Exported complete transaction analysis to JSON`,
    });
  };

  // Load transaction data
  const loadTransactionData = async () => {
    if (!selectedToken) return;

    try {
      setRefreshing(true);
      
      // In real implementation, this would call Algorand Explorer API
      const mockTransactions = generateMockTransactions(selectedToken);
      setTransactions(mockTransactions);
      setFilteredTransactions(mockTransactions);
      setStats(calculateStats(mockTransactions));
      
      toast({
        title: "Data Updated",
        description: `Loaded transactions for ${selectedToken.symbol}`,
      });
      
    } catch (error) {
      console.error('Error loading transaction data:', error);
      toast({
        title: "Error",
        description: "Failed to load transaction data",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Filter transactions
  useEffect(() => {
    let filtered = transactions;

    // Apply date range filter
    if (dateRange !== 'all') {
      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      filtered = filtered.filter(tx => tx.timestamp >= cutoffDate);
    }

    // Apply type filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(tx => tx.type === selectedFilter);
    }

    // Apply amount filter
    if (amountFilter.min || amountFilter.max) {
      filtered = filtered.filter(tx => {
        const min = parseFloat(amountFilter.min) || 0;
        const max = parseFloat(amountFilter.max) || Infinity;
        return tx.amount >= min && tx.amount <= max;
      });
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(tx => 
        tx.txHash.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.note?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredTransactions(filtered);
  }, [transactions, selectedFilter, searchQuery, dateRange, amountFilter]);

  useEffect(() => {
    if (connected && walletAddress) {
      loadTokens();
    }
  }, [connected, walletAddress, selectedNetwork]);

  useEffect(() => {
    if (selectedToken) {
      loadTransactionData();
    }
  }, [selectedToken]);

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'send':
        return <ArrowUp className="w-4 h-4 text-red-400" />;
      case 'receive':
        return <ArrowDown className="w-4 h-4 text-green-400" />;
      case 'create':
        return <TrendingUp className="w-4 h-4 text-blue-400" />;
      default:
        return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTransactionColor = (type: Transaction['type']) => {
    switch (type) {
      case 'send':
        return 'text-red-400';
      case 'receive':
        return 'text-green-400';
      case 'create':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

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
              <Activity className="w-16 h-16 mx-auto text-primary mb-4" />
              <CardTitle>Connect Wallet</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center">
                Connect your Algorand wallet to view transaction history
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
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Transaction History</h1>
                <p className="text-muted-foreground">Track all token transactions and analytics</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={loadTransactionData}
                disabled={refreshing || !selectedToken}
                variant="outline"
              >
                {refreshing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Refresh
              </Button>

              {/* Export Buttons */}
              {filteredTransactions.length > 0 && (
                <>
                  <Button
                    onClick={exportTransactionsToCSV}
                    variant="outline"
                    className="hidden sm:flex"
                  >
                    📊 CSV
                  </Button>
                  <Button
                    onClick={exportTransactionsToJSON}
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
                  <Activity className="w-5 h-5" />
                  Select Token
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
                          <Activity className="w-5 h-5 text-primary" />
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
              <p className="text-muted-foreground">Loading transaction data...</p>
            </div>
          )}

          {/* No Tokens */}
          {!loading && tokens.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Activity className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No Tokens Found</h3>
                <p className="text-muted-foreground mb-4">
                  Create some tokens first to view transaction history
                </p>
                <Link href="/create">
                  <Button className="bg-primary hover:bg-primary/90">
                    Create Your First Token
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Transaction Dashboard */}
          {selectedToken && stats && (
            <div className="space-y-6">
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Activity className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Transactions</p>
                        <p className="text-2xl font-bold text-foreground">{stats.totalTransactions}</p>
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
                        <p className="text-sm text-muted-foreground">Total Volume</p>
                        <p className="text-2xl font-bold text-foreground">{stats.totalVolume.toFixed(2)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                        <ArrowUp className="w-6 h-6 text-red-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Sent</p>
                        <p className="text-2xl font-bold text-foreground">{stats.sent.toFixed(2)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <ArrowDown className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Received</p>
                        <p className="text-2xl font-bold text-foreground">{stats.received.toFixed(2)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Search and Filters */}
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Search Bar */}
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          placeholder="Search by transaction hash, address, or note..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    {/* Filter Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Transaction Type Filter */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Transaction Type</Label>
                        <div className="flex flex-wrap gap-1">
                          {(['all', 'send', 'receive', 'create'] as const).map((filter) => (
                            <Button
                              key={filter}
                              variant={selectedFilter === filter ? "default" : "outline"}
                              size="sm"
                              onClick={() => setSelectedFilter(filter)}
                              className="text-xs"
                            >
                              {filter.charAt(0).toUpperCase() + filter.slice(1)}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Date Range Filter */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Date Range</Label>
                        <div className="flex flex-wrap gap-1">
                          {([
                            { value: '7d', label: '7 Days' },
                            { value: '30d', label: '30 Days' },
                            { value: '90d', label: '90 Days' },
                            { value: 'all', label: 'All Time' }
                          ] as const).map((range) => (
                            <Button
                              key={range.value}
                              variant={dateRange === range.value ? "default" : "outline"}
                              size="sm"
                              onClick={() => setDateRange(range.value)}
                              className="text-xs"
                            >
                              {range.label}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Amount Range Filter */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Amount Range ({selectedToken?.symbol})</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Min"
                            type="number"
                            value={amountFilter.min}
                            onChange={(e) => setAmountFilter(prev => ({ ...prev, min: e.target.value }))}
                            className="text-xs"
                          />
                          <Input
                            placeholder="Max"
                            type="number"
                            value={amountFilter.max}
                            onChange={(e) => setAmountFilter(prev => ({ ...prev, max: e.target.value }))}
                            className="text-xs"
                          />
                        </div>
                      </div>

                      {/* Filter Summary & Clear */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Active Filters</Label>
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">
                            Showing {filteredTransactions.length} of {transactions.length} transactions
                          </div>
                          {(selectedFilter !== 'all' || dateRange !== 'all' || searchQuery || amountFilter.min || amountFilter.max) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedFilter('all');
                                setDateRange('all');
                                setSearchQuery('');
                                setAmountFilter({ min: '', max: '' });
                              }}
                              className="text-xs h-6 px-2"
                            >
                              Clear All
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Transaction List */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="recent">Recent</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>

                <TabsContent value="recent" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        Transaction History ({filteredTransactions.length} transactions)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {filteredTransactions.slice(0, 20).map((tx) => (
                          <div
                            key={tx.id}
                            className="flex items-center justify-between p-4 bg-background/50 rounded-lg border hover:bg-background/80 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                {getTransactionIcon(tx.type)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-foreground">
                                    {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                                  </p>
                                  <Badge 
                                    variant={tx.confirmed ? "default" : "secondary"}
                                    className="text-xs"
                                  >
                                    {tx.confirmed ? "Confirmed" : "Pending"}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground font-mono">
                                  {tx.txHash}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(tx.timestamp)}
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <p className={`font-semibold ${getTransactionColor(tx.type)}`}>
                                {tx.type === 'send' ? '-' : '+'}{tx.amount.toFixed(2)} {tx.token.symbol}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Fee: {tx.fee.toFixed(4)} ALGO
                              </p>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <span>{tx.type === 'send' ? 'To' : 'From'}:</span>
                                <span className="font-mono">{tx.type === 'send' ? tx.to : tx.from}</span>
                                <ExternalLink className="w-3 h-3" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {filteredTransactions.length === 0 && (
                        <div className="text-center py-8">
                          <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                          <p className="text-muted-foreground">No transactions found</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Volume Over Time Chart */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="w-5 h-5" />
                          Volume Over Time (14 Days)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={getVolumeChartData()}>
                              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                              <XAxis 
                                dataKey="date" 
                                className="text-muted-foreground"
                                fontSize={12}
                                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              />
                              <YAxis 
                                className="text-muted-foreground"
                                fontSize={12}
                                tickFormatter={(value) => `${value.toFixed(0)}`}
                              />
                              <Tooltip 
                                content={({ active, payload, label }) => {
                                  if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                                        <p className="font-medium text-foreground">
                                          {new Date(label).toLocaleDateString()}
                                        </p>
                                        <p className="text-sm text-primary">
                                          Volume: {data.volume.toFixed(2)} {selectedToken?.symbol}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                          Transactions: {data.count}
                                        </p>
                                        <div className="flex gap-4 mt-2 text-xs">
                                          <span className="text-green-500">Received: {data.received.toFixed(2)}</span>
                                          <span className="text-red-500">Sent: {data.sent.toFixed(2)}</span>
                                        </div>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Area
                                type="monotone"
                                dataKey="volume"
                                stroke="#3b82f6"
                                fill="#3b82f6"
                                fillOpacity={0.2}
                                strokeWidth={2}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Transaction Types Chart */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <PieChart className="w-5 h-5" />
                          Transaction Types
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                              <Pie
                                data={getTransactionTypeChartData()}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={100}
                                paddingAngle={2}
                                dataKey="value"
                              >
                                {getTransactionTypeChartData().map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip 
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                                        <p className="font-medium text-foreground">{data.name}</p>
                                        <p className="text-sm text-primary">{data.value} transactions</p>
                                        <p className="text-sm text-muted-foreground">{data.percentage}% of total</p>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Legend />
                            </RechartsPieChart>
                          </ResponsiveContainer>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 mt-4">
                          {getTransactionTypeChartData().map((type, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: type.color }}
                              ></div>
                              <span className="text-sm text-muted-foreground">{type.name}: {type.value}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Activity Heatmap */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        24-Hour Activity Pattern
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsBarChart data={getHourlyActivityData()}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                            <XAxis 
                              dataKey="hour" 
                              className="text-muted-foreground"
                              fontSize={12}
                            />
                            <YAxis 
                              className="text-muted-foreground"
                              fontSize={12}
                            />
                            <Tooltip 
                              content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  return (
                                    <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                                      <p className="font-medium text-foreground">Hour: {label}</p>
                                      <p className="text-sm text-primary">Transactions: {data.transactions}</p>
                                      <p className="text-sm text-muted-foreground">
                                        Volume: {data.volume.toFixed(2)} {selectedToken?.symbol}
                                      </p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Bar 
                              dataKey="transactions" 
                              fill="#8b5cf6"
                              radius={[2, 2, 0, 0]}
                            />
                          </RechartsBarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Detailed Analytics */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Transaction Analytics Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-4">
                          <h4 className="font-semibold text-foreground">Volume Analysis</h4>
                          <div className="space-y-3">
                            <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
                              <span className="text-muted-foreground">Average Transaction:</span>
                              <span className="font-medium">{stats?.avgTransactionSize.toFixed(2)} {selectedToken?.symbol}</span>
                            </div>
                            <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
                              <span className="text-muted-foreground">Peak Day:</span>
                              <span className="font-medium">{stats?.peakDay ? new Date(stats.peakDay).toLocaleDateString() : 'N/A'}</span>
                            </div>
                            <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
                              <span className="text-muted-foreground">Net Flow:</span>
                              <span className={`font-medium ${(stats?.received || 0) > (stats?.sent || 0) ? 'text-green-400' : 'text-red-400'}`}>
                                {((stats?.received || 0) - (stats?.sent || 0)).toFixed(2)} {selectedToken?.symbol}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <h4 className="font-semibold text-foreground">Activity Summary</h4>
                          <div className="space-y-3">
                            <div className="p-3 bg-blue-500/10 rounded-lg border-l-4 border-blue-500">
                              <p className="text-blue-700 dark:text-blue-300 font-medium">
                                {stats?.totalTransactions} Total Transactions
                              </p>
                              <p className="text-blue-600 dark:text-blue-400 text-sm">
                                {stats?.totalVolume.toFixed(2)} {selectedToken?.symbol} total volume
                              </p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <div className="p-2 bg-green-500/10 rounded text-center">
                                <p className="text-green-700 dark:text-green-300 font-medium text-sm">Received</p>
                                <p className="text-green-600 dark:text-green-400 text-xs">
                                  {stats?.received.toFixed(2)} {selectedToken?.symbol}
                                </p>
                              </div>
                              <div className="p-2 bg-red-500/10 rounded text-center">
                                <p className="text-red-700 dark:text-red-300 font-medium text-sm">Sent</p>
                                <p className="text-red-600 dark:text-red-400 text-xs">
                                  {stats?.sent.toFixed(2)} {selectedToken?.symbol}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="font-semibold text-foreground">Transaction Breakdown</h4>
                          <div className="space-y-2">
                            {(['send', 'receive', 'create'] as const).map((type) => {
                              const count = transactions.filter(tx => tx.type === type).length;
                              const percentage = transactions.length > 0 ? (count / transactions.length * 100).toFixed(1) : '0';
                              return (
                                <div key={type} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                                  <span className="text-sm text-muted-foreground capitalize flex items-center gap-2">
                                    {getTransactionIcon(type)}
                                    {type}:
                                  </span>
                                  <Badge variant="secondary" className="text-xs">
                                    {count} ({percentage}%)
                                  </Badge>
                                </div>
                              );
                            })}
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
