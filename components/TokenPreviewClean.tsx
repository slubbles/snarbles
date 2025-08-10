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
  RefreshCw,
  Clock,
  User,
  Hash,
  TrendingUp,
  Shield,
  AlertCircle,
  Info
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
        return { name: 'Algorand Mainnet', color: 'bg-green-500', shortName: '' };
      case 'algorand-testnet':
        return { name: 'Algorand Testnet', color: 'bg-yellow-500', shortName: '' };
      case 'solana-devnet':
        return { name: 'Solana Devnet', color: 'bg-purple-500', shortName: '' };
      default:
        return { name: 'Unknown Network', color: 'bg-gray-500', shortName: '' };
    }
  };

  // Get token type based on features
  const getTokenType = () => {
    const features = [];
    if (tokenData.mintable) features.push('Mintable');
    if (tokenData.burnable) features.push('Burnable');
    if (tokenData.pausable) features.push('Pausable');
    
    if (features.length === 0) return 'Standard Token';
    if (features.includes('Pausable')) return 'Governance Token';
    if (features.includes('Mintable') && features.includes('Burnable')) return 'Utility Token';
    if (features.includes('Mintable')) return 'Supply-Adjustable Token';
    return 'Custom Token';
  };

  // Generate deployment readiness score
  const getDeploymentReadiness = () => {
    let score = 0;
    let total = 0;
    const checks = [];

    // Required fields
    if (tokenData.name) { score++; checks.push({ label: 'Token name', status: 'complete' }); }
    else { checks.push({ label: 'Token name', status: 'missing' }); }
    total++;

    if (tokenData.symbol) { score++; checks.push({ label: 'Token symbol', status: 'complete' }); }
    else { checks.push({ label: 'Token symbol', status: 'missing' }); }
    total++;

    if (tokenData.totalSupply && parseFloat(tokenData.totalSupply) > 0) { 
      score++; checks.push({ label: 'Total supply', status: 'complete' }); 
    } else { 
      checks.push({ label: 'Total supply', status: 'missing' }); 
    }
    total++;

    // Optional but recommended
    if (tokenData.description) { score++; checks.push({ label: 'Description', status: 'complete' }); }
    else { checks.push({ label: 'Description', status: 'optional' }); }
    total++;

    if (tokenData.logoUrl) { score++; checks.push({ label: 'Logo', status: 'complete' }); }
    else { checks.push({ label: 'Logo', status: 'optional' }); }
    total++;

    const percentage = Math.round((score / total) * 100);
    const requiredComplete = score >= 3;

    return { score, total, percentage, checks, requiredComplete };
  };

  const networkInfo = getNetworkInfo(tokenData.network);
  const tokenType = getTokenType();
  const readiness = getDeploymentReadiness();
  const currentDate = new Date().toLocaleDateString();

  return (
    <div className="bg-card border border-border rounded-lg p-4 lg:p-6">
      <div className="flex items-center gap-2 mb-4 lg:mb-6">
        <Eye className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
        <h3 className="text-base lg:text-lg font-semibold text-foreground">Live Preview</h3>
      </div>
      
      <div className="space-y-4 lg:space-y-6">
        {/* Token Header with Enhanced Logo */}
        <div className="flex items-center gap-3 lg:gap-4">
          <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-full bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center flex-shrink-0 relative overflow-hidden border-2 border-primary/20">
            {tokenData.logoUrl ? (
              <>
                <img 
                  src={tokenData.logoUrl} 
                  alt={`${tokenData.name || 'Token'} logo`} 
                  className="w-full h-full rounded-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary to-primary/60 rounded-full hidden">
                  <Coins className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
                </div>
              </>
            ) : (
              <div className="relative">
                <Coins className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
                {tokenData.symbol && (
                  <div className="absolute -bottom-1 -right-1 bg-background border border-border rounded-full w-4 h-4 lg:w-5 lg:h-5 flex items-center justify-center">
                    <span className="text-[8px] lg:text-[10px] font-bold text-foreground">
                      {tokenData.symbol.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
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
            </div>
          </div>
        </div>

        {/* Enhanced Token Stats Grid */}
        <div className="grid grid-cols-2 gap-3 lg:gap-4">
          <div className="bg-muted/50 rounded-lg p-3 lg:p-4">
            <div className="text-xs lg:text-sm text-muted-foreground mb-1">
              Total Supply
            </div>
            <div className="text-base lg:text-lg font-semibold text-foreground">
              {formatSupply(tokenData.totalSupply)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {parseFloat(tokenData.totalSupply || '0').toLocaleString()} tokens
            </div>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-3 lg:p-4">
            <div className="text-xs lg:text-sm text-muted-foreground mb-1">
              Decimals
            </div>
            <div className="text-base lg:text-lg font-semibold text-foreground">
              {tokenData.decimals || '9'}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Precision level
            </div>
          </div>
        </div>

        {/* Additional Metadata */}
        <div className="grid grid-cols-1 gap-3">
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
              <Globe className="w-3 h-3" />
              Network
            </div>
            <div className="text-sm font-medium text-green-500">{networkInfo.name}</div>
          </div>
        </div>

        {/* Description */}
        {tokenData.description && (
          <div>
            <div className="flex items-center gap-1 text-xs lg:text-sm text-muted-foreground mb-2">
              <Info className="w-3 h-3" />
              Description
            </div>
            <p className="text-sm text-foreground leading-relaxed bg-muted/30 rounded-lg p-3">
              {tokenData.description}
            </p>
          </div>
        )}

        {/* Enhanced Features */}
        <div>
          <div className="flex items-center gap-1 text-xs lg:text-sm text-muted-foreground mb-3">
            <Shield className="w-3 h-3" />
            Token Features
          </div>
          <div className="flex flex-wrap gap-2">
            {tokenData.mintable && (
              <Badge variant="outline" className="text-green-500 border-green-500/50 text-xs bg-green-500/10">
                <RefreshCw className="w-3 h-3 mr-1" />
                Mintable
              </Badge>
            )}
            {tokenData.burnable && (
              <Badge variant="outline" className="text-orange-500 border-orange-500/50 text-xs bg-orange-500/10">
                <Flame className="w-3 h-3 mr-1" />
                Burnable
              </Badge>
            )}
            {tokenData.pausable && (
              <Badge variant="outline" className="text-blue-500 border-blue-500/50 text-xs bg-blue-500/10">
                <Pause className="w-3 h-3 mr-1" />
                Pausable
              </Badge>
            )}
            {!tokenData.mintable && !tokenData.burnable && !tokenData.pausable && (
              <Badge variant="outline" className="text-muted-foreground border-muted-foreground/50 text-xs">
                <Shield className="w-3 h-3 mr-1" />
                Standard
              </Badge>
            )}
          </div>
        </div>

        {/* Social Links */}
        {(tokenData.website || tokenData.twitter || tokenData.github) && (
          <div>
            <div className="flex items-center gap-1 text-xs lg:text-sm text-muted-foreground mb-3">
              <Globe className="w-3 h-3" />
              Links & Social
            </div>
            <div className="flex gap-2">
              {tokenData.website && (
                <a 
                  href={tokenData.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 bg-muted/50 rounded-lg hover:bg-muted transition-colors group"
                  title="Website"
                >
                  <Globe className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                </a>
              )}
              {tokenData.twitter && (
                <a 
                  href={`https://twitter.com/${tokenData.twitter.replace('@', '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 bg-muted/50 rounded-lg hover:bg-muted transition-colors group"
                  title="Twitter"
                >
                  <Twitter className="w-4 h-4 text-muted-foreground group-hover:text-blue-500" />
                </a>
              )}
              {tokenData.github && (
                <a 
                  href={`https://${tokenData.github}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 bg-muted/50 rounded-lg hover:bg-muted transition-colors group"
                  title="GitHub"
                >
                  <Github className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Enhanced Deployment Readiness */}
        <div className="pt-3 lg:pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1 text-xs lg:text-sm text-muted-foreground">
              <CheckCircle className="w-3 h-3" />
              Deployment Status
            </div>
            <Badge 
              variant={readiness.requiredComplete ? "default" : "secondary"} 
              className={`text-xs ${readiness.requiredComplete ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'}`}
            >
              {readiness.requiredComplete ? 'Ready' : 'Incomplete'}
            </Badge>
          </div>
          
          <div className="space-y-2">
            {readiness.checks.map((check, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                {check.status === 'complete' ? (
                  <CheckCircle className="w-3 h-3 text-green-500" />
                ) : check.status === 'missing' ? (
                  <AlertCircle className="w-3 h-3 text-red-500" />
                ) : (
                  <Info className="w-3 h-3 text-yellow-500" />
                )}
                <span className={`${
                  check.status === 'complete' ? 'text-green-500' : 
                  check.status === 'missing' ? 'text-red-500' : 'text-yellow-500'
                }`}>
                  {check.label}
                </span>
                <span className="text-muted-foreground ml-auto">
                  {check.status === 'complete' ? '✓' : 
                   check.status === 'missing' ? '✗' : '○'}
                </span>
              </div>
            ))}
          </div>
          
          <div className="mt-3 bg-muted/30 rounded-lg p-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Completion</span>
              <span className="font-medium text-foreground">{readiness.percentage}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 mt-1">
              <div 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  readiness.percentage === 100 ? 'bg-green-500' : 
                  readiness.percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${readiness.percentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
