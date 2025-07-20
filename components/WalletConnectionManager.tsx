'use client';

import React from 'react';
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider';
import { Button } from '@/components/ui/button';
import { Wallet, Wifi, WifiOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WalletConnectionManagerProps {
  onConnectionChange?: (connected: boolean, walletType?: string) => void;
  className?: string;
}

export default function WalletConnectionManager({ onConnectionChange, className }: WalletConnectionManagerProps) {
  const { 
    connected, 
    isConnecting, 
    address, 
    connect, 
    disconnect,
    error
  } = useAlgorandWallet();
  
  const { toast } = useToast();

  const handleConnect = async () => {
    try {
      await connect();
      onConnectionChange?.(true, 'pera'); // Assuming Pera since this is Algorand
      toast({
        title: "Wallet Connected",
        description: "Successfully connected to Pera wallet",
        duration: 3000,
      });
    } catch (error) {
      console.error('Connection failed:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      onConnectionChange?.(false);
      toast({
        title: "Wallet Disconnected",
        description: "Successfully disconnected from wallet",
        duration: 3000,
      });
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  };

  if (connected && address) {
    return (
      <div className={`flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg ${className || ''}`}>
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-800">
            Connected to Pera
          </span>
          <Wifi className="h-4 w-4 text-green-600" />
        </div>
        <div className="text-xs text-green-600 font-mono">
          {address.slice(0, 6)}...{address.slice(-4)}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDisconnect}
          className="ml-auto"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg ${className || ''}`}>
      <Wallet className="h-4 w-4 text-gray-400" />
      <span className="text-sm text-gray-600">No wallet connected</span>
      {error && (
        <WifiOff className="h-4 w-4 text-red-500" />
      )}
      <Button
        onClick={handleConnect}
        disabled={isConnecting}
        className="ml-auto"
      >
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>
    </div>
  );
}