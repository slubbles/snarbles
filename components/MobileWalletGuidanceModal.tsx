'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Smartphone, Download, ExternalLink, X } from 'lucide-react';
import { generateWalletDeepLink, getWalletDownloadUrl, getWalletAppName } from '@/lib/deep-links';

interface MobileWalletGuidanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletType: 'solana' | 'algorand';
  error?: string;
}

export default function MobileWalletGuidanceModal({ 
  isOpen, 
  onClose, 
  walletType, 
  error 
}: MobileWalletGuidanceModalProps) {
  
  const walletName = getWalletAppName(walletType);
  const downloadUrl = getWalletDownloadUrl(walletType);
  const deepLink = generateWalletDeepLink(walletType);
  
  const getWalletSteps = (type: 'solana' | 'algorand'): string[] => {
    if (type === 'solana') {
      return [
        'Open Phantom app',
        'Tap "Browser" tab',
        'Go to snarbles.com',
        'Connect wallet'
      ];
    } else {
      return [
        'Open Pera Wallet app',
        'Tap "Browser" icon',
        'Go to snarbles.com',
        'Connect wallet'
      ];
    }
  };
  
  const steps = getWalletSteps(walletType);
  
  const handleOpenInWallet = () => {
    window.open(deepLink, '_blank');
    // Close modal after opening
    setTimeout(() => onClose(), 1000);
  };
  
  const handleDownloadWallet = () => {
    window.open(downloadUrl, '_blank');
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-4 bg-background border border-border rounded-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2 text-foreground">
              <Smartphone className="h-5 w-5 text-red-500" />
              <span>Mobile Connection Guide</span>
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-4 pt-2">
          {/* Problem Explanation */}
          <div className="glass-card border-red-500/20 bg-red-500/5 p-3 rounded-lg">
            <p className="text-sm text-foreground">
              📱 Mobile browsers can't connect directly to wallets. Use the <strong>{walletName} app browser</strong> instead.
            </p>
          </div>
          
          {/* Quick Steps */}
          <div className="space-y-3">
            <h4 className="font-medium text-foreground">Quick Fix (4 steps):</h4>
            <ol className="text-sm space-y-2">
              {steps.map((step, i) => (
                <li key={i} className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                  <span className="text-muted-foreground">{step}</span>
                </li>
              ))}
            </ol>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col space-y-2 pt-2">
            <Button 
              onClick={handleOpenInWallet}
              className="button-enhanced w-full flex items-center justify-center space-x-2"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Open in {walletName}</span>
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleDownloadWallet}
              className="w-full flex items-center justify-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Download {walletName}</span>
            </Button>
          </div>
          
          {/* Additional Help */}
          <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
            Having trouble? Make sure you have {walletName} installed first.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
