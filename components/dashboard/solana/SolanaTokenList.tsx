'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TokenCard } from '@/components/dashboard/shared/TokenCard';
import { SolanaTokenManager } from '@/components/dashboard/solana/SolanaTokenManager';
import { 
  Coins, 
  Plus, 
  Filter, 
  Search,
  Grid,
  List,
  TrendingUp,
  Zap,
  Shield
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SolanaToken {
  mintAddress: string;
  name: string;
  symbol: string;
  decimals: number;
  supply: number;
  balance: number;
  logoUri?: string;
  authority?: string;
  freezeAuthority?: string;
  mintAuthority?: string;
  isNative?: boolean;
  verified?: boolean;
  tags?: string[];
}

interface SolanaTokenListProps {
  tokens: SolanaToken[];
  onTokenSelect: (token: SolanaToken) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export function SolanaTokenList({ tokens, onTokenSelect, onRefresh, isLoading }: SolanaTokenListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedToken, setSelectedToken] = useState<SolanaToken | null>(null);

  const filteredTokens = tokens.filter(token => {
    const matchesSearch = token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         token.mintAddress.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'verified' && token.verified) ||
                         (filterType === 'manageable' && token.mintAuthority) ||
                         (filterType === 'native' && token.isNative);
    
    return matchesSearch && matchesFilter;
  });

  const getTokenStats = () => {
    const totalValue = tokens.reduce((sum, token) => sum + (token.balance || 0), 0);
    const manageableTokens = tokens.filter(token => token.mintAuthority).length;
    const verifiedTokens = tokens.filter(token => token.verified).length;
    
    return { totalValue, manageableTokens, verifiedTokens };
  };

  const stats = getTokenStats();

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card border-purple-500/30 bg-purple-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Coins className="w-8 h-8 text-purple-500" />
              <div>
                <div className="text-2xl font-bold text-foreground">{tokens.length}</div>
                <div className="text-sm text-muted-foreground">Total Tokens</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-green-500/30 bg-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-foreground">{stats.totalValue.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">Portfolio Value</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-blue-500/30 bg-blue-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Zap className="w-8 h-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold text-foreground">{stats.manageableTokens}</div>
                <div className="text-sm text-muted-foreground">Manageable</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold text-foreground">{stats.verifiedTokens}</div>
                <div className="text-sm text-muted-foreground">Verified</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Coins className="w-5 h-5" />
              Your SPL Tokens
            </CardTitle>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                ) : (
                  'Refresh'
                )}
              </Button>
              
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search tokens by name, symbol, or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tokens</SelectItem>
                  <SelectItem value="verified">Verified Only</SelectItem>
                  <SelectItem value="manageable">Manageable</SelectItem>
                  <SelectItem value="native">Native Tokens</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Token Grid/List */}
          {filteredTokens.length === 0 ? (
            <div className="text-center py-12">
              <Coins className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchTerm || filterType !== 'all' ? 'No tokens match your filters' : 'No tokens found'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm || filterType !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Create your first token or refresh to check for new tokens'
                }
              </p>
              {!searchTerm && filterType === 'all' && (
                <Button className="bg-purple-500 hover:bg-purple-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Token
                </Button>
              )}
            </div>
          ) : (
            <div className={
              viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'space-y-3'
            }>
              {filteredTokens.map((token) => (
                <TokenCard
                  key={token.mintAddress}
                  token={{
                    id: token.mintAddress,
                    network: 'solana' as const,
                    name: token.name,
                    symbol: token.symbol,
                    decimals: token.decimals,
                    totalSupply: token.supply.toString(),
                    createdAt: new Date().toISOString(),
                    mintAddress: token.mintAddress,
                    mintAuthority: token.mintAuthority,
                    freezeAuthority: token.freezeAuthority,
                    updateAuthority: token.authority
                  }}
                  onManage={(token) => {
                    const foundToken = filteredTokens.find(t => t.mintAddress === token.id);
                    if (foundToken) {
                      setSelectedToken(foundToken);
                      onTokenSelect(foundToken);
                    }
                  }}
                  onViewDetails={(token) => {
                    console.log('View details for token:', token.id);
                  }}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Token Management Modal */}
      {selectedToken && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="glass-card max-w-4xl w-full max-h-[90vh] overflow-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Coins className="w-5 h-5" />
                  Manage {selectedToken.name}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedToken(null)}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <SolanaTokenManager
                token={{
                  mintAddress: selectedToken.mintAddress,
                  name: selectedToken.name,
                  symbol: selectedToken.symbol,
                  decimals: selectedToken.decimals,
                  totalSupply: selectedToken.supply.toString(),
                  balance: (selectedToken.balance || 0).toString(),
                  mintAuthority: selectedToken.mintAuthority,
                  freezeAuthority: selectedToken.freezeAuthority,
                  updateAuthority: selectedToken.authority,
                  isOwner: !!selectedToken.mintAuthority,
                  canMint: !!selectedToken.mintAuthority,
                  canBurn: true,
                  canFreeze: !!selectedToken.freezeAuthority,
                  canUpdate: !!selectedToken.authority
                }}
                onOperation={async (operation, params) => {
                  console.log('Token operation:', operation, params);
                  return 'success'; // Return success message
                }}
                onRefresh={() => {
                  onRefresh();
                  setSelectedToken(null);
                }}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
