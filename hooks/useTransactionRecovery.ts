'use client';

import { useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { usePaymentState } from '@/hooks/usePaymentState';
import { TransactionTracker, createTokenCreationSteps, retryWithBackoff } from '@/lib/error-handling';

export interface TransactionRecoveryConfig {
  maxRetries: number;
  baseDelay: number;
  timeoutMs: number;
  enableRecovery: boolean;
}

export interface TransactionResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  recoverable?: boolean;
}

const defaultConfig: TransactionRecoveryConfig = {
  maxRetries: 3,
  baseDelay: 2000,
  timeoutMs: 60000,
  enableRecovery: true
};

export function useTransactionRecovery(config: Partial<TransactionRecoveryConfig> = {}) {
  const finalConfig = { ...defaultConfig, ...config };
  const { toast } = useToast();
  const { 
    setProcessing, 
    setError, 
    setTransactionId, 
    setTokenCreationStep, 
    network,
    selectedMethod
  } = usePaymentState();
  
  const trackerRef = useRef<TransactionTracker | null>(null);
  const recoveryAttemptsRef = useRef(0);

  // Initialize transaction tracker
  const initializeTracker = useCallback((network: 'solana' | 'algorand') => {
    const steps = createTokenCreationSteps(network);
    trackerRef.current = new TransactionTracker((updatedSteps) => {
      const currentStep = updatedSteps.findIndex(s => s.status === 'in-progress');
      if (currentStep !== -1) {
        setTokenCreationStep(currentStep);
      }
    });
    
    steps.forEach(step => trackerRef.current?.addStep(step));
    return trackerRef.current;
  }, [setTokenCreationStep]);

  // Enhanced transaction execution with recovery
  const executeTransactionWithRecovery = useCallback(async (
    transactionFunction: () => Promise<TransactionResult>,
    operationName: string = 'Transaction'
  ): Promise<TransactionResult> => {
    if (!network || !selectedMethod) {
      return { success: false, error: 'Network or payment method not selected' };
    }

    setProcessing(true);
    setError(null);
    recoveryAttemptsRef.current = 0;

    // Initialize tracker
    const tracker = initializeTracker(network);
    
    try {
      const result = await retryWithBackoff(
        async () => {
          recoveryAttemptsRef.current += 1;
          
          // Update progress
          tracker.startStep('validation');
          await new Promise(resolve => setTimeout(resolve, 500));
          tracker.completeStep('validation');
          
          // Execute transaction
          tracker.startStep('wallet-approval');
          
          const txResult = await Promise.race([
            transactionFunction(),
            new Promise<TransactionResult>((_, reject) => {
              setTimeout(() => reject(new Error('Transaction timeout')), finalConfig.timeoutMs);
            })
          ]);
          
          if (txResult.success) {
            tracker.completeStep('wallet-approval');
            
            if (txResult.transactionId) {
              setTransactionId(txResult.transactionId);
              tracker.startStep('transaction-broadcast');
              tracker.addTransaction('transaction-broadcast', txResult.transactionId);
              tracker.completeStep('transaction-broadcast');
            }
            
            tracker.startStep('confirmation');
            // Simulate confirmation time
            await new Promise(resolve => setTimeout(resolve, 2000));
            tracker.completeStep('confirmation');
            
            tracker.startStep('finalization');
            await new Promise(resolve => setTimeout(resolve, 1000));
            tracker.completeStep('finalization');
          } else {
            tracker.failStep('wallet-approval', txResult.error || 'Transaction failed');
            if (!txResult.recoverable) {
              throw new Error(txResult.error || 'Non-recoverable transaction error');
            }
          }
          
          return txResult;
        },
        finalConfig.maxRetries,
        finalConfig.baseDelay,
        {
          onRetry: (attempt, error) => {
            console.log(`${operationName} attempt ${attempt} failed:`, error);
            
            toast({
              title: "Transaction Retry",
              description: `Attempt ${attempt} failed, retrying... (${error.message})`,
              variant: "destructive",
            });
          }
        }
      );

      if (result.success) {
        setProcessing(false);
        
        toast({
          title: "Transaction Successful",
          description: `${operationName} completed successfully`,
          variant: "default",
        });
        
        return result;
      } else {
        throw new Error(result.error || 'Transaction failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Transaction failed';
      
      setProcessing(false);
      setError(errorMessage);
      
      // Check if recovery is possible
      if (finalConfig.enableRecovery && canRecover(errorMessage)) {
        toast({
          title: "Transaction Failed",
          description: `${operationName} failed but may be recoverable. Check your wallet and try again.`,
          variant: "destructive",
        });
        
        return { success: false, error: errorMessage, recoverable: true };
      } else {
        toast({
          title: "Transaction Failed",
          description: `${operationName} failed: ${errorMessage}`,
          variant: "destructive",
        });
        
        return { success: false, error: errorMessage, recoverable: false };
      }
    }
  }, [
    network, 
    selectedMethod, 
    setProcessing, 
    setError, 
    setTransactionId, 
    initializeTracker, 
    finalConfig, 
    toast
  ]);

  // Determine if transaction can be recovered
  const canRecover = useCallback((error: string): boolean => {
    const recoverableErrors = [
      'network error',
      'timeout',
      'connection lost',
      'rpc error',
      'insufficient funds', // User can add funds
      'blockhash not found', // Retry with new blockhash
      'simulation failed', // May be temporary
      'transaction rejected' // User can retry
    ];
    
    return recoverableErrors.some(pattern => 
      error.toLowerCase().includes(pattern)
    );
  }, []);

  // Manual recovery function
  const recoverTransaction = useCallback(async (
    originalFunction: () => Promise<TransactionResult>,
    operationName: string = 'Recovery'
  ): Promise<TransactionResult> => {
    if (recoveryAttemptsRef.current >= finalConfig.maxRetries) {
      return { 
        success: false, 
        error: 'Maximum recovery attempts reached',
        recoverable: false
      };
    }
    
    toast({
      title: "Attempting Recovery",
      description: `Starting ${operationName} recovery process...`,
      variant: "default",
    });
    
    return executeTransactionWithRecovery(originalFunction, operationName);
  }, [finalConfig.maxRetries, executeTransactionWithRecovery, toast]);

  // Check transaction status
  const checkTransactionStatus = useCallback(async (
    transactionId: string,
    network: 'solana' | 'algorand'
  ): Promise<'confirmed' | 'failed' | 'pending'> => {
    try {
      // This would need to be implemented based on the specific blockchain
      // For now, return a mock status
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate random status for demonstration
      const statuses: Array<'confirmed' | 'failed' | 'pending'> = ['confirmed', 'failed', 'pending'];
      return statuses[Math.floor(Math.random() * statuses.length)];
    } catch (error) {
      console.error('Failed to check transaction status:', error);
      return 'failed';
    }
  }, []);

  // Reset recovery state
  const resetRecovery = useCallback(() => {
    recoveryAttemptsRef.current = 0;
    trackerRef.current?.reset();
    setProcessing(false);
    setError(null);
    setTransactionId(null);
    setTokenCreationStep(0);
  }, [setProcessing, setError, setTransactionId, setTokenCreationStep]);

  return {
    executeTransactionWithRecovery,
    recoverTransaction,
    checkTransactionStatus,
    resetRecovery,
    canRecover,
    recoveryAttempts: recoveryAttemptsRef.current,
    tracker: trackerRef.current
  };
}
