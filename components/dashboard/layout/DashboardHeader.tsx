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
  Users
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface DashboardHeaderProps {
  network: 'algorand' | 'solana';
  walletAddress?: string;
  portfolioValue?: number;
  totalTokens?: number;
  onRefresh?: () => void;
}

export function DashboardHeader({ 
  network, 
  walletAddress, 
  portfolioValue = 0,
  totalTokens = 0,
  onRefresh 
}: DashboardHeaderProps) {
  const { toast } = useToast();
  const { disconnect: disconnectAlgorand } = useAlgorandWallet();
  const { disconnect: disconnectSolana } = useWallet();

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

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
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
    <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between h-full px-6">
        
        {/* Left Section - Portfolio Stats */}
        <div className="flex items-center gap-6">
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
        </div>

        {/* Right Section - Wallet & Actions */}
        <div className="flex items-center gap-4">
          
          {/* Refresh Button */}
          {onRefresh && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onRefresh}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Bell className="w-4 h-4" />
          </Button>

          {/* Network Badge */}
          <Badge className={`${info.bgColor} ${info.color} ${info.borderColor} border`}>
            {info.name}
          </Badge>

          {/* Wallet Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 h-9">
                <Wallet className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {formatAddress(walletAddress || '')}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <div className="text-sm font-medium text-foreground">
                  {info.name} Wallet
                </div>
                <div className="text-xs text-muted-foreground font-mono">
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
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                Wallet Settings
              </DropdownMenuItem>
              
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
