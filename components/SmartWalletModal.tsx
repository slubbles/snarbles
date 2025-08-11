'use client';

import React, { useState, useEffect } from 'react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { SolanaWalletModal } from './SolanaWalletModal';
import { AlgorandWalletModal } from './AlgorandWalletModal';
import MobileWalletGuidanceModal from './MobileWalletGuidanceModal';
import { 
  isMobileDevice, 
  isPhantomAppBrowser, 
  isPeraAppBrowser 
} from '@/lib/mobile-wallet-detection';

interface SmartWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SmartWalletModal: React.FC<SmartWalletModalProps> = ({
  isOpen,
  onClose
}) => {
  const [modalType, setModalType] = useState<'solana' | 'algorand' | 'standard-solana' | null>(null);
  const { setVisible: setWalletModalVisible } = useWalletModal();

  useEffect(() => {
    if (!isOpen) {
      setModalType(null);
      return;
    }

    // Smart detection logic - Hybrid approach
    if (isPhantomAppBrowser()) {
      // User is in Phantom app - show Solana modal directly
      setModalType('solana');
    } else if (isPeraAppBrowser()) {
      // User is in Pera app - show Algorand modal directly
      setModalType('algorand');
    } else {
      // For all other cases (mobile, desktop), trigger standard Solana wallet modal
      // This will naturally flow into the education system on mobile failures
      setModalType('standard-solana');
    }
  }, [isOpen]);

  // Handle triggering the standard wallet modal for non-wallet-app browsers
  useEffect(() => {
    if (modalType === 'standard-solana') {
      // Trigger the standard Solana wallet adapter modal
      setWalletModalVisible(true);
      // Close our modal since the standard one is now showing
      onClose();
    }
  }, [modalType, setWalletModalVisible, onClose]);

  if (!isOpen || !modalType) return null;

  const handleModalClose = () => {
    setModalType(null);
    onClose();
  };

  switch (modalType) {
    case 'solana':
      return (
        <SolanaWalletModal 
          isOpen={true} 
          onClose={handleModalClose} 
        />
      );
    
    case 'algorand':
      return (
        <AlgorandWalletModal 
          isOpen={true} 
          onClose={handleModalClose} 
        />
      );
    
    case 'standard-solana':
      // This case is handled by the useEffect above
      // Just show a brief loading state
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[rgb(8,8,8)] border border-[rgb(254,254,235)] rounded-lg p-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[rgb(254,254,235)] mx-auto"></div>
          </div>
        </div>
      );
    
    default:
      return null;
  }
};
