'use client';

import { useEffect } from 'react';
import { X, Loader2, CheckCircle, AlertCircle, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { type ProgressState, type ProgressStep } from '@/hooks/useTokenCreationProgress';

interface TokenCreationProgressProps {
  progress: ProgressState;
  steps: ProgressStep[];
  onClose?: () => void;
  onCancel?: () => void;
  canClose?: boolean;
}

export default function TokenCreationProgress({
  progress,
  steps,
  onClose,
  onCancel,
  canClose = false
}: TokenCreationProgressProps) {
  // Prevent closing during signing step
  const canActuallyClose = canClose && progress.status !== 'signing' && progress.status !== 'broadcasting';
  
  // Auto-close on success after 3 seconds
  useEffect(() => {
    if (progress.status === 'success' && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [progress.status, onClose]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[rgb(17,17,17)] border-2 border-[rgb(38,38,38)] rounded-xl p-6 w-full max-w-md mx-4 glass-card">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="snarbles-heading text-xl font-bold text-[rgb(254,254,235)]">
            Creating Your Token
          </h3>
          {canActuallyClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-[rgb(163,163,163)] hover:text-[rgb(254,254,235)]"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="snarbles-body text-sm text-[rgb(163,163,163)]">
              Progress
            </span>
            <span className="snarbles-body text-sm font-medium text-[rgb(254,254,235)]">
              {Math.round(progress.progress)}%
            </span>
          </div>
          <Progress 
            value={progress.progress} 
            className="h-2 bg-[rgb(38,38,38)]"
          />
        </div>

        {/* Current Step */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            {progress.status === 'error' ? (
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            ) : progress.status === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
            ) : (
              <Loader2 className="w-5 h-5 text-[rgb(239,68,68)] animate-spin flex-shrink-0" />
            )}
            <span className="snarbles-heading text-base font-semibold text-[rgb(254,254,235)]">
              {progress.message}
            </span>
          </div>
          
          {steps[progress.step] && (
            <p className="snarbles-body text-sm text-[rgb(163,163,163)] ml-8">
              {steps[progress.step].description}
            </p>
          )}
        </div>

        {/* Steps List */}
        <div className="space-y-3 mb-6">
          {steps.map((step, index) => {
            const isCompleted = index < progress.step;
            const isActive = index === progress.step;
            const isFuture = index > progress.step;
            
            return (
              <div 
                key={step.id}
                className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-200 ${
                  isActive ? 'bg-[rgb(239,68,68)]/10 border border-[rgb(239,68,68)]/20' : ''
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  isCompleted 
                    ? 'bg-green-500 text-white' 
                    : isActive 
                      ? 'bg-[rgb(239,68,68)] text-white' 
                      : 'bg-[rgb(38,38,38)] text-[rgb(163,163,163)]'
                }`}>
                  {isCompleted ? '✓' : step.id + 1}
                </div>
                
                <span className={`snarbles-body text-sm ${
                  isCompleted 
                    ? 'text-green-400' 
                    : isActive 
                      ? 'text-[rgb(254,254,235)] font-medium' 
                      : 'text-[rgb(163,163,163)]'
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Signing Instructions */}
        {progress.status === 'signing' && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Smartphone className="w-5 h-5 text-blue-400" />
              <span className="snarbles-heading text-sm font-semibold text-blue-300">
                Wallet Signature Required
              </span>
            </div>
            <p className="snarbles-body text-sm text-blue-200">
              Please check your Pera Wallet app to sign the transaction. 
              The app should open automatically or check your notifications.
            </p>
            <div className="flex justify-center mt-3">
              <div className="animate-pulse">
                <Smartphone className="w-8 h-8 text-blue-400" />
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {progress.status === 'error' && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="snarbles-heading text-sm font-semibold text-red-300">
                Error Occurred
              </span>
            </div>
            <p className="snarbles-body text-sm text-red-200">
              {progress.error || 'An unexpected error occurred during token creation.'}
            </p>
          </div>
        )}

        {/* Success Display */}
        {progress.status === 'success' && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="snarbles-heading text-sm font-semibold text-green-300">
                Token Created Successfully!
              </span>
            </div>
            <p className="snarbles-body text-sm text-green-200">
              Your token has been created and deployed to the Algorand network.
            </p>
            {progress.assetId && (
              <p className="snarbles-body text-xs text-green-300 mt-2">
                Asset ID: {progress.assetId}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {progress.status === 'error' && (
            <>
              <Button
                onClick={onCancel}
                variant="outline"
                className="flex-1 border-[rgb(163,163,163)] text-[rgb(163,163,163)] hover:bg-[rgb(38,38,38)]"
              >
                Cancel
              </Button>
              <Button
                onClick={() => window.location.reload()}
                className="flex-1 bg-[rgb(239,68,68)] hover:bg-[rgb(239,68,68)]/80 text-white"
              >
                Try Again
              </Button>
            </>
          )}
          
          {progress.status === 'success' && onClose && (
            <Button
              onClick={onClose}
              className="w-full bg-[rgb(239,68,68)] hover:bg-[rgb(239,68,68)]/80 text-white"
            >
              Continue
            </Button>
          )}
          
          {(progress.status === 'preparing' || progress.status === 'idle') && onCancel && (
            <Button
              onClick={onCancel}
              variant="outline"
              className="w-full border-[rgb(163,163,163)] text-[rgb(163,163,163)] hover:bg-[rgb(38,38,38)]"
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
