"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { MCPTrackingService } from '@/lib/mcp-tracking-service';

export function MCPAnalyticsProvider() {
  const pathname = usePathname();

  useEffect(() => {
    // Track page view on route change
    MCPTrackingService.trackPageView({
      page: pathname,
      timestamp: Date.now()
    });
  }, [pathname]);

  useEffect(() => {
    // Track session start on initial load
    MCPTrackingService.track({
      event_name: 'session_start',
      event_properties: {
        initial_page: pathname,
        user_agent: navigator.userAgent,
        screen_resolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    });

    // Track performance metrics
    if ('performance' in window) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          if (navigation) {
            MCPTrackingService.trackPerformance('page_load_time', navigation.loadEventEnd - navigation.fetchStart);
            MCPTrackingService.trackPerformance('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.fetchStart);
          }
        }, 100);
      });
    }

    // Track errors
    const handleError = (event: ErrorEvent) => {
      MCPTrackingService.trackError(
        event.message,
        `${event.filename}:${event.lineno}:${event.colno}`
      );
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      MCPTrackingService.trackError(
        event.reason?.toString() || 'Unhandled promise rejection',
        'promise_rejection'
      );
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null;
}
