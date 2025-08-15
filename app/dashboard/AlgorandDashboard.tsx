'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  AlertCircle, 
  Loader2, 
  RefreshCw, 
  TrendingUp, 
  Coins, 
  DollarSign,
  BarChart3,
  Activity
} from 'lucide-react';
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider';
import { useToast } from '@/hooks/use-toast';
import { 
  getAlgorandEnhancedTokenInfo, 
  getAlgorandTransactionHistory, 
  getAlgorandWalletSummary,
  getAlgorandWalletSummaryWithMarketData,
  AlgorandTokenInfo,
  AlgorandTransactionInfo
} from '@/lib/algorand-data';
import { useRealTimeData } from '@/lib/real-time-data';

// Enhanced dashboard components  
import SuperAdvancedAnalytics from '@/components/dashboard/SuperAdvancedAnalytics';
import PerformanceMonitor from '@/components/dashboard/PerformanceMonitor';
import EnhancedTokenManagement from '@/components/dashboard/EnhancedTokenManagement';
import AdvancedAnalytics from '@/components/dashboard/AdvancedAnalytics';

export default function AlgorandDashboard() {
  const { toast } = useToast();
  const { 
    connected, 
    address: walletAddress, 
    selectedNetwork,
    networkConfig
  } = useAlgorandWallet();
  
  // State for tokens, transactions, and wallet summary
  const [tokens, setTokens] = useState<AlgorandTokenInfo[]>([]);
  const [transactions, setTransactions] = useState<AlgorandTransactionInfo[]>([]);
  const [walletSummary, setWalletSummary] = useState({
    totalValue: 0,
    totalTokens: 0,
    recentTransactions: 0,
    algoBalance: 0,
    algoValueUSD: 0,
    portfolioChange24h: 0
  });
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState<'24h' | '7d' | '30d' | '90d' | '1y'>('7d');
  const [superAnalyticsTimeframe, setSuperAnalyticsTimeframe] = useState<'1h' | '24h' | '7d' | '30d' | '90d' | '1y' | 'all'>('7d');
  
  // Real-time data hooks for enhanced dashboard
  const { 
    data: realTimeTokens, 
    loading: realTimeLoading, 
    refresh: refreshRealTimeTokens 
  } = useRealTimeData<AlgorandTokenInfo[]>(
    `tokens:algorand:${walletAddress}`,
    async () => {
      if (!walletAddress) return [];
      const result = await getAlgorandEnhancedTokenInfo(walletAddress, selectedNetwork);
      return result.success ? result.data || [] : [];
    },
    { enabled: !!walletAddress && connected }
  );
  
  const { 
    data: realTimeTransactions, 
    refresh: refreshRealTimeTransactions 
  } = useRealTimeData<AlgorandTransactionInfo[]>(
    `transactions:algorand:${walletAddress}`,
    async () => {
      if (!walletAddress) return [];
      const result = await getAlgorandTransactionHistory(walletAddress, 20, selectedNetwork);
      return result.success ? result.data || [] : [];
    },
    { enabled: !!walletAddress && connected }
  );
  
  // Load and refresh data
  const fetchWalletData = async () => {
    if (!walletAddress || !connected) return;
    
    try {
      setRefreshing(true);
      
      // Fetch wallet summary with market data
      const summaryResult = await getAlgorandWalletSummaryWithMarketData(walletAddress, selectedNetwork);
      if (summaryResult.success && summaryResult.data) {
        setWalletSummary({
          totalValue: summaryResult.data.totalValue || 0,
          totalTokens: summaryResult.data.totalTokens || 0,
          recentTransactions: summaryResult.data.recentTransactions || 0,
          algoBalance: summaryResult.data.algoBalance || 0,
          algoValueUSD: summaryResult.data.algoValueUSD || 0,
          portfolioChange24h: summaryResult.data.portfolioChange24h || 0
        });
      }
      
      // Refresh real-time data
      await Promise.all([
        refreshRealTimeTokens(),
        refreshRealTimeTransactions()
      ]);
      
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      toast({
        title: "Error",
        description: "Failed to refresh wallet data",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Initialize dashboard data on wallet connection
  useEffect(() => {
    if (connected && walletAddress) {
      setLoading(false);
      fetchWalletData();
    } else {
      setLoading(true);
    }
  }, [connected, walletAddress, selectedNetwork]);

  // Update tokens and transactions from real-time data
  useEffect(() => {
    if (realTimeTokens) {
      setTokens(realTimeTokens);
    }
  }, [realTimeTokens]);

  useEffect(() => {
    if (realTimeTransactions) {
      setTransactions(realTimeTransactions);
    }
  }, [realTimeTransactions]);

  useEffect(() => {
    if (connected && walletAddress) {
      setLoading(false);
    }
  }, [connected, walletAddress]);

  // If not connected, show connection prompt
  if (!connected || !walletAddress) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <Card className="glass-card border-primary/30 bg-primary/5">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                <Wallet className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Connect Wallet</h2>
                <p className="text-muted-foreground">
                  Connect your Algorand wallet to access your token dashboard
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-primary mt-0.5" />
                  <div className="text-sm text-primary">
                    <p className="font-semibold mb-1">Connection required:</p>
                    <p>Use the wallet button in the top navigation to connect your Algorand wallet.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Display loading state while data is being fetched initially
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground text-lg font-semibold">Loading Algorand Dashboard...</p>
          <p className="text-muted-foreground mt-2">Fetching your assets and transactions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-6">
        {/* Header */}
        <div className="flex flex-col space-y-3 mb-6 lg:mb-8">
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Algorand Dashboard</h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <span className="truncate">Wallet: {walletAddress.slice(0, 6)}...{walletAddress.slice(-6)}</span>
            </div>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={fetchWalletData}
              disabled={refreshing}
              className="h-8 sm:h-9 text-xs sm:text-sm"
              variant="outline"
            >
              {refreshing ? (
                <>
                  <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
                  <span className="hidden sm:inline">Refreshing...</span>
                  <span className="sm:hidden">...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Refresh Data</span>
                  <span className="sm:hidden">Sync</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Network Badge */}
        <div className="flex items-center justify-center mb-4 sm:mb-6">
          <div className="flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 text-primary border border-primary/30">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mr-1.5 sm:mr-2" style={{ backgroundColor: 'currentColor' }}></span>
            <span className="font-medium text-xs sm:text-sm">
              {networkConfig?.isMainnet ? 'Algorand MainNet' : 'Algorand TestNet'}
            </span>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Summary Cards */}
            <Card className="glass-card">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-foreground text-sm sm:text-base">Wallet Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <div className="text-center">
                    <div className="text-lg sm:text-2xl font-bold text-primary">{walletSummary.totalTokens}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Total Tokens</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg sm:text-2xl font-bold text-primary">${walletSummary.totalValue.toFixed(2)}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Portfolio Value</div>
                    {walletSummary.portfolioChange24h !== 0 && (
                      <div className={`text-xs ${walletSummary.portfolioChange24h > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {walletSummary.portfolioChange24h > 0 ? '+' : ''}${walletSummary.portfolioChange24h.toFixed(2)} (24h)
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <div className="text-lg sm:text-2xl font-bold text-primary">{walletSummary.recentTransactions}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Transactions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg sm:text-2xl font-bold text-primary">{walletSummary.algoBalance.toFixed(3)} ALGO</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      ALGO Balance
                      {walletSummary.algoValueUSD > 0 && (
                        <span className="block text-xs text-gray-500">${walletSummary.algoValueUSD.toFixed(2)} USD</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dashboard Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 h-9 sm:h-10">
                <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
                <TabsTrigger value="tokens" className="text-xs sm:text-sm">Tokens</TabsTrigger>
                <TabsTrigger value="transactions" className="text-xs sm:text-sm">Transactions</TabsTrigger>
                <TabsTrigger value="analytics" className="text-xs sm:text-sm">Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-3 sm:space-y-4">
                <Card className="glass-card">
                  <CardHeader className="pb-3 sm:pb-6">
                    <CardTitle className="text-foreground text-sm sm:text-base">Dashboard Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 sm:p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                          <span className="text-xs sm:text-sm font-medium text-foreground">Token Portfolio</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          Your created and owned tokens
                        </p>
                        <div className="text-base sm:text-lg font-bold text-primary">{tokens.length} tokens</div>
                      </div>
                      
                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 sm:p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                          <span className="text-xs sm:text-sm font-medium text-foreground">Recent Activity</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          Latest transactions
                        </p>
                        <div className="text-base sm:text-lg font-bold text-primary">{transactions.length} recent</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tokens" className="space-y-4">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="text-foreground">Your Tokens</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {realTimeLoading ? (
                      <div className="text-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                        <p className="text-muted-foreground">Loading tokens...</p>
                      </div>
                    ) : tokens.length > 0 ? (
                      <div className="space-y-3">
                        {tokens.slice(0, 5).map((token) => (
                          <div key={token.assetId} className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-primary/20 hover:border-primary/40 transition-colors">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                {token.image ? (
                                  <img src={token.image} alt={token.name} className="w-8 h-8 rounded-full" />
                                ) : (
                                  <Coins className="w-5 h-5 text-primary" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-foreground">{token.name}</p>
                                  <a 
                                    href={token.explorerUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-primary hover:text-primary/80"
                                    title="View on explorer"
                                  >
                                    ↗
                                  </a>
                                </div>
                                <p className="text-sm text-muted-foreground">{token.symbol}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-foreground">{token.uiBalance}</p>
                              <div className="flex flex-col gap-1">
                                <Badge variant={token.verified ? "default" : "secondary"} className="text-xs">
                                  {token.verified ? "Verified" : "Unverified"}
                                </Badge>
                                {token.holders && (
                                  <span className="text-xs text-muted-foreground">
                                    {token.holders} holders
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        {tokens.length > 5 && (
                          <p className="text-center text-sm text-muted-foreground">
                            And {tokens.length - 5} more tokens...
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Coins className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No tokens found. Create some tokens to get started!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="transactions" className="space-y-4">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="text-foreground">Recent Transactions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {transactions.length > 0 ? (
                      <div className="space-y-3">
                        {transactions.slice(0, 10).map((tx) => (
                          <div key={tx.id} className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-primary/20">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                <Activity className="w-4 h-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium text-foreground text-sm">{tx.type}</p>
                                <p className="text-xs text-muted-foreground">
                                  {tx.to && `To: ${tx.to.slice(0, 6)}...${tx.to.slice(-6)}`}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-foreground text-sm">{tx.amount} {tx.token}</p>
                              <Badge variant={tx.status === 'confirmed' ? "default" : "secondary"} className="text-xs">
                                {tx.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No transactions found.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-4">
                <div className="grid grid-cols-1 gap-6">
                  {/* Performance Monitor */}
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="text-foreground flex items-center space-x-2">
                        <BarChart3 className="w-5 h-5" />
                        <span>Performance Monitor</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <PerformanceMonitor 
                        walletAddress={walletAddress}
                        network={selectedNetwork as "algorand" | "solana" | "all"}
                      />
                    </CardContent>
                  </Card>

                  {/* Advanced Analytics */}
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="text-foreground flex items-center space-x-2">
                        <TrendingUp className="w-5 h-5" />
                        <span>Advanced Analytics</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <AdvancedAnalytics 
                        walletAddress={walletAddress}
                        network={selectedNetwork as any}
                        tokens={tokens.map(token => ({
                          ...token,
                          id: token.assetId.toString(),
                          network: 'algorand' as const
                        }))}
                        timeframe={analyticsTimeframe}
                        onTimeframeChange={setAnalyticsTimeframe}
                      />
                    </CardContent>
                  </Card>

                  {/* Super Advanced Analytics */}
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="text-foreground flex items-center space-x-2">
                        <Activity className="w-5 h-5" />
                        <span>Super Advanced Analytics</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <SuperAdvancedAnalytics 
                        walletAddress={walletAddress}
                        network={selectedNetwork as "algorand" | "solana" | "all"}
                        tokens={tokens}
                        timeframe={superAnalyticsTimeframe}
                        onTimeframeChange={setSuperAnalyticsTimeframe}
                      />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Side Panel */}
          <div className="space-y-4 sm:space-y-6">
            {/* Quick Actions */}
            <Card className="glass-card">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-xs sm:text-sm text-foreground">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3">
                <Button
                  onClick={fetchWalletData}
                  disabled={refreshing}
                  className="w-full h-8 sm:h-9 text-xs sm:text-sm"
                  variant="outline"
                >
                  {refreshing ? (
                    <>
                      <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
                      <span className="hidden sm:inline">Refreshing...</span>
                      <span className="sm:hidden">Sync</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Refresh Data</span>
                      <span className="sm:hidden">Sync</span>
                    </>
                  )}
                </Button>
                
                <Button
                  className="w-full h-8 sm:h-9 text-xs sm:text-sm"
                  onClick={() => window.open('/create', '_blank')}
                >
                  <Coins className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Create Token</span>
                  <span className="sm:hidden">Create</span>
                </Button>
              </CardContent>
            </Card>

            {/* Network Info */}
            <Card className="glass-card">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-xs sm:text-sm text-foreground">Network Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3">
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">Network:</span>
                  <span className="text-xs sm:text-sm text-primary font-medium">
                    {networkConfig?.isMainnet ? 'MainNet' : 'TestNet'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">Status:</span>
                  <span className="text-xs sm:text-sm text-green-500 font-medium">Connected</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">Wallet:</span>
                  <span className="text-xs sm:text-sm text-primary font-medium">
                    {walletAddress?.slice(0, 4)}...{walletAddress?.slice(-4)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Real-Time Status */}
            <Card className="glass-card">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-xs sm:text-sm text-foreground">Real-Time Data</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-muted-foreground">Data Status:</span>
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${realTimeLoading ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                    <span className="text-xs sm:text-sm text-primary font-medium">
                      {realTimeLoading ? 'Loading' : 'Live'}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">Last Update:</span>
                  <span className="text-xs sm:text-sm text-primary font-medium">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
