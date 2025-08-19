'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
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
  TrendingDown,
  ArrowUpDown,
  Search,
  RefreshCw,
  Loader2,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Calendar,
  ArrowLeft,
  PieChart
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface SolanaTransaction {
  id: string;
  type: 'send' | 'receive' | 'create' | 'burn' | 'freeze' | 'thaw';
  amount: number;
  token: {
    symbol: string;
    name: string;
    mint: string;
  };
  from: string;
  to: string;
  timestamp: Date;
  signature: string;
  fee: number;
  memo?: string;
  confirmed: boolean;
  slot: number;
}

interface TransactionStats {
  totalTransactions: number;
  totalVolume: number;
  sent: number;
  received: number;
  avgTransactionSize: number;
  peakDay: string;
}

interface SolanaToken {
  mint: string;
  name: string;
  symbol: string;
  balance: number;
  decimals: number;
  uiBalance: number;
  isOwner?: boolean;
}

export default function SolanaTransactionsPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<SolanaTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<SolanaTransaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'send' | 'receive' | 'create'>('all');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [amountFilter, setAmountFilter] = useState({ min: '', max: '' });
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [tokens, setTokens] = useState<SolanaToken[]>([]);
  const [selectedToken, setSelectedToken] = useState<SolanaToken | null>(null);
  const [activeTab, setActiveTab] = useState('recent');
  const { toast } = useToast();
  const { connected, publicKey } = useWallet();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load user's SPL tokens
  const loadTokens = async () => {
    if (!publicKey || !connected) return;

    try {
      setLoading(true);
      // Mock SPL tokens for demonstration
      const mockTokens: SolanaToken[] = [
        {
          mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          name: 'USD Coin',
          symbol: 'USDC',
          balance: 1000000,
          decimals: 6,
          uiBalance: 1000,
          isOwner: false
        },
        {
          mint: 'So11111111111111111111111111111111111111112',
          name: 'Wrapped SOL',
          symbol: 'wSOL',
          balance: 5000000000,
          decimals: 9,
          uiBalance: 5,
          isOwner: false
        },
        {
          mint: `${publicKey.toString().slice(0, 44)}`,
          name: 'My Token',
          symbol: 'MTK',
          balance: 100000000,
          decimals: 6,
          uiBalance: 100,
          isOwner: true
        }
      ];
      
      setTokens(mockTokens);
      if (mockTokens.length > 0 && !selectedToken) {
        setSelectedToken(mockTokens[0]);
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
  const generateMockTransactions = (token: SolanaToken): SolanaTransaction[] => {
    const transactionTypes: SolanaTransaction['type'][] = ['send', 'receive', 'create', 'burn', 'freeze', 'thaw'];
    const mockTransactions: SolanaTransaction[] = [];

    for (let i = 0; i < 75; i++) {
      const type = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
      const amount = Math.random() * 1000;
      const timestamp = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Last 30 days
      
      mockTransactions.push({
        id: `tx_sol_${i + 1}`,
        type,
        amount,
        token: {
          symbol: token.symbol,
          name: token.name,
          mint: token.mint
        },
        from: type === 'receive' ?
          `${Math.random().toString(36).slice(-8).toUpperCase()}...${Math.random().toString(36).slice(-4).toUpperCase()}` :
          publicKey?.toString().slice(0, 8) + '...' + publicKey?.toString().slice(-4) || '',
        to: type === 'send' ?
          `${Math.random().toString(36).slice(-8).toUpperCase()}...${Math.random().toString(36).slice(-4).toUpperCase()}` :
          publicKey?.toString().slice(0, 8) + '...' + publicKey?.toString().slice(-4) || '',
        timestamp,
        signature: `${Math.random().toString(16).slice(2, 18)}...${Math.random().toString(16).slice(2, 6)}`,
        fee: Math.random() * 0.01,
        confirmed: Math.random() > 0.05,
        slot: Math.floor(Math.random() * 1000000) + 150000000,
        memo: Math.random() > 0.8 ? `SPL transaction memo ${i + 1}` : undefined
      });
    }

    return mockTransactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  // Calculate transaction statistics
  const calculateStats = (txs: SolanaTransaction[]): TransactionStats => {
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

  // Export functions
  const exportTransactionsToCSV = () => {
    if (!filteredTransactions.length || !selectedToken) return;

    const csvData = filteredTransactions.map(tx => ({
      'Transaction Signature': tx.signature,
      'Type': tx.type,
      'Amount': tx.amount.toFixed(6),
      'Token Symbol': tx.token.symbol,
      'From': tx.from,
      'To': tx.to,
      'Fee': tx.fee.toFixed(6),
      'Slot': tx.slot,
      'Date': tx.timestamp.toISOString(),
      'Confirmed': tx.confirmed ? 'Yes' : 'No',
      'Memo': tx.memo || ''
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

  // Load transaction data
  const loadTransactionData = async () => {
    if (!selectedToken) return;

    try {
      setRefreshing(true);
      
      // In real implementation, this would call Solana RPC or indexer
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
        tx.signature.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.memo?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredTransactions(filtered);
  }, [transactions, selectedFilter, searchQuery, dateRange, amountFilter]);

  useEffect(() => {
    if (connected && publicKey) {
      loadTokens();
    }
  }, [connected, publicKey]);

  useEffect(() => {
    if (selectedToken) {
      loadTransactionData();
    }
  }, [selectedToken]);

  const getTransactionIcon = (type: SolanaTransaction['type']) => {
    switch (type) {
      case 'send':
        return <ArrowUp className="w-4 h-4 text-red-400" />;
      case 'receive':
        return <ArrowDown className="w-4 h-4 text-green-400" />;
      case 'create':
        return <TrendingUp className="w-4 h-4 text-blue-400" />;
      case 'burn':
        return <TrendingDown className="w-4 h-4 text-orange-400" />;
      default:
        return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTransactionColor = (type: SolanaTransaction['type']) => {
    switch (type) {
      case 'send':
        return 'text-red-400';
      case 'receive':
        return 'text-green-400';
      case 'create':
        return 'text-blue-400';
      case 'burn':
        return 'text-orange-400';
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

  if (!connected || !publicKey) {
    return (
      <DashboardLayout 
        network="solana"
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
                Connect your Solana wallet to view transaction history
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      network="solana"
      walletAddress={publicKey.toBase58()}
      isConnected={connected}
      isAdmin={false}
    >
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/solana">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">SPL Transaction History</h1>
                <p className="text-muted-foreground">Track all SPL token transactions and analytics</p>
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
                <Button
                  onClick={exportTransactionsToCSV}
                  variant="outline"
                  className="hidden sm:flex"
                >
                  📊 CSV
                </Button>
              )}
            </div>
          </div>

          {/* Token Selection */}
          {tokens.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Select SPL Token
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tokens.map((token) => (
                    <button
                      key={token.mint}
                      onClick={() => setSelectedToken(token)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        selectedToken?.mint === token.mint
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
                          {token.isOwner && (
                            <Badge variant="default" className="text-xs mt-1">Creator</Badge>
                          )}
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
                <h3 className="text-xl font-semibold mb-2">No SPL Tokens Found</h3>
                <p className="text-muted-foreground mb-4">
                  Create some SPL tokens first to view transaction history
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
                          placeholder="Search by transaction signature, address, or memo..."
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
                        {filteredTransactions.slice(0, 25).map((tx) => (
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
                                  {tx.signature}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(tx.timestamp)}
                                  <span>• Slot: {tx.slot}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <p className={`font-semibold ${getTransactionColor(tx.type)}`}>
                                {tx.type === 'send' ? '-' : '+'}{tx.amount.toFixed(2)} {tx.token.symbol}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Fee: {tx.fee.toFixed(4)} SOL
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
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PieChart className="w-5 h-5" />
                        Analytics Coming Soon
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-12">
                        <PieChart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          Advanced analytics and charts will be available in a future update
                        </p>
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
