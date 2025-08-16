import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface AnalyticsEvent {
  event_name: string;
  wallet_address?: string;
  user_id?: string;
  event_properties?: Record<string, any>;
  session_id?: string;
  user_agent?: string;
  page_url?: string;
  referrer?: string;
}

export class MCPTrackingService {
  private static sessionId: string | null = null;
  
  static {
    // Initialize session ID
    if (typeof window !== 'undefined') {
      this.sessionId = sessionStorage.getItem('snarbles_session_id') || this.generateSessionId();
      sessionStorage.setItem('snarbles_session_id', this.sessionId);
    }
  }

  /**
   * Track user events with enhanced context for MCP analysis
   */
  static async track(event: AnalyticsEvent): Promise<void> {
    try {
      const enhancedEvent = {
        ...event,
        session_id: this.sessionId,
        user_agent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
        page_url: typeof window !== 'undefined' ? window.location.href : undefined,
        referrer: typeof window !== 'undefined' ? document.referrer : undefined,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('analytics_events')
        .insert([enhancedEvent]);

      if (error) {
        console.error('Analytics tracking error:', error);
      }
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  /**
   * Track page views with automatic metadata
   */
  static trackPageView(additionalData?: Record<string, any>): void {
    if (typeof window === 'undefined') return;

    this.track({
      event_name: 'page_view',
      event_properties: {
        page: window.location.pathname,
        title: document.title,
        ...additionalData
      }
    });
  }

  /**
   * Track wallet connection events
   */
  static trackWalletConnection(walletAddress: string, walletType: string, network: string): void {
    this.track({
      event_name: 'wallet_connected',
      wallet_address: walletAddress,
      event_properties: {
        wallet_type: walletType,
        network: network,
        timestamp: Date.now()
      }
    });
  }

  /**
   * Track token creation journey
   */
  static trackTokenCreationStart(walletAddress: string, network: string): void {
    this.track({
      event_name: 'token_creation_started',
      wallet_address: walletAddress,
      event_properties: {
        network: network,
        step: 'form_start'
      }
    });
  }

  static trackTokenCreationStep(walletAddress: string, step: string, data?: Record<string, any>): void {
    this.track({
      event_name: 'token_creation_step',
      wallet_address: walletAddress,
      event_properties: {
        step: step,
        ...data
      }
    });
  }

  static trackTokenCreationSuccess(
    walletAddress: string, 
    tokenAddress: string, 
    network: string,
    tokenData: any
  ): void {
    this.track({
      event_name: 'token_created',
      wallet_address: walletAddress,
      event_properties: {
        token_address: tokenAddress,
        network: network,
        token_name: tokenData.name,
        token_symbol: tokenData.symbol,
        supply: tokenData.supply,
        features: tokenData.features || [],
        creation_time: Date.now()
      }
    });
  }

  static trackTokenCreationError(walletAddress: string, error: string, step: string): void {
    this.track({
      event_name: 'token_creation_error',
      wallet_address: walletAddress,
      event_properties: {
        error_message: error,
        failed_step: step,
        timestamp: Date.now()
      }
    });
  }

  /**
   * Track payment and credit events
   */
  static trackCreditPurchase(walletAddress: string, amount: number, method: string): void {
    this.track({
      event_name: 'credit_purchased',
      wallet_address: walletAddress,
      event_properties: {
        amount: amount,
        payment_method: method,
        timestamp: Date.now()
      }
    });
  }

  static trackCreditUsage(walletAddress: string, amount: number, purpose: string): void {
    this.track({
      event_name: 'credit_used',
      wallet_address: walletAddress,
      event_properties: {
        amount: amount,
        purpose: purpose,
        timestamp: Date.now()
      }
    });
  }

  /**
   * Track user engagement and feature usage
   */
  static trackFeatureUsage(feature: string, walletAddress?: string, data?: Record<string, any>): void {
    this.track({
      event_name: 'feature_used',
      wallet_address: walletAddress,
      event_properties: {
        feature_name: feature,
        ...data
      }
    });
  }

  static trackDashboardView(walletAddress: string, section: string): void {
    this.track({
      event_name: 'dashboard_view',
      wallet_address: walletAddress,
      event_properties: {
        section: section
      }
    });
  }

  static trackTokenVerification(tokenAddress: string, result: any): void {
    this.track({
      event_name: 'token_verified',
      event_properties: {
        token_address: tokenAddress,
        verification_result: result,
        timestamp: Date.now()
      }
    });
  }

  /**
   * Track user journey and flow analysis
   */
  static trackUserFlow(fromPage: string, toPage: string, walletAddress?: string): void {
    this.track({
      event_name: 'user_flow',
      wallet_address: walletAddress,
      event_properties: {
        from_page: fromPage,
        to_page: toPage,
        flow_time: Date.now()
      }
    });
  }

  static trackFormInteraction(formName: string, action: string, data?: Record<string, any>): void {
    this.track({
      event_name: 'form_interaction',
      event_properties: {
        form_name: formName,
        action: action, // 'start', 'field_change', 'submit', 'abandon'
        ...data
      }
    });
  }

  /**
   * Track errors and performance issues
   */
  static trackError(error: string, context: string, walletAddress?: string): void {
    this.track({
      event_name: 'error_occurred',
      wallet_address: walletAddress,
      event_properties: {
        error_message: error,
        error_context: context,
        timestamp: Date.now(),
        user_agent: typeof window !== 'undefined' ? navigator.userAgent : undefined
      }
    });
  }

  static trackPerformance(metric: string, value: number, context?: string): void {
    this.track({
      event_name: 'performance_metric',
      event_properties: {
        metric_name: metric,
        metric_value: value,
        context: context,
        timestamp: Date.now()
      }
    });
  }

  /**
   * Track business metrics
   */
  static trackConversion(conversionType: string, walletAddress?: string, value?: number): void {
    this.track({
      event_name: 'conversion',
      wallet_address: walletAddress,
      event_properties: {
        conversion_type: conversionType,
        conversion_value: value,
        timestamp: Date.now()
      }
    });
  }

  static trackRetention(walletAddress: string, daysSinceFirstVisit: number): void {
    this.track({
      event_name: 'user_retention',
      wallet_address: walletAddress,
      event_properties: {
        days_since_first_visit: daysSinceFirstVisit,
        is_returning_user: daysSinceFirstVisit > 0
      }
    });
  }

  /**
   * Track A/B tests and experiments
   */
  static trackExperiment(experimentName: string, variant: string, walletAddress?: string): void {
    this.track({
      event_name: 'experiment_exposure',
      wallet_address: walletAddress,
      event_properties: {
        experiment_name: experimentName,
        variant: variant,
        timestamp: Date.now()
      }
    });
  }

  /**
   * Batch tracking for high-frequency events
   */
  private static eventQueue: AnalyticsEvent[] = [];
  private static flushTimer: NodeJS.Timeout | null = null;

  static trackBatch(event: AnalyticsEvent): void {
    this.eventQueue.push(event);

    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
    }

    this.flushTimer = setTimeout(() => {
      this.flushEvents();
    }, 5000); // Flush every 5 seconds

    // Flush immediately if queue gets too large
    if (this.eventQueue.length >= 10) {
      this.flushEvents();
    }
  }

  private static async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const eventsToFlush = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const enhancedEvents = eventsToFlush.map(event => ({
        ...event,
        session_id: this.sessionId,
        user_agent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
        page_url: typeof window !== 'undefined' ? window.location.href : undefined,
        referrer: typeof window !== 'undefined' ? document.referrer : undefined,
        created_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('analytics_events')
        .insert(enhancedEvents);

      if (error) {
        console.error('Batch analytics tracking error:', error);
        // Re-queue failed events
        this.eventQueue.unshift(...eventsToFlush);
      }
    } catch (error) {
      console.error('Failed to flush analytics events:', error);
      // Re-queue failed events
      this.eventQueue.unshift(...eventsToFlush);
    }
  }

  /**
   * Real-time analytics for immediate insights
   */
  static async getRealtimeMetrics(): Promise<any> {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('analytics_events')
        .select('*')
        .gte('created_at', oneHourAgo)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        totalEvents: data.length,
        uniqueUsers: new Set(data.map(e => e.wallet_address).filter(Boolean)).size,
        topEvents: this.getTopEvents(data),
        recentActivity: data.slice(0, 10)
      };
    } catch (error) {
      console.error('Failed to get realtime metrics:', error);
      return null;
    }
  }

  private static getTopEvents(events: any[]): Array<{ event: string; count: number }> {
    const eventCounts = events.reduce((acc, event) => {
      acc[event.event_name] = (acc[event.event_name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(eventCounts)
      .map(([event, count]) => ({ event, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup and utility methods
   */
  static clearSession(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('snarbles_session_id');
      this.sessionId = this.generateSessionId();
      sessionStorage.setItem('snarbles_session_id', this.sessionId);
    }
  }

  static getSessionId(): string | null {
    return this.sessionId;
  }

  // Ensure events are flushed before page unload
  static {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        if (this.eventQueue.length > 0) {
          // Send events synchronously for page unload
          const eventsToFlush = [...this.eventQueue];
          this.eventQueue = [];
          
          // Use sendBeacon for reliable delivery
          if (navigator.sendBeacon) {
            navigator.sendBeacon(
              '/api/analytics/batch',
              JSON.stringify(eventsToFlush)
            );
          }
        }
      });
    }
  }
}
