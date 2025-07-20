import { defineConfig, devices } from '@playwright/test';

/**
 * Mobile testing configuration for Snarbles Token Platform
 * Tests mobile wallet flows, responsive design, and touch interactions
 */
export default defineConfig({
  testDir: './tests/mobile',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'test-results/mobile-html' }],
    ['json', { outputFile: 'test-results/mobile-results.json' }],
    ['list']
  ],
  
  /* Shared settings for all the projects below. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',
    
    /* Collect trace when retrying the failed test. */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Video recording for debugging */
    video: 'retain-on-failure'
  },

  /* Configure projects for major mobile devices */
  projects: [
    {
      name: 'iPhone 13',
      use: { 
        ...devices['iPhone 13'],
        // Override with specific test settings
        viewport: { width: 390, height: 844 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true
      },
    },
    
    {
      name: 'iPhone 13 Mini',
      use: { 
        ...devices['iPhone 13 Mini'],
        viewport: { width: 375, height: 812 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
      },
    },

    {
      name: 'iPhone 13 Pro Max',
      use: { 
        ...devices['iPhone 13 Pro Max'],
        viewport: { width: 428, height: 926 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
      },
    },

    {
      name: 'Galaxy S21',
      use: { 
        ...devices['Galaxy S21'],
        viewport: { width: 384, height: 854 },
        userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
      },
    },

    {
      name: 'Galaxy S21 Ultra',
      use: { 
        ...devices['Galaxy S21 Ultra'],
        viewport: { width: 412, height: 915 },
        userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
      },
    },

    {
      name: 'Pixel 6',
      use: { 
        ...devices['Pixel 6'],
        viewport: { width: 412, height: 915 },
        userAgent: 'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
      },
    },

    {
      name: 'iPad Pro',
      use: { 
        ...devices['iPad Pro'],
        viewport: { width: 1024, height: 1366 },
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
      },
    },

    {
      name: 'iPad Air',
      use: { 
        ...devices['iPad Air'],
        viewport: { width: 820, height: 1180 },
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
      },
    },

    // In-app browser testing
    {
      name: 'Instagram In-App Browser (iOS)',
      use: {
        ...devices['iPhone 13'],
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 219.0.0.12.117 (iPhone13,2; iOS 15_0; en_US; en-US; scale=3.00; 1170x2532; 331434178) [FBAN/MessengerForiOS;FBAV/]',
      },
    },

    {
      name: 'Facebook In-App Browser (Android)',  
      use: {
        ...devices['Galaxy S21'],
        userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/91.0.4472.120 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/]',
      },
    },

    {
      name: 'Twitter In-App Browser (iOS)',
      use: {
        ...devices['iPhone 13'],
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 TwitterAndroidβ',
      },
    },

    // Small screen devices
    {
      name: 'Small Android (320px)',
      use: {
        viewport: { width: 320, height: 568 },
        userAgent: 'Mozilla/5.0 (Linux; Android 9; SM-A102U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.93 Mobile Safari/537.36',
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true
      },
    }
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes
  },

  /* Test timeout settings */
  timeout: 30 * 1000, // 30 seconds per test
  expect: {
    timeout: 10 * 1000, // 10 seconds for assertions
  },

  /* Global test setup */
  globalSetup: require.resolve('./tests/mobile/global-setup.ts'),
  globalTeardown: require.resolve('./tests/mobile/global-teardown.ts'),
});
