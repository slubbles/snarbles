'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Coins, 
  ExternalLink, 
  Settings, 
  TrendingUp, 
  Users,
  Activity,
  Clock,
  Wallet
} from 'lucide-react';

interface BaseToken {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  createdAt: string;
  network: 'solana' | 'algorand';
}

interface SolanaToken extends BaseToken {
  network: 'solana';
  mintAddress: string;
  mintAuthority?: string;
  freezeAuthority?: string;
  updateAuthority?: string;
  metadataUri?: string;
}

interface AlgorandAsset extends BaseToken {
  network: 'algorand';
  assetId: number;
  manager?: string;
  reserve?: string;
  freeze?: string;
  clawback?: string;
  isFrozen: boolean;
  url?: string;
}

type UniversalToken = SolanaToken | AlgorandAsset;

interface TokenCardProps {
  token: UniversalToken;
  onManage: (token: UniversalToken) => void;
  onViewDetails: (token: UniversalToken) => void;
}

export function TokenCard({ token, onManage, onViewDetails }: TokenCardProps) {
  const formatSupply = (supply: string, decimals: number) => {
    const numSupply = parseFloat(supply);
    if (numSupply >= 1e9) return `${(numSupply / 1e9).toFixed(2)}B`;
    if (numSupply >= 1e6) return `${(numSupply / 1e6).toFixed(2)}M`;
    if (numSupply >= 1e3) return `${(numSupply / 1e3).toFixed(2)}K`;
    return numSupply.toFixed(decimals > 0 ? Math.min(decimals, 4) : 0);
  };

  const getNetworkColor = (network: string) => {
    return network === 'solana' 
      ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
      : 'bg-green-500/10 text-green-400 border-green-500/20';
  };

  const getStatusBadge = () => {
    if (token.network === 'algorand' && (token as AlgorandAsset).isFrozen) {
      return (
        <Badge className="bg-red-500/10 text-red-400 border-red-500/20">
          Frozen
        </Badge>
      );
    }
    return (
      <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
        Active
      </Badge>
    );
  };

  const getExplorerUrl = () => {
    if (token.network === 'solana') {
      const solanaToken = token as SolanaToken;
      return `https://explorer.solana.com/address/${solanaToken.mintAddress}`;
    } else {
      const algorandAsset = token as AlgorandAsset;
      return `https://algoexplorer.io/asset/${algorandAsset.assetId}`;
    }
  };

  return (
    <Card className="glass-card hover:shadow-lg transition-all duration-300 group">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-foreground mb-2">
              {token.name}
            </CardTitle>
            <div className="flex items-center gap-2 mb-3">
              <Badge className={getNetworkColor(token.network)}>
                {token.network.charAt(0).toUpperCase() + token.network.slice(1)}
              </Badge>
              {getStatusBadge()}
            </div>
          </div>
          <Coins className="h-8 w-8 text-primary opacity-70 group-hover:opacity-100 transition-opacity" />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Symbol:</span>
            <span className="font-medium text-foreground">{token.symbol}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Supply:</span>
            <span className="font-medium text-foreground">
              {formatSupply(token.totalSupply, token.decimals)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Decimals:</span>
            <span className="font-medium text-foreground">{token.decimals}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Created:</span>
            <span className="font-medium text-foreground">
              {new Date(token.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex flex-col gap-2">
          <Button 
            onClick={() => onManage(token)}
            className="w-full bg-primary hover:bg-primary/90"
          >
            <Settings className="h-4 w-4 mr-2" />
            Manage Token
          </Button>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onViewDetails(token)}
              className="flex-1"
            >
              <Activity className="h-4 w-4 mr-2" />
              Details
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.open(getExplorerUrl(), '_blank')}
              className="flex-1"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Explorer
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Portfolio Summary Component
interface PortfolioSummaryProps {
  tokens: UniversalToken[];
  network: 'solana' | 'algorand' | 'all';
}

export function PortfolioSummary({ tokens, network }: PortfolioSummaryProps) {
  const filteredTokens = network === 'all' 
    ? tokens 
    : tokens.filter(token => token.network === network);

  const stats = {
    totalTokens: filteredTokens.length,
    solanaTokens: filteredTokens.filter(t => t.network === 'solana').length,
    algorandAssets: filteredTokens.filter(t => t.network === 'algorand').length,
    recentlyCreated: filteredTokens.filter(t => {
      const created = new Date(t.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return created > weekAgo;
    }).length,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Tokens</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalTokens}</p>
            </div>
            <Wallet className="h-8 w-8 text-primary" />
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Solana Tokens</p>
              <p className="text-2xl font-bold text-purple-400">{stats.solanaTokens}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center">
              <span className="text-xs font-bold text-purple-400">SOL</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Algorand Assets</p>
              <p className="text-2xl font-bold text-green-400">{stats.algorandAssets}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <span className="text-xs font-bold text-green-400">ALGO</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Recent (7d)</p>
              <p className="text-2xl font-bold text-blue-400">{stats.recentlyCreated}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-400" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
