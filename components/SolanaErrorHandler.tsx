'use client';

import React from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { AlertCircle, ExternalLink, RefreshCw, Wallet, DollarSign } from 'lucide-react';
import { Button } from './ui/button';
import { getErrorMessage } from '@/lib/solana-contract-types';
import { getTransactionUrl, CURRENT_SOLANA_NETWORK } from '@/lib/solana-data';

interface SolanaErrorHandlerProps {
  error: string;
  errorCode?: number;
  signature?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function SolanaErrorHandler({ 
  error, 
  errorCode, 
  signature, 
  onRetry, 
  onDismiss 
}: SolanaErrorHandlerProps) {
  
  const getErrorSeverity = (code?: number): 'error' | 'warning' | 'info' => {
    if (!code) return 'error';
    
    // Critical errors
    if ([6006, 6013, 6014, 6015].includes(code)) return 'error';
    
    // User errors that can be fixed
    if ([6000, 6001, 6002, 6005, 6008, 6016].includes(code)) return 'warning';
    
    // Info/state errors
    return 'info';
  };

  const getErrorIcon = (severity: string) => {
    switch (severity) {
      case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default: return <AlertCircle className="w-5 h-5 text-blue-500" />;
    }
  };

  const getErrorSolution = (code?: number): string => {
    if (!code) return '';
    
    switch (code) {
      case 6000: return 'Wait for token to be unpaused by the creator or try again later.';
      case 6001: return 'Token is already active. No action needed.';
      case 6002: return 'You don\'t have permission for this action. Only the token creator can perform this operation.';
      case 6003: return 'Check your token data and ensure all fields are valid.';
      case 6004: return 'This token has already been created. Try creating a different token.';
      case 6005: return 'The fee amount is invalid. Contact support if this persists.';
      case 6006: return 'Add more SOL to your wallet and try again.';
      case 6007: return 'Token transfers are disabled. Contact the token creator.';
      case 6008: return 'Enter a valid amount greater than 0.';
      case 6009: return 'Minting is disabled for this token. You cannot create additional tokens.';
      case 6010: return 'Burning is disabled for this token. You cannot destroy tokens.';
      case 6011: return 'You are not the owner of this token.';
      case 6012: return 'Account is already set up. Try refreshing and continuing.';
      case 6013: return 'Invalid instruction sent to the contract. Try again or contact support.';
      case 6014: return 'The platform is temporarily paused. Try again later.';
      case 6015: return 'Platform state is invalid. Contact support.';
      case 6016: return `Token name must be ${32} characters or less. Please shorten your token name.`;
      default: return 'Try the suggested actions below or contact support if the issue persists.';
    }
  };

  const getErrorActions = (code?: number) => {
    if (!code) return [];
    
    const actions = [];
    
    // Common retry action for most errors
    if (onRetry && ![6004, 6012, 6014].includes(code)) {
      actions.push({
        label: 'Try Again',
        action: onRetry,
        icon: <RefreshCw className="w-4 h-4" />,
        variant: 'default' as const
      });
    }
    
    // Specific actions based on error type
    switch (code) {
      case 6006: // Insufficient funds
        actions.push({
          label: 'Add SOL to Wallet',
          action: () => window.open('https://faucet.solana.com', '_blank'),
          icon: <DollarSign className="w-4 h-4" />,
          variant: 'outline' as const
        });
        break;
        
      case 6002: // Unauthorized
      case 6011: // Invalid owner
        actions.push({
          label: 'Switch Wallet',
          action: () => {
            // Trigger wallet selector (implementation depends on your wallet setup)
            console.log('Switch wallet requested');
          },
          icon: <Wallet className="w-4 h-4" />,
          variant: 'outline' as const
        });
        break;
    }
    
    return actions;
  };

  const severity = getErrorSeverity(errorCode);
  const solution = getErrorSolution(errorCode);
  const actions = getErrorActions(errorCode);
  const errorMessage = errorCode ? getErrorMessage(errorCode) : error;

  const alertColors = {
    error: 'border-red-500/50 bg-red-500/10',
    warning: 'border-yellow-500/50 bg-yellow-500/10',
    info: 'border-blue-500/50 bg-blue-500/10'
  };

  const textColors = {
    error: 'text-red-400',
    warning: 'text-yellow-400',
    info: 'text-blue-400'
  };

  return (
    <Alert className={`${alertColors[severity]} border`}>
      <div className="flex items-start space-x-3">
        {getErrorIcon(severity)}
        <div className="flex-1 space-y-3">
          <div>
            <h4 className={`font-semibold ${textColors[severity]} mb-1`}>
              {errorCode ? `Error ${errorCode}: ${errorMessage}` : 'Transaction Failed'}
            </h4>
            <AlertDescription className="text-gray-300">
              {solution || error}
            </AlertDescription>
          </div>

          {/* Error Details */}
          {errorCode && (
            <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
              <h5 className="text-sm font-medium text-gray-300 mb-2">Error Details</h5>
              <div className="space-y-1 text-xs text-gray-400">
                <div>Error Code: {errorCode}</div>
                <div>Network: {CURRENT_SOLANA_NETWORK.name}</div>
                {signature && (
                  <div className="flex items-center gap-2">
                    <span>Transaction:</span>
                    <a
                      href={getTransactionUrl(signature)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline flex items-center gap-1"
                    >
                      View on Explorer
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {actions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant}
                  size="sm"
                  onClick={action.action}
                  className="flex items-center gap-2"
                >
                  {action.icon}
                  {action.label}
                </Button>
              ))}
              
              {onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                  className="text-gray-400 hover:text-gray-300"
                >
                  Dismiss
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Alert>
  );
}

// Utility function to extract error code from error message
export function extractSolanaErrorCode(errorMessage: string): number | undefined {
  // Try to extract error code from various error message formats
  const patterns = [
    /custom program error: 0x([0-9a-f]+)/i,
    /error code: (\d+)/i,
    /Program error: Custom\((\d+)\)/i,
    /AnchorError occurred. Error Code: (\d+)/i
  ];

  for (const pattern of patterns) {
    const match = errorMessage.match(pattern);
    if (match) {
      const code = match[1];
      // Convert hex to decimal if needed
      const errorCode = code.includes('x') ? parseInt(code, 16) : parseInt(code, 10);
      
      // Check if it's a valid Snarbles contract error code
      if (errorCode >= 6000 && errorCode <= 6016) {
        return errorCode;
      }
    }
  }

  return undefined;
}

// Hook for handling Solana errors
export function useSolanaErrorHandler() {
  const handleError = (error: any) => {
    const errorMessage = error?.message || error?.toString() || 'Unknown error occurred';
    const errorCode = extractSolanaErrorCode(errorMessage);
    
    return {
      errorMessage,
      errorCode,
      formattedMessage: errorCode ? getErrorMessage(errorCode) : errorMessage
    };
  };

  return { handleError };
} 