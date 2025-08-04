'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
  RefreshCw,
  BarChart3,
  Plus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePaymentState } from '@/hooks/usePaymentState';

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
  
  // Use global payment state for progress tracking
  const { tokenCreationStep, isProcessing, steps } = usePaymentState();

  useEffect(() => {
    setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
  }, []);

  const getTransactionSteps = (): TransactionStep[] => {
    // Determine if this is Solana based on network prop or tokenData
    const isSolana = network?.includes('solana') || tokenData?.network?.includes('solana');
    
    // Use global payment state steps ONLY if we have an explicit status indicating we're processing
    // and the global state is actively being used for token creation
    if (isProcessing && steps.length > 0 && tokenCreationStep >= 0) {
      return steps.map((stepTitle: string, index: number) => ({
        id: `step-${index}`,
        title: stepTitle,
        description: index === 0 ? 'Validating parameters and preparing payment' :
                    index === 1 ? 'Building transaction for your wallet' :
                    index === 2 ? isSolana 
                      ? '⭐ Please approve the transaction in your Solana wallet (Phantom, OKX, etc.)'
                      : '⭐ Please open your Pera Wallet app and sign the transaction' :
                    index === 3 ? isSolana 
                      ? 'Processing your token creation on the Solana blockchain'
                      : 'Processing your token creation on the Algorand blockchain' :
                    index === 4 ? 'Token created successfully!' : 'Processing...',
        status: index < tokenCreationStep ? 'completed' : 
               index === tokenCreationStep ? 'active' : 'pending',
        estimatedTime: index === 0 ? '10s' : 
                      index === 1 ? '30s' :
                      index === 2 ? '30s' :
                      index === 3 ? '15s' : '60s',
        mobileOptimized: true
      }));
    }

    // Fallback to local status-based steps with network-specific descriptions
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
        description: isMobile ? 
          (isSolana ? 'Sign with your Solana wallet' : 'Sign with your wallet app') :
          (isSolana ? 'Please approve the transaction in your Solana wallet' : 'Please sign the transaction in your connected wallet'),
        status: status === 'signing' ? 'active' : (status && ['broadcasting', 'confirming', 'success'].includes(status)) ? 'completed' : 'pending',
        estimatedTime: '30s',
        mobileOptimized: true
      },
      {
        id: 'broadcasting',
        title: isMobile ? 'Broadcasting' : 'Broadcasting to Network',
        description: isMobile ? 'Sending to blockchain...' : 
          isSolana ? 'Submitting your transaction to the Solana network' : 'Submitting your transaction to the Algorand network',
        status: status === 'broadcasting' ? 'active' : (status && ['confirming', 'success'].includes(status)) ? 'completed' : 'pending',
        estimatedTime: '15s',
        mobileOptimized: true
      },
      {
        id: 'confirming',
        title: isMobile ? 'Confirming' : 'Network Confirmation',
        description: isMobile ? 'Waiting for confirmation...' : 
          isSolana ? 'Waiting for blockchain confirmation (finalized)' : 'Waiting for blockchain confirmation (4 blocks)',
        status: status === 'confirming' ? 'active' : status === 'success' ? 'completed' : 'pending',
        estimatedTime: isSolana ? '30s' : '60s',
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
        return <CheckCircle className="w-5 h-5 text-primary" />;
      case 'active':
        return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (stepStatus: string) => {
    switch (stepStatus) {
      case 'completed':
        return 'text-primary';
      case 'active':
        return 'text-primary';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-muted-foreground';
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
  const activeStepIndex = getTransactionSteps().findIndex(step => step.status === 'active');
  
  // Determine if we're in success state - either from explicit status or global payment state completion
  const isSuccess = status === 'success' || (tokenCreationStep >= 4 && deploymentResult);
  
  // More accurate progress calculation
  const progressPercentage = isSuccess ? 100 : 
    activeStepIndex >= 0 ? ((activeStepIndex + 0.5) / totalSteps) * 100 :
    (completedSteps / totalSteps) * 100;
  
  // Get network type for styling
  const isSolana = network?.includes('solana') || tokenData?.network?.includes('solana');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isMobile ? 'max-w-[95vw] w-full mx-2' : 'max-w-lg w-full'} max-h-[90vh] overflow-y-auto rounded-xl z-50`}>
        <DialogHeader className="space-y-3 pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className={`flex items-center gap-2 ${isMobile ? 'text-lg' : 'text-xl'}`}>
              {isMobile && <Smartphone className="w-5 h-5" />}
              {isSuccess ? (
                <>
                  <CheckCircle className="w-6 h-6 text-primary" />
                  {isMobile ? 'Token Created!' : 'Token Created Successfully!'}
                </>
              ) : status === 'error' ? (
                <>
                  <AlertCircle className="w-6 h-6 text-red-500" />
                  {isMobile ? 'Error' : 'Transaction Failed'}
                </>
              ) : (
                <>
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  {isMobile ? 'Creating Token...' : 'Creating Your Token...'}
                </>
              )}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {isSuccess ? 'Your token has been successfully created on the blockchain.' :
               status === 'error' ? 'There was an error creating your token.' :
               'Please wait while your token is being created on the blockchain.'}
            </DialogDescription>
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
            <div className="glass-card p-3 border border-border/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center text-white font-bold">
                  {tokenData.symbol?.charAt(0) || 'T'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate text-foreground">{tokenData.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {tokenData.symbol} • {tokenData.network?.replace('-', ' ')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Progress Bar - Always visible during transaction */}
          {!isSuccess && status !== 'error' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-foreground">
                  {isSolana ? 'Solana Token Creation Progress' : 'Algorand Token Creation Progress'}
                </span>
                <span className="text-sm font-bold text-primary">
                  {Math.round(progressPercentage)}%
                </span>
              </div>
              <div className="relative">
                <div className="w-full bg-muted/30 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-3 rounded-full transition-all duration-700 ease-out ${
                      isSolana 
                        ? 'bg-gradient-to-r from-purple-500 to-purple-600' 
                        : 'bg-gradient-to-r from-blue-500 to-blue-600'
                    } relative`}
                    style={{ width: `${progressPercentage}%` }}
                  >
                    {/* Animated shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                  </div>
                </div>
                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                  <span>Step {Math.min(activeStepIndex + 1, totalSteps)} of {totalSteps}</span>
                  {currentStep && (
                    <span>Est. {currentStep.estimatedTime} remaining</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {/* Transaction Steps */}
          {!isSuccess && (
            <div className="space-y-3">
              {getTransactionSteps().map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-start gap-3 p-3 rounded-lg transition-all ${
                    step.status === 'active' 
                      ? 'glass-card border border-primary/20' 
                      : step.status === 'completed'
                      ? 'glass-card border border-muted/50'
                      : step.status === 'error'
                      ? 'glass-card border border-red-500/30'
                      : 'bg-muted/20 border border-muted/30'
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
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground mt-1`}>
                      {step.description}
                    </p>
                    
                    {/* Mobile-specific guidance */}
                    {isMobile && step.status === 'active' && step.id === 'signing' && (
                      <div className={`mt-2 p-2 glass-card border ${
                        isSolana ? 'border-purple-500/20' : 'border-primary/20'
                      }`}>
                        <div className="flex items-center gap-2">
                          <Wallet className={`w-4 h-4 ${
                            isSolana ? 'text-purple-500' : 'text-primary'
                          }`} />
                          <p className={`text-xs font-medium ${
                            isSolana ? 'text-purple-600' : 'text-primary'
                          }`}>
                            {isSolana 
                              ? 'Check your Solana wallet (Phantom, OKX, etc.) to approve the transaction'
                              : 'Check your Pera Wallet app to sign the transaction'
                            }
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
            <Alert className="border-red-500/30 glass-card">
              <AlertCircle className="w-5 h-5" />
              <AlertDescription>
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold text-red-500 mb-1">
                      Transaction Failed
                    </p>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
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
          {isSuccess && deploymentResult && (
            <div className="space-y-6">
              <div className="text-center py-2">
                <div className="w-16 h-16 bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className={`font-bold ${isMobile ? 'text-lg' : 'text-xl'} text-primary`}>
                  🎉 Token Created Successfully!
                </h3>
                <p className={`${isMobile ? 'text-sm' : 'text-base'} text-muted-foreground mt-2`}>
                  Your {tokenData?.symbol} token is now live on {deploymentResult.network?.replace('-', ' ')}
                </p>
              </div>

              {/* Token Details */}
              <div className="space-y-4">
                {deploymentResult.assetId && (
                  <div className="glass-card p-4 border border-primary/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-primary mb-1">Asset ID</p>
                        <p className={`font-mono ${isMobile ? 'text-base' : 'text-lg'} font-bold text-foreground break-all`}>
                          {deploymentResult.assetId}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          This is your unique token identifier on {deploymentResult.network?.replace('-', ' ')}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyAssetId}
                        className="p-2 hover:bg-primary/10 ml-2 flex-shrink-0"
                      >
                        {copiedAssetId ? (
                          <CheckCircle className="w-4 h-4 text-primary" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {deploymentResult.transactionId && (
                  <div className="glass-card p-4 border border-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-1">Transaction ID</p>
                        <p className={`font-mono ${isMobile ? 'text-xs' : 'text-sm'} font-semibold truncate text-foreground`}>
                          {deploymentResult.transactionId}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyTxId}
                        className="p-2 hover:bg-muted ml-2 flex-shrink-0"
                      >
                        {copiedTxId ? (
                          <CheckCircle className="w-4 h-4 text-primary" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {/* Primary action - Explorer button */}
                {deploymentResult.explorerUrl && (
                  <Button
                    variant="default"
                    size="default"
                    className="w-full button-enhanced"
                    onClick={() => window.open(deploymentResult.explorerUrl, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View on Explorer
                  </Button>
                )}

                {/* Secondary actions */}
                <div className={`grid ${isMobile ? 'grid-cols-1 gap-2' : 'grid-cols-2 gap-3'}`}>
                  <Button
                    variant="outline"
                    size="default"
                    className="border-border hover:bg-muted"
                    onClick={() => {
                      window.open('/dashboard', '_blank');
                    }}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>

                  <Button
                    variant="ghost"
                    size="default"
                    className="text-primary hover:bg-primary/10"
                    onClick={() => {
                      onClose();
                      window.location.reload();
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Again
                  </Button>
                </div>

                {/* Share Button */}
                <div className="flex justify-center pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={handleShare}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Token Details
                  </Button>
                </div>
              </div>

              {/* Mobile-specific completion message */}
              {isMobile && (
                <div className="text-center py-2">
                  <p className="text-xs text-muted-foreground">
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
