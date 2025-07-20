import { FullConfig } from '@playwright/test';

/**
 * Global teardown for mobile testing
 * Cleans up after mobile testing is complete
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up mobile testing environment...');
  
  // Clean up mobile test data
  delete process.env.MOBILE_TESTING;
  
  // Clear any mobile-specific mocks
  console.log('✅ Mobile testing cleanup complete');
}

export default globalTeardown;
