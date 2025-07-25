'use client';

import { Badge } from '@/components/ui/badge';
import { 
  Coins, 
  Globe, 
  Twitter, 
  Github, 
  Eye, 
  CheckCircle,
  Flame,
  Pause,
  RefreshCw
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

interface TokenPreviewCleanProps {
  tokenData: TokenData;
}

export default function TokenPreviewClean({ tokenData }: TokenPreviewCleanProps) {
  // Format total supply
  const formatSupply = (supply: string) => {
    const num = parseFloat(supply) || 0;
    
    if (num >= 1e15) {
      const formatted = num / 1e15;
      return (formatted % 1 === 0 ? formatted.toFixed(0) : formatted.toFixed(1)) + 'Q';
    } else if (num >= 1e12) {
      const formatted = num / 1e12;
      return (formatted % 1 === 0 ? formatted.toFixed(0) : formatted.toFixed(1)) + 'T';
    } else if (num >= 1e9) {
      const formatted = num / 1e9;
      return (formatted % 1 === 0 ? formatted.toFixed(0) : formatted.toFixed(1)) + 'B';
    } else if (num >= 1e6) {
      const formatted = num / 1e6;
      return (formatted % 1 === 0 ? formatted.toFixed(0) : formatted.toFixed(1)) + 'M';
    } else if (num >= 1e3) {
      const formatted = num / 1e3;
      return (formatted % 1 === 0 ? formatted.toFixed(0) : formatted.toFixed(1)) + 'K';
    } else {
      return num.toLocaleString();
    }
  };

  // Get network info
  const getNetworkInfo = (network: string) => {
    switch (network) {
      case 'algorand-mainnet':
        return { name: 'Algorand Mainnet', color: 'bg-green-500' };
      case 'algorand-testnet':
        return { name: 'Algorand Testnet', color: 'bg-yellow-500' };
      case 'solana-devnet':
        return { name: 'Solana Devnet', color: 'bg-purple-500' };
      default:
        return { name: 'Unknown Network', color: 'bg-gray-500' };
    }
  };

  const networkInfo = getNetworkInfo(tokenData.network);

  return (
    <div className="bg-card border border-border rounded-lg p-4 lg:p-6">
      <div className="flex items-center gap-2 mb-4 lg:mb-6">
        <Eye className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
        <h3 className="text-base lg:text-lg font-semibold text-foreground">Live Preview</h3>
      </div>
      
      <div className="space-y-4 lg:space-y-6">
        {/* Token Header */}
        <div className="flex items-center gap-3 lg:gap-4">
          <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0">
            {tokenData.logoUrl ? (
              <img 
                src={tokenData.logoUrl} 
                alt="Token logo" 
                className="w-full h-full rounded-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <Coins className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-lg lg:text-xl font-bold text-foreground truncate">
              {tokenData.name || 'Token Name'}
            </h4>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-sm lg:text-lg font-semibold text-muted-foreground">
                {tokenData.symbol || 'SYMBOL'}
              </span>
              <Badge variant="outline" className={`${networkInfo.color} text-white border-0 text-xs lg:text-sm`}>
                {networkInfo.name}
              </Badge>
            </div>
          </div>
        </div>

        {/* Token Stats */}
        <div className="grid grid-cols-2 gap-3 lg:gap-4">
          <div className="bg-muted/50 rounded-lg p-3 lg:p-4">
            <div className="text-xs lg:text-sm text-muted-foreground">Total Supply</div>
            <div className="text-base lg:text-lg font-semibold text-foreground">
              {formatSupply(tokenData.totalSupply)}
            </div>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-3 lg:p-4">
            <div className="text-xs lg:text-sm text-muted-foreground">Decimals</div>
            <div className="text-base lg:text-lg font-semibold text-foreground">
              {tokenData.decimals || '9'}
            </div>
          </div>
        </div>

        {/* Description */}
        {tokenData.description && (
          <div>
            <div className="text-xs lg:text-sm text-muted-foreground mb-2">Description</div>
            <p className="text-sm text-foreground leading-relaxed">{tokenData.description}</p>
          </div>
        )}

        {/* Features */}
        <div>
          <div className="text-xs lg:text-sm text-muted-foreground mb-3">Features</div>
          <div className="flex flex-wrap gap-2">
            {tokenData.mintable && (
              <Badge variant="outline" className="text-green-500 border-green-500/50 text-xs">
                <RefreshCw className="w-3 h-3 mr-1" />
                Mintable
              </Badge>
            )}
            {tokenData.burnable && (
              <Badge variant="outline" className="text-orange-500 border-orange-500/50 text-xs">
                <Flame className="w-3 h-3 mr-1" />
                Burnable
              </Badge>
            )}
            {tokenData.pausable && (
              <Badge variant="outline" className="text-blue-500 border-blue-500/50 text-xs">
                <Pause className="w-3 h-3 mr-1" />
                Pausable
              </Badge>
            )}
          </div>
        </div>

        {/* Social Links */}
        {(tokenData.website || tokenData.twitter || tokenData.github) && (
          <div>
            <div className="text-xs lg:text-sm text-muted-foreground mb-3">Links</div>
            <div className="flex gap-2">
              {tokenData.website && (
                <a 
                  href={tokenData.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  title="Website"
                >
                  <Globe className="w-4 h-4 text-muted-foreground" />
                </a>
              )}
              {tokenData.twitter && (
                <a 
                  href={`https://twitter.com/${tokenData.twitter.replace('@', '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  title="Twitter"
                >
                  <Twitter className="w-4 h-4 text-muted-foreground" />
                </a>
              )}
              {tokenData.github && (
                <a 
                  href={`https://${tokenData.github}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  title="GitHub"
                >
                  <Github className="w-4 h-4 text-muted-foreground" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Status */}
        <div className="pt-3 lg:pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-green-500">Ready to deploy</span>
          </div>
        </div>
      </div>
    </div>
  );
}
