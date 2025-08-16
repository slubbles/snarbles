import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';

interface NetworkMismatchAlertProps {
  network: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function NetworkMismatchAlert({ network, onRetry, onDismiss }: NetworkMismatchAlertProps) {
  const isDevnet = network.includes('devnet');
  const targetNetwork = isDevnet ? 'Solana Devnet' : 'Solana Mainnet';
  const walletNetwork = isDevnet ? 'Mainnet' : 'Devnet';

  return (
    <Alert className="border-red-500/50 bg-red-500/10 backdrop-blur-sm">
      <AlertTriangle className="h-5 w-5 text-red-500" />
      <AlertTitle className="text-red-400 font-semibold">
        Network Configuration Mismatch
      </AlertTitle>
      <AlertDescription className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <p className="mb-2">
            <strong>Issue:</strong> You are trying to create a token on <span className="text-red-400">{targetNetwork}</span> but your wallet appears to be connected to <span className="text-yellow-400">{walletNetwork}</span>.
          </p>
          <p className="mb-3">
            This causes WebSocket connection errors and prevents token creation from completing successfully.
          </p>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-3 space-y-2">
          <h4 className="text-sm font-medium text-foreground">To fix this issue:</h4>
          <ol className="text-xs text-muted-foreground space-y-1 ml-4">
            <li>1. Open your Solana wallet (Phantom, Solflare, etc.)</li>
            <li>2. Look for network settings (usually in Settings or a network dropdown)</li>
            <li>3. Switch to <span className="text-green-400 font-medium">{targetNetwork}</span></li>
            <li>4. Refresh this page and try again</li>
          </ol>
        </div>

        <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
          <p className="text-xs text-blue-400">
            <strong>💡 Tip:</strong> If you want to create tokens on Mainnet instead, you can switch the network selection above to "Solana Mainnet" before creating your token.
          </p>
        </div>

        <div className="flex gap-2 pt-2">
          {onRetry && (
            <Button
              onClick={onRetry}
              size="sm"
              variant="outline"
              className="text-xs"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Try Again
            </Button>
          )}
          <Button
            onClick={() => window.open('https://docs.snarbles.xyz/troubleshooting/network-issues', '_blank')}
            size="sm"
            variant="outline"
            className="text-xs"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            View Guide
          </Button>
          {onDismiss && (
            <Button
              onClick={onDismiss}
              size="sm"
              variant="ghost"
              className="text-xs text-muted-foreground"
            >
              Dismiss
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
