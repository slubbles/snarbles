'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AlertCircle, 
  Wallet, 
  Smartphone, 
  RefreshCw, 
  ExternalLink,
  CheckCircle,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider';

interface WalletConnectionGuardProps {
  children: React.ReactNode;
  requiredForNetworks: string[];
  currentNetwork: string;
}

export function WalletConnectionGuard({ 
  children, 
  requiredForNetworks, 
  currentNetwork 
}: WalletConnectionGuardProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  const algorandWallet = useAlgorandWallet();

  useEffect(() => {
    setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
  }, []);

  const isWalletRequired = requiredForNetworks.some(network => currentNetwork.includes(network));
  const isWalletConnected = algorandWallet.connected && algorandWallet.address;

  const handleConnectWallet = async () => {
    setIsConnecting(true);
    try {
      await algorandWallet.connect();
      toast({
        title: "Wallet Connected!",
        description: "Your Algorand wallet has been successfully connected.",
      });
    } catch (error) {
      console.error('Wallet connection failed:', error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // If wallet is not required for this network, show children
  if (!isWalletRequired) {
    return <>{children}</>;
  }

  // If wallet is connected, show children
  if (isWalletConnected) {
    return <>{children}</>;
  }

  // Show wallet connection requirement
  return (
    <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
          <Wallet className="w-5 h-5" />
          {isMobile ? 'Wallet Required' : 'Algorand Wallet Connection Required'}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">
                Why do I need to connect my wallet?
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Creating tokens on {currentNetwork.replace('-', ' ')} requires signing transactions with your Algorand wallet. This ensures you own and control your tokens.
              </p>
            </div>
          </div>

          {isMobile && (
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <Smartphone className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm text-blue-900 dark:text-blue-100 mb-1">
                  Mobile Wallet Setup
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                  Make sure you have Pera Wallet or another Algorand wallet app installed on your device.
                </p>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-blue-600 dark:text-blue-400"
                  onClick={() => window.open('https://perawallet.app/', '_blank')}
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Download Pera Wallet
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleConnectWallet}
              disabled={isConnecting}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
              size={isMobile ? "default" : "lg"}
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4 mr-2" />
                  Connect Algorand Wallet
                </>
              )}
            </Button>

            {algorandWallet.error && (
              <Alert className="border-red-200 bg-red-50 dark:bg-red-950/20">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription className="text-sm">
                  <p className="font-medium text-red-800 dark:text-red-200 mb-1">
                    Connection Error
                  </p>
                  <p className="text-red-700 dark:text-red-300">
                    {algorandWallet.error}
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 mt-2 text-red-600 dark:text-red-400"
                    onClick={handleConnectWallet}
                  >
                    Try connecting again
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        {/* Troubleshooting section for mobile */}
        {isMobile && (
          <details className="group">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
              Troubleshooting wallet connection
            </summary>
            <div className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="font-medium mb-2">Common issues:</p>
                <ul className="space-y-1 text-xs list-disc list-inside">
                  <li>Make sure your wallet app is installed and set up</li>
                  <li>Try refreshing this page if connection fails</li>
                  <li>Check that you're on the correct network in your wallet</li>
                  <li>Ensure your wallet app is up to date</li>
                </ul>
              </div>
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  );
}

// Enhanced wallet status indicator component
export function WalletStatusIndicator() {
  const [isMobile, setIsMobile] = useState(false);
  const algorandWallet = useAlgorandWallet();

  useEffect(() => {
    setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
  }, []);

  if (!algorandWallet.connected) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
      <CheckCircle className="w-4 h-4 text-green-500" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-green-800 dark:text-green-200">
          Wallet Connected
        </p>
        {!isMobile && algorandWallet.address && (
          <p className="text-xs text-green-600 dark:text-green-400 font-mono truncate">
            {algorandWallet.address}
          </p>
        )}
      </div>
      {algorandWallet.balance !== null && (
        <div className="text-right">
          <p className="text-xs text-green-600 dark:text-green-400">Balance</p>
          <p className="text-sm font-semibold text-green-800 dark:text-green-200">
            {algorandWallet.balance.toFixed(3)} ALGO
          </p>
        </div>
      )}
    </div>
  );
}
