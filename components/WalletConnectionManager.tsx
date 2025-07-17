'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, LogOut, ExternalLink } from 'lucide-react';
import { useWalletAuth } from '@/components/providers/WalletAuthProvider';
import { usePaymentState } from '@/hooks/usePaymentState';
import { useToast } from '@/hooks/use-toast';

interface WalletConnectionManagerProps {
  className?: string;
  showBalance?: boolean;
}

export default function WalletConnectionManager({ 
  className = '',
  showBalance = true 
}: WalletConnectionManagerProps) {
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const { walletAddress, isAuthenticated, disconnectWallet: authDisconnectWallet } = useWalletAuth();
  const { walletBalance, setIsConnected } = usePaymentState();
  const { toast } = useToast();

  const handleDisconnect = async () => {
    if (isDisconnecting) return;
    
    setIsDisconnecting(true);
    
    try {
      // Use the auth provider's disconnect method
      await authDisconnectWallet();
      
      // Update global state
      setIsConnected(false);
      
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been disconnected successfully.",
      });
      
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      toast({
        title: "Disconnect Failed",
        description: "Failed to disconnect wallet. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  const truncateAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const openInExplorer = () => {
    if (!walletAddress) return;
    const explorerUrl = `https://explorer.perawallet.app/address/${walletAddress}`;
    window.open(explorerUrl, '_blank');
  };

  if (!isAuthenticated || !walletAddress) {
    return null;
  }

  return (
    <div className={`wallet-connection-status mobile-optimized ${className}`}>
      <div className="connected-wallet-info">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-[rgb(239,68,68)]" />
          <Badge variant="outline" className="text-green-400 border-green-400">
            Connected
          </Badge>
        </div>
        
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="snarbles-body text-sm text-[rgb(254,254,235)] font-medium">
              {truncateAddress(walletAddress)}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={openInExplorer}
              className="p-1 h-auto text-[rgb(163,163,163)] hover:text-[rgb(254,254,235)]"
            >
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>
          
          {showBalance && walletBalance !== null && (
            <span className="snarbles-body text-xs text-[rgb(163,163,163)]">
              Balance: {walletBalance.toFixed(2)} ALGO
            </span>
          )}
        </div>
      </div>

      <Button
        onClick={handleDisconnect}
        disabled={isDisconnecting}
        variant="outline"
        size="sm"
        className="disconnect-btn touch-friendly border-[rgb(239,68,68)] text-[rgb(239,68,68)] hover:bg-[rgb(239,68,68)]/10"
      >
        {isDisconnecting ? (
          <>
            <div className="w-4 h-4 border-2 border-[rgb(239,68,68)] border-t-transparent rounded-full animate-spin mr-2" />
            Disconnecting...
          </>
        ) : (
          <>
            <LogOut className="w-4 h-4 mr-2" />
            Disconnect
          </>
        )}
      </Button>
    </div>
  );
}
