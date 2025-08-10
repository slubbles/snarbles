'use client';

import React, { useState } from 'react';
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Wallet, Wifi, WifiOff, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MultiWalletConnectionManagerProps {
  onConnectionChange?: (connected: boolean, walletType?: 'algorand' | 'solana', address?: string) => void;
  className?: string;
  preferredNetwork?: 'algorand' | 'solana';
  showNetworkSelection?: boolean;
  hideStatusWhenConnected?: boolean;
}

export default function MultiWalletConnectionManager({ 
  onConnectionChange, 
  className, 
  preferredNetwork = 'algorand',
  showNetworkSelection = true,
  hideStatusWhenConnected = false
}: MultiWalletConnectionManagerProps) {
  const [selectedNetwork, setSelectedNetwork] = useState<'algorand' | 'solana'>(preferredNetwork);
  
  // Algorand wallet
  const { 
    connected: algorandConnected, 
    isConnecting: algorandConnecting, 
    address: algorandAddress, 
    connect: algorandConnect, 
    disconnect: algorandDisconnect,
    error: algorandError
  } = useAlgorandWallet();
  
  // Solana wallet
  const { 
    connected: solanaConnected, 
    connecting: solanaConnecting, 
    publicKey: solanaPublicKey, 
    connect: solanaConnect, 
    disconnect: solanaDisconnect,
    wallet: solanaWallet 
  } = useWallet();
  
  const { toast } = useToast();

  const handleAlgorandConnect = async () => {
    try {
      await algorandConnect();
      onConnectionChange?.(true, 'algorand', algorandAddress || undefined);
      toast({
        title: "Wallet Connected",
        description: "Successfully connected to Pera wallet",
        duration: 3000,
      });
    } catch (error) {
      console.error('Algorand connection failed:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect Algorand wallet. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const handleSolanaConnect = async () => {
    try {
      await solanaConnect();
      onConnectionChange?.(true, 'solana', solanaPublicKey?.toString());
      toast({
        title: "Wallet Connected",
        description: `Successfully connected to ${solanaWallet?.adapter.name || 'Solana'} wallet`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Solana connection failed:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect Solana wallet. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const handleAlgorandDisconnect = async () => {
    try {
      await algorandDisconnect();
      onConnectionChange?.(false, 'algorand');
      toast({
        title: "Wallet Disconnected",
        description: "Successfully disconnected from Algorand wallet",
        duration: 3000,
      });
    } catch (error) {
      console.error('Algorand disconnect failed:', error);
    }
  };

  const handleSolanaDisconnect = async () => {
    try {
      await solanaDisconnect();
      onConnectionChange?.(false, 'solana');
      toast({
        title: "Wallet Disconnected",
        description: "Successfully disconnected from Solana wallet",
        duration: 3000,
      });
    } catch (error) {
      console.error('Solana disconnect failed:', error);
    }
  };

  // Check if any wallet is connected
  const isConnected = algorandConnected || solanaConnected;
  const isConnecting = algorandConnecting || solanaConnecting;

  // Get connected wallet info
  const getConnectedWalletInfo = () => {
    if (algorandConnected && algorandAddress) {
      return {
        type: 'algorand' as const,
        name: 'Pera Wallet',
        address: algorandAddress,
        icon: 'A',
        gradient: 'snarbles-gradient-blue'
      };
    }
    if (solanaConnected && solanaPublicKey) {
      return {
        type: 'solana' as const,
        name: solanaWallet?.adapter.name || 'Solana Wallet',
        address: solanaPublicKey.toString(),
        icon: 'S',
        gradient: 'snarbles-gradient-purple'
      };
    }
    return null;
  };

  const connectedWallet = getConnectedWalletInfo();

  if (connectedWallet && !hideStatusWhenConnected) {
    return (
      <Card className={`snarbles-glass border-emerald-500/30 ${className || ''}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${connectedWallet.gradient} flex items-center justify-center`}>
              <span className="text-white font-bold">{connectedWallet.icon}</span>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="snarbles-heading font-semibold text-emerald-400">
                  {connectedWallet.name}
                </span>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  <Wifi className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              </div>
              <div className="text-xs snarbles-body-small text-gray-400 font-mono">
                {connectedWallet.address.slice(0, 8)}...{connectedWallet.address.slice(-8)}
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={connectedWallet.type === 'algorand' ? handleAlgorandDisconnect : handleSolanaDisconnect}
              className="snarbles-btn-secondary"
            >
              Disconnect
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`snarbles-glass border-gray-500/30 ${className || ''}`}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Network Selection */}
          {showNetworkSelection && (
            <div className="flex items-center gap-2">
              <span className="snarbles-body-small text-gray-400">Network:</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="snarbles-btn-secondary">
                    {selectedNetwork === 'algorand' ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded snarbles-gradient-blue flex items-center justify-center">
                          <span className="text-white text-xs font-bold">A</span>
                        </div>
                        Algorand
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded snarbles-gradient-purple flex items-center justify-center">
                          <span className="text-white text-xs font-bold">S</span>
                        </div>
                        Solana
                      </div>
                    )}
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSelectedNetwork('algorand')}>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded snarbles-gradient-blue flex items-center justify-center">
                        <span className="text-white text-xs font-bold">A</span>
                      </div>
                      Algorand
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedNetwork('solana')}>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded snarbles-gradient-purple flex items-center justify-center">
                        <span className="text-white text-xs font-bold">S</span>
                      </div>
                      Solana
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Connection Status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-gray-400" />
              <span className="snarbles-body text-gray-400">
                {isConnecting ? 'Connecting...' : 'No wallet connected'}
              </span>
              {(algorandError || !solanaWallet) && !isConnected && (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
            </div>
            
            <Button
              onClick={selectedNetwork === 'algorand' ? handleAlgorandConnect : handleSolanaConnect}
              disabled={isConnecting}
              className="snarbles-btn-primary ml-auto"
            >
              {isConnecting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Connecting...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Connect {selectedNetwork === 'algorand' ? 'Pera' : 'Solana'} Wallet
                </div>
              )}
            </Button>
          </div>

          {/* Helper Text */}
          <div className="text-xs snarbles-body-small text-gray-400">
            {selectedNetwork === 'algorand' 
              ? 'Connect your Pera wallet to create tokens on Algorand' 
              : 'Connect your Phantom, Solflare, or other Solana wallet'
            }
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
