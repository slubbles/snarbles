import { FullConfig } from '@playwright/test';

// Extend global interface for mock wallets
declare global {
  var mockWallets: {
    phantom: any;
    pera: any;
  };
}

/**
 * Global setup for mobile testing
 * Prepares the environment for mobile wallet testing
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Setting up mobile testing environment...');
  
  // Setup mobile analytics tracking
  process.env.MOBILE_TESTING = 'true';
  
  // Initialize mobile test database if needed
  console.log('📱 Mobile testing environment ready');
  
  // Mock wallet extensions for testing
  (global as any).mockWallets = {
    phantom: {
      isPhantom: true,
      isConnected: false,
      publicKey: null
    },
    pera: {
      isPeraWallet: true,  
      isConnected: false,
      accounts: []
    }
  };
  
  console.log('✅ Mobile test environment configured');
}

export default globalSetup;
