'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Send, 
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  Coins,
  DollarSign,
  Wallet,
  Activity,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface UnifiedAsset {
  id: string;
  symbol: string;
  name: string;
  network: 'algorand' | 'solana';
  icon?: string;
  balance: number;
  available: number;
  inOrder: number;
  usdValue: number;
  price: number;
  change24h: number;
  decimals: number;
  isNative?: boolean;
}

interface NetworkStats {
  totalBalance: number;
  totalAssets: number;
  networkHealth: 'online' | 'degraded' | 'offline';
}

export default function UnifiedAssetsDashboard() {
  const [mounted, setMounted] = useState(false);
  const [assets, setAssets] = useState<UnifiedAsset[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState<'all' | 'algorand' | 'solana'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'balance' | 'value'>('value');
  const [isLoading, setIsLoading] = useState(true);

  // Wallet connections
  const { connected: solanaConnected, publicKey } = useWallet();
  const { connected: algorandConnected, address: algorandAddress } = useAlgorandWallet();

  // Portfolio stats
  const [portfolioStats, setPortfolioStats] = useState({
    totalValue: 0,
    totalAssets: 0,
    change24h: 0,
    algorand: { totalBalance: 0, totalAssets: 0, networkHealth: 'online' as const },
    solana: { totalBalance: 0, totalAssets: 0, networkHealth: 'online' as const }
  });

  useEffect(() => {
    setMounted(true);
    loadAssets();
  }, [algorandConnected, solanaConnected]);

  const loadAssets = async () => {
    setIsLoading(true);
    try {
      const allAssets: UnifiedAsset[] = [];
      
      // Load Algorand assets
      if (algorandConnected && algorandAddress) {
        // Mock Algorand assets - replace with actual API calls
        const algorandAssets: UnifiedAsset[] = [
          {
            id: 'algo-native',
            symbol: 'ALGO',
            name: 'Algorand',
            network: 'algorand',
            balance: 100.5,
            available: 95.2,
            inOrder: 5.3,
            usdValue: 45.67,
            price: 0.455,
            change24h: 2.5,
            decimals: 6,
            isNative: true
          }
        ];
        allAssets.push(...algorandAssets);
      }

      // Load Solana assets
      if (solanaConnected && publicKey) {
        // Mock Solana assets - replace with actual API calls
        const solanaAssets: UnifiedAsset[] = [
          {
            id: 'sol-native',
            symbol: 'SOL',
            name: 'Solana',
            network: 'solana',
            balance: 25.8,
            available: 25.8,
            inOrder: 0,
            usdValue: 125.4,
            price: 4.86,
            change24h: -1.2,
            decimals: 9,
            isNative: true
          }
        ];
        allAssets.push(...solanaAssets);
      }

      setAssets(allAssets);
      
      // Calculate portfolio stats
      const totalValue = allAssets.reduce((sum, asset) => sum + asset.usdValue, 0);
      const totalAssets = allAssets.length;
      const weightedChange = allAssets.reduce((sum, asset) => 
        sum + (asset.change24h * asset.usdValue), 0) / totalValue;

      setPortfolioStats({
        totalValue,
        totalAssets,
        change24h: weightedChange || 0,
        algorand: {
          totalBalance: allAssets.filter(a => a.network === 'algorand').reduce((sum, a) => sum + a.usdValue, 0),
          totalAssets: allAssets.filter(a => a.network === 'algorand').length,
          networkHealth: 'online'
        },
        solana: {
          totalBalance: allAssets.filter(a => a.network === 'solana').reduce((sum, a) => sum + a.usdValue, 0),
          totalAssets: allAssets.filter(a => a.network === 'solana').length,
          networkHealth: 'online'
        }
      });

    } catch (error) {
      console.error('Error loading assets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesNetwork = selectedNetwork === 'all' || asset.network === selectedNetwork;
    return matchesSearch && matchesNetwork;
  });

  const getNetworkColor = (network: string) => {
    return network === 'algorand' ? 'text-green-400' : 'text-purple-400';
  };

  const getNetworkBadge = (network: string) => {
    return network === 'algorand' 
      ? <Badge className="bg-green-500/20 text-green-400 border-green-500/30">ALGO</Badge>
      : <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">SOL</Badge>;
  };

  if (!mounted) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  if (!algorandConnected && !solanaConnected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <Wallet className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <CardTitle>Connect Wallet</CardTitle>
            <p className="text-muted-foreground">Connect at least one wallet to view your assets</p>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Portfolio Overview Header */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Portfolio Value</CardTitle>
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold text-foreground">
                  ${portfolioStats.totalValue.toFixed(2)}
                </div>
                <div className={`flex items-center gap-1 text-sm ${
                  portfolioStats.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {portfolioStats.change24h >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {portfolioStats.change24h.toFixed(2)}%
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Deposit
                </Button>
                <Button variant="outline" className="flex-1">
                  <Upload className="w-4 h-4 mr-2" />
                  Withdraw
                </Button>
                <Button variant="outline" className="flex-1">
                  <Send className="w-4 h-4 mr-2" />
                  Transfer
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Assets</CardTitle>
              <div className="text-2xl font-bold text-foreground">{portfolioStats.totalAssets}</div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-400">Algorand:</span>
                  <span>{portfolioStats.algorand.totalAssets}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-400">Solana:</span>
                  <span>{portfolioStats.solana.totalAssets}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Network Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-green-400">Algorand</span>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Online</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-purple-400">Solana</span>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Online</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assets Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Assets Portfolio</CardTitle>
              <Button variant="outline" size="sm" onClick={loadAssets}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
            
            {/* Filters and Search */}
            <div className="flex items-center gap-4 mt-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search assets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={selectedNetwork === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedNetwork('all')}
                >
                  All
                </Button>
                <Button
                  variant={selectedNetwork === 'algorand' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedNetwork('algorand')}
                  className="text-green-400 border-green-500/30"
                >
                  Algorand
                </Button>
                <Button
                  variant={selectedNetwork === 'solana' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedNetwork('solana')}
                  className="text-purple-400 border-purple-500/30"
                >
                  Solana
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Network</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Available</TableHead>
                  <TableHead className="text-right">In Order</TableHead>
                  <TableHead className="text-right">USD Value</TableHead>
                  <TableHead className="text-right">24h Change</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Loading assets...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredAssets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No assets found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAssets.map((asset) => (
                    <TableRow key={asset.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                            <Coins className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{asset.symbol}</div>
                            <div className="text-sm text-muted-foreground">{asset.name}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getNetworkBadge(asset.network)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {asset.balance.toFixed(asset.decimals > 6 ? 6 : asset.decimals)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {asset.available.toFixed(asset.decimals > 6 ? 6 : asset.decimals)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {asset.inOrder.toFixed(asset.decimals > 6 ? 6 : asset.decimals)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${asset.usdValue.toFixed(2)}
                      </TableCell>
                      <TableCell className={`text-right font-mono ${
                        asset.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Send className="w-4 h-4 mr-2" />
                              Transfer
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="w-4 h-4 mr-2" />
                              Deposit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Upload className="w-4 h-4 mr-2" />
                              Withdraw
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <BarChart3 className="w-4 h-4 mr-2" />
                              Analytics
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
