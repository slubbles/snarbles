'use client';

import { useState } from 'react';
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider';
import { useWallet } from '@solana/wallet-adapter-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Wallet,
  Copy,
  ExternalLink,
  RefreshCw,
  Bell,
  Settings,
  LogOut,
  DollarSign,
  TrendingUp,
  Users,
  Menu,
  X
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface DashboardHeaderProps {
  network: 'algorand' | 'solana';
  walletAddress?: string;
  portfolioValue?: number;
  totalTokens?: number;
  onRefresh?: () => void;
  onMenuToggle?: () => void;
  isMobile?: boolean;
}

export function DashboardHeader({ 
  network, 
  walletAddress, 
  portfolioValue = 0,
  totalTokens = 0,
  onRefresh,
  onMenuToggle,
  isMobile = false
}: DashboardHeaderProps) {
  const { toast } = useToast();
  const { disconnect: disconnectAlgorand } = useAlgorandWallet();
  const { disconnect: disconnectSolana } = useWallet();

  const networkInfo = {
    algorand: {
      name: 'Algorand',
      shortName: 'ALGO',
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20'
    },
    solana: {
      name: 'Solana',
      shortName: 'SOL',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10', 
      borderColor: 'border-purple-500/20'
    }
  };

  const info = networkInfo[network];

  const formatAddress = (address: string, length: number = 8) => {
    if (!address) return '';
    const start = Math.floor(length / 2);
    const end = Math.ceil(length / 2);
    return `${address.slice(0, start)}...${address.slice(-end)}`;
  };

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
        duration: 2000,
      });
    }
  };

  const handleDisconnect = () => {
    if (network === 'algorand') {
      disconnectAlgorand();
    } else {
      disconnectSolana();
    }
    
    toast({
      title: "Wallet Disconnected",
      description: `${info.name} wallet has been disconnected`,
      duration: 3000,
    });
  };

  const openExplorer = () => {
    if (!walletAddress) return;
    
    const explorerUrl = network === 'algorand' 
      ? `https://algoexplorer.io/address/${walletAddress}`
      : `https://explorer.solana.com/address/${walletAddress}`;
      
    window.open(explorerUrl, '_blank');
  };

  return (
    <header className={cn(
      "border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      isMobile ? "h-14 fixed top-0 left-0 right-0 z-30" : "h-16"
    )}>
      <div className={cn(
        "flex items-center justify-between h-full",
        isMobile ? "px-4" : "px-6"
      )}>
        
        {/* Mobile Menu Button */}
        {isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuToggle}
            className="h-8 w-8 p-0 lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </Button>
        )}

        {/* Left Section - Portfolio Stats */}
        <div className={cn(
          "flex items-center",
          isMobile ? "gap-2" : "gap-6"
        )}>
          {/* Mobile: Show only totals */}
          {isMobile ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">{totalTokens}</span>
              <span className="text-muted-foreground text-xs">Tokens</span>
            </div>
          ) : (
            /* Desktop: Full stats */
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium text-foreground">
                    ${portfolioValue.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground">Portfolio Value</div>
                </div>
              </div>
              
              <div className="w-px h-8 bg-border" />
              
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium text-foreground">{totalTokens}</div>
                  <div className="text-xs text-muted-foreground">Created Tokens</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Section - Wallet & Actions */}
        <div className={cn(
          "flex items-center",
          isMobile ? "gap-2" : "gap-4"
        )}>
          
          {/* Refresh Button - Only on desktop */}
          {onRefresh && !isMobile && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onRefresh}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}

          {/* Notifications - Only on desktop */}
          {!isMobile && (
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Bell className="w-4 h-4" />
            </Button>
          )}

          {/* Network Badge */}
          <Badge className={cn(
            `${info.bgColor} ${info.color} ${info.borderColor} border`,
            isMobile ? "text-xs px-2 py-1" : ""
          )}>
            {isMobile ? info.shortName : info.name}
          </Badge>

          {/* Wallet Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className={cn(
                  "flex items-center gap-2",
                  isMobile ? "h-8 px-2" : "h-9"
                )}
              >
                <Wallet className="w-4 h-4" />
                <span className={cn(
                  isMobile ? "text-xs" : "hidden sm:inline"
                )}>
                  {formatAddress(walletAddress || '', isMobile ? 6 : 8)}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <div className="text-sm font-medium text-foreground">
                  {info.name} Wallet
                </div>
                <div className="text-xs text-muted-foreground font-mono break-all">
                  {walletAddress}
                </div>
              </div>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={copyAddress}>
                <Copy className="w-4 h-4 mr-2" />
                Copy Address
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={openExplorer}>
                <ExternalLink className="w-4 h-4 mr-2" />
                View in Explorer
              </DropdownMenuItem>
              
              {!isMobile && (
                <>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem>
                    <Settings className="w-4 h-4 mr-2" />
                    Wallet Settings
                  </DropdownMenuItem>
                </>
              )}
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={handleDisconnect}
                className="text-red-400 focus:text-red-400"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Disconnect
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
