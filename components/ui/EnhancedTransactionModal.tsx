'use client';

// Type declaration for confetti
declare global {
  interface Window {
    confetti?: (options: any) => void;
  }
}

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { NetworkBadge } from '@/components/ui/NetworkBadge';
import { 
  CheckCircle, 
  Loader2, 
  AlertCircle, 
  ExternalLink, 
  Copy, 
  ArrowRight,
  Wallet,
  Database,
  Sparkles,
  Trophy
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { SuccessConfetti } from '@/components/SuccessConfetti';

interface TransactionStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  icon: React.ReactNode;
  estimatedTime?: string;
}

interface EnhancedTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenData: {
    name: string;
    symbol: string;
    network: string;
  };
  transactionHash?: string;
  explorerUrl?: string;
  currentStep?: number;
  error?: string;
}

export function EnhancedTransactionModal({
  isOpen,
  onClose,
  tokenData,
  transactionHash,
  explorerUrl,
  currentStep = 0,
  error
}: EnhancedTransactionModalProps) {
  const [progress, setProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const { toast } = useToast();

  const steps: TransactionStep[] = [
    {
      id: 'wallet',
      title: 'Wallet Approval',
      description: 'Waiting for transaction approval in your wallet',
      status: currentStep >= 0 ? (currentStep > 0 ? 'completed' : 'processing') : 'pending',
      icon: <Wallet className="w-5 h-5" />,
      estimatedTime: '30 seconds'
    },
    {
      id: 'blockchain',
      title: 'Blockchain Processing',
      description: 'Submitting transaction to the blockchain network',
      status: currentStep >= 1 ? (currentStep > 1 ? 'completed' : 'processing') : 'pending',
      icon: <Database className="w-5 h-5" />,
      estimatedTime: '1-2 minutes'
    },
    {
      id: 'metadata',
      title: 'Token Creation',
      description: 'Creating your token with metadata and features',
      status: currentStep >= 2 ? (currentStep > 2 ? 'completed' : 'processing') : 'pending',
      icon: <Sparkles className="w-5 h-5" />,
      estimatedTime: '30 seconds'
    },
    {
      id: 'success',
      title: 'Deployment Complete',
      description: 'Your token is now live on the blockchain!',
      status: currentStep >= 3 ? 'completed' : 'pending',
      icon: <Trophy className="w-5 h-5" />,
      estimatedTime: 'Done!'
    }
  ];

  // Update progress based on current step
  useEffect(() => {
    const newProgress = ((currentStep + 1) / steps.length) * 100;
    setProgress(newProgress);

    // Show success animation when complete
    if (currentStep >= 3 && !showSuccess) {
      setShowSuccess(true);
      setShowConfetti(true);
      
      // Trigger confetti celebration (dynamic import for better compatibility)
      import('canvas-confetti').then((confetti) => {
        confetti.default({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }).catch(() => {
        // Fallback if confetti fails to load
        console.log('🎉 Transaction success! (confetti unavailable)');
      });
    }
  }, [currentStep, showSuccess]);

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const getStepIcon = (step: TransactionStep) => {
    if (error && step.status === 'processing') {
      return <AlertCircle className="w-5 h-5 text-destructive" />;
    }
    
    if (step.status === 'completed') {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    
    if (step.status === 'processing') {
      return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
    }
    
    return step.icon;
  };

  const getStepColor = (step: TransactionStep) => {
    if (error && step.status === 'processing') return 'text-destructive';
    if (step.status === 'completed') return 'text-green-500';
    if (step.status === 'processing') return 'text-primary';
    return 'text-muted-foreground';
  };

  return (
    <>
      {/* Success Confetti */}
      <SuccessConfetti 
        show={showConfetti} 
        duration={4000}
        onComplete={() => setShowConfetti(false)}
      />
      
      <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {showSuccess ? (
              <span className="text-green-600">🎉 Token Created!</span>
            ) : error ? (
              <span className="text-destructive">❌ Transaction Failed</span>
            ) : (
              <span>Creating Token...</span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Token Info */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <div className="font-medium">{tokenData.name}</div>
              <div className="text-sm text-muted-foreground">{tokenData.symbol}</div>
            </div>
            <NetworkBadge network={tokenData.network} size="sm" />
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>

          {/* Steps */}
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-start gap-3 p-3 rounded-lg border">
                {getStepIcon(step)}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className={`font-medium ${getStepColor(step)}`}>
                      {step.title}
                    </h4>
                    {step.status === 'processing' && (
                      <Badge variant="outline" className="text-xs">
                        {step.estimatedTime}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {step.description}
                  </p>
                </div>
                {index < steps.length - 1 && step.status === 'completed' && (
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium">Transaction Failed</div>
                <div className="text-sm mt-1">{error}</div>
              </AlertDescription>
            </Alert>
          )}

          {/* Success Actions */}
          {showSuccess && transactionHash && (
            <div className="space-y-3">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <div className="font-medium text-green-700">Congratulations!</div>
                  <div className="text-sm text-green-600 mt-1">
                    Your token has been successfully created and deployed to the blockchain.
                  </div>
                </AlertDescription>
              </Alert>

              {/* Transaction Details */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <span className="text-sm font-medium">Transaction:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono">
                      {transactionHash.slice(0, 8)}...{transactionHash.slice(-8)}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(transactionHash, 'Transaction hash')}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {explorerUrl && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => window.open(explorerUrl, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View on Explorer
                  </Button>
                )}
                <Button onClick={onClose} className="flex-1">
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Retry Button for Errors */}
          {error && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Close
              </Button>
              <Button variant="default" className="flex-1">
                Try Again
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
