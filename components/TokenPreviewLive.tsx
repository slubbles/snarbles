'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Coins, 
  Globe, 
  Twitter, 
  Github, 
  Eye, 
  CheckCircle, 
  AlertCircle,
  Flame,
  Pause,
  RefreshCw,
  TrendingUp,
  Users,
  Shield
} from 'lucide-react';

interface TokenData {
  name: string;
  symbol: string;
  description: string;
  totalSupply: string;
  decimals: string;
  logoUrl: string;
  website: string;
  twitter: string;
  github: string;
  mintable: boolean;
  burnable: boolean;
  pausable: boolean;
  network: string;
}

interface TokenPreviewLiveProps {
  tokenData: TokenData;
  className?: string;
}

export default function TokenPreviewLive({ tokenData, className = '' }: TokenPreviewLiveProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Format total supply with commas and handle large numbers
  const formatSupply = (supply: string) => {
    const num = parseFloat(supply) || 0;
    
    // Handle very large numbers
    if (num >= 1e15) {
      return (num / 1e15).toFixed(1) + 'Q'; // Quadrillion
    } else if (num >= 1e12) {
      return (num / 1e12).toFixed(1) + 'T'; // Trillion
    } else if (num >= 1e9) {
      return (num / 1e9).toFixed(1) + 'B'; // Billion
    } else if (num >= 1e6) {
      return (num / 1e6).toFixed(1) + 'M'; // Million
    } else if (num >= 1e3) {
      return (num / 1e3).toFixed(1) + 'K'; // Thousand
    } else {
      return num.toLocaleString();
    }
  };

  // Get network display info
  const getNetworkInfo = (network: string) => {
    switch (network) {
      case 'algorand-mainnet':
        return { name: 'Algorand Mainnet', color: 'bg-green-500', icon: '🔷' };
      case 'algorand-testnet':
        return { name: 'Algorand Testnet', color: 'bg-yellow-500', icon: '🧪' };
      case 'solana-devnet':
        return { name: 'Solana Devnet', color: 'bg-purple-500', icon: '⚡' };
      case 'solana-testnet':
        return { name: 'Solana Testnet', color: 'bg-blue-500', icon: '🔮' };
      default:
        return { name: 'Unknown Network', color: 'bg-gray-500', icon: '❓' };
    }
  };

  const networkInfo = getNetworkInfo(tokenData.network);

  // Calculate completion percentage
  const getCompletionPercentage = () => {
    const fields = [
      tokenData.name,
      tokenData.symbol,
      tokenData.description,
      tokenData.totalSupply,
      tokenData.decimals
    ];
    const filledFields = fields.filter(field => field.trim() !== '').length;
    return Math.round((filledFields / fields.length) * 100);
  };

  const completionPercentage = getCompletionPercentage();

  return (
    <div className={`sticky top-20 space-y-4 ${className}`}>
      {/* Live Preview Card */}
      <Card className="snarbles-card border-border bg-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="snarbles-heading text-foreground flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              Live Preview
            </CardTitle>
            <Badge className={`${networkInfo.color} text-white text-xs`}>
              {networkInfo.icon} {networkInfo.name}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Token Header */}
          <div className="flex items-start gap-4">
            {/* Logo */}
            <div className="relative">
              {tokenData.logoUrl ? (
                <img
                  src={tokenData.logoUrl}
                  alt={tokenData.name || 'Token Logo'}
                  className="w-16 h-16 rounded-full object-cover border-2 border-border"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/logo-placeholder.png';
                  }}
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-muted border-2 border-border flex items-center justify-center">
                  <Coins className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Token Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-foreground truncate">
                {tokenData.name || 'Token Name'}
              </h3>
              <div className="flex items-center gap-2 mb-2">
                <code className="text-lg font-mono text-primary bg-primary/10 px-2 py-1 rounded">
                  ${tokenData.symbol || 'SYMBOL'}
                </code>
                {completionPercentage === 100 && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {tokenData.description || 'Add a description to make your token more appealing to potential holders.'}
              </p>
            </div>
          </div>

          {/* Token Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Supply</p>
              <p className="text-lg font-bold text-foreground">
                {formatSupply(tokenData.totalSupply)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Decimals</p>
              <p className="text-lg font-bold text-foreground">
                {tokenData.decimals || '9'}
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Features</p>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={tokenData.mintable ? "default" : "secondary"}
                className={tokenData.mintable ? "bg-green-500/20 text-green-400 border-green-500/30" : ""}
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                {tokenData.mintable ? 'Mintable' : 'Fixed Supply'}
              </Badge>
              <Badge
                variant={tokenData.burnable ? "default" : "secondary"}
                className={tokenData.burnable ? "bg-orange-500/20 text-orange-400 border-orange-500/30" : ""}
              >
                <Flame className="w-3 h-3 mr-1" />
                {tokenData.burnable ? 'Burnable' : 'Non-Burnable'}
              </Badge>
              <Badge
                variant={tokenData.pausable ? "default" : "secondary"}
                className={tokenData.pausable ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : ""}
              >
                <Pause className="w-3 h-3 mr-1" />
                {tokenData.pausable ? 'Pausable' : 'Non-Pausable'}
              </Badge>
            </div>
          </div>

          {/* Social Links */}
          {(tokenData.website || tokenData.twitter || tokenData.github) && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Links</p>
              <div className="flex flex-wrap gap-2">
                {tokenData.website && (
                  <a
                    href={tokenData.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <Globe className="w-3 h-3" />
                    Website
                  </a>
                )}
                {tokenData.twitter && (
                  <a
                    href={`https://twitter.com/${tokenData.twitter.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <Twitter className="w-3 h-3" />
                    Twitter
                  </a>
                )}
                {tokenData.github && (
                  <a
                    href={tokenData.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <Github className="w-3 h-3" />
                    GitHub
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Completion Progress */}
          <div className="space-y-3 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Completion</p>
              <span className="text-xs font-medium text-foreground">{completionPercentage}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            {completionPercentage < 100 && (
              <p className="text-xs text-muted-foreground">
                Complete all required fields to enable deployment
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Card */}
      <Card className="snarbles-card border-border bg-card">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="space-y-1">
              <TrendingUp className="w-5 h-5 text-green-500 mx-auto" />
              <p className="text-xs text-muted-foreground">Est. Value</p>
              <p className="text-sm font-bold text-foreground">$0.00</p>
            </div>
            <div className="space-y-1">
              <Users className="w-5 h-5 text-blue-500 mx-auto" />
              <p className="text-xs text-muted-foreground">Holders</p>
              <p className="text-sm font-bold text-foreground">1</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Badge */}
      <Card className="snarbles-card-premium border-green-500/30 snarbles-glow-green">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm font-medium text-foreground">Secure Deployment</p>
              <p className="text-xs text-muted-foreground">
                All tokens are deployed with industry-standard security practices
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
