// Mobile Analytics and Performance Tracking for Snarbles
// Tracks mobile-specific metrics and user behavior

interface DeviceInfo {
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isTablet: boolean;
  isInAppBrowser: boolean;
  viewport: {
    width: number;
    height: number;
    devicePixelRatio: number;
  };
  connection?: {
    effectiveType: string;
    downlink: number;
    rtt: number;
  };
  userAgent: string;
  platform: string;
}

interface MobilePerformanceMetrics {
  pageLoadTime: number;
  domContentLoaded: number;
  firstPaint: number;
  firstContentfulPaint: number;
  touchResponseTime?: number;
  walletConnectionTime?: number;
  networkLatency?: number;
}

interface TouchTargetIssue {
  element: string;
  size: number;
  minSize: number;
  valid: boolean;
  position: { x: number; y: number };
}

interface MobileWalletMetrics {
  wallet: 'phantom' | 'pera';
  connectionMethod: 'deeplink' | 'qr' | 'browser';
  connectionTime: number;
  success: boolean;
  errorType?: string;
  retryCount: number;
  deviceInfo: Partial<DeviceInfo>;
}

class MobileAnalytics {
  private deviceInfo: DeviceInfo | null = null;
  private sessionId: string;
  private startTime: number;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    
    // Only run browser-specific code on client side
    if (typeof window !== 'undefined') {
      this.detectDevice();
      this.setupPerformanceMonitoring();
    }
  }

  private generateSessionId(): string {
    return 'mobile_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private detectDevice(): void {
    // Only run on client side
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return;
    }

    try {
      this.deviceInfo = {
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
        isAndroid: /Android/.test(navigator.userAgent),
        isTablet: /iPad|Android(?=.*Tablet)/.test(navigator.userAgent),
        isInAppBrowser: navigator.userAgent.includes('FB_IAB') || 
                       navigator.userAgent.includes('FBAN') || 
                       navigator.userAgent.includes('Instagram') ||
                       navigator.userAgent.includes('Twitter') ||
                       navigator.userAgent.includes('TikTok'),
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
          devicePixelRatio: window.devicePixelRatio
        },
        connection: (navigator as any).connection,
        userAgent: navigator.userAgent,
        platform: navigator.platform
      };
    } catch (error) {
      console.error('Device detection failed:', error);
      this.deviceInfo = null;
    }
  }

  private setupPerformanceMonitoring(): void {
    // Only run on client side
    if (typeof window === 'undefined') return;

    try {
      // Monitor page performance
      if ('performance' in window) {
        window.addEventListener('load', () => {
          setTimeout(() => {
            this.trackPagePerformance();
          }, 100);
        });
      }

      // Monitor touch interactions - only if we have device info and document exists
      if (this.deviceInfo?.isMobile && typeof document !== 'undefined') {
        document.addEventListener('touchstart', this.trackTouchInteraction.bind(this), { passive: true });
        document.addEventListener('touchend', this.trackTouchInteraction.bind(this), { passive: true });
      }

      // Monitor viewport changes (orientation, etc.)
      window.addEventListener('resize', () => {
        this.trackViewportChange();
      });

      // Monitor network changes
      if (typeof navigator !== 'undefined' && (navigator as any).connection) {
        (navigator as any).connection.addEventListener('change', () => {
          this.trackNetworkChange();
        });
      }
    } catch (error) {
      console.error('Performance monitoring setup failed:', error);
    }
  }

  // Track page performance metrics
  trackPagePerformance(): void {
    // Only run on client side
    if (typeof window === 'undefined' || typeof performance === 'undefined') {
      return;
    }

    try {
      const perfEntries = performance.getEntriesByType('navigation')[0] as any;
      const paintEntries = performance.getEntriesByType('paint');
      
      const metrics: MobilePerformanceMetrics = {
        pageLoadTime: perfEntries?.loadEventEnd - perfEntries?.loadEventStart || 0,
        domContentLoaded: perfEntries?.domContentLoadedEventEnd - perfEntries?.domContentLoadedEventStart || 0,
        firstPaint: paintEntries.find(entry => entry.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0
      };

      this.sendAnalytics('mobile_performance', {
        metrics,
        deviceInfo: this.deviceInfo,
        sessionId: this.sessionId,
        timestamp: Date.now()
      });

      // Send to service worker for caching
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'MOBILE_PERFORMANCE',
          metrics,
          userAgent: navigator.userAgent
        });
      }
    } catch (error) {
      console.error('Failed to track mobile performance:', error);
    }
  }

  // Track mobile wallet connection attempts
  trackWalletConnection(metrics: MobileWalletMetrics): void {
    this.sendAnalytics('mobile_wallet_connection', {
      ...metrics,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      deviceInfo: this.deviceInfo
    });
  }

  // Track touch target validation
  trackTouchTargets(issues: TouchTargetIssue[]): void {
    const summary = {
      totalTargets: issues.length,
      validTargets: issues.filter(issue => issue.valid).length,
      invalidTargets: issues.filter(issue => !issue.valid),
      averageSize: issues.reduce((sum, issue) => sum + issue.size, 0) / issues.length
    };

    this.sendAnalytics('mobile_touch_targets', {
      summary,
      issues: issues.filter(issue => !issue.valid), // Only send problematic targets
      sessionId: this.sessionId,
      timestamp: Date.now(),
      deviceInfo: this.deviceInfo
    });
  }

  // Track mobile-specific errors
  trackMobileError(error: string, context: Record<string, any>): void {
    this.sendAnalytics('mobile_error', {
      error,
      context,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      deviceInfo: this.deviceInfo,
      url: window.location.href
    });
  }

  // Track touch interactions and response times
  private touchStartTime: number = 0;
  
  private trackTouchInteraction(event: TouchEvent): void {
    if (event.type === 'touchstart') {
      this.touchStartTime = Date.now();
    } else if (event.type === 'touchend' && this.touchStartTime) {
      const responseTime = Date.now() - this.touchStartTime;
      
      if (responseTime > 100) { // Track slow responses
        this.sendAnalytics('mobile_touch_performance', {
          responseTime,
          target: (event.target as Element)?.tagName || 'unknown',
          sessionId: this.sessionId,
          timestamp: Date.now()
        });
      }
    }
  }

  // Track viewport changes (orientation, size)
  private trackViewportChange(): void {
    if (this.deviceInfo) {
      const newViewport = {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio
      };

      this.sendAnalytics('mobile_viewport_change', {
        oldViewport: this.deviceInfo.viewport,
        newViewport,
        sessionId: this.sessionId,
        timestamp: Date.now()
      });

      this.deviceInfo.viewport = newViewport;
    }
  }

  // Track network changes
  private trackNetworkChange(): void {
    const connection = (navigator as any).connection;
    
    this.sendAnalytics('mobile_network_change', {
      connection: {
        effectiveType: connection?.effectiveType,
        downlink: connection?.downlink,
        rtt: connection?.rtt
      },
      sessionId: this.sessionId,
      timestamp: Date.now()
    });
  }

  // Validate touch targets on the current page
  validateTouchTargets(): TouchTargetIssue[] {
    // Only run on client side
    if (typeof document === 'undefined') {
      return [];
    }

    try {
      const interactiveElements = document.querySelectorAll(
        'button, a, input, select, textarea, [role="button"], [tabindex="0"]'
      );

      const issues: TouchTargetIssue[] = [];

      interactiveElements.forEach((element, index) => {
        const rect = element.getBoundingClientRect();
        const minSize = Math.min(rect.width, rect.height);
        
        issues.push({
          element: `${element.tagName}${element.id ? '#' + element.id : ''}${element.className ? '.' + element.className.split(' ')[0] : ''}`,
          size: minSize,
          minSize: 44,
          valid: minSize >= 44,
          position: { x: rect.left, y: rect.top }
        });
      });

      this.trackTouchTargets(issues);
      return issues;
    } catch (error) {
      console.error('Touch target validation failed:', error);
      return [];
    }
  }

  // Send analytics data
  private sendAnalytics(event: string, data: any): void {
    try {
      // In a real app, this would send to your analytics service
      console.log(`📱 Mobile Analytics [${event}]:`, data);
      
      // Store locally for development
      const analyticsData = {
        event,
        data,
        timestamp: Date.now()
      };
      
      const stored = localStorage.getItem('snarbles_mobile_analytics') || '[]';
      const analytics = JSON.parse(stored);
      analytics.push(analyticsData);
      
      // Keep only last 100 events
      if (analytics.length > 100) {
        analytics.splice(0, analytics.length - 100);
      }
      
      localStorage.setItem('snarbles_mobile_analytics', JSON.stringify(analytics));
    } catch (error) {
      console.error('Failed to send mobile analytics:', error);
    }
  }

  // Get stored analytics data
  getAnalyticsData(): any[] {
    try {
      const stored = localStorage.getItem('snarbles_mobile_analytics') || '[]';
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to get analytics data:', error);
      return [];
    }
  }

  // Clear analytics data
  clearAnalyticsData(): void {
    localStorage.removeItem('snarbles_mobile_analytics');
  }

  // Get current device info
  getDeviceInfo(): DeviceInfo | null {
    return this.deviceInfo;
  }

  // Get session summary
  getSessionSummary(): any {
    const sessionDuration = Date.now() - this.startTime;
    const analytics = this.getAnalyticsData();
    const sessionEvents = analytics.filter(a => a.data.sessionId === this.sessionId);
    
    return {
      sessionId: this.sessionId,
      duration: sessionDuration,
      events: sessionEvents.length,
      errors: sessionEvents.filter(e => e.event === 'mobile_error').length,
      walletConnections: sessionEvents.filter(e => e.event === 'mobile_wallet_connection').length,
      deviceInfo: this.deviceInfo
    };
  }
}

// Export singleton instance
export const mobileAnalytics = new MobileAnalytics();

// Export types for use in components
export type {
  DeviceInfo,
  MobilePerformanceMetrics,
  TouchTargetIssue,
  MobileWalletMetrics
};
