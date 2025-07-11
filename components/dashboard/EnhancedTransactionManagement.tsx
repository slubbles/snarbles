'use client';

import { useState, useEffect, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  Filter, 
  Download, 
  Calendar, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  ExternalLink, 
  Copy, 
  MoreHorizontal,
  Eye,
  FileText,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Activity,
  CheckCircle,
  AlertCircle,
  Clock,
  Send,
  Plus,
  Flame,
  Pause,
  Play,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { NetworkType } from './EnhancedTokenManagement';

// Transaction interface
export interface EnhancedTransaction {
  id: string;
  signature: string;
  type: 'mint' | 'burn' | 'transfer' | 'pause' | 'unpause' | 'freeze' | 'unfreeze' | 'create' | 'swap' | 'payment';
  category: 'token_operation' | 'trading' | 'defi' | 'nft' | 'governance' | 'other';
  status: 'confirmed' | 'pending' | 'failed' | 'finalized';
  amount: number;
  token: string;
  tokenSymbol: string;
  tokenName: string;
  timestamp: number;
  from?: string;
  to?: string;
  fee: number;
  feeToken: string;
  usdValue?: number;
  note?: string;
  network: NetworkType;
  explorerUrl: string;
  gasUsed?: number;
  priorityFee?: number;
  confirmations?: number;
}

// Filter options
export interface TransactionFilter {
  search: string;
  types: string[];
  categories: string[];
  statuses: string[];
  tokens: string[];
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  amountRange: {
    min: number | null;
    max: number | null;
  };
  direction: 'all' | 'incoming' | 'outgoing';
}

// Sort options
export interface SortOption {
  field: 'timestamp' | 'amount' | 'fee' | 'token' | 'type';
  direction: 'asc' | 'desc';
}

// Props interface
interface EnhancedTransactionManagementProps {
  transactions: EnhancedTransaction[];
  network: NetworkType;
  walletAddress: string;
  loading?: boolean;
  onRefresh: () => void;
  onExport?: (transactions: EnhancedTransaction[], format: 'csv' | 'json') => void;
}

export default function EnhancedTransactionManagement({
  transactions,
  network,
  walletAddress,
  loading = false,
  onRefresh,
  onExport
}: EnhancedTransactionManagementProps) {
  const { toast } = useToast();

  // State management
  const [filter, setFilter] = useState<TransactionFilter>({
    search: '',
    types: [],
    categories: [],
    statuses: [],
    tokens: [],
    dateRange: { from: null, to: null },
    amountRange: { min: null, max: null },
    direction: 'all'
  });
  const [sort, setSort] = useState<SortOption>({ field: 'timestamp', direction: 'desc' });
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [showTransactionDetail, setShowTransactionDetail] = useState<EnhancedTransaction | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [groupBy, setGroupBy] = useState<'none' | 'date' | 'token' | 'type'>('none');

  // Available filter options
  const availableTypes = ['mint', 'burn', 'transfer', 'pause', 'unpause', 'freeze', 'unfreeze', 'create', 'swap', 'payment'];
  const availableCategories = ['token_operation', 'trading', 'defi', 'nft', 'governance', 'other'];
  const availableStatuses = ['confirmed', 'pending', 'failed', 'finalized'];
  const availableTokens = [...new Set(transactions.map(tx => tx.tokenSymbol))].filter(Boolean);

  // Filtered and sorted transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactions.filter(tx => {
      // Search filter
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        const matchesSearch = (
          tx.signature.toLowerCase().includes(searchLower) ||
          tx.tokenSymbol.toLowerCase().includes(searchLower) ||
          tx.tokenName.toLowerCase().includes(searchLower) ||
          tx.type.toLowerCase().includes(searchLower) ||
          tx.category.toLowerCase().includes(searchLower) ||
          tx.from?.toLowerCase().includes(searchLower) ||
          tx.to?.toLowerCase().includes(searchLower)
        );
        if (!matchesSearch) return false;
      }

      // Type filter
      if (filter.types.length > 0 && !filter.types.includes(tx.type)) return false;

      // Category filter
      if (filter.categories.length > 0 && !filter.categories.includes(tx.category)) return false;

      // Status filter
      if (filter.statuses.length > 0 && !filter.statuses.includes(tx.status)) return false;

      // Token filter
      if (filter.tokens.length > 0 && !filter.tokens.includes(tx.tokenSymbol)) return false;

      // Date range filter
      if (filter.dateRange.from && tx.timestamp < filter.dateRange.from.getTime()) return false;
      if (filter.dateRange.to && tx.timestamp > filter.dateRange.to.getTime()) return false;

      // Amount range filter
      if (filter.amountRange.min !== null && tx.amount < filter.amountRange.min) return false;
      if (filter.amountRange.max !== null && tx.amount > filter.amountRange.max) return false;

      // Direction filter
      if (filter.direction === 'incoming' && tx.to !== walletAddress) return false;
      if (filter.direction === 'outgoing' && tx.from !== walletAddress) return false;

      return true;
    });

    // Sort transactions
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sort.field) {
        case 'timestamp':
          comparison = a.timestamp - b.timestamp;
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'fee':
          comparison = a.fee - b.fee;
          break;
        case 'token':
          comparison = a.tokenSymbol.localeCompare(b.tokenSymbol);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
      }

      return sort.direction === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [transactions, filter, sort, walletAddress]);

  // Group transactions if needed
  const groupedTransactions = useMemo(() => {
    if (groupBy === 'none') {
      return { ungrouped: filteredTransactions };
    }

    const groups: Record<string, EnhancedTransaction[]> = {};

    filteredTransactions.forEach(tx => {
      let groupKey = '';
      
      switch (groupBy) {
        case 'date':
          groupKey = new Date(tx.timestamp).toDateString();
          break;
        case 'token':
          groupKey = tx.tokenSymbol;
          break;
        case 'type':
          groupKey = tx.type;
          break;
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(tx);
    });

    return groups;
  }, [filteredTransactions, groupBy]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = groupBy === 'none' 
    ? filteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : filteredTransactions;

  // Get transaction direction
  const getTransactionDirection = (tx: EnhancedTransaction): 'incoming' | 'outgoing' | 'self' => {
    if (tx.from === walletAddress && tx.to === walletAddress) return 'self';
    if (tx.to === walletAddress) return 'incoming';
    return 'outgoing';
  };

  // Get transaction icon
  const getTransactionIcon = (tx: EnhancedTransaction) => {
    switch (tx.type) {
      case 'mint':
        return <Plus className="w-4 h-4 text-green-500" />;
      case 'burn':
        return <Flame className="w-4 h-4 text-red-500" />;
      case 'transfer':
        const direction = getTransactionDirection(tx);
        return direction === 'incoming' ? 
          <TrendingDown className="w-4 h-4 text-green-500 rotate-180" /> :
          <TrendingUp className="w-4 h-4 text-blue-500" />;
      case 'pause':
        return <Pause className="w-4 h-4 text-yellow-500" />;
      case 'unpause':
        return <Play className="w-4 h-4 text-green-500" />;
      case 'create':
        return <Settings className="w-4 h-4 text-blue-500" />;
      default:
        return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'finalized':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Copied to clipboard",
    });
  };

  // Handle export
  const handleExport = (format: 'csv' | 'json') => {
    const selectedTxs = selectedTransactions.size > 0 
      ? filteredTransactions.filter(tx => selectedTransactions.has(tx.id))
      : filteredTransactions;

    if (onExport) {
      onExport(selectedTxs, format);
    } else {
      // Default export implementation
      if (format === 'csv') {
        const csv = [
          'Date,Type,Token,Amount,From,To,Status,Fee,USD Value,Transaction ID',
          ...selectedTxs.map(tx => [
            new Date(tx.timestamp).toISOString(),
            tx.type,
            tx.tokenSymbol,
            tx.amount,
            tx.from || '',
            tx.to || '',
            tx.status,
            tx.fee,
            tx.usdValue || '',
            tx.signature
          ].join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const json = JSON.stringify(selectedTxs, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    }

    toast({
      title: "Export Complete",
      description: `Exported ${selectedTxs.length} transactions as ${format.toUpperCase()}`,
    });
  };

  // Clear filters
  const clearFilters = () => {
    setFilter({
      search: '',
      types: [],
      categories: [],
      statuses: [],
      tokens: [],
      dateRange: { from: null, to: null },
      amountRange: { min: null, max: null },
      direction: 'all'
    });
    setCurrentPage(1);
  };

  // Handle sort change
  const handleSort = (field: SortOption['field']) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Transaction History</h2>
          <p className="text-muted-foreground">
            {filteredTransactions.length} of {transactions.length} transactions
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilterDialog(true)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {(filter.types.length + filter.categories.length + filter.statuses.length + filter.tokens.length) > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {filter.types.length + filter.categories.length + filter.statuses.length + filter.tokens.length}
              </Badge>
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Export Format</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                <FileText className="w-4 h-4 mr-2" />
                CSV File
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('json')}>
                <FileText className="w-4 h-4 mr-2" />
                JSON File
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search and Quick Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions, tokens, addresses..."
              value={filter.search}
              onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={filter.direction} onValueChange={(value: any) => setFilter(prev => ({ ...prev, direction: value }))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="incoming">Incoming</SelectItem>
              <SelectItem value="outgoing">Outgoing</SelectItem>
            </SelectContent>
          </Select>

          <Select value={groupBy} onValueChange={(value: any) => setGroupBy(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No grouping</SelectItem>
              <SelectItem value="date">By date</SelectItem>
              <SelectItem value="token">By token</SelectItem>
              <SelectItem value="type">By type</SelectItem>
            </SelectContent>
          </Select>

          {(filter.search || filter.types.length > 0 || filter.categories.length > 0) && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedTransactions.size > 0 && (
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
          <span className="text-sm font-medium">
            {selectedTransactions.size} transactions selected
          </span>
          <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
            Export Selected
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelectedTransactions(new Set())}>
            Clear Selection
          </Button>
        </div>
      )}

      {/* Transactions Table/List */}
      <Card className="glass-card">
        <CardContent className="p-0">
          {groupBy === 'none' ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedTransactions.size === filteredTransactions.length && filteredTransactions.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTransactions(new Set(filteredTransactions.map(tx => tx.id)));
                          } else {
                            setSelectedTransactions(new Set());
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('timestamp')}
                    >
                      <div className="flex items-center gap-1">
                        Date
                        {sort.field === 'timestamp' && (
                          sort.direction === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('token')}
                    >
                      <div className="flex items-center gap-1">
                        Token
                        {sort.field === 'token' && (
                          sort.direction === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 text-right"
                      onClick={() => handleSort('amount')}
                    >
                      <div className="flex items-center gap-1 justify-end">
                        Amount
                        {sort.field === 'amount' && (
                          sort.direction === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>From/To</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Fee</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTransactions.map((tx) => (
                    <TableRow key={tx.id} className="hover:bg-muted/25">
                      <TableCell>
                        <Checkbox
                          checked={selectedTransactions.has(tx.id)}
                          onCheckedChange={(checked) => {
                            const newSelected = new Set(selectedTransactions);
                            if (checked) {
                              newSelected.add(tx.id);
                            } else {
                              newSelected.delete(tx.id);
                            }
                            setSelectedTransactions(newSelected);
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTransactionIcon(tx)}
                          <span className="capitalize">{tx.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(tx.timestamp).toLocaleDateString()}
                          <div className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{tx.tokenSymbol}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-24">{tx.tokenName}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-medium">{tx.amount.toLocaleString()}</div>
                        {tx.usdValue && (
                          <div className="text-xs text-muted-foreground">${tx.usdValue.toFixed(2)}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          {tx.from && (
                            <div className="mb-1">
                              <span className="text-muted-foreground">From:</span> {tx.from.slice(0, 8)}...
                            </div>
                          )}
                          {tx.to && (
                            <div>
                              <span className="text-muted-foreground">To:</span> {tx.to.slice(0, 8)}...
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(tx.status)}
                          <span className="capitalize text-xs">{tx.status}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="text-sm">{tx.fee} {tx.feeToken}</div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setShowTransactionDetail(tx)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => copyToClipboard(tx.signature)}>
                              <Copy className="w-4 h-4 mr-2" />
                              Copy Signature
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => window.open(tx.explorerUrl, '_blank')}>
                              <ExternalLink className="w-4 h-4 mr-2" />
                              View on Explorer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {Object.entries(groupedTransactions).map(([group, groupTxs]) => (
                <div key={group}>
                  <h3 className="font-semibold mb-3 capitalize">{group}</h3>
                  <div className="space-y-2">
                    {groupTxs.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/25">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedTransactions.has(tx.id)}
                            onCheckedChange={(checked) => {
                              const newSelected = new Set(selectedTransactions);
                              if (checked) {
                                newSelected.add(tx.id);
                              } else {
                                newSelected.delete(tx.id);
                              }
                              setSelectedTransactions(newSelected);
                            }}
                          />
                          {getTransactionIcon(tx)}
                          <div>
                            <div className="font-medium capitalize">{tx.type} {tx.tokenSymbol}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(tx.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="font-medium">{tx.amount.toLocaleString()} {tx.tokenSymbol}</div>
                            {tx.usdValue && (
                              <div className="text-xs text-muted-foreground">${tx.usdValue.toFixed(2)}</div>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(tx.status)}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setShowTransactionDetail(tx)}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => copyToClipboard(tx.signature)}>
                                <Copy className="w-4 h-4 mr-2" />
                                Copy Signature
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => window.open(tx.explorerUrl, '_blank')}>
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View on Explorer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {groupBy === 'none' && totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-border">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} transactions
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <span className="text-sm font-medium">
                  {currentPage} of {totalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Empty State */}
      {filteredTransactions.length === 0 && !loading && (
        <Card className="glass-card">
          <CardContent className="p-8 text-center">
            <Activity className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">No Transactions Found</h3>
            <p className="text-muted-foreground">
              {transactions.length === 0 
                ? 'No transactions yet. Start using your tokens to see history here.'
                : 'No transactions match your current filters. Try adjusting your search criteria.'
              }
            </p>
            {(filter.search || filter.types.length > 0 || filter.categories.length > 0) && (
              <Button variant="outline" onClick={clearFilters} className="mt-4">
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filter Dialog */}
      <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Advanced Filters</DialogTitle>
            <DialogDescription>
              Customize your transaction view with detailed filters
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Transaction Types */}
            <div>
              <Label className="text-sm font-medium">Transaction Types</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {availableTypes.map(type => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`type-${type}`}
                      checked={filter.types.includes(type)}
                      onCheckedChange={(checked) => {
                        setFilter(prev => ({
                          ...prev,
                          types: checked 
                            ? [...prev.types, type]
                            : prev.types.filter(t => t !== type)
                        }));
                      }}
                    />
                    <Label htmlFor={`type-${type}`} className="text-sm capitalize">{type}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div>
              <Label className="text-sm font-medium">Categories</Label>
              <div className="grid grid-cols-1 gap-2 mt-2">
                {availableCategories.map(category => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category}`}
                      checked={filter.categories.includes(category)}
                      onCheckedChange={(checked) => {
                        setFilter(prev => ({
                          ...prev,
                          categories: checked 
                            ? [...prev.categories, category]
                            : prev.categories.filter(c => c !== category)
                        }));
                      }}
                    />
                    <Label htmlFor={`category-${category}`} className="text-sm capitalize">
                      {category.replace('_', ' ')}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Status */}
            <div>
              <Label className="text-sm font-medium">Status</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {availableStatuses.map(status => (
                  <div key={status} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${status}`}
                      checked={filter.statuses.includes(status)}
                      onCheckedChange={(checked) => {
                        setFilter(prev => ({
                          ...prev,
                          statuses: checked 
                            ? [...prev.statuses, status]
                            : prev.statuses.filter(s => s !== status)
                        }));
                      }}
                    />
                    <Label htmlFor={`status-${status}`} className="text-sm capitalize">{status}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Tokens */}
            {availableTokens.length > 0 && (
              <div>
                <Label className="text-sm font-medium">Tokens</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {availableTokens.map(token => (
                    <div key={token} className="flex items-center space-x-2">
                      <Checkbox
                        id={`token-${token}`}
                        checked={filter.tokens.includes(token)}
                        onCheckedChange={(checked) => {
                          setFilter(prev => ({
                            ...prev,
                            tokens: checked 
                              ? [...prev.tokens, token]
                              : prev.tokens.filter(t => t !== token)
                          }));
                        }}
                      />
                      <Label htmlFor={`token-${token}`} className="text-sm">{token}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Amount Range */}
            <div>
              <Label className="text-sm font-medium">Amount Range</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <Label htmlFor="min-amount" className="text-xs text-muted-foreground">Min</Label>
                  <Input
                    id="min-amount"
                    type="number"
                    placeholder="0"
                    value={filter.amountRange.min || ''}
                    onChange={(e) => setFilter(prev => ({
                      ...prev,
                      amountRange: { ...prev.amountRange, min: parseFloat(e.target.value) || null }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="max-amount" className="text-xs text-muted-foreground">Max</Label>
                  <Input
                    id="max-amount"
                    type="number"
                    placeholder="∞"
                    value={filter.amountRange.max || ''}
                    onChange={(e) => setFilter(prev => ({
                      ...prev,
                      amountRange: { ...prev.amountRange, max: parseFloat(e.target.value) || null }
                    }))}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={clearFilters}>
              Clear All
            </Button>
            <Button onClick={() => setShowFilterDialog(false)}>
              Apply Filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction Detail Dialog */}
      <Dialog open={!!showTransactionDetail} onOpenChange={() => setShowTransactionDetail(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {showTransactionDetail && getTransactionIcon(showTransactionDetail)}
              Transaction Details
            </DialogTitle>
            <DialogDescription>
              {showTransactionDetail?.signature}
            </DialogDescription>
          </DialogHeader>

          {showTransactionDetail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <p className="capitalize">{showTransactionDetail.type}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(showTransactionDetail.status)}
                    <span className="capitalize">{showTransactionDetail.status}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Token</Label>
                  <p>{showTransactionDetail.tokenSymbol} - {showTransactionDetail.tokenName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Amount</Label>
                  <p>{showTransactionDetail.amount.toLocaleString()} {showTransactionDetail.tokenSymbol}</p>
                  {showTransactionDetail.usdValue && (
                    <p className="text-sm text-muted-foreground">${showTransactionDetail.usdValue.toFixed(2)} USD</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium">Date</Label>
                  <p>{new Date(showTransactionDetail.timestamp).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Network</Label>
                  <p className="capitalize">{showTransactionDetail.network}</p>
                </div>
                {showTransactionDetail.from && (
                  <div>
                    <Label className="text-sm font-medium">From</Label>
                    <p className="font-mono text-sm break-all">{showTransactionDetail.from}</p>
                  </div>
                )}
                {showTransactionDetail.to && (
                  <div>
                    <Label className="text-sm font-medium">To</Label>
                    <p className="font-mono text-sm break-all">{showTransactionDetail.to}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium">Fee</Label>
                  <p>{showTransactionDetail.fee} {showTransactionDetail.feeToken}</p>
                </div>
                {showTransactionDetail.confirmations && (
                  <div>
                    <Label className="text-sm font-medium">Confirmations</Label>
                    <p>{showTransactionDetail.confirmations}</p>
                  </div>
                )}
              </div>

              {showTransactionDetail.note && (
                <div>
                  <Label className="text-sm font-medium">Note</Label>
                  <p className="text-sm">{showTransactionDetail.note}</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(showTransactionDetail.signature)}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Signature
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(showTransactionDetail.explorerUrl, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on Explorer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 