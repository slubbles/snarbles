'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TestTube, Globe, Zap, AlertTriangle } from 'lucide-react';

interface NetworkBadgeProps {
  network: string;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function NetworkBadge({ network, className, showIcon = true, size = 'md' }: NetworkBadgeProps) {
  const getNetworkConfig = (network: string) => {
    if (network.includes('mainnet')) {
      return {
        label: 'MAINNET',
        color: 'bg-red-500/10 text-red-700 border-red-500/20 hover:bg-red-500/20',
        icon: Globe,
        description: 'Real transactions with fees'
      };
    }
    
    if (network.includes('testnet')) {
      return {
        label: 'TESTNET', 
        color: 'bg-blue-500/10 text-blue-700 border-blue-500/20 hover:bg-blue-500/20',
        icon: TestTube,
        description: 'Free test environment'
      };
    }
    
    if (network.includes('devnet')) {
      return {
        label: 'DEVNET',
        color: 'bg-purple-500/10 text-purple-700 border-purple-500/20 hover:bg-purple-500/20', 
        icon: Zap,
        description: 'Development environment'
      };
    }
    
    return {
      label: 'UNKNOWN',
      color: 'bg-gray-500/10 text-gray-700 border-gray-500/20',
      icon: AlertTriangle,
      description: 'Unknown network'
    };
  };

  const config = getNetworkConfig(network);
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5', 
    lg: 'text-base px-4 py-2'
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        config.color,
        sizeClasses[size],
        'font-semibold tracking-wide border transition-colors',
        className
      )}
      title={config.description}
    >
      {showIcon && <Icon className={cn('mr-1.5', size === 'sm' ? 'w-3 h-3' : 'w-4 h-4')} />}
      {config.label}
    </Badge>
  );
}

// Preset components for common networks
export function SolanaDevnetBadge({ className }: { className?: string }) {
  return <NetworkBadge network="solana-devnet" className={className} />;
}

export function AlgorandTestnetBadge({ className }: { className?: string }) {
  return <NetworkBadge network="algorand-testnet" className={className} />;
}

export function AlgorandMainnetBadge({ className }: { className?: string }) {
  return <NetworkBadge network="algorand-mainnet" className={className} />;
}
