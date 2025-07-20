import { Page, expect } from '@playwright/test';

/**
 * Mobile Testing Utilities for Snarbles Platform
 * Provides helper functions for mobile-specific testing scenarios
 */

export class MobileTestUtils {
  constructor(private page: Page) {}

  /**
   * Check if touch targets meet minimum size requirements (44px)
   */
  async validateTouchTargets(selector?: string) {
    const elements = selector ? this.page.locator(selector) : this.page.locator('button, a, input, [role="button"]');
    const count = await elements.count();
    
    const results = [];
    
    for (let i = 0; i < count; i++) {
      const element = elements.nth(i);
      const box = await element.boundingBox();
      
      if (box) {
        const minSize = Math.min(box.width, box.height);
        results.push({
          element: await element.textContent() || `Element ${i}`,
          size: minSize,
          valid: minSize >= 44
        });
      }
    }
    
    return results;
  }

  /**
   * Test wallet connection flow on mobile
   */
  async testMobileWalletConnection(walletType: 'phantom' | 'pera') {
    // Click connect wallet button
    await this.page.click('[data-testid="connect-wallet-button"]');
    
    // Verify mobile wallet modal appears
    await expect(this.page.locator('[data-testid="mobile-wallet-modal"]')).toBeVisible();
    
    // Click specific wallet option
    await this.page.click(`[data-testid="${walletType}-mobile-option"]`);
    
    if (walletType === 'phantom') {
      // Test Phantom-specific mobile flow
      return await this.testPhantomMobileFlow();
    } else {
      // Test Pera-specific mobile flow  
      return await this.testPeraMobileFlow();
    }
  }

  /**
   * Test Phantom mobile connection flow
   */
  async testPhantomMobileFlow() {
    const results = {
      deepLinkGenerated: false,
      appStoreRedirect: false,
      connectionHandled: false
    };

    // Check for deep link generation
    const deepLink = this.page.locator('[data-testid="phantom-deep-link"]');
    if (await deepLink.isVisible()) {
      const href = await deepLink.getAttribute('href');
      results.deepLinkGenerated = href?.includes('phantom.app/ul/browse') || false;
    }

    // Check for app store redirect option
    const installButton = this.page.locator('[data-testid="install-phantom"]');
    if (await installButton.isVisible()) {
      results.appStoreRedirect = true;
    }

    // Test connection flow
    const connectButton = this.page.locator('[data-testid="phantom-connect-mobile"]');
    if (await connectButton.isVisible()) {
      await connectButton.click();
      results.connectionHandled = true;
    }

    return results;
  }

  /**
   * Test Pera mobile connection flow
   */
  async testPeraMobileFlow() {
    const results = {
      qrCodeDisplayed: false,
      deepLinkGenerated: false,
      connectionHandled: false
    };

    // Check for QR code display
    const qrCode = this.page.locator('[data-testid="pera-qr-code"]');
    if (await qrCode.isVisible()) {
      const src = await qrCode.getAttribute('src');
      results.qrCodeDisplayed = !!src;
    }

    // Check for deep link generation
    const deepLink = this.page.locator('[data-testid="pera-deep-link"]');
    if (await deepLink.isVisible()) {
      const href = await deepLink.getAttribute('href');
      results.deepLinkGenerated = href?.includes('perawallet://') || false;
    }

    // Test connection flow
    const connectButton = this.page.locator('[data-testid="pera-connect-mobile"]');
    if (await connectButton.isVisible()) {
      await connectButton.click();
      results.connectionHandled = true;
    }

    return results;
  }

  /**
   * Test mobile form completion
   */
  async testMobileTokenCreation() {
    const formData = {
      name: 'Mobile Test Token',
      symbol: 'MTT',
      supply: '1000000',
      decimals: 6,
      description: 'A token created during mobile testing'
    };

    // Fill form fields
    await this.page.fill('[data-testid="token-name"]', formData.name);
    await this.page.fill('[data-testid="token-symbol"]', formData.symbol);
    await this.page.fill('[data-testid="token-supply"]', formData.supply);
    
    // Check if decimals field exists and fill it
    const decimalsField = this.page.locator('[data-testid="token-decimals"]');
    if (await decimalsField.isVisible()) {
      await decimalsField.fill(formData.decimals.toString());
    }

    // Fill description if available
    const descriptionField = this.page.locator('[data-testid="token-description"]');
    if (await descriptionField.isVisible()) {
      await descriptionField.fill(formData.description);
    }

    // Check form validation
    const submitButton = this.page.locator('[data-testid="create-token-submit"]');
    const isFormValid = await submitButton.isEnabled();

    return {
      formData,
      isFormValid,
      submitEnabled: isFormValid
    };
  }

  /**
   * Test responsive layout
   */
  async testResponsiveLayout() {
    const viewport = this.page.viewportSize();
    const isMobile = viewport ? viewport.width <= 768 : false;
    const isTablet = viewport ? viewport.width > 768 && viewport.width <= 1024 : false;

    const results = {
      viewport,
      isMobile,
      isTablet,
      mobileOptimized: false,
      tabletOptimized: false
    };

    if (isMobile) {
      // Check mobile-specific elements
      const mobileNav = this.page.locator('[data-testid="mobile-navigation"]');
      const hamburgerMenu = this.page.locator('[data-testid="hamburger-menu"]');
      
      results.mobileOptimized = (await mobileNav.isVisible()) || (await hamburgerMenu.isVisible());
    }

    if (isTablet) {
      // Check tablet-specific layouts
      const tabletLayout = this.page.locator('[data-testid="tablet-layout"]');
      results.tabletOptimized = await tabletLayout.isVisible();
    }

    return results;
  }

  /**
   * Test performance on mobile
   */
  async testMobilePerformance() {
    const startTime = Date.now();
    
    // Navigate to create page
    await this.page.goto('/create');
    
    // Wait for critical content
    await this.page.waitForSelector('[data-testid="token-form"]');
    
    const loadTime = Date.now() - startTime;
    
    // Check for performance indicators
    const performanceEntries = await this.page.evaluate(() => {
      return JSON.stringify(performance.getEntriesByType('navigation'));
    });

    return {
      loadTime,
      performanceEntries: JSON.parse(performanceEntries),
      isAcceptable: loadTime < 3000 // 3 second target
    };
  }

  /**
   * Test mobile accessibility
   */
  async testMobileAccessibility() {
    const results = {
      hasHeadings: false,
      hasAriaLabels: false,
      hasProperContrast: false,
      touchTargetsValid: false
    };

    // Check heading structure
    const headings = this.page.locator('h1, h2, h3, h4, h5, h6');
    results.hasHeadings = (await headings.count()) > 0;

    // Check ARIA labels
    const inputsWithLabels = this.page.locator('input[aria-label], input[aria-labelledby]');
    const totalInputs = this.page.locator('input');
    const inputsWithLabelsCount = await inputsWithLabels.count();
    const totalInputsCount = await totalInputs.count();
    
    results.hasAriaLabels = totalInputsCount === 0 || inputsWithLabelsCount / totalInputsCount > 0.8;

    // Check touch targets
    const touchTargets = await this.validateTouchTargets();
    const validTargets = touchTargets.filter(t => t.valid);
    results.touchTargetsValid = validTargets.length / touchTargets.length > 0.9;

    return results;
  }

  /**
   * Test network connectivity handling
   */
  async testNetworkConnectivity() {
    // Simulate offline mode
    await this.page.context().setOffline(true);
    
    // Try to interact with the page
    await this.page.click('[data-testid="token-name"]');
    await this.page.fill('[data-testid="token-name"]', 'Offline Test');
    
    // Check for offline indicators
    const offlineIndicator = this.page.locator('[data-testid="offline-indicator"], [data-testid="network-error"]');
    const showsOfflineState = await offlineIndicator.isVisible();
    
    // Restore connectivity
    await this.page.context().setOffline(false);
    
    // Check recovery
    await this.page.reload();
    const recoversOnline = await this.page.locator('[data-testid="token-form"]').isVisible();
    
    return {
      showsOfflineState,
      recoversOnline
    };
  }

  /**
   * Check for in-app browser detection
   */
  async testInAppBrowserDetection() {
    const userAgent = await this.page.evaluate(() => navigator.userAgent);
    
    const isInAppBrowser = userAgent.includes('FB_IAB') || 
                          userAgent.includes('FBAN') || 
                          userAgent.includes('Instagram') ||
                          userAgent.includes('TwitterAndroid');
    
    if (isInAppBrowser) {
      // Check for in-app browser warning
      const warning = this.page.locator('[data-testid="in-app-browser-warning"]');
      const showsWarning = await warning.isVisible();
      
      return {
        isInAppBrowser: true,
        showsWarning,
        userAgent
      };
    }
    
    return {
      isInAppBrowser: false,
      showsWarning: false,
      userAgent
    };
  }
}

/**
 * Mobile testing helper functions
 */
export const mobileHelpers = {
  /**
   * Get device info from user agent
   */
  getDeviceInfo: (userAgent: string) => {
    return {
      isIOS: /iPad|iPhone|iPod/.test(userAgent),
      isAndroid: /Android/.test(userAgent),
      isTablet: /iPad|Android(?=.*Tablet)/.test(userAgent),
      isPhone: /iPhone|Android(?!.*Tablet)/.test(userAgent)
    };
  },

  /**
   * Generate test data for mobile scenarios
   */
  generateTestToken: (prefix = 'Mobile') => ({
    name: `${prefix} Test Token ${Date.now()}`,
    symbol: `${prefix.toUpperCase()}${Math.floor(Math.random() * 1000)}`,
    supply: Math.floor(Math.random() * 1000000) + 100000,
    decimals: Math.floor(Math.random() * 10) + 6,
    description: `A test token created on mobile device for ${prefix} testing`
  }),

  /**
   * Mobile viewport configurations
   */
  viewports: {
    smallMobile: { width: 320, height: 568 },
    mobile: { width: 375, height: 812 },
    largeMobile: { width: 428, height: 926 },
    tablet: { width: 768, height: 1024 },
    largeTablet: { width: 1024, height: 1366 }
  }
};
