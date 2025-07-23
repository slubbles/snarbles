import React from 'react';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileLoadingIndicatorProps {
  isLoading: boolean;
  status?: 'idle' | 'loading' | 'success' | 'error';
  loadingText?: string;
  successText?: string;
  errorText?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const MobileLoadingIndicator: React.FC<MobileLoadingIndicatorProps> = ({
  isLoading,
  status = 'idle',
  loadingText = 'Loading...',
  successText = 'Success!',
  errorText = 'Error occurred',
  className,
  size = 'md',
  showIcon = true,
}) => {
  if (!isLoading && status === 'idle') return null;

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <>
            {showIcon && (
              <Loader2 className={cn("animate-spin text-blue-500", sizeClasses[size])} />
            )}
            <span className={cn("text-blue-400 font-medium", textSizeClasses[size])}>
              {loadingText}
            </span>
          </>
        );
      case 'success':
        return (
          <>
            {showIcon && (
              <CheckCircle className={cn("text-green-500", sizeClasses[size])} />
            )}
            <span className={cn("text-green-400 font-medium", textSizeClasses[size])}>
              {successText}
            </span>
          </>
        );
      case 'error':
        return (
          <>
            {showIcon && (
              <AlertCircle className={cn("text-red-500", sizeClasses[size])} />
            )}
            <span className={cn("text-red-400 font-medium", textSizeClasses[size])}>
              {errorText}
            </span>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className={cn(
      "flex items-center justify-center gap-3 p-4 rounded-lg",
      "snarbles-glass-subtle border border-white/10",
      "transition-all duration-300",
      // Mobile optimizations
      "min-h-[60px] md:min-h-[48px]",
      "touch-manipulation",
      className
    )}>
      {renderContent()}
    </div>
  );
};

// Enhanced loading state for mobile deployment
interface MobileDeploymentProgressProps {
  status: 'idle' | 'checking' | 'deploying' | 'success' | 'error';
  progress?: number;
  currentStep?: string;
  className?: string;
}

const MobileDeploymentProgress: React.FC<MobileDeploymentProgressProps> = ({
  status,
  progress = 0,
  currentStep = '',
  className,
}) => {
  const getStatusText = () => {
    switch (status) {
      case 'checking':
        return 'Checking Payment Method...';
      case 'deploying':
        return currentStep || 'Deploying Your Token...';
      case 'success':
        return 'Token Successfully Deployed!';
      case 'error':
        return 'Deployment Failed';
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'checking':
        return 'text-yellow-400';
      case 'deploying':
        return 'text-blue-400';
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  if (status === 'idle') return null;

  return (
    <div className={cn(
      "w-full p-6 rounded-xl",
      "snarbles-glass-subtle border border-white/10",
      "transition-all duration-300",
      className
    )}>
      {/* Status indicator */}
      <div className="flex items-center justify-center gap-3 mb-4">
        {status === 'checking' || status === 'deploying' ? (
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        ) : status === 'success' ? (
          <CheckCircle className="w-8 h-8 text-green-500" />
        ) : status === 'error' ? (
          <AlertCircle className="w-8 h-8 text-red-500" />
        ) : null}
        
        <span className={cn(
          "text-lg font-semibold text-center",
          getStatusColor()
        )}>
          {getStatusText()}
        </span>
      </div>

      {/* Progress bar for deployment */}
      {(status === 'checking' || status === 'deploying') && (
        <div className="w-full bg-gray-700 rounded-full h-3 mb-3">
          <div 
            className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
            style={{ width: `${Math.max(progress, 10)}%` }}
          />
        </div>
      )}

      {/* Current step text */}
      {currentStep && (status === 'checking' || status === 'deploying') && (
        <p className="text-center text-sm text-gray-300 mt-2">
          {currentStep}
        </p>
      )}
    </div>
  );
};

export { MobileLoadingIndicator, MobileDeploymentProgress };
export type { MobileLoadingIndicatorProps, MobileDeploymentProgressProps };
