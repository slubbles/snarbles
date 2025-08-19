'use client';

import React, { useEffect, useState } from 'react';
import { SuccessConfetti } from '@/components/SuccessConfetti';
import { CheckCircle, Clock, AlertCircle, CreditCard, Shield, Zap } from 'lucide-react';

interface PaymentProcessingModalProps {
  isOpen: boolean;
  onClose?: () => void;
  currentStep: 'checking' | 'signing' | 'submitting' | 'confirming' | 'recording' | 'completed' | 'error';
  error?: string;
  transactionHash?: string;
  paymentDetails?: {
    amount: number;
    currency: string;
    creditsReceived: number;
  };
}

export default function PaymentProcessingModal({
  isOpen,
  onClose,
  currentStep,
  error,
  transactionHash,
  paymentDetails
}: PaymentProcessingModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  // Trigger confetti when payment is completed
  useEffect(() => {
    if (currentStep === 'completed' && !showConfetti) {
      setShowConfetti(true);
    }
  }, [currentStep, showConfetti]);
  if (!isOpen) return null;

  const steps = [
    {
      id: 'checking',
      title: 'Verifying Payment',
      description: 'Checking wallet balance and opt-in status...',
      icon: Shield,
      color: 'text-blue-400'
    },
    {
      id: 'signing',
      title: 'Wallet Signature Required',
      description: 'Please approve the transaction in your wallet',
      icon: CreditCard,
      color: 'text-yellow-400'
    },
    {
      id: 'submitting',
      title: 'Submitting Transaction',
      description: 'Broadcasting to Algorand network...',
      icon: Zap,
      color: 'text-purple-400'
    },
    {
      id: 'confirming',
      title: 'Confirming Transaction',
      description: 'Waiting for blockchain confirmation...',
      icon: Clock,
      color: 'text-orange-400'
    },
    {
      id: 'recording',
      title: 'Recording Credits',
      description: 'Updating your account balance...',
      icon: CreditCard,
      color: 'text-green-400'
    }
  ];

  const getCurrentStepIndex = () => steps.findIndex(step => step.id === currentStep);
  const currentStepIndex = getCurrentStepIndex();

  const getStepStatus = (stepIndex: number) => {
    if (currentStep === 'error') return 'error';
    if (currentStep === 'completed') return 'completed';
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) return 'active';
    return 'pending';
  };

  return (
    <>
      {/* Success Confetti */}
      <SuccessConfetti 
        show={showConfetti} 
        duration={4000}
        onComplete={() => setShowConfetti(false)}
      />
      
      <style jsx>{`
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(12px);
          z-index: 55;
          animation: fadeIn 0.3s ease;
        }

        .modal-content {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 90%;
          max-width: 520px;
          max-height: 90vh;
          overflow-y: auto;
          z-index: 1000;
          animation: slideIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translate(-50%, -60%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
        }

        .step-active {
          animation: pulse 2s infinite;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }
      `}</style>

      <div className="modal-backdrop" />
      
      <div className="modal-content">
        <div className="glass-card" style={{ background: 'rgba(8, 8, 8, 0.95)', border: '1px solid rgb(38, 38, 38)' }}>
          {/* Header */}
          <div className="px-6 py-6 border-b border-gray-800">
            <div className="text-center">
              {currentStep === 'completed' ? (
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
              ) : currentStep === 'error' ? (
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-400" />
                </div>
              ) : (
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full spinner"></div>
                </div>
              )}
              
              <h2 className="text-2xl font-bold text-foreground font-['Inter'] mb-2">
                {currentStep === 'completed' ? 'Payment Successful!' :
                 currentStep === 'error' ? 'Payment Failed' :
                 'Processing Payment...'}
              </h2>
              
              {paymentDetails && currentStep === 'completed' && (
                <p className="text-green-400 font-semibold font-['Inter']">
                  +{paymentDetails.creditsReceived} credits added to your account
                </p>
              )}
            </div>
          </div>

          {/* Progress Steps */}
          <div className="px-6 py-6">
            {currentStep === 'error' ? (
              <div className="text-center">
                <div className="p-4 rounded-lg border border-red-600/30" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                  <p className="text-red-300 font-['Inter'] mb-2">Transaction Failed</p>
                  <p className="text-red-200 text-sm font-['Inter']">
                    {error || 'An unexpected error occurred. Please try again.'}
                  </p>
                </div>
              </div>
            ) : currentStep === 'completed' ? (
              <div className="text-center space-y-4">
                <div className="p-4 rounded-lg border border-green-600/30" style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
                  <p className="text-green-300 font-medium font-['Inter'] mb-2">
                    Payment Processed Successfully
                  </p>
                  {transactionHash && (
                    <div className="text-sm">
                      <p className="text-green-200 font-['Inter'] mb-2">Transaction ID:</p>
                      <p className="font-mono text-xs text-green-300 break-all bg-green-500/10 p-2 rounded border border-green-500/20">
                        {transactionHash}
                      </p>
                    </div>
                  )}
                </div>
                
                {paymentDetails && (
                  <div className="glass-card p-4 border border-gray-800" style={{ background: 'rgba(31, 41, 55, 0.2)' }}>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-['Inter']">Payment Amount:</span>
                      <span className="text-foreground font-semibold font-['Inter']">
                        {paymentDetails.amount} {paymentDetails.currency}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-muted-foreground font-['Inter']">Credits Received:</span>
                      <span className="text-primary font-bold font-['Inter']">
                        +{paymentDetails.creditsReceived} credits
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {steps.map((step, index) => {
                  const status = getStepStatus(index);
                  const StepIcon = step.icon;
                  
                  return (
                    <div
                      key={step.id}
                      className={`flex items-center gap-4 p-3 rounded-lg transition-all duration-300 ${
                        status === 'active' ? 'bg-primary/10 border border-primary/20 step-active' :
                        status === 'completed' ? 'bg-green-500/10 border border-green-500/20' :
                        'bg-muted/5'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        status === 'active' ? 'bg-primary/20' :
                        status === 'completed' ? 'bg-green-500/20' :
                        'bg-muted/20'
                      }`}>
                        {status === 'completed' ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : status === 'active' ? (
                          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full spinner"></div>
                        ) : (
                          <StepIcon className={`w-5 h-5 ${step.color} opacity-50`} />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h4 className={`font-semibold font-['Inter'] ${
                          status === 'active' ? 'text-primary' :
                          status === 'completed' ? 'text-green-400' :
                          'text-muted-foreground'
                        }`}>
                          {step.title}
                        </h4>
                        <p className={`text-sm font-['Inter'] ${
                          status === 'active' ? 'text-foreground' : 'text-muted-foreground'
                        }`}>
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {(currentStep === 'completed' || currentStep === 'error') && (
            <div className="px-6 py-4 border-t border-gray-800">
              {onClose && (
                <div className="flex justify-center">
                  <button
                    onClick={onClose}
                    className="button-enhanced"
                  >
                    {currentStep === 'completed' ? 'Continue' : 'Try Again'}
                  </button>
                </div>
              )}
              <div className="text-center mt-3">
                <p className="text-xs text-muted-foreground font-['Inter']">
                  {currentStep === 'completed' 
                    ? 'You can now close this window and start creating tokens!'
                    : 'You can close this window and try again.'
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
