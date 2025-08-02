import React, { useEffect, useState } from 'react';

interface CreditTopUpSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  topUpDetails: {
    algoAmount: number;
    creditsReceived: number;
    bonusCredits?: number;
    transactionId: string;
    newBalance?: number;
    paymentMethod?: 'ALGO' | 'USDT'; // Add payment method
  };
}

// Simple confetti effect using CSS animations
const ConfettiPiece = ({ delay, duration, color }: { delay: number; duration: number; color: string }) => (
  <div
    className="absolute w-2 h-2 rounded"
    style={{
      backgroundColor: color,
      left: `${Math.random() * 100}%`,
      animationDelay: `${delay}ms`,
      animationDuration: `${duration}ms`,
      animation: `confetti-fall ${duration}ms ease-out ${delay}ms forwards`
    }}
  />
);

export default function CreditTopUpSuccessModal({ 
  isOpen, 
  onClose, 
  topUpDetails 
}: CreditTopUpSuccessModalProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Determine payment method and display labels
  const paymentMethod = topUpDetails.paymentMethod || 'ALGO';
  const isUSDT = paymentMethod === 'USDT';
  const currencyLabel = isUSDT ? 'USDt' : 'ALGO';
  const amountLabel = isUSDT ? 'USDt Paid' : 'ALGO Paid';

  const formatAlgo = (amount: number) => amount.toLocaleString('en-US', { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 6 
  });

  const formatCredits = (amount: number) => amount.toLocaleString('en-US');

  const explorerUrl = `https://allo.info/tx/${topUpDetails.transactionId}`;

  const confettiColors = ['rgb(239, 68, 68)', 'rgb(59, 130, 246)', 'rgb(34, 197, 94)', 'rgb(168, 85, 247)', 'rgb(249, 115, 22)', 'rgb(236, 72, 153)'];

  return (
    <>
      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        
        @keyframes bounce-in {
          0% {
            transform: scale(0.3);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .modal-enter {
          animation: bounce-in 0.6s ease-out;
        }
      `}</style>

      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Confetti */}
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 50 }).map((_, i) => (
              <ConfettiPiece
                key={i}
                delay={Math.random() * 3000}
                duration={2000 + Math.random() * 1000}
                color={confettiColors[Math.floor(Math.random() * confettiColors.length)]}
              />
            ))}
          </div>
        )}

        <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          {/* Background overlay - Enhanced with design system */}
          <div 
            className="fixed inset-0 transition-opacity backdrop-blur-sm"
            style={{ background: 'rgba(0, 0, 0, 0.8)' }}
            onClick={onClose}
          />

          {/* Modal panel - Updated to use design system */}
          <div className="modal-enter relative inline-block transform overflow-hidden rounded-2xl glass-card border border-gray-800 text-left align-bottom shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle" style={{ background: 'rgba(8, 8, 8, 0.95)', backdropFilter: 'blur(20px)' }}>
            {/* Success header with design system gradient */}
            <div className="px-6 py-8 text-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgb(239, 68, 68) 0%, rgba(239, 68, 68, 0.8) 50%, rgb(59, 130, 246) 100%)' }}>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
                <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="mt-4 text-2xl font-bold text-white font-['Inter']">
                🎉 Top-up Successful!
              </h3>
              <p className="mt-2 text-white/80 font-['Inter']">
                Your credits have been added to your account
              </p>
            </div>

            {/* Content - Updated with design system colors */}
            <div className="px-6 py-6" style={{ background: 'rgb(8, 8, 8)', color: 'rgb(254, 254, 235)' }}>
              {/* Transaction summary */}
              <div className="space-y-4">
                <div className="rounded-xl glass-card p-4 border border-gray-800" style={{ background: 'rgba(31, 41, 55, 0.3)', backdropFilter: 'blur(8px)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400 font-['Inter']">Credits Added</p>
                      <p className="text-3xl font-bold font-['Inter']" style={{ background: 'linear-gradient(to right, rgb(239, 68, 68), rgba(239, 68, 68, 0.8))', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent' }}>
                        +{formatCredits(topUpDetails.creditsReceived)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400 font-['Inter']">{amountLabel}</p>
                      <p className="text-xl font-semibold text-white font-['Inter']">
                        {formatAlgo(topUpDetails.algoAmount)} {currencyLabel}
                      </p>
                    </div>
                  </div>

                  {topUpDetails.bonusCredits && topUpDetails.bonusCredits > 0 && (
                    <div className="mt-3 rounded-lg p-3 border border-yellow-600/30" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                      <p className="text-sm font-medium text-yellow-300 font-['Inter']">
                        🎁 Bonus: +{formatCredits(topUpDetails.bonusCredits)} credits included!
                      </p>
                    </div>
                  )}
                </div>

                {/* New balance */}
                {topUpDetails.newBalance !== undefined && (
                  <div className="rounded-lg glass-card p-4 border border-gray-800" style={{ background: 'rgba(31, 41, 55, 0.2)' }}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-400 font-['Inter']">
                        New Balance
                      </span>
                      <span className="text-lg font-bold text-white font-['Inter']">
                        {formatCredits(topUpDetails.newBalance)} credits
                      </span>
                    </div>
                  </div>
                )}

                {/* Transaction details toggle */}
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex w-full items-center justify-between rounded-lg border border-gray-700 p-3 text-left hover:bg-gray-800/50 transition-all duration-300 font-['Inter']"
                >
                  <span className="text-sm font-medium text-gray-300">
                    Transaction Details
                  </span>
                  <span className="text-gray-400 text-xl">
                    {showDetails ? '−' : '+'}
                  </span>
                </button>

                {showDetails && (
                  <div className="space-y-3 rounded-lg glass-card p-4 text-sm border border-gray-800" style={{ background: 'rgba(31, 41, 55, 0.2)' }}>
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-['Inter']">Transaction ID:</span>
                      <span className="font-mono text-white break-all text-xs">
                        {topUpDetails.transactionId}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-['Inter']">Network:</span>
                      <span className="text-white font-['Inter']">Algorand Mainnet</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-['Inter']">Status:</span>
                      <span className="font-medium font-['Inter']" style={{ color: 'rgb(239, 68, 68)' }}>Confirmed ✅</span>
                    </div>
                    <a
                      href={explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center hover:opacity-80 transition-all duration-300 font-['Inter']"
                      style={{ color: 'rgb(239, 68, 68)' }}
                    >
                      View on Allo.info →
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Actions - Updated with design system styling */}
            <div className="px-6 py-4 flex gap-3 border-t border-gray-800" style={{ background: 'rgba(8, 8, 8, 0.95)' }}>
              <button
                onClick={onClose}
                className="flex-1 rounded-xl px-4 py-3 text-white font-medium font-['Inter'] transition-all duration-300 transform hover:scale-105 hover:shadow-lg border border-red-600/30"
                style={{ 
                  background: 'linear-gradient(135deg, rgb(239, 68, 68) 0%, rgba(239, 68, 68, 0.8) 100%)',
                  boxShadow: '0 4px 15px rgba(239, 68, 68, 0.2)'
                }}
              >
                ✨ Awesome!
              </button>
              <a
                href="/create"
                className="flex-1 rounded-xl border border-gray-700 px-4 py-3 text-center font-medium text-gray-300 hover:bg-gray-800/50 hover:border-gray-600 transition-all duration-300 font-['Inter']"
              >
                Create Token
              </a>
            </div>

            {/* Close button - Updated styling */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-2 transition-all duration-300 hover:scale-110"
              style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(8px)' }}
            >
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
