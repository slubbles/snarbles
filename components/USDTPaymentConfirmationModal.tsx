'use client';

import React from 'react';
import { DollarSign, CreditCard, AlertTriangle, CheckCircle } from 'lucide-react';

interface USDTPaymentConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  paymentDetails: {
    amount: number;
    currency: string;
    creditsReceived: number;
    estimatedFee: number;
    nativeCurrency: string;
    walletAddress: string;
  };
  isProcessing?: boolean;
}

export default function USDTPaymentConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  paymentDetails,
  isProcessing = false
}: USDTPaymentConfirmationModalProps) {
  if (!isOpen) return null;

  const { amount, currency, creditsReceived, estimatedFee, nativeCurrency, walletAddress } = paymentDetails;

  return (
    <>
      <style jsx>{`
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(8px);
          z-index: 999;
          animation: fadeIn 0.3s ease;
        }

        .modal-content {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 90%;
          max-width: 480px;
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

        .glass-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
        }

        .button-enhanced {
          background: linear-gradient(135deg, rgb(239, 68, 68) 0%, rgb(220, 38, 38) 100%);
          color: rgb(254, 254, 235);
          padding: 1rem 1.5rem;
          border-radius: 0.75rem;
          font-weight: 600;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
          border: none;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
        }

        .button-enhanced:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4);
        }

        .button-enhanced:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .button-secondary {
          background: transparent;
          color: rgb(163, 163, 163);
          border: 1px solid rgb(38, 38, 38);
          padding: 1rem 1.5rem;
          border-radius: 0.75rem;
          font-weight: 500;
          transition: all 0.3s ease;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
        }

        .button-secondary:hover {
          background: rgba(38, 38, 38, 0.5);
          border-color: rgb(163, 163, 163);
        }
      `}</style>

      <div className="modal-backdrop" onClick={onClose} />
      
      <div className="modal-content">
        <div className="glass-card" style={{ background: 'rgba(8, 8, 8, 0.95)', border: '1px solid rgb(38, 38, 38)' }}>
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground font-['Inter']">Confirm Payment</h2>
                <p className="text-sm text-muted-foreground font-['Inter']">
                  Review your {currency} payment details
                </p>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="px-6 py-6 space-y-6">
            {/* Amount & Credits */}
            <div className="glass-card p-4 border border-gray-800" style={{ background: 'rgba(31, 41, 55, 0.2)' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-foreground font-['Inter']">Payment Summary</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-['Inter']">Amount to Pay:</span>
                  <span className="text-xl font-bold text-foreground font-['Inter']">
                    {amount} {currency}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-['Inter']">Credits Received:</span>
                  <span className="text-lg font-semibold text-primary font-['Inter']">
                    +{creditsReceived} credits
                  </span>
                </div>
                <div className="border-t border-gray-700 pt-3 flex justify-between items-center">
                  <span className="text-muted-foreground font-['Inter']">Exchange Rate:</span>
                  <span className="text-sm text-muted-foreground font-['Inter']">
                    1 {currency} = 1 Credit
                  </span>
                </div>
              </div>
            </div>

            {/* Transaction Details */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground font-['Inter']">Network Fee:</span>
                <span className="text-foreground font-['Inter']">
                  ~{estimatedFee.toFixed(4)} {nativeCurrency}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground font-['Inter']">Payment To:</span>
                <span className="text-foreground font-mono text-xs">
                  {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
                </span>
              </div>
            </div>

            {/* Important Notice */}
            <div className="flex items-start gap-3 p-4 rounded-lg border border-yellow-600/30" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-yellow-300 font-medium font-['Inter'] mb-1">Important:</p>
                <p className="text-yellow-200 font-['Inter']">
                  This transaction will be processed on the Algorand blockchain. Please ensure you have sufficient {nativeCurrency} for network fees.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 flex gap-3 border-t border-gray-800" style={{ background: 'rgba(8, 8, 8, 0.95)' }}>
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="button-secondary flex-1"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isProcessing}
              className="button-enhanced flex-1"
            >
              {isProcessing ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Confirm & Pay {amount} {currency}
                </div>
              )}
            </button>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="absolute right-4 top-4 rounded-full p-2 transition-all duration-300 hover:scale-110"
            style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(8px)' }}
          >
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
