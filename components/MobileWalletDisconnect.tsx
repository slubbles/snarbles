'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Wallet, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { isMobileDevice } from '@/lib/mobile-wallet-detection';

interface MobileWalletDisconnectProps {
  walletType: 'solana' | 'algorand';
  walletAddress: string;
  onDisconnect: () => Promise<void>;
  isConnected: boolean;
}

export default function MobileWalletDisconnect({
  walletType,
  walletAddress,
  onDisconnect,
  isConnected
}: MobileWalletDisconnectProps) {
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  // Only show on mobile devices
  if (!isMobileDevice() || !isConnected) {
    return null;
  }
  
  const formatAddress = (address: string): string => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };
  
  const getWalletName = (type: 'solana' | 'algorand'): string => {
    return type === 'solana' ? 'Phantom' : 'Pera Wallet';
  };
  
  const getWalletIcon = (type: 'solana' | 'algorand'): string => {
    return type === 'solana' ? '🟣' : '🟡';
  };
  
  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
        duration: 2000
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
      toast({
        title: "Copy Failed",
        description: "Failed to copy wallet address",
        variant: "destructive"
      });
    }
  };
  
  const handleDisconnect = async () => {
    if (isDisconnecting) return;
    
    setIsDisconnecting(true);
    
    try {
      toast({
        title: `Disconnecting ${getWalletName(walletType)}...`,
        duration: 1500
      });
      
      await onDisconnect();
      
      toast({
        title: "Wallet Disconnected",
        description: `Successfully disconnected from ${getWalletName(walletType)}`,
        duration: 2000
      });
    } catch (error: any) {
      console.error(`${walletType} disconnect error:`, error);
      toast({
        title: "Disconnect Failed",
        description: `Failed to disconnect ${getWalletName(walletType)}`,
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setIsDisconnecting(false);
    }
  };
  
  return (
    <div className="glass-card border border-border/20 rounded-lg p-4 space-y-3">
      {/* Wallet Info Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <span className="text-lg">{getWalletIcon(walletType)}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {getWalletName(walletType)}
            </p>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground">
                {formatAddress(walletAddress)}
              </span>
              <button
                onClick={handleCopyAddress}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Connection Status */}
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-xs text-green-500 font-medium">Connected</span>
        </div>
      </div>
      
      {/* Disconnect Button */}
      <Button
        onClick={handleDisconnect}
        disabled={isDisconnecting}
        variant="outline"
        className="w-full border-red-500/20 text-red-500 hover:bg-red-500/10 hover:border-red-500/40 transition-colors"
      >
        <LogOut className="h-4 w-4 mr-2" />
        {isDisconnecting ? (
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Disconnecting...</span>
          </div>
        ) : (
          'Disconnect Wallet'
        )}
      </Button>
    </div>
  );
}
