'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  ExternalLink, 
  Copy, 
  Share2,
  Clock,
  X,
  Wallet,
  Smartphone,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

export type TransactionStatus = 'preparing' | 'signing' | 'broadcasting' | 'confirming' | 'success' | 'error';

interface TransactionStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  estimatedTime?: string;
  mobileOptimized?: boolean;
}

interface TransactionStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: TransactionStatus | null;
  error?: string;
  transactionData?: any; // Added this prop
  network?: string; // Added this prop
  tokenData?: {
    name: string;
    symbol: string;
    network: string;
  };
  deploymentResult?: {
    assetId?: number;
    transactionId?: string;
    explorerUrl?: string;
    network?: string;
  };
  onRetry?: () => void;
}

export default function TransactionStatusModalEnhanced({
  isOpen,
  onClose,
  status,
  error,
  transactionData,
  network,
  tokenData,
  deploymentResult,
  onRetry
}: TransactionStatusModalProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [copiedTxId, setCopiedTxId] = useState(false);
  const [copiedAssetId, setCopiedAssetId] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
  }, []);

  const getTransactionSteps = (): TransactionStep[] => {
    const baseSteps: TransactionStep[] = [
      {
        id: 'preparing',
        title: isMobile ? 'Preparing' : 'Preparing Transaction',
        description: isMobile ? 'Setting up your token...' : 'Validating parameters and preparing blockchain transaction',
        status: status === 'preparing' ? 'active' : (status && ['signing', 'broadcasting', 'confirming', 'success'].includes(status)) ? 'completed' : 'pending',
        estimatedTime: '10s',
        mobileOptimized: true
      },
      {
        id: 'signing',
        title: isMobile ? 'Wallet Signing' : 'Wallet Signature Required',
        description: isMobile ? 'Sign with your wallet app' : 'Please sign the transaction in your connected wallet',
        status: status === 'signing' ? 'active' : (status && ['broadcasting', 'confirming', 'success'].includes(status)) ? 'completed' : 'pending',
        estimatedTime: '30s',
        mobileOptimized: true
      },
      {
        id: 'broadcasting',
        title: isMobile ? 'Broadcasting' : 'Broadcasting to Network',
        description: isMobile ? 'Sending to blockchain...' : 'Submitting your transaction to the Algorand network',
        status: status === 'broadcasting' ? 'active' : (status && ['confirming', 'success'].includes(status)) ? 'completed' : 'pending',
        estimatedTime: '15s',
        mobileOptimized: true
      },
      {
        id: 'confirming',
        title: isMobile ? 'Confirming' : 'Network Confirmation',
        description: isMobile ? 'Waiting for confirmation...' : 'Waiting for blockchain confirmation (4 blocks)',
        status: status === 'confirming' ? 'active' : status === 'success' ? 'completed' : 'pending',
        estimatedTime: '60s',
        mobileOptimized: true
      }
    ];

    // Set error status if there's an error
    if (status === 'error' && error) {
      baseSteps.forEach(step => {
        if (step.status === 'active') {
          step.status = 'error';
        }
      });
    }

    return baseSteps;
  };

  const getStatusIcon = (stepStatus: string) => {
    switch (stepStatus) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'active':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (stepStatus: string) => {
    switch (stepStatus) {
      case 'completed':
        return 'text-green-600 dark:text-green-400';
      case 'active':
        return 'text-blue-600 dark:text-blue-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-500';
    }
  };

  const handleCopyTxId = async () => {
    if (deploymentResult?.transactionId) {
      try {
        await navigator.clipboard.writeText(deploymentResult.transactionId);
        setCopiedTxId(true);
        setTimeout(() => setCopiedTxId(false), 2000);
        toast({
          title: "Copied!",
          description: "Transaction ID copied to clipboard",
        });
      } catch (err) {
        toast({
          title: "Copy failed",
          description: "Could not copy transaction ID",
          variant: "destructive",
        });
      }
    }
  };

  const handleCopyAssetId = async () => {
    if (deploymentResult?.assetId) {
      try {
        await navigator.clipboard.writeText(deploymentResult.assetId.toString());
        setCopiedAssetId(true);
        setTimeout(() => setCopiedAssetId(false), 2000);
        toast({
          title: "Copied!",
          description: "Asset ID copied to clipboard",
        });
      } catch (err) {
        toast({
          title: "Copy failed",
          description: "Could not copy asset ID",
          variant: "destructive",
        });
      }
    }
  };

  const handleShare = async () => {
    if (deploymentResult?.explorerUrl) {
      if (navigator.share && isMobile) {
        try {
          await navigator.share({
            title: `${tokenData?.name} Token Created!`,
            text: `Check out my new ${tokenData?.symbol} token on Algorand`,
            url: deploymentResult.explorerUrl,
          });
        } catch (err) {
          // Fallback to clipboard
          await navigator.clipboard.writeText(deploymentResult.explorerUrl);
          toast({
            title: "Link copied!",
            description: "Explorer link copied to clipboard",
          });
        }
      } else {
        await navigator.clipboard.writeText(deploymentResult.explorerUrl);
        toast({
          title: "Link copied!",
          description: "Explorer link copied to clipboard",
        });
      }
    }
  };

  const currentStep = getTransactionSteps().find(step => step.status === 'active');
  const completedSteps = getTransactionSteps().filter(step => step.status === 'completed').length;
  const totalSteps = getTransactionSteps().length;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isMobile ? 'max-w-sm mx-4' : 'max-w-md'} rounded-xl`}>
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <DialogTitle className={`flex items-center gap-2 ${isMobile ? 'text-lg' : 'text-xl'}`}>
              {isMobile && <Smartphone className="w-5 h-5" />}
              {status === 'success' ? (
                <>
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  {isMobile ? 'Token Created!' : 'Token Created Successfully!'}
                </>
              ) : status === 'error' ? (
                <>
                  <AlertCircle className="w-6 h-6 text-red-500" />
                  {isMobile ? 'Error' : 'Transaction Failed'}
                </>
              ) : (
                <>
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                  {isMobile ? 'Creating Token...' : 'Creating Your Token...'}
                </>
              )}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {tokenData && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                  {tokenData.symbol?.charAt(0) || 'T'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{tokenData.name}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {tokenData.symbol} • {tokenData.network?.replace('-', ' ')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Progress Bar for Mobile */}
          {isMobile && status !== 'success' && status !== 'error' && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>Progress</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {/* Transaction Steps */}
          {status !== 'success' && (
            <div className="space-y-3">
              {getTransactionSteps().map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-start gap-3 p-3 rounded-lg transition-all ${
                    step.status === 'active' 
                      ? 'bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800' 
                      : step.status === 'completed'
                      ? 'bg-green-50 dark:bg-green-950/20'
                      : step.status === 'error'
                      ? 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800'
                      : 'bg-gray-50 dark:bg-gray-900'
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getStatusIcon(step.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className={`font-medium ${isMobile ? 'text-sm' : 'text-base'} ${getStatusColor(step.status)}`}>
                        {step.title}
                      </h4>
                      {step.estimatedTime && step.status === 'active' && (
                        <Badge variant="secondary" className={`${isMobile ? 'text-xs px-1 py-0' : 'text-xs'}`}>
                          ~{step.estimatedTime}
                        </Badge>
                      )}
                    </div>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 dark:text-gray-400 mt-1`}>
                      {step.description}
                    </p>
                    
                    {/* Mobile-specific guidance */}
                    {isMobile && step.status === 'active' && step.id === 'signing' && (
                      <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/20 rounded border border-amber-200 dark:border-amber-800">
                        <div className="flex items-center gap-2">
                          <Wallet className="w-4 h-4 text-amber-600" />
                          <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                            Check your wallet app to sign the transaction
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {status === 'error' && error && (
            <Alert className="border-red-200 bg-red-50 dark:bg-red-950/20">
              <AlertCircle className="w-5 h-5" />
              <AlertDescription>
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold text-red-800 dark:text-red-200 mb-1">
                      Transaction Failed
                    </p>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-red-700 dark:text-red-300`}>
                      {error}
                    </p>
                  </div>
                  
                  {onRetry && (
                    <Button 
                      size={isMobile ? "sm" : "default"}
                      className="w-full bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => {
                        onRetry();
                        onClose();
                      }}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Try Again
                    </Button>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Success State */}
          {status === 'success' && deploymentResult && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className={`font-bold ${isMobile ? 'text-lg' : 'text-xl'} text-green-600 dark:text-green-400`}>
                  🎉 Token Created Successfully!
                </h3>
                <p className={`${isMobile ? 'text-sm' : 'text-base'} text-gray-600 dark:text-gray-400 mt-2`}>
                  Your {tokenData?.symbol} token is now live on {deploymentResult.network?.replace('-', ' ')}
                </p>
              </div>

              {/* Token Details */}
              <div className="grid grid-cols-1 gap-3">
                {deploymentResult.assetId && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Asset ID</p>
                      <p className={`font-mono ${isMobile ? 'text-sm' : 'text-base'} font-semibold`}>
                        {deploymentResult.assetId}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyAssetId}
                      className="p-2"
                    >
                      {copiedAssetId ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                )}

                {deploymentResult.transactionId && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Transaction ID</p>
                      <p className={`font-mono ${isMobile ? 'text-xs' : 'text-sm'} font-semibold truncate`}>
                        {deploymentResult.transactionId}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyTxId}
                      className="p-2"
                    >
                      {copiedTxId ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-3`}>
                {deploymentResult.explorerUrl && (
                  <Button
                    variant="default"
                    size={isMobile ? "default" : "default"}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                    onClick={() => window.open(deploymentResult.explorerUrl, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View on Explorer
                  </Button>
                )}

                <Button
                  variant="outline"
                  size={isMobile ? "default" : "default"}
                  className="flex-1"
                  onClick={handleShare}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>

              {/* Mobile-specific completion message */}
              {isMobile && (
                <div className="text-center py-2">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Your token is ready! You can now trade, transfer, or manage it through your wallet.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
