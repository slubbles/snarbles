import { useState, useCallback } from 'react';

export type ProgressStatus = 
  | 'idle' 
  | 'preparing' 
  | 'signing' 
  | 'broadcasting' 
  | 'confirming' 
  | 'success' 
  | 'error';

export interface ProgressStep {
  id: number;
  label: string;
  description: string;
  duration?: number; // Expected duration in ms
}

export interface ProgressState {
  step: number;
  status: ProgressStatus;
  message: string;
  txId?: string;
  assetId?: number;
  error?: string;
  progress: number; // 0-100
}

export const PROGRESS_STEPS: ProgressStep[] = [
  {
    id: 0,
    label: 'Preparing Transaction',
    description: 'Creating token parameters and validating data...',
    duration: 2000
  },
  {
    id: 1,
    label: 'Waiting for Signature',
    description: 'Please check your wallet to sign the transaction'
    // No duration - user dependent
  },
  {
    id: 2,
    label: 'Broadcasting to Network',
    description: 'Submitting your transaction to the Algorand network...',
    duration: 3000
  },
  {
    id: 3,
    label: 'Confirming Transaction',
    description: 'Waiting for network confirmation...',
    duration: 8000
  },
  {
    id: 4,
    label: 'Token Created Successfully!',
    description: 'Your token has been created and is ready to use',
    duration: 1000
  }
];

export const useTokenCreationProgress = () => {
  const [progress, setProgress] = useState<ProgressState>({
    step: 0,
    status: 'idle',
    message: '',
    progress: 0
  });

  const updateProgress = useCallback((
    stepIndex: number, 
    status: ProgressStatus, 
    data: Partial<ProgressState> = {}
  ) => {
    const step = PROGRESS_STEPS[stepIndex];
    const progressPercentage = (stepIndex / (PROGRESS_STEPS.length - 1)) * 100;
    
    setProgress(prev => ({
      ...prev,
      step: stepIndex,
      status,
      message: step?.label || '',
      progress: Math.min(progressPercentage, 100),
      ...data
    }));
  }, []);

  const resetProgress = useCallback(() => {
    setProgress({
      step: 0,
      status: 'idle',
      message: '',
      progress: 0
    });
  }, []);

  const setError = useCallback((error: string) => {
    setProgress(prev => ({
      ...prev,
      status: 'error',
      error
    }));
  }, []);

  const setSuccess = useCallback((data: { txId: string; assetId: number }) => {
    updateProgress(4, 'success', data);
  }, [updateProgress]);

  return {
    progress,
    steps: PROGRESS_STEPS,
    updateProgress,
    resetProgress,
    setError,
    setSuccess
  };
};
