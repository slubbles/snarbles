'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Smartphone, 
  Wifi, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Target,
  Monitor,
  Battery,
  Network
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SmartWalletModal } from '@/components/SmartWalletModal';
import { mobileAnalytics, type TouchTargetIssue } from '@/lib/mobile-analytics';

interface TestResult {
  status: 'passed' | 'failed';
  result?: any;
  error?: string;
  duration?: number;
  timestamp: string;
}

interface TestResults {
  [key: string]: TestResult;
}

export default function MobileTestingPage() {
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [testResults, setTestResults] = useState<TestResults>({});
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [activeTest, setActiveTest] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Detect device information
    const detectDevice = () => {
      // Get device info from mobile analytics
      const analyticsDeviceInfo = mobileAnalytics.getDeviceInfo();
      
      const info = {
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
          devicePixelRatio: window.devicePixelRatio
        },
        screen: {
          width: window.screen.width,
          height: window.screen.height,
          availWidth: window.screen.availWidth,
          availHeight: window.screen.availHeight
        },
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
        isAndroid: /Android/.test(navigator.userAgent),
        isTablet: /iPad|Android(?=.*Tablet)/.test(navigator.userAgent),
        isInAppBrowser: navigator.userAgent.includes('FB_IAB') || 
                       navigator.userAgent.includes('FBAN') || 
                       navigator.userAgent.includes('Instagram'),
        connection: (navigator as any).connection,
        online: navigator.onLine,
        cookieEnabled: navigator.cookieEnabled,
        language: navigator.language,
        platform: navigator.platform,
        webgl: (() => {
          try {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
          } catch (e) {
            return false;
          }
        })(),
        // Add analytics data
        analyticsDeviceInfo
      };
      
      setDeviceInfo(info);
      
      // Track page visit
      mobileAnalytics.trackMobileError('mobile_test_page_loaded', { 
        url: window.location.href,
        deviceType: analyticsDeviceInfo?.isMobile ? 'mobile' : 'desktop'
      });
    };

    detectDevice();
    
    // Update on resize
    window.addEventListener('resize', detectDevice);
    return () => window.removeEventListener('resize', detectDevice);
  }, []);

  const runTest = async (testName: string, testFunction: () => Promise<any>) => {
    setActiveTest(testName);
    
    try {
      const startTime = Date.now();
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      setTestResults((prev: TestResults) => ({
        ...prev,
        [testName]: {
          status: 'passed',
          result,
          duration,
          timestamp: new Date().toISOString()
        }
      }));
      
      toast({
        title: `✅ ${testName} Passed`,
        description: `Completed in ${duration}ms`,
      });
    } catch (error) {
      setTestResults((prev: TestResults) => ({
        ...prev,
        [testName]: {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      }));
      
      toast({
        title: `❌ ${testName} Failed`,
        description: error instanceof Error ? error.message : 'Test failed',
        variant: "destructive",
      });
    } finally {
      setActiveTest(null);
    }
  };

  const testTouchTargets = async () => {
    return new Promise((resolve) => {
      // Use mobile analytics to validate touch targets
      const issues = mobileAnalytics.validateTouchTargets();
      
      const validCount = issues.filter(issue => issue.valid).length;
      const totalCount = issues.length;
      
      resolve({
        total: totalCount,
        valid: validCount,
        percentage: totalCount > 0 ? (validCount / totalCount) * 100 : 100,
        details: issues.slice(0, 10), // Show first 10 for display
        issues: issues.filter(issue => !issue.valid) // Invalid targets
      });
    });
  };

  const testPageLoad = async () => {
    return new Promise((resolve) => {
      const perfEntries = performance.getEntriesByType('navigation')[0] as any;
      resolve({
        loadTime: perfEntries.loadEventEnd - perfEntries.loadEventStart,
        domContentLoaded: perfEntries.domContentLoadedEventEnd - perfEntries.domContentLoadedEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      });
    });
  };

  const testWalletConnection = async () => {
    return new Promise((resolve) => {
      const startTime = Date.now();
      setIsWalletModalOpen(true);
      
      // Track wallet connection attempt
      mobileAnalytics.trackWalletConnection({
        wallet: 'phantom', // This is a test
        connectionMethod: 'browser',
        connectionTime: 0,
        success: true,
        retryCount: 0,
        deviceInfo: mobileAnalytics.getDeviceInfo() || {}
      });
      
      // Simulate wallet connection test
      setTimeout(() => {
        const connectionTime = Date.now() - startTime;
        resolve({
          modalOpened: true,
          responsive: window.innerWidth <= 768,
          connectionTime,
          timestamp: Date.now()
        });
      }, 1000);
    });
  };

  const testFormInteraction = async () => {
    return new Promise((resolve) => {
      // Create test form elements
      const input = document.createElement('input');
      input.style.position = 'absolute';
      input.style.left = '-9999px';
      input.type = 'text';
      document.body.appendChild(input);
      
      // Test focus and input
      input.focus();
      input.value = 'test';
      
      const canFocus = document.activeElement === input;
      const canInput = input.value === 'test';
      
      document.body.removeChild(input);
      
      resolve({
        canFocus,
        canInput,
        touchKeyboard: deviceInfo?.isMobile && canFocus
      });
    });
  };

  const testNetwork = async () => {
    return new Promise(async (resolve) => {
      try {
        const startTime = Date.now();
        const response = await fetch('/api/health', { method: 'HEAD' });
        const responseTime = Date.now() - startTime;
        
        resolve({
          online: navigator.onLine,
          responseTime,
          status: response.status,
          connection: (navigator as any).connection?.effectiveType || 'unknown'
        });
      } catch (error) {
        resolve({
          online: false,
          error: error instanceof Error ? error.message : 'Network error'
        });
      }
    });
  };

  const getDeviceCategory = () => {
    if (!deviceInfo) return 'Unknown';
    
    if (deviceInfo.isTablet) return 'Tablet';
    if (deviceInfo.isMobile) return 'Mobile';
    return 'Desktop';
  };

  const getConnectionStatus = () => {
    if (!deviceInfo) return 'Unknown';
    
    const conn = deviceInfo.connection;
    if (!conn) return 'Unknown';
    
    return {
      type: conn.effectiveType || 'unknown',
      downlink: conn.downlink || 0,
      rtt: conn.rtt || 0
    };
  };

  return (
    <div className="min-h-screen bg-background p-4" data-testid="mobile-testing-page">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">📱 Mobile UX Testing</h1>
          <p className="text-muted-foreground">Comprehensive mobile testing for Snarbles platform</p>
        </div>

        {/* Device Information */}
        <Card data-testid="device-info">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Device Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deviceInfo && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="space-y-2">
                    <div><strong>Category:</strong> {getDeviceCategory()}</div>
                    <div><strong>Platform:</strong> {deviceInfo.platform}</div>
                    <div><strong>Language:</strong> {deviceInfo.language}</div>
                    <div><strong>Online:</strong> {deviceInfo.online ? '✅' : '❌'}</div>
                  </div>
                  
                  <div className="mt-4">
                    <strong>Viewport:</strong>
                    <div className="text-xs text-muted-foreground">
                      {deviceInfo.viewport.width} × {deviceInfo.viewport.height}
                      (DPR: {deviceInfo.viewport.devicePixelRatio})
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="space-y-2">
                    <div><strong>iOS:</strong> {deviceInfo.isIOS ? '✅' : '❌'}</div>
                    <div><strong>Android:</strong> {deviceInfo.isAndroid ? '✅' : '❌'}</div>
                    <div><strong>Tablet:</strong> {deviceInfo.isTablet ? '✅' : '❌'}</div>
                    <div><strong>In-App Browser:</strong> {deviceInfo.isInAppBrowser ? '⚠️' : '✅'}</div>
                  </div>
                  
                  <div className="mt-4">
                    <strong>Connection:</strong>
                    <div className="text-xs text-muted-foreground">
                      {JSON.stringify(getConnectionStatus(), null, 2)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Suite */}
        <Card data-testid="test-suite">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Mobile Test Suite
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Touch Target Test */}
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Touch Targets
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Test that all interactive elements meet 44px minimum size
                </p>
                <Button 
                  onClick={() => runTest('touch-targets', testTouchTargets)}
                  disabled={activeTest === 'touch-targets'}
                  className="w-full"
                  data-testid="test-touch-targets"
                >
                  {activeTest === 'touch-targets' ? 'Testing...' : 'Test Touch Targets'}
                </Button>
                {testResults['touch-targets'] && (
                  <div className="mt-2 text-xs">
                    <Badge variant={testResults['touch-targets'].status === 'passed' ? 'default' : 'destructive'}>
                      {testResults['touch-targets'].status}
                    </Badge>
                    {testResults['touch-targets'].result && (
                      <div className="mt-1">
                        {testResults['touch-targets'].result.valid}/{testResults['touch-targets'].result.total} valid 
                        ({testResults['touch-targets'].result.percentage.toFixed(1)}%)
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Page Load Test */}
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Page Performance
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Test page load times and performance metrics
                </p>
                <Button 
                  onClick={() => runTest('page-load', testPageLoad)}
                  disabled={activeTest === 'page-load'}
                  className="w-full"
                  data-testid="test-page-performance"
                >
                  {activeTest === 'page-load' ? 'Testing...' : 'Test Performance'}
                </Button>
                {testResults['page-load'] && (
                  <div className="mt-2 text-xs">
                    <Badge variant={testResults['page-load'].status === 'passed' ? 'default' : 'destructive'}>
                      {testResults['page-load'].status}
                    </Badge>
                    {testResults['page-load'].result && (
                      <div className="mt-1">
                        Load: {testResults['page-load'].result.loadTime.toFixed(0)}ms
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Wallet Connection Test */}
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Wifi className="w-4 h-4" />
                  Wallet Connection
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Test mobile wallet connection modal and flow
                </p>
                <Button 
                  onClick={() => runTest('wallet-connection', testWalletConnection)}
                  disabled={activeTest === 'wallet-connection'}
                  className="w-full"
                  data-testid="test-wallet-connection"
                >
                  {activeTest === 'wallet-connection' ? 'Testing...' : 'Test Wallet Modal'}
                </Button>
                {testResults['wallet-connection'] && (
                  <div className="mt-2 text-xs">
                    <Badge variant={testResults['wallet-connection'].status === 'passed' ? 'default' : 'destructive'}>
                      {testResults['wallet-connection'].status}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Form Interaction Test */}
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Monitor className="w-4 h-4" />
                  Form Interaction
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Test form inputs and mobile keyboard interaction
                </p>
                <Button 
                  onClick={() => runTest('form-interaction', testFormInteraction)}
                  disabled={activeTest === 'form-interaction'}
                  className="w-full"
                  data-testid="test-form-interaction"
                >
                  {activeTest === 'form-interaction' ? 'Testing...' : 'Test Form Input'}
                </Button>
                {testResults['form-interaction'] && (
                  <div className="mt-2 text-xs">
                    <Badge variant={testResults['form-interaction'].status === 'passed' ? 'default' : 'destructive'}>
                      {testResults['form-interaction'].status}
                    </Badge>
                    {testResults['form-interaction'].result && (
                      <div className="mt-1">
                        Focus: {testResults['form-interaction'].result.canFocus ? '✅' : '❌'}
                        Input: {testResults['form-interaction'].result.canInput ? '✅' : '❌'}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Network Test */}
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Network className="w-4 h-4" />
                  Network Connection
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Test network connectivity and response times
                </p>
                <Button 
                  onClick={() => runTest('network', testNetwork)}
                  disabled={activeTest === 'network'}
                  className="w-full"
                  data-testid="test-network"
                >
                  {activeTest === 'network' ? 'Testing...' : 'Test Network'}
                </Button>
                {testResults['network'] && (
                  <div className="mt-2 text-xs">
                    <Badge variant={testResults['network'].status === 'passed' ? 'default' : 'destructive'}>
                      {testResults['network'].status}
                    </Badge>
                    {testResults['network'].result && (
                      <div className="mt-1">
                        Response: {testResults['network'].result.responseTime}ms
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Manual Test Instructions */}
              <div className="p-4 border rounded-lg md:col-span-2">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Manual Testing Checklist
                </h3>
                <div className="space-y-2 text-sm">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" data-testid="manual-scroll" />
                    Smooth scrolling without horizontal overflow
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" data-testid="manual-tap" />
                    All buttons are easily tappable with thumb
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" data-testid="manual-keyboard" />
                    Mobile keyboard appears for text inputs
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" data-testid="manual-orientation" />
                    Layout works in both portrait and landscape
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" data-testid="manual-wallet" />
                    Wallet deep links work (if wallet apps installed)
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Results Summary */}
        {Object.keys(testResults).length > 0 && (
          <Card data-testid="test-results">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Test Results Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(testResults).map(([testName, result]: [string, TestResult]) => (
                  <div key={testName} className="flex items-center justify-between p-2 border rounded">
                    <span className="font-medium">{testName}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant={result.status === 'passed' ? 'default' : 'destructive'}>
                        {result.status}
                      </Badge>
                      {result.duration && (
                        <span className="text-xs text-muted-foreground">
                          {result.duration}ms
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Warning for In-App Browsers */}
        {deviceInfo?.isInAppBrowser && (
          <Alert data-testid="in-app-browser-warning">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              <strong>In-App Browser Detected:</strong> Some wallet features may be limited. 
              For best results, open this page in your main browser app.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Smart Wallet Modal */}
      <SmartWalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />
    </div>
  );
}
