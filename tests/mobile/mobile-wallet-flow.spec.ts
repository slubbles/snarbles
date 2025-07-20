import { test, expect, devices } from '@playwright/test';

// Test configuration for mobile devices
const mobileDevices = {
  iphone13: devices['iPhone 13'],
  galaxyS21: devices['Galaxy S21'],
  ipadPro: devices['iPad Pro'],
  pixelXL: devices['Pixel XL']
};

test.describe('Mobile Wallet Connection Flow', () => {
  
  // Test on iPhone 13
  test.describe('iPhone 13 Safari', () => {
    test.use(mobileDevices.iphone13);

    test('should display mobile wallet modal correctly', async ({ page }) => {
      await page.goto('/create');
      
      // Test mobile-specific UI elements
      await expect(page.locator('[data-testid="mobile-create-token"]')).toBeVisible();
      
      // Check responsive layout
      const viewport = page.viewportSize();
      expect(viewport?.width).toBeLessThanOrEqual(414); // iPhone 13 width
      
      // Test touch targets are adequate size
      const buttons = page.locator('button');
      const count = await buttons.count();
      
      for (let i = 0; i < count; i++) {
        const button = buttons.nth(i);
        const box = await button.boundingBox();
        if (box) {
          // Ensure touch targets are at least 44px (Apple's recommended minimum)
          expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(44);
        }
      }
    });

    test('should handle Phantom wallet connection on mobile', async ({ page }) => {
      await page.goto('/create');
      
      // Click wallet connection
      await page.click('[data-testid="connect-wallet-button"]');
      
      // Should show mobile wallet modal
      await expect(page.locator('[data-testid="mobile-wallet-modal"]')).toBeVisible();
      
      // Click Phantom option
      await page.click('[data-testid="phantom-mobile-option"]');
      
      // Check deep link generation
      const deepLinkElement = page.locator('[data-testid="phantom-deep-link"]');
      if (await deepLinkElement.isVisible()) {
        const href = await deepLinkElement.getAttribute('href');
        expect(href).toContain('phantom.app/ul/browse');
      }
      
      // Test app store fallback for users without Phantom installed
      const installButton = page.locator('[data-testid="install-phantom"]');
      if (await installButton.isVisible()) {
        await installButton.click();
        // Should redirect to iOS App Store
        expect(page.url()).toContain('apps.apple.com');
      }
    });

    test('should handle Pera wallet connection on mobile', async ({ page }) => {
      await page.goto('/create');
      
      // Switch to Algorand network first
      await page.click('[data-testid="network-selector"]');
      await page.click('[data-testid="algorand-mainnet"]');
      
      // Click wallet connection
      await page.click('[data-testid="connect-wallet-button"]');
      
      // Should show mobile wallet modal
      await expect(page.locator('[data-testid="mobile-wallet-modal"]')).toBeVisible();
      
      // Click Pera option
      await page.click('[data-testid="pera-mobile-option"]');
      
      // Check QR code display for mobile
      const qrCode = page.locator('[data-testid="pera-qr-code"]');
      if (await qrCode.isVisible()) {
        expect(await qrCode.getAttribute('src')).toBeTruthy();
      }
      
      // Test manual deep link
      const connectButton = page.locator('[data-testid="pera-connect-mobile"]');
      if (await connectButton.isVisible()) {
        await connectButton.click();
        // Should attempt deep link to Pera wallet
      }
    });
  });

  // Test on Android Galaxy S21
  test.describe('Android Galaxy S21 Chrome', () => {
    test.use(mobileDevices.galaxyS21);

    test('should handle Android-specific wallet flows', async ({ page }) => {
      await page.goto('/create');
      
      // Test Android-specific behaviors
      await page.click('[data-testid="connect-wallet-button"]');
      
      // Check mobile environment detection
      const mobileIndicator = page.locator('[data-testid="mobile-environment-detected"]');
      await expect(mobileIndicator).toBeVisible();
      
      // Test Android app store links
      await page.click('[data-testid="phantom-mobile-option"]');
      const installButton = page.locator('[data-testid="install-phantom"]');
      
      if (await installButton.isVisible()) {
        await installButton.click();
        // Should redirect to Google Play Store
        expect(page.url()).toContain('play.google.com');
      }
    });

    test('should handle in-app browser detection', async ({ page }) => {
      // Simulate common in-app browsers
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'userAgent', {
          value: 'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/74.0.3729.157 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/]',
          writable: false
        });
      });
      
      await page.goto('/create');
      
      // Should detect in-app browser and show appropriate guidance
      const inAppWarning = page.locator('[data-testid="in-app-browser-warning"]');
      if (await inAppWarning.isVisible()) {
        expect(await inAppWarning.textContent()).toContain('Open in your main browser');
      }
    });
  });

  // Test on iPad Pro (tablet experience)
  test.describe('iPad Pro Safari', () => {
    test.use(mobileDevices.ipadPro);

    test('should provide optimal tablet experience', async ({ page }) => {
      await page.goto('/create');
      
      // Tablet should show desktop-like layout but with touch-friendly elements
      const viewport = page.viewportSize();
      expect(viewport?.width).toBeGreaterThan(768);
      
      // Should still show mobile wallet options but with better spacing
      await page.click('[data-testid="connect-wallet-button"]');
      
      const modal = page.locator('[data-testid="mobile-wallet-modal"]');
      await expect(modal).toBeVisible();
      
      // Check that modal is appropriately sized for tablet
      const modalBox = await modal.boundingBox();
      if (modalBox) {
        expect(modalBox.width).toBeLessThan(viewport!.width * 0.9); // Should not take full width
      }
    });
  });
});

test.describe('Mobile Token Creation Flow', () => {
  test.use(mobileDevices.iphone13);

  test('should complete token creation on mobile', async ({ page }) => {
    await page.goto('/create');
    
    // Fill out token form on mobile
    await page.fill('[data-testid="token-name"]', 'Mobile Test Token');
    await page.fill('[data-testid="token-symbol"]', 'MTT');
    await page.fill('[data-testid="token-supply"]', '1000000');
    
    // Check form validation on mobile
    const submitButton = page.locator('[data-testid="create-token-submit"]');
    const isEnabled = await submitButton.isEnabled();
    
    if (isEnabled) {
      await submitButton.click();
      
      // Should show payment selection
      await expect(page.locator('[data-testid="payment-selector"]')).toBeVisible();
      
      // Test credit payment on mobile
      await page.click('[data-testid="payment-credits"]');
      
      // Should proceed to token creation
      const createButton = page.locator('[data-testid="final-create-token"]');
      if (await createButton.isVisible() && await createButton.isEnabled()) {
        await createButton.click();
        
        // Should show success or wallet connection prompt
        await page.waitForSelector('[data-testid="token-creation-result"]', { timeout: 10000 });
      }
    }
  });

  test('should handle form validation errors gracefully on mobile', async ({ page }) => {
    await page.goto('/create');
    
    // Try to submit with invalid data
    await page.fill('[data-testid="token-name"]', ''); // Empty name
    await page.fill('[data-testid="token-symbol"]', 'TOOLONGSYMBOL'); // Too long symbol
    
    const submitButton = page.locator('[data-testid="create-token-submit"]');
    
    // Should be disabled or show errors
    if (await submitButton.isEnabled()) {
      await submitButton.click();
    }
    
    // Check for error messages
    const errors = page.locator('[data-testid*="error"]');
    const errorCount = await errors.count();
    expect(errorCount).toBeGreaterThan(0);
    
    // Errors should be clearly visible on mobile
    for (let i = 0; i < errorCount; i++) {
      const error = errors.nth(i);
      await expect(error).toBeVisible();
      
      const errorBox = await error.boundingBox();
      if (errorBox) {
        expect(errorBox.height).toBeGreaterThan(20); // Should be readable
      }
    }
  });
});

test.describe('Mobile Performance', () => {
  test.use(mobileDevices.iphone13);

  test('should load quickly on mobile devices', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/create');
    
    // Wait for main content to load
    await page.waitForSelector('[data-testid="token-form"]');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 3 seconds on mobile
    expect(loadTime).toBeLessThan(3000);
  });

  test('should handle network interruptions gracefully', async ({ page }) => {
    await page.goto('/create');
    
    // Simulate network failure
    await page.route('**/*', route => route.abort());
    
    // Try to interact with the form
    await page.fill('[data-testid="token-name"]', 'Test Token');
    
    // Should show appropriate offline messaging
    const offlineIndicator = page.locator('[data-testid="offline-indicator"]');
    if (await offlineIndicator.isVisible()) {
      expect(await offlineIndicator.textContent()).toContain('offline');
    }
    
    // Restore network
    await page.unroute('**/*');
    
    // Should recover gracefully
    await page.reload();
    await expect(page.locator('[data-testid="token-form"]')).toBeVisible();
  });
});

test.describe('Mobile Accessibility', () => {
  test.use(mobileDevices.iphone13);

  test('should be accessible on mobile devices', async ({ page }) => {
    await page.goto('/create');
    
    // Check for proper ARIA labels
    const inputs = page.locator('input');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const ariaLabel = await input.getAttribute('aria-label');
      const label = await input.getAttribute('label');
      
      // Should have proper labeling
      expect(ariaLabel || label).toBeTruthy();
    }
    
    // Check color contrast (basic check)
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const computedStyle = await button.evaluate(el => {
        const style = window.getComputedStyle(el);
        return {
          color: style.color,
          backgroundColor: style.backgroundColor
        };
      });
      
      // Basic contrast check - should not be white on white or black on black
      expect(computedStyle.color).not.toBe(computedStyle.backgroundColor);
    }
  });

  test('should support screen reader navigation', async ({ page }) => {
    await page.goto('/create');
    
    // Check heading structure
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();
    
    expect(headingCount).toBeGreaterThan(0);
    
    // Should have logical heading hierarchy
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1); // Should have exactly one h1
  });
});
