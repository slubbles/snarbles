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
    <div className={`wallet-connection-status mobile-optimized glass-card p-4 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Wallet className="w-5 h-5 text-primary flex-shrink-0" />
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm text-foreground font-medium truncate">
                {truncateAddress(walletAddress)}
              </span>
              <Badge variant="outline" className="text-green-400 border-green-400 flex-shrink-0">
                Connected
              </Badge>
            </div>
            
            {showBalance && walletBalance !== null && (
              <span className="text-xs text-muted-foreground">
                Balance: {walletBalance.toFixed(2)} ALGO
              </span>
            )}
          </div>
        </div>

        {/* Mobile-friendly disconnect and explorer buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm" 
            onClick={openInExplorer}
            className="p-2 h-auto text-muted-foreground hover:text-foreground touch-friendly"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
          
          <Button
            onClick={handleDisconnect}
            disabled={isDisconnecting}
            variant="outline"
            size="sm"
            className="disconnect-btn touch-friendly border-primary text-primary hover:bg-primary/10 min-h-[44px] px-4"
          >
            {isDisconnecting ? (
              <>
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
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
      </div>
    </div>
  );
}
