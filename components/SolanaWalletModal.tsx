'use client';

import React from 'react';
import { X } from 'lucide-react';
import { PhantomMobileConnector } from './PhantomMobileConnector';

interface SolanaWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SolanaWalletModal: React.FC<SolanaWalletModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[rgb(8,8,8)] border border-[rgb(254,254,235)] rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-[rgb(254,254,235)]">
          <h2 className="text-xl font-bold text-[rgb(254,254,235)]">
            Connect Phantom Wallet
          </h2>
          <button
            onClick={onClose}
            className="text-[rgb(254,254,235)] hover:text-[rgb(239,68,68)] transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <p className="text-[rgb(254,254,235)] text-sm leading-relaxed mb-4">
              Since you're using the Phantom wallet app, you can connect directly to access Solana features.
            </p>
            
            <div className="bg-[rgb(254,254,235)] bg-opacity-10 rounded-lg p-4 mb-4">
              <h3 className="text-[rgb(254,254,235)] font-semibold mb-2">
                What you can do with Solana:
              </h3>
              <ul className="text-[rgb(254,254,235)] text-sm space-y-1">
                <li>• Purchase algo credits with SOL</li>
                <li>• Access Solana-based features</li>
                <li>• Manage SOL transactions</li>
              </ul>
            </div>
          </div>

          {/* Phantom Connector */}
          <PhantomMobileConnector onConnectionChange={(connected) => {
            if (connected) {
              onClose();
            }
          }} />

          {/* Help Section */}
          <div className="mt-6 pt-6 border-t border-[rgb(254,254,235)] border-opacity-30">
            <h3 className="text-[rgb(254,254,235)] font-semibold mb-3">
              Need help?
            </h3>
            <div className="space-y-2 text-sm text-[rgb(254,254,235)]">
              <p>• Make sure you have the latest Phantom app version</p>
              <p>• Try refreshing the page if connection fails</p>
              <p>• Check your internet connection</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
