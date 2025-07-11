'use client';

import React from 'react';
import { useSolanaNetwork } from './providers/WalletProvider';
import { Button } from './ui/button';
import { NETWORK_STATUS } from '@/lib/solana-data';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';
import { Badge } from './ui/badge';
import { ChevronDown, Globe, TestTube, Zap } from 'lucide-react';

export function SolanaNetworkSelector() {
  const { currentNetwork, setNetwork, availableNetworks } = useSolanaNetwork();

  const getNetworkIcon = (networkName: string) => {
    if (networkName.includes('Mainnet')) return <Globe className="w-4 h-4" />;
    if (networkName.includes('Testnet')) return <TestTube className="w-4 h-4" />;
    if (networkName.includes('Devnet')) return <Zap className="w-4 h-4" />;
    return <Globe className="w-4 h-4" />;
  };

  const getNetworkStatus = (networkKey: keyof typeof availableNetworks) => {
    const network = availableNetworks[networkKey];
    if (!network.programId) return 'Not Deployed';
    
    // Use the network status from our configuration
    const statusInfo = NETWORK_STATUS[networkKey as keyof typeof NETWORK_STATUS];
    return statusInfo ? statusInfo.status : 'Available';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LIVE': return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'PLANNED': return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      case 'Not Deployed': return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
      default: return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
    }
  };

  const isNetworkAvailable = (networkKey: keyof typeof availableNetworks) => {
    return availableNetworks[networkKey].programId !== null;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center gap-2 min-w-[140px] justify-between"
        >
          <div className="flex items-center gap-2">
            {getNetworkIcon(currentNetwork.name)}
            <span className="text-sm font-medium">{currentNetwork.name}</span>
          </div>
          <ChevronDown className="w-4 h-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium text-gray-900">Solana Networks</p>
          <p className="text-xs text-gray-500">Select network for token creation</p>
        </div>
        <DropdownMenuSeparator />
        
        {Object.entries(availableNetworks).map(([key, network]) => {
          const networkKey = key as keyof typeof availableNetworks;
          const status = getNetworkStatus(networkKey);
          const isAvailable = isNetworkAvailable(networkKey);
          const isSelected = currentNetwork.name === network.name;

          return (
            <DropdownMenuItem
              key={key}
              onClick={() => isAvailable && setNetwork(networkKey)}
              disabled={!isAvailable}
              className={`flex items-center justify-between p-3 cursor-pointer ${
                !isAvailable ? 'opacity-50 cursor-not-allowed' : ''
              } ${isSelected ? 'bg-blue-50 border-l-2 border-blue-500' : ''}`}
            >
              <div className="flex items-center gap-3">
                {getNetworkIcon(network.name)}
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{network.name}</span>
                  {network.isTestnet && (
                    <span className="text-xs text-gray-500">Test Network</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge 
                  variant="outline" 
                  className={`text-xs px-2 py-0.5 ${getStatusColor(status)}`}
                >
                  {status}
                </Badge>
                {isSelected && (
                  <Badge variant="default" className="text-xs px-2 py-0.5">
                    Current
                  </Badge>
                )}
              </div>
            </DropdownMenuItem>
          );
        })}
        
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5">
          <p className="text-xs text-gray-500">
            ✅ Testnet & Devnet: Ready for token creation<br/>
            🚀 Same program deployed on both networks<br/>
            📋 Mainnet: Deployment planned
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Alternative compact version for mobile or tight spaces
export function SolanaNetworkSelectorCompact() {
  const { currentNetwork, setNetwork, availableNetworks } = useSolanaNetwork();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-1">
          <TestTube className="w-4 h-4" />
          <span className="text-xs font-medium">{currentNetwork.name}</span>
          <ChevronDown className="w-3 h-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {Object.entries(availableNetworks).map(([key, network]) => {
          const networkKey = key as keyof typeof availableNetworks;
          const isAvailable = network.programId !== null;
          const isSelected = currentNetwork.name === network.name;

          return (
            <DropdownMenuItem
              key={key}
              onClick={() => isAvailable && setNetwork(networkKey)}
              disabled={!isAvailable}
              className={`text-sm ${!isAvailable ? 'opacity-50' : ''} ${
                isSelected ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span>{network.name}</span>
                {isSelected && <span className="text-blue-600">✓</span>}
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 