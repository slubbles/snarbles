'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Coins, 
  Globe, 
  Twitter, 
  Github, 
  RefreshCw, 
  Flame, 
  Pause, 
  CheckCircle, 
  AlertTriangle 
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

interface TokenConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tokenData: TokenData;
  isLoading?: boolean;
  selectedPaymentMethod?: string | null;
  paymentCosts?: {
    credits: number;
    algo: number;
  };
}

export default function TokenConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  tokenData, 
  isLoading = false,
  selectedPaymentMethod,
  paymentCosts
}: TokenConfirmationModalProps) {
  
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

  // Get network info with dynamic cost based on payment method
  const getNetworkInfo = (network: string) => {
    const isMainnet = network.includes('mainnet');
    const isTestnet = network.includes('testnet') || network.includes('devnet');
    
    let cost = 'Free';
    let networkName = 'Unknown Network';
    let icon = '❓';
    
    // Determine network details
    if (network === 'algorand-mainnet') {
      networkName = 'Algorand Mainnet';
      icon = '🔺';
    } else if (network === 'algorand-testnet') {
      networkName = 'Algorand Testnet';
      icon = '🔸';
    } else if (network === 'solana-devnet') {
      networkName = 'Solana Devnet';
      icon = '🟣';
    } else if (network === 'solana-mainnet') {
      networkName = 'Solana Mainnet';
      icon = '🟣';
    }
    
    // Calculate cost based on selected payment method
    if (isMainnet && selectedPaymentMethod && paymentCosts) {
      if (selectedPaymentMethod === 'credits') {
        cost = `${paymentCosts.credits} credits`;
      } else if (selectedPaymentMethod === 'algo_direct') {
        cost = `${paymentCosts.algo} ALGO + network fee`;
      }
    } else if (isTestnet) {
      cost = 'Free (testnet)';
    }
    
    return { name: networkName, cost, icon };
  };

  const networkInfo = getNetworkInfo(tokenData.network);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-primary" />
            Confirm Token Creation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Token Header */}
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0">
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
                <Coins className="w-6 h-6 text-white" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-bold text-foreground truncate">
                {tokenData.name}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-semibold text-muted-foreground">
                  {tokenData.symbol}
                </span>
                <Badge variant="outline" className="text-xs border-border">
                  {networkInfo.icon} {networkInfo.name}
                </Badge>
              </div>
            </div>
          </div>

          <Separator className="bg-border" />

          {/* Token Details */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Supply:</span>
                <p className="font-semibold text-foreground">{formatSupply(tokenData.totalSupply)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Decimals:</span>
                <p className="font-semibold text-foreground">{tokenData.decimals}</p>
              </div>
            </div>

            {tokenData.description && (
              <div>
                <span className="text-muted-foreground text-sm">Description:</span>
                <p className="text-sm text-foreground mt-1 leading-relaxed">{tokenData.description}</p>
              </div>
            )}

            {/* Features */}
            {(tokenData.mintable || tokenData.burnable || tokenData.pausable) && (
              <div>
                <span className="text-muted-foreground text-sm">Features:</span>
                <div className="flex flex-wrap gap-2 mt-1">
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
            )}

            {/* Social Links */}
            {(tokenData.website || tokenData.twitter || tokenData.github) && (
              <div>
                <span className="text-muted-foreground text-sm">Links:</span>
                <div className="flex gap-2 mt-1">
                  {tokenData.website && (
                    <div className="p-2 bg-muted/50 rounded text-xs flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      Website
                    </div>
                  )}
                  {tokenData.twitter && (
                    <div className="p-2 bg-muted/50 rounded text-xs flex items-center gap-1">
                      <Twitter className="w-3 h-3" />
                      Twitter
                    </div>
                  )}
                  {tokenData.github && (
                    <div className="p-2 bg-muted/50 rounded text-xs flex items-center gap-1">
                      <Github className="w-3 h-3" />
                      GitHub
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <Separator className="bg-border" />

          {/* Cost Information or Testnet Wallet Note */}
          {tokenData.network.includes('testnet') || tokenData.network.includes('devnet') ? (
            // For testnets - show wallet balance requirement
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Wallet Requirements</span>
              </div>
              <p className="text-xs text-blue-700 leading-relaxed">
                {tokenData.network.includes('solana') ? (
                  <>Make sure you have <strong>Solana devnet tokens</strong> in your wallet to pay for transaction fees.</>
                ) : (
                  <>Make sure you have <strong>Algorand testnet tokens</strong> in your wallet to pay for transaction fees.</>
                )}
              </p>
              <div className="flex items-center justify-between pt-1 border-t border-blue-200">
                <span className="text-sm text-blue-700">Network Cost:</span>
                <span className="text-sm font-semibold text-blue-900">Free (testnet)</span>
              </div>
            </div>
          ) : (
            // For mainnets - show payment method and cost
            <div className="p-3 bg-muted/20 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Payment Method:</span>
                <span className="text-sm font-medium text-foreground">
                  {selectedPaymentMethod === 'credits' ? 'Credits' : 
                   selectedPaymentMethod === 'algo_direct' ? 'ALGO Direct' : 
                   'Not Selected'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Cost:</span>
                <span className="text-sm font-semibold text-foreground">{networkInfo.cost}</span>
              </div>
              {selectedPaymentMethod === 'algo_direct' && paymentCosts && (
                <div className="text-xs text-muted-foreground pt-1 border-t border-border">
                  <div className="flex justify-between">
                    <span>Platform fee:</span>
                    <span>{paymentCosts.algo} ALGO</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Network fee:</span>
                    <span>~0.001 ALGO</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Warning */}
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
            <p className="text-xs text-foreground leading-relaxed">
              <strong>Important:</strong> Once created, this token cannot be deleted. Please review all details carefully before proceeding.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Creating...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Create Token
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
