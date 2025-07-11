/**
 * Comprehensive Monitoring and Analytics System
 * For error tracking, performance monitoring, and user analytics
 */

// Types for monitoring events
export interface ErrorEvent {
  error: Error;
  context?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  metadata?: Record<string, any>;
}

export interface UserEvent {
  event: string;
  userId?: string;
  properties?: Record<string, any>;
}

// Error tracking system
export class ErrorTracker {
  private static instance: ErrorTracker;

  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  // Track errors with context
  trackError(event: ErrorEvent): void {
    try {
      console.error('🚨 Error tracked:', {
        message: event.error.message,
        stack: event.error.stack,
        context: event.context,
        userId: event.userId,
        metadata: event.metadata,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });

      // Store in localStorage for later analysis
      this.storeErrorLocally(event);

      // Send to external service if configured
      this.sendToExternalService(event);
    } catch (err) {
      console.warn('Failed to track error:', err);
    }
  }

  private storeErrorLocally(event: ErrorEvent): void {
    try {
      const errors = JSON.parse(localStorage.getItem('snarbles_errors') || '[]');
      errors.push({
        ...event,
        error: {
          message: event.error.message,
          stack: event.error.stack,
          name: event.error.name
        },
        timestamp: Date.now()
      });

      // Keep only last 50 errors
      if (errors.length > 50) {
        errors.splice(0, errors.length - 50);
      }

      localStorage.setItem('snarbles_errors', JSON.stringify(errors));
    } catch (err) {
      console.warn('Failed to store error locally:', err);
    }
  }

  private sendToExternalService(event: ErrorEvent): void {
    // Placeholder for external service integration (Sentry, LogRocket, etc.)
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      // Sentry integration would go here
      console.log('📤 Sending error to Sentry...');
    }
  }

  // Get stored errors for analysis
  getStoredErrors(): any[] {
    try {
      return JSON.parse(localStorage.getItem('snarbles_errors') || '[]');
    } catch {
      return [];
    }
  }

  // Clear stored errors
  clearStoredErrors(): void {
    localStorage.removeItem('snarbles_errors');
  }
}

// Performance monitoring system
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Track performance metrics
  trackMetric(metric: PerformanceMetric): void {
    try {
      console.log('📊 Performance metric:', {
        ...metric,
        timestamp: Date.now()
      });

      // Store metrics locally
      this.storeMetricLocally(metric);
    } catch (err) {
      console.warn('Failed to track performance metric:', err);
    }
  }

  private storeMetricLocally(metric: PerformanceMetric): void {
    try {
      const metrics = JSON.parse(localStorage.getItem('snarbles_metrics') || '[]');
      metrics.push({
        ...metric,
        timestamp: Date.now()
      });

      // Keep only last 100 metrics
      if (metrics.length > 100) {
        metrics.splice(0, metrics.length - 100);
      }

      localStorage.setItem('snarbles_metrics', JSON.stringify(metrics));
    } catch (err) {
      console.warn('Failed to store metric locally:', err);
    }
  }

  // Track page load performance
  trackPageLoad(pageName: string): void {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const loadTime = performance.now();
      this.trackMetric({
        name: 'page_load_time',
        value: loadTime,
        metadata: { page: pageName }
      });
    }
  }

  // Track wallet connection time
  trackWalletConnection(network: string, connectionTime: number): void {
    this.trackMetric({
      name: 'wallet_connection_time',
      value: connectionTime,
      metadata: { network }
    });
  }

  // Track token creation performance
  trackTokenCreation(network: string, creationTime: number, success: boolean): void {
    this.trackMetric({
      name: 'token_creation_time',
      value: creationTime,
      metadata: { network, success }
    });
  }
}

// User analytics system
export class UserAnalytics {
  private static instance: UserAnalytics;

  static getInstance(): UserAnalytics {
    if (!UserAnalytics.instance) {
      UserAnalytics.instance = new UserAnalytics();
    }
    return UserAnalytics.instance;
  }

  // Track user events
  trackEvent(event: UserEvent): void {
    try {
      console.log('📈 User event:', {
        ...event,
        timestamp: Date.now(),
        sessionId: this.getSessionId(),
        url: window.location.href
      });

      // Store events locally
      this.storeEventLocally(event);

      // Send to analytics service
      this.sendToAnalyticsService(event);
    } catch (err) {
      console.warn('Failed to track user event:', err);
    }
  }

  private storeEventLocally(event: UserEvent): void {
    try {
      const events = JSON.parse(localStorage.getItem('snarbles_events') || '[]');
      events.push({
        ...event,
        timestamp: Date.now(),
        sessionId: this.getSessionId()
      });

      // Keep only last 200 events
      if (events.length > 200) {
        events.splice(0, events.length - 200);
      }

      localStorage.setItem('snarbles_events', JSON.stringify(events));
    } catch (err) {
      console.warn('Failed to store event locally:', err);
    }
  }

  private sendToAnalyticsService(event: UserEvent): void {
    // Placeholder for analytics service integration (Google Analytics, Mixpanel, etc.)
    if (process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID) {
      // Google Analytics integration would go here
      console.log('📤 Sending event to Google Analytics...');
    }
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('snarbles_session_id');
    if (!sessionId) {
      sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('snarbles_session_id', sessionId);
    }
    return sessionId;
  }

  // Track page views
  trackPageView(path: string): void {
    this.trackEvent({
      event: 'page_view',
      properties: { path }
    });
  }

  // Track wallet connections
  trackWalletConnect(network: string, walletName: string): void {
    this.trackEvent({
      event: 'wallet_connect',
      properties: { network, walletName }
    });
  }

  // Track token creation
  trackTokenCreate(network: string, tokenData: any): void {
    this.trackEvent({
      event: 'token_create',
      properties: { 
        network,
        hasLogo: !!tokenData.logoUrl,
        hasWebsite: !!tokenData.website,
        mintable: tokenData.mintable,
        burnable: tokenData.burnable,
        pausable: tokenData.pausable
      }
    });
  }
}

// Global error handler
export function setupGlobalErrorHandling(): void {
  if (typeof window !== 'undefined') {
    const errorTracker = ErrorTracker.getInstance();

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      errorTracker.trackError({
        error: new Error(`Unhandled Promise Rejection: ${event.reason}`),
        context: 'unhandled_promise_rejection',
        metadata: { reason: event.reason }
      });
    });

    // Handle JavaScript errors
    window.addEventListener('error', (event) => {
      errorTracker.trackError({
        error: event.error || new Error(event.message),
        context: 'javascript_error',
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    });
  }
}

// Singleton instances
export const errorTracker = ErrorTracker.getInstance();
export const performanceMonitor = PerformanceMonitor.getInstance();
export const userAnalytics = UserAnalytics.getInstance(); 