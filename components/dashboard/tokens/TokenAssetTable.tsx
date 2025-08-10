'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  Download, 
  Upload, 
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  Coins,
  RefreshCw,
  Plus,
  ArrowUpDown,
  Eye,
  Settings,
  Send,
  BarChart3,
  Flame,
  Lock,
  Unlock
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface UserToken {
  id: string;
  name: string;
  symbol: string;
  network: 'algorand' | 'solana';
  icon?: string;
  totalSupply: number;
  circulatingSupply: number;
  holders: number;
  price: number;
  marketCap: number;
  change24h: number;
  volume24h: number;
  status: 'active' | 'paused' | 'frozen';
  decimals: number;
  contractAddress: string;
  createdAt: Date;
  lastActivity: Date;
  canManage: boolean;
  canFreeze: boolean;
  canBurn: boolean;
}

interface TokenAssetTableProps {
  network: 'algorand' | 'solana';
  tokens: UserToken[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onTokenAction?: (action: string, token: UserToken) => void;
}

type SortField = 'name' | 'marketCap' | 'holders' | 'change24h' | 'createdAt';
type SortDirection = 'asc' | 'desc';

export function TokenAssetTable({ 
  network, 
  tokens, 
  isLoading = false, 
  onRefresh,
  onTokenAction 
}: TokenAssetTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'frozen'>('all');
  const [sortField, setSortField] = useState<SortField>('marketCap');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

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

  const filteredAndSortedTokens = useMemo(() => {
    let filtered = tokens.filter(token => {
      const matchesSearch = token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           token.symbol.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || token.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'createdAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [tokens, searchTerm, statusFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Paused</Badge>;
      case 'frozen':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Frozen</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatNumber = (num: number, compact = false) => {
    if (compact && num >= 1e9) {
      return (num / 1e9).toFixed(1) + 'B';
    }
    if (compact && num >= 1e6) {
      return (num / 1e6).toFixed(1) + 'M';
    }
    if (compact && num >= 1e3) {
      return (num / 1e3).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  };

  const formatPrice = (price: number) => {
    if (price < 0.01) {
      return `$${price.toFixed(6)}`;
    }
    return `$${price.toFixed(2)}`;
  };

  const portfolioStats = {
    totalValue: tokens.reduce((sum, token) => sum + token.marketCap, 0),
    totalTokens: tokens.length,
    activeTokens: tokens.filter(t => t.status === 'active').length,
    totalHolders: tokens.reduce((sum, token) => sum + token.holders, 0)
  };

  return (
    <div className="space-y-6">
      {/* Portfolio Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Market Cap</p>
                <p className="text-2xl font-bold">${formatNumber(portfolioStats.totalValue, true)}</p>
              </div>
              <TrendingUp className={`w-8 h-8 ${info.color}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tokens</p>
                <p className="text-2xl font-bold">{portfolioStats.totalTokens}</p>
              </div>
              <Coins className={`w-8 h-8 ${info.color}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Tokens</p>
                <p className="text-2xl font-bold">{portfolioStats.activeTokens}</p>
              </div>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 px-2">
                {Math.round((portfolioStats.activeTokens / portfolioStats.totalTokens) * 100)}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Holders</p>
                <p className="text-2xl font-bold">{formatNumber(portfolioStats.totalHolders)}</p>
              </div>
              <BarChart3 className={`w-8 h-8 ${info.color}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Token Management Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Coins className="w-5 h-5" />
              Token Portfolio
              <Badge className={`${info.bgColor} ${info.color} ${info.borderColor} border`}>
                {info.name}
              </Badge>
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Create Token
              </Button>
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex items-center gap-4 mt-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search tokens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="frozen">Frozen</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Token</TableHead>
                <TableHead 
                  className="cursor-pointer hover:text-foreground"
                  onClick={() => handleSort('marketCap')}
                >
                  <div className="flex items-center gap-1">
                    Market Cap
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead className="text-right">Supply</TableHead>
                <TableHead 
                  className="cursor-pointer hover:text-foreground text-right"
                  onClick={() => handleSort('holders')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Holders
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead 
                  className="cursor-pointer hover:text-foreground text-right"
                  onClick={() => handleSort('change24h')}
                >
                  <div className="flex items-center justify-end gap-1">
                    24h Change
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Loading tokens...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredAndSortedTokens.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {tokens.length === 0 ? 'No tokens created yet' : 'No tokens match your filters'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedTokens.map((token) => (
                  <TableRow key={token.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                          {token.icon ? (
                            <img src={token.icon} alt={token.symbol} className="w-full h-full rounded-full" />
                          ) : (
                            <Coins className="w-4 h-4 text-primary" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{token.symbol}</div>
                          <div className="text-sm text-muted-foreground">{token.name}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono">
                        ${formatNumber(token.marketCap, true)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Vol: ${formatNumber(token.volume24h, true)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-mono">
                        {formatNumber(token.circulatingSupply, true)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        of {formatNumber(token.totalSupply, true)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatNumber(token.holders)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatPrice(token.price)}
                    </TableCell>
                    <TableCell className={`text-right font-mono ${
                      token.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      <div className="flex items-center justify-end gap-1">
                        {token.change24h >= 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(token.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onTokenAction?.('view', token)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onTokenAction?.('analytics', token)}>
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Analytics
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onTokenAction?.('transfer', token)}>
                            <Send className="w-4 h-4 mr-2" />
                            Transfer
                          </DropdownMenuItem>
                          {token.canManage && (
                            <DropdownMenuItem onClick={() => onTokenAction?.('manage', token)}>
                              <Settings className="w-4 h-4 mr-2" />
                              Manage
                            </DropdownMenuItem>
                          )}
                          {token.canFreeze && (
                            <DropdownMenuItem onClick={() => onTokenAction?.('freeze', token)}>
                              {token.status === 'frozen' ? (
                                <>
                                  <Unlock className="w-4 h-4 mr-2" />
                                  Unfreeze
                                </>
                              ) : (
                                <>
                                  <Lock className="w-4 h-4 mr-2" />
                                  Freeze
                                </>
                              )}
                            </DropdownMenuItem>
                          )}
                          {token.canBurn && (
                            <DropdownMenuItem 
                              onClick={() => onTokenAction?.('burn', token)}
                              className="text-red-400 focus:text-red-400"
                            >
                              <Flame className="w-4 h-4 mr-2" />
                              Burn Tokens
                            </DropdownMenuItem>
                          )}
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
  );
}
