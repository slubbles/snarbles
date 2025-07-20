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
    <div className="space-y-6">
      <div className="snarbles-glass-subtle p-4 rounded-xl border border-blue-500/30">
        <div className="flex items-center gap-3 mb-3">
          <Smartphone className="w-5 h-5 text-blue-400" />
          <span className="text-lg font-semibold text-blue-400">Mobile Device Detected</span>
        </div>
        <p className="snarbles-body text-gray-300">
          Follow these steps to connect your mobile wallet:
        </p>
      </div>
      
      <div className="space-y-4">
        {[
          {
            step: 1,
            title: "Install the wallet app",
            description: `Download ${selectedTab === 'phantom' ? 'Phantom' : 'Pera'} from your app store if not already installed`,
            color: "blue"
          },
          {
            step: 2,
            title: "Tap \"Connect\"",
            description: "This will open the wallet app automatically",
            color: "purple"
          },
          {
            step: 3,
            title: "Approve connection",
            description: "Approve the connection request in your wallet app",
            color: "green"
          },
          {
            step: 4,
            title: "Return to Snarbles",
            description: "Come back to this page to continue using the platform",
            color: "orange"
          }
        ].map((item) => (
          <div key={item.step} className="flex items-start space-x-4 snarbles-glass-subtle p-4 rounded-xl border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300">
            <div className={`w-8 h-8 rounded-full snarbles-gradient-${item.color} flex items-center justify-center text-white text-sm font-bold shadow-lg flex-shrink-0`}>
              {item.step}
            </div>
            <div className="flex-1">
              <p className="snarbles-body font-semibold text-white mb-1">{item.title}</p>
              <p className="snarbles-body-small text-gray-400 leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDesktopInstructions = () => (
    <div className="space-y-6">
      <div className="snarbles-glass-subtle p-4 rounded-xl border border-purple-500/30">
        <div className="flex items-center gap-3 mb-3">
          <Monitor className="w-5 h-5 text-purple-400" />
          <span className="text-lg font-semibold text-purple-400">Desktop Browser Detected</span>
        </div>
        <p className="snarbles-body text-gray-300">
          Install the browser extension for the best experience
        </p>
      </div>
      
      <div className="space-y-4">
        {[
          {
            step: 1,
            title: "Install browser extension",
            description: `Add ${selectedTab === 'phantom' ? 'Phantom' : 'Pera'} to your browser`,
            color: "purple"
          },
          {
            step: 2,
            title: "Create or import wallet",
            description: "Set up your wallet following the extension prompts",
            color: "blue"
          },
          {
            step: 3,
            title: "Connect to Snarbles",
            description: "Click \"Connect\" and approve the connection",
            color: "green"
          }
        ].map((item) => (
          <div key={item.step} className="flex items-start space-x-4 snarbles-glass-subtle p-4 rounded-xl border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300">
            <div className={`w-8 h-8 rounded-full snarbles-gradient-${item.color} flex items-center justify-center text-white text-sm font-bold shadow-lg flex-shrink-0`}>
              {item.step}
            </div>
            <div className="flex-1">
              <p className="snarbles-body font-semibold text-white mb-1">{item.title}</p>
              <p className="snarbles-body-small text-gray-400 leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="snarbles-card-premium max-w-[700px] w-full mx-4 max-h-[90vh] overflow-y-auto border-0 shadow-2xl"
        data-testid="mobile-wallet-modal"
      >
        <DialogHeader className="relative pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full snarbles-gradient-purple flex items-center justify-center text-white text-2xl shadow-lg">
                📱
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold snarbles-gradient-text-multi">
                  Mobile Wallet Connection
                </DialogTitle>
                <DialogDescription className="text-lg text-muted-foreground mt-1">
                  Connect your mobile wallet to create tokens
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-10 w-10 rounded-full snarbles-glass-subtle hover:bg-red-500/20 transition-all duration-300"
              data-testid="close-mobile-modal"
            >
              <X className="h-5 w-5 text-red-400" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-8 pt-4">
          {/* Wallet Selection Tabs */}
          <div className="space-y-6">
            <Tabs 
              value={selectedTab} 
              onValueChange={(value) => setSelectedTab(value as 'phantom' | 'pera')}
              data-testid="wallet-selection-tabs"
            >
              <TabsList className="grid w-full grid-cols-2 snarbles-glass-subtle border-0 p-1.5 rounded-xl h-auto">
                <TabsTrigger 
                  value="phantom" 
                  className="data-[state=active]:snarbles-gradient-purple data-[state=active]:text-white data-[state=active]:shadow-lg flex items-center space-x-3 py-4 px-6 rounded-lg font-semibold transition-all duration-300 hover:bg-purple-500/10"
                  data-testid="phantom-tab"
                >
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-lg">
                    👻
                  </div>
                  <span className="text-base">Phantom Wallet</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="pera" 
                  className="data-[state=active]:snarbles-gradient-blue data-[state=active]:text-white data-[state=active]:shadow-lg flex items-center space-x-3 py-4 px-6 rounded-lg font-semibold transition-all duration-300 hover:bg-blue-500/10"
                  data-testid="pera-tab"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-lg">
                    🔷
                  </div>
                  <span className="text-base">Pera Wallet</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="phantom" className="space-y-6 mt-8" data-testid="phantom-content">
                <div className="snarbles-glass-subtle p-6 rounded-xl snarbles-border-glow">
                  <PhantomMobileConnector
                    onConnectionChange={(connected) => handleWalletConnectionChange('phantom', connected)}
                    data-testid="phantom-mobile-connector"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="pera" className="space-y-6 mt-8" data-testid="pera-content">
                <div className="snarbles-glass-subtle p-6 rounded-xl snarbles-border-glow">
                  <PeraMobileConnector
                    onConnectionChange={(connected) => handleWalletConnectionChange('pera', connected)}
                    data-testid="pera-mobile-connector"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Instructions Toggle */}
          <div className="snarbles-glass-subtle rounded-xl border border-gray-700/50 overflow-hidden">
            <Button
              variant="ghost"
              size="lg"
              onClick={() => setShowInstructions(!showInstructions)}
              className="w-full justify-between p-6 h-auto snarbles-glass-subtle hover:bg-blue-500/5 transition-all duration-300 rounded-none"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full snarbles-gradient-blue flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <span className="snarbles-body text-lg font-medium">Need help connecting?</span>
              </div>
              <ArrowRight className={`w-5 h-5 transition-transform duration-300 ${showInstructions ? 'rotate-90' : ''} text-blue-400`} />
            </Button>
            
            {showInstructions && (
              <div className="px-6 pb-6 border-t border-gray-700/50 bg-gradient-to-br from-blue-500/5 to-purple-500/5">
                <div className="pt-4">
                  {isMobileDevice ? renderMobileInstructions() : renderDesktopInstructions()}
                </div>
              </div>
            )}
          </div>
          
          {/* Platform Support Info */}
          <div className="text-center space-y-4">
            <div className="snarbles-glass-subtle p-6 rounded-xl border border-green-500/20">
              <p className="snarbles-body text-base text-gray-300 mb-4">
                Supports {isMobileDevice ? 'mobile apps and' : ''} browser extensions
              </p>
              <div className="flex justify-center space-x-6 text-sm">
                <div className="flex items-center space-x-2 snarbles-glass-subtle px-4 py-2 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 font-medium">Secure</span>
                </div>
                <div className="flex items-center space-x-2 snarbles-glass-subtle px-4 py-2 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-blue-400" />
                  <span className="text-blue-400 font-medium">Open Source</span>
                </div>
                <div className="flex items-center space-x-2 snarbles-glass-subtle px-4 py-2 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-purple-400" />
                  <span className="text-purple-400 font-medium">No Fees</span>
                </div>
              </div>
            </div>
            
            {/* Wallet Logos */}
            <div className="flex justify-center items-center space-x-8 pt-4">
              <div className="flex flex-col items-center space-y-2">
                <div className="w-12 h-12 rounded-xl snarbles-gradient-purple flex items-center justify-center text-2xl shadow-lg">
                  👻
                </div>
                <span className="text-xs text-gray-400 font-medium">Phantom</span>
              </div>
              <div className="w-px h-8 bg-gray-600"></div>
              <div className="flex flex-col items-center space-y-2">
                <div className="w-12 h-12 rounded-xl snarbles-gradient-blue flex items-center justify-center text-2xl shadow-lg">
                  🔷
                </div>
                <span className="text-xs text-gray-400 font-medium">Pera</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default MobileWalletModal;
