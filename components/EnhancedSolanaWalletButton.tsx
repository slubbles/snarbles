'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { WalletReadyState } from '@solana/wallet-adapter-base';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Wallet, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Download,
  ExternalLink,
  Zap,
  Eye
} from 'lucide-react';

interface EnhancedSolanaWalletButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
}

interface WalletDetectionStatus {
  phantom: boolean;
  solflare: boolean;
  backpack: boolean;
  total: number;
}

export function EnhancedSolanaWalletButton({
  className = '',
  size = 'md',
  showStatus = true,
  variant = 'default'
}: EnhancedSolanaWalletButtonProps) {
  const { 
    wallet, 
    wallets, 
    publicKey, 
    connected, 
    connecting, 
    connect,
    disconnect 
  } = useWallet();
  
  const { setVisible, visible } = useWalletModal();
  const { toast } = useToast();
  
  const [walletDetection, setWalletDetection] = useState<WalletDetectionStatus>({
    phantom: false,
    solflare: false,
    backpack: false,
    total: 0
  });
  
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  // Detect installed wallets
  const detectWallets = useCallback(() => {
    if (typeof window === 'undefined') return;

    const detection: WalletDetectionStatus = {
      phantom: !!(window as any).phantom?.solana,
      solflare: !!(window as any).solflare,
      backpack: !!(window as any).backpack,
      total: 0
    };

    // Count installed wallets from window objects
    detection.total = Object.values(detection).filter(Boolean).length;

    // Also check wallet adapters
    const installedAdapters = wallets.filter(w => 
      w.adapter.readyState === WalletReadyState.Installed
    ).length;

    // Use the higher count
    detection.total = Math.max(detection.total, installedAdapters);

    setWalletDetection(detection);
    
    console.log('🔍 Wallet Detection:', detection);
  }, [wallets]);

  // Enhanced connection handler
  const handleConnect = useCallback(async () => {
    if (connecting || connected) return;

    try {
      setConnectionAttempts(prev => prev + 1);
      
      if (walletDetection.total === 0) {
        toast({
          title: "No Wallets Found",
          description: "Please install a Solana wallet extension first.",
          variant: "destructive",
          duration: 5000,
        });
        return;
      }

      console.log('🔗 Opening wallet selection modal...');
      setVisible(true);
      
    } catch (error: any) {
      console.error('❌ Connection failed:', error);
      toast({
        title: "Connection Failed",
        description: error.message || 'Failed to open wallet selection',
        variant: "destructive",
        duration: 4000,
      });
    }
  }, [connecting, connected, walletDetection.total, setVisible, toast]);

  // Enhanced disconnect handler
  const handleDisconnect = useCallback(async () => {
    if (!connected) return;

    try {
      console.log('🔌 Disconnecting wallet...');
      await disconnect();
      
      toast({
        title: "Disconnected",
        description: "Wallet disconnected successfully",
        duration: 2000,
      });
      
    } catch (error: any) {
      console.error('❌ Disconnect failed:', error);
      toast({
        title: "Disconnect Failed",
        description: error.message || 'Failed to disconnect wallet',
        variant: "destructive",
        duration: 3000,
      });
    }
  }, [connected, disconnect, toast]);

  // Auto-reconnection logic
  useEffect(() => {
    if (connected || connecting || isReconnecting) return;
    
    const lastConnectedWallet = localStorage.getItem('snarbles_last_connected_wallet');
    if (!lastConnectedWallet) return;

    const handleReconnect = async () => {
      setIsReconnecting(true);
      
      try {
        const walletToReconnect = wallets.find(w => w.adapter.name === lastConnectedWallet);
        if (walletToReconnect && walletToReconnect.adapter.readyState === WalletReadyState.Installed) {
          console.log(`🔄 Auto-reconnecting to ${lastConnectedWallet}...`);
          await connect();
        }
      } catch (error) {
        console.warn('Auto-reconnect failed:', error);
      } finally {
        setIsReconnecting(false);
      }
    };

    // Delay auto-reconnect to avoid conflicts
    const timer = setTimeout(handleReconnect, 2000);
    return () => clearTimeout(timer);
  }, [connected, connecting, isReconnecting, wallets, connect]);

  // Save last connected wallet
  useEffect(() => {
    if (connected && wallet) {
      localStorage.setItem('snarbles_last_connected_wallet', wallet.adapter.name);
      console.log(`💾 Saved last connected wallet: ${wallet.adapter.name}`);
    }
  }, [connected, wallet]);

  // Initial wallet detection
  useEffect(() => {
    detectWallets();
    
    // Re-detect periodically
    const interval = setInterval(detectWallets, 5000);
    return () => clearInterval(interval);
  }, [detectWallets]);

  // Size variations
  const sizeClasses = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-9 px-4 text-sm',
    lg: 'h-10 px-6 text-base'
  };

  // Status indicator
  const getStatusIndicator = () => {
    if (connected) {
      return <CheckCircle className="w-3 h-3 text-green-500" />;
    }
    if (connecting || isReconnecting) {
      return <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />;
    }
    if (walletDetection.total === 0) {
      return <AlertTriangle className="w-3 h-3 text-orange-500" />;
    }
    return <Wallet className="w-3 h-3" />;
  };

  // Button text
  const getButtonText = () => {
    if (connected && publicKey) {
      return `${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}`;
    }
    if (connecting) return 'Connecting...';
    if (isReconnecting) return 'Reconnecting...';
    if (walletDetection.total === 0) return 'Install Wallet';
    return 'Connect Wallet';
  };

  // Button action
  const getButtonAction = () => {
    if (connected) return handleDisconnect;
    if (walletDetection.total === 0) {
      return () => window.open('https://phantom.app/', '_blank');
    }
    return handleConnect;
  };

  // Button variant styling
  const getButtonClass = () => {
    const baseClass = `${sizeClasses[size]} ${className}`;
    
    if (connected) {
      return `${baseClass} bg-green-500 hover:bg-green-600 text-white border-green-500`;
    }
    
    if (variant === 'default') {
      return `${baseClass} bg-[#9945FF] hover:bg-[#8A3FF0] text-white`;
    }
    
    return baseClass;
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={getButtonAction()}
        disabled={connecting || isReconnecting}
        variant={connected ? 'outline' : variant}
        className={getButtonClass()}
      >
        {getStatusIndicator()}
        <span className="ml-2">{getButtonText()}</span>
      </Button>

      {/* Status badges */}
      {showStatus && (
        <div className="flex items-center gap-1">
          {walletDetection.total > 0 && (
            <Badge 
              variant="outline" 
              className="h-5 px-1 text-xs bg-green-500/10 text-green-700 border-green-500/20"
            >
              {walletDetection.total} 🔗
            </Badge>
          )}
          
          {process.env.NODE_ENV === 'development' && connectionAttempts > 0 && (
            <Badge 
              variant="outline" 
              className="h-5 px-1 text-xs bg-blue-500/10 text-blue-700 border-blue-500/20"
            >
              {connectionAttempts} attempts
            </Badge>
          )}
        </div>
      )}

      {/* Installation prompt for missing wallets */}
      {walletDetection.total === 0 && (
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => window.open('https://phantom.app/', '_blank')}
            className="h-6 px-2 text-xs"
          >
            <Download className="w-3 h-3 mr-1" />
            Phantom
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => window.open('https://solflare.com/', '_blank')}
            className="h-6 px-2 text-xs"
          >
            <Download className="w-3 h-3 mr-1" />
            Solflare
          </Button>
        </div>
      )}
    </div>
  );
}

export default EnhancedSolanaWalletButton; 