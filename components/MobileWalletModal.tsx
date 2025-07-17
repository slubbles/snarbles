'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Smartphone, 
  Monitor, 
  Download, 
  ExternalLink, 
  CheckCircle,
  AlertTriangle,
  Wifi,
  Globe,
  QrCode,
  ArrowRight,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { isMobile, isIOS, isAndroid } from '@/lib/mobile-wallet-utils';
import PhantomMobileConnector from '@/components/PhantomMobileConnector';
import PeraMobileConnector from '@/components/PeraMobileConnector';

interface MobileWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWalletConnect?: (walletType: 'phantom' | 'pera', connected: boolean) => void;
}

export function MobileWalletModal({
  isOpen,
  onClose,
  onWalletConnect
}: MobileWalletModalProps) {
  const [selectedTab, setSelectedTab] = useState<'phantom' | 'pera'>('phantom');
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsMobileDevice(isMobile());
  }, []);

  const handleWalletConnectionChange = (walletType: 'phantom' | 'pera', connected: boolean) => {
    if (connected) {
      toast({
        title: `${walletType === 'phantom' ? 'Phantom' : 'Pera'} Connected`,
        description: `Successfully connected to ${walletType === 'phantom' ? 'Phantom' : 'Pera'} wallet`,
        duration: 3000,
      });
      
      // Close modal after successful connection
      setTimeout(() => {
        onClose();
      }, 1500);
    }
    
    onWalletConnect?.(walletType, connected);
  };

  const renderMobileInstructions = () => (
    <div className="space-y-4">
      <Alert className="border-blue-500/50 bg-blue-500/10">
        <Smartphone className="w-4 h-4" />
        <AlertDescription>
          <strong>Mobile Device Detected</strong>
          <p className="text-sm mt-1">
            Follow these steps to connect your mobile wallet:
          </p>
        </AlertDescription>
      </Alert>
      
      <div className="space-y-3">
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
            1
          </div>
          <div>
            <p className="font-medium">Install the wallet app</p>
            <p className="text-sm text-muted-foreground">
              Download {selectedTab === 'phantom' ? 'Phantom' : 'Pera'} from your app store if not already installed
            </p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
            2
          </div>
          <div>
            <p className="font-medium">Tap "Connect"</p>
            <p className="text-sm text-muted-foreground">
              This will open the wallet app automatically
            </p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
            3
          </div>
          <div>
            <p className="font-medium">Approve connection</p>
            <p className="text-sm text-muted-foreground">
              Approve the connection request in your wallet app
            </p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
            4
          </div>
          <div>
            <p className="font-medium">Return to Snarbles</p>
            <p className="text-sm text-muted-foreground">
              Come back to this page to continue using the platform
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDesktopInstructions = () => (
    <div className="space-y-4">
      <Alert className="border-purple-500/50 bg-purple-500/10">
        <Monitor className="w-4 h-4" />
        <AlertDescription>
          <strong>Desktop Browser Detected</strong>
          <p className="text-sm mt-1">
            Install the browser extension for the best experience
          </p>
        </AlertDescription>
      </Alert>
      
      <div className="space-y-3">
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-sm font-bold">
            1
          </div>
          <div>
            <p className="font-medium">Install browser extension</p>
            <p className="text-sm text-muted-foreground">
              Add {selectedTab === 'phantom' ? 'Phantom' : 'Pera'} to your browser
            </p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-sm font-bold">
            2
          </div>
          <div>
            <p className="font-medium">Create or import wallet</p>
            <p className="text-sm text-muted-foreground">
              Set up your wallet following the extension prompts
            </p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-sm font-bold">
            3
          </div>
          <div>
            <p className="font-medium">Connect to Snarbles</p>
            <p className="text-sm text-muted-foreground">
              Click "Connect" and approve the connection
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold">
                Connect Your Wallet
              </DialogTitle>
              <DialogDescription>
                Choose your preferred wallet to get started
              </DialogDescription>
            </div>
            <div className="flex items-center space-x-2">
              {isMobileDevice && (
                <Badge variant="outline" className="text-xs">
                  <Smartphone className="w-3 h-3 mr-1" />
                  Mobile
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Wallet Selection Tabs */}
          <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as 'phantom' | 'pera')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="phantom" className="flex items-center space-x-2">
                <span>👻</span>
                <span>Phantom</span>
              </TabsTrigger>
              <TabsTrigger value="pera" className="flex items-center space-x-2">
                <span>🔷</span>
                <span>Pera</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="phantom" className="space-y-4">
              <PhantomMobileConnector
                onConnectionChange={(connected) => handleWalletConnectionChange('phantom', connected)}
              />
            </TabsContent>
            
            <TabsContent value="pera" className="space-y-4">
              <PeraMobileConnector
                onConnectionChange={(connected) => handleWalletConnectionChange('pera', connected)}
              />
            </TabsContent>
          </Tabs>
          
          {/* Instructions Toggle */}
          <div className="border-t pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInstructions(!showInstructions)}
              className="w-full justify-between"
            >
              <span>Need help connecting?</span>
              <ArrowRight className={`w-4 h-4 transition-transform ${showInstructions ? 'rotate-90' : ''}`} />
            </Button>
            
            {showInstructions && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                {isMobileDevice ? renderMobileInstructions() : renderDesktopInstructions()}
              </div>
            )}
          </div>
          
          {/* Platform Support Info */}
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Supports {isMobileDevice ? 'mobile apps and' : ''} browser extensions
            </p>
            <div className="flex justify-center space-x-4 text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span>Secure</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span>Open Source</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span>No Fees</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default MobileWalletModal;
