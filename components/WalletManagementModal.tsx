'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Wallet } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider';
import { 
  isPhantomAppBrowser, 
  isPeraAppBrowser,
  isMobileDevice 
} from '@/lib/mobile-wallet-detection';
import { SolanaWalletModal } from './SolanaWalletModal';
import { AlgorandWalletModal } from './AlgorandWalletModal';
import { mobileEducationManager } from '@/lib/mobile-education-events';

interface WalletManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WalletManagementModal({ 
  isOpen, 
  onClose 
}: WalletManagementModalProps) {
  const [selectedWallet, setSelectedWallet] = useState<'solana' | 'algorand' | null>(null);
  
  // Solana wallet hooks
  const { connected: solanaConnected } = useWallet();
  const { setVisible: setWalletModalVisible } = useWalletModal();
  
  // Algorand wallet hooks
  const { 
    connected: algorandConnected, 
    connect: connectAlgorand,
    isConnecting: algorandConnecting 
  } = useAlgorandWallet();

  const handleSolanaConnect = async () => {
    try {
      // Check if we're in Phantom app browser
      if (isPhantomAppBrowser()) {
        // Show Solana wallet modal for direct connection
        setSelectedWallet('solana');
      } else {
        // Use standard wallet adapter for other cases
        setWalletModalVisible(true);
        onClose(); // Close this modal since wallet adapter modal is showing
      }
    } catch (error: any) {
      console.error('Solana connection error:', error);
      
      // If mobile and connection fails, trigger education
      if (isMobileDevice()) {
        mobileEducationManager.trigger({
          walletType: 'solana',
          error: error.message
        });
        onClose();
      }
    }
  };

  const handleAlgorandConnect = async () => {
    try {
      // Check if we're in Pera app browser
      if (isPeraAppBrowser()) {
        // Show Algorand wallet modal for direct connection
        setSelectedWallet('algorand');
      } else {
        // Try standard connection
        await connectAlgorand();
        onClose();
      }
    } catch (error: any) {
      console.error('Algorand connection error:', error);
      
      // If mobile and connection fails, trigger education
      if (isMobileDevice()) {
        mobileEducationManager.trigger({
          walletType: 'algorand',
          error: error.message
        });
        onClose();
      }
    }
  };

  const handleModalClose = () => {
    setSelectedWallet(null);
    onClose();
  };

  // If a specific wallet modal is selected, show it
  if (selectedWallet === 'solana') {
    return (
      <SolanaWalletModal 
        isOpen={true} 
        onClose={() => {
          setSelectedWallet(null);
          onClose();
        }} 
      />
    );
  }

  if (selectedWallet === 'algorand') {
    return (
      <AlgorandWalletModal 
        isOpen={true} 
        onClose={() => {
          setSelectedWallet(null);
          onClose();
        }} 
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
      <DialogContent className="max-w-sm mx-4 bg-background border border-border rounded-xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-foreground font-bold text-lg">
              Wallet Management
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleModalClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-muted-foreground text-sm">
            Connect or manage your wallets
          </p>
        </DialogHeader>
        
        <div className="space-y-3 pt-2">
          {/* Solana Wallet Card */}
          <Card className="border border-[#9945FF]/20 bg-[#9945FF]/5 overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-[#9945FF]/10 p-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-[#9945FF] flex items-center justify-center shadow-md">
                    <span className="text-white font-bold text-sm">S</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-foreground font-medium text-sm">Solana Wallet</p>
                    <p className="text-muted-foreground text-xs">For Solana Network tokens</p>
                  </div>
                  {solanaConnected && (
                    <div className="flex items-center text-green-500 text-xs font-medium">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                      Connected
                    </div>
                  )}
                </div>
              </div>
              <div className="p-3">
                <Button
                  onClick={handleSolanaConnect}
                  disabled={solanaConnected}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-lg h-10 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  {solanaConnected ? 'Connected' : 'Connect Solana Wallet'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Algorand Wallet Card */}
          <Card className="border border-[#ffee55]/20 bg-[#ffee55]/5 overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-[#ffee55]/10 p-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-[#ffee55] flex items-center justify-center shadow-md">
                    <span className="text-black font-bold text-sm">A</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-foreground font-medium text-sm">Algorand Wallet</p>
                    <p className="text-muted-foreground text-xs">For Algorand Network tokens</p>
                  </div>
                  {algorandConnected && (
                    <div className="flex items-center text-green-500 text-xs font-medium">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                      Connected
                    </div>
                  )}
                </div>
              </div>
              <div className="p-3">
                <Button
                  onClick={handleAlgorandConnect}
                  disabled={algorandConnected || algorandConnecting}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-lg h-10 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  {algorandConnecting ? 'Connecting...' : algorandConnected ? 'Connected' : 'Connect Pera Wallet'}
                </Button>
                {!algorandConnected && (
                  <p className="text-xs text-[#ffee55] text-center mt-2">
                    Need to install Pera Wallet?
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Close Button */}
          <Button
            onClick={handleModalClose}
            variant="outline"
            className="w-full mt-4 border-border text-muted-foreground hover:text-foreground"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
