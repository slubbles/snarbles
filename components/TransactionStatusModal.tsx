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
  X
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
}

interface TransactionStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: TransactionStatus;
  transactionData?: {
    transactionId?: string;
    assetId?: string;
    mintAddress?: string;
    explorerUrl?: string;
    network?: string;
    tokenName?: string;
    tokenSymbol?: string;
  };
  error?: string;
  onRetry?: () => void;
  steps?: TransactionStep[];
}

export default function TransactionStatusModal({
  isOpen,
  onClose,
  status,
  transactionData,
  error,
  onRetry,
  steps: customSteps
}: TransactionStatusModalProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Default steps for token creation
  const defaultSteps: TransactionStep[] = [
    {
      id: 'prepare',
      title: 'Preparing Transaction',
      description: 'Setting up token creation parameters',
      status: 'pending',
      estimatedTime: '~5 seconds'
    },
    {
      id: 'sign',
      title: 'Wallet Signing',
      description: 'Waiting for wallet approval',
      status: 'pending',
      estimatedTime: '~10 seconds'
    },
    {
      id: 'broadcast',
      title: 'Broadcasting',
      description: 'Submitting transaction to blockchain',
      status: 'pending',
      estimatedTime: '~5 seconds'
    },
    {
      id: 'confirm',
      title: 'Confirming',
      description: 'Waiting for blockchain confirmation',
      status: 'pending',
      estimatedTime: '~30 seconds'
    }
  ];

  const steps = customSteps || defaultSteps;

  // Update step statuses based on transaction status
  useEffect(() => {
    const updateSteps = () => {
      switch (status) {
        case 'preparing':
          setCurrentStep(0);
          break;
        case 'signing':
          setCurrentStep(1);
          break;
        case 'broadcasting':
          setCurrentStep(2);
          break;
        case 'confirming':
          setCurrentStep(3);
          break;
        case 'success':
          setCurrentStep(steps.length);
          break;
        case 'error':
          // Keep current step for error display
          break;
      }
    };

    updateSteps();
  }, [status, steps.length]);

  // Timer for elapsed time
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isOpen && status !== 'success' && status !== 'error') {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      setElapsedTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, status]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const shareTransaction = async () => {
    if (!transactionData?.explorerUrl) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${transactionData.tokenName} Token Created`,
          text: `I just created ${transactionData.tokenName} (${transactionData.tokenSymbol}) on ${transactionData.network}!`,
          url: transactionData.explorerUrl,
        });
      } else {
        await copyToClipboard(transactionData.explorerUrl, 'Explorer URL');
      }
    } catch (error) {
      console.log('Share failed:', error);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-12 h-12 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-12 h-12 text-red-500" />;
      default:
        return <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />;
    }
  };

  const getStatusColor = (stepIndex: number) => {
    if (status === 'error' && stepIndex === currentStep) {
      return 'text-red-500 border-red-500';
    }
    if (stepIndex < currentStep) {
      return 'text-green-500 border-green-500';
    }
    if (stepIndex === currentStep) {
      return 'text-blue-500 border-blue-500';
    }
    return 'text-gray-400 border-gray-300';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-md w-[95vw] max-h-[90vh] overflow-y-auto"
        data-testid="transaction-status-modal"
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              {status === 'success' ? 'Token Created!' : 
               status === 'error' ? 'Transaction Failed' : 
               'Creating Token...'}
            </DialogTitle>
            {status !== 'success' && status !== 'error' && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                {formatTime(elapsedTime)}
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Icon and Main Message */}
          <div className="flex flex-col items-center text-center py-4">
            {getStatusIcon()}
            
            <div className="mt-4">
              {status === 'success' && (
                <div>
                  <h3 className="text-xl font-bold text-green-600 mb-2">
                    🎉 Success!
                  </h3>
                  <p className="text-muted-foreground">
                    Your token "{transactionData?.tokenName}" has been created successfully!
                  </p>
                </div>
              )}
              
              {status === 'error' && (
                <div>
                  <h3 className="text-xl font-bold text-red-600 mb-2">
                    Transaction Failed
                  </h3>
                  <p className="text-muted-foreground mb-3">
                    Something went wrong during token creation.
                  </p>
                  {error && (
                    <Alert variant="destructive" className="text-left">
                      <AlertCircle className="w-4 h-4" />
                      <AlertDescription className="text-sm">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
              
              {status !== 'success' && status !== 'error' && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Processing Transaction
                  </h3>
                  <p className="text-muted-foreground">
                    Please wait while we create your token...
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Progress Steps */}
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div 
                key={step.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                  index <= currentStep ? 'bg-muted/50' : 'bg-background'
                }`}
              >
                <div className={`
                  w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0
                  ${getStatusColor(index)}
                `}>
                  {index < currentStep ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : index === currentStep && status !== 'error' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : status === 'error' && index === currentStep ? (
                    <X className="w-4 h-4" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{step.title}</h4>
                    {step.estimatedTime && index >= currentStep && (
                      <Badge variant="outline" className="text-xs">
                        {step.estimatedTime}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Transaction Details - Success State */}
          {status === 'success' && transactionData && (
            <div className="space-y-3 border-t pt-4">
              <h4 className="font-semibold">Transaction Details</h4>
              
              {transactionData.assetId && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Asset ID:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono">
                      {transactionData.assetId}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(transactionData.assetId!, 'Asset ID')}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}

              {transactionData.transactionId && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Transaction ID:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono truncate max-w-[120px]">
                      {transactionData.transactionId}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(transactionData.transactionId!, 'Transaction ID')}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}

              {transactionData.network && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Network:</span>
                  <Badge variant="outline" className="capitalize">
                    {transactionData.network.replace('-', ' ')}
                  </Badge>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            {status === 'success' && (
              <>
                {transactionData?.explorerUrl && (
                  <Button
                    onClick={() => window.open(transactionData.explorerUrl, '_blank')}
                    className="flex-1"
                    data-testid="view-explorer"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Explorer
                  </Button>
                )}
                
                <Button
                  onClick={shareTransaction}
                  variant="outline"
                  className="flex-1"
                  data-testid="share-transaction"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </>
            )}
            
            {status === 'error' && onRetry && (
              <Button
                onClick={() => {
                  setElapsedTime(0);
                  setCurrentStep(0);
                  onRetry();
                }}
                className="flex-1"
                data-testid="retry-transaction"
              >
                Try Again
              </Button>
            )}
            
            <Button
              onClick={onClose}
              variant={status === 'success' ? 'outline' : 'secondary'}
              className={status === 'success' || status === 'error' ? 'flex-1' : 'w-full'}
              data-testid="close-modal"
            >
              {status === 'success' ? 'Done' : status === 'error' ? 'Close' : 'Cancel'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
