import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export class MCPAnalyticsService {
  /**
   * Get real-time platform insights using MCP access
   */
  static async getPlatformInsights(timeframe: '24h' | '7d' | '30d' = '7d') {
    try {
      const { data: events, error } = await supabase
        .from('analytics_events')
        .select('*')
        .gte('created_at', this.getTimeframeDate(timeframe))
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        totalEvents: events.length,
        uniqueUsers: new Set(events.map(e => e.wallet_address)).size,
        avgSessionTime: this.calculateAverageSessionTime(events),
        bounceRate: this.calculateBounceRate(events),
        conversionRate: this.calculateConversionRate(events),
        topFeatures: this.getMostUsedFeatures(events),
        recentActivity: this.getRecentActivity(events)
      };
    } catch (error) {
      console.error('MCP Analytics Error:', error);
      return null;
    }
  }

  /**
   * Analyze user behavior patterns for optimization
   */
  static async getUserBehaviorInsights() {
    const { data: events, error } = await supabase
      .from('analytics_events')
      .select('*')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (error) return null;

    return {
      dropoffPoints: this.identifyDropoffPoints(events),
      successfulJourneys: this.getSuccessfulJourneys(events),
      timeToComplete: this.calculateAverageCompletionTime(events),
      mostUsedFeatures: this.getMostUsedFeatures(events)
    };
  }

  /**
   * Get real-time token creation metrics
   */
  static async getTokenCreationMetrics() {
    const { data: tokens, error } = await supabase
      .from('tokens')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return null;

    const { data: events, error: eventError } = await supabase
      .from('analytics_events')
      .select('*')
      .eq('event_name', 'token_created')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (eventError) return null;

    const { data: failedEvents, error: failedError } = await supabase
      .from('analytics_events')
      .select('*')
      .eq('event_name', 'token_creation_failed')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    const failedCreations = failedError ? 0 : (failedEvents?.length || 0);

    return {
      totalTokensCreated: tokens.length,
      successfulCreations: events.length,
      failedCreations: failedCreations,
      mostActiveNetworks: this.getNetworkDistribution(events),
      successRate: this.calculateTokenCreationSuccessRate(events)
    };
  }

  /**
   * Monitor platform performance in real-time
   */
  static async getPerformanceMetrics() {
    const { data: events, error } = await supabase
      .from('analytics_events')
      .select('*')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (error) return null;

    return {
      averageResponseTime: 150, // Mock value - would be measured in real implementation
      uptime: '99.9%',
      errorRate: this.calculateErrorRate(events),
      throughput: events.length, // Events per day as throughput
      cpuUsage: 45, // Mock value
      memoryUsage: 67, // Mock value  
      activeConnections: new Set(events.map(e => e.wallet_address)).size,
      hourlyStats: this.getHourlyStats(events)
    };
  }

  // Helper methods
  private static getTimeframeDate(timeframe: string): string {
    const hours = timeframe === '24h' ? 24 : timeframe === '7d' ? 168 : 720;
    return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  }

  private static getMostVisitedPages(events: any[]) {
    const pageViews = events.filter(e => e.event_name === 'page_view');
    const pageCounts = pageViews.reduce((acc, event) => {
      const page = event.event_properties?.page || 'unknown';
      acc[page] = (acc[page] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(pageCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5);
  }

  private static analyzeUserJourney(events: any[]) {
    // Group events by session_id to track user journeys
    const sessions = events.reduce((acc, event) => {
      const sessionId = event.session_id || 'anonymous';
      if (!acc[sessionId]) acc[sessionId] = [];
      acc[sessionId].push(event);
      return acc;
    }, {});

    const journeys = Object.values(sessions).map((sessionEvents: any) => {
      const sortedEvents = sessionEvents.sort((a: any, b: any) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      return sortedEvents.map((e: any) => e.event_name);
    });

    return this.findCommonJourneys(journeys);
  }

  private static findCommonJourneys(journeys: string[][]) {
    const journeyPatterns = journeys.reduce((acc, journey) => {
      const pattern = journey.join(' -> ');
      acc[pattern] = (acc[pattern] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(journeyPatterns)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
  }

  private static calculateConversionRate(events: any[]) {
    const pageViews = events.filter(e => e.event_name === 'page_view').length;
    const tokenCreations = events.filter(e => e.event_name === 'token_created').length;
    return pageViews > 0 ? (tokenCreations / pageViews * 100).toFixed(2) : '0';
  }

  private static getTimeDistribution(events: any[]) {
    const hourCounts = events.reduce((acc, event) => {
      const hour = new Date(event.created_at).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => a.hour - b.hour);
  }

  private static identifyDropoffPoints(events: any[]) {
    // Analyze where users typically drop off in the journey
    const journeySteps = ['page_view', 'wallet_connected', 'form_started', 'form_completed', 'token_created'];
    const stepCounts = journeySteps.map(step => ({
      step,
      count: events.filter(e => e.event_name === step).length
    }));

    return stepCounts.map((current, index) => {
      const next = stepCounts[index + 1];
      if (!next) return { step: current.step, dropoff: 0 };
      
      const dropoffRate = current.count > 0 ? 
        ((current.count - next.count) / current.count * 100).toFixed(2) : '0';
      
      return { step: current.step, dropoff: parseFloat(dropoffRate) };
    });
  }

  private static getSuccessfulJourneys(events: any[]) {
    const tokenCreations = events.filter(e => e.event_name === 'token_created');
    return tokenCreations.map(creation => ({
      wallet: creation.wallet_address,
      timestamp: creation.created_at,
      network: creation.event_properties?.network || 'unknown'
    }));
  }

  private static calculateAverageCompletionTime(events: any[]) {
    // Calculate time from first interaction to token creation
    const sessions = events.reduce((acc, event) => {
      const sessionId = event.session_id || event.wallet_address;
      if (!acc[sessionId]) acc[sessionId] = [];
      acc[sessionId].push(event);
      return acc;
    }, {} as Record<string, any[]>);

    const completionTimes = Object.values(sessions)
      .filter((sessionEvents): sessionEvents is any[] => 
        Array.isArray(sessionEvents) && sessionEvents.some((e: any) => e.event_name === 'token_created')
      )
      .map(sessionEvents => {
        const sortedEvents = sessionEvents.sort((a: any, b: any) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        const firstEvent = sortedEvents[0];
        const tokenCreation = sortedEvents.find((e: any) => e.event_name === 'token_created');
        
        if (!tokenCreation) return 0;
        
        return new Date(tokenCreation.created_at).getTime() - 
               new Date(firstEvent.created_at).getTime();
      })
      .filter(time => time > 0);

    if (completionTimes.length === 0) return 0;
    
    const avgMs = completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length;
    return Math.round(avgMs / 1000 / 60); // Convert to minutes
  }

  private static getMostUsedFeatures(events: any[]) {
    const featureEvents = events.filter(e => 
      !['page_view', 'session_start'].includes(e.event_name)
    );
    
    const featureCounts = featureEvents.reduce((acc, event) => {
      acc[event.event_name] = (acc[event.event_name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(featureCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 10);
  }

  private static getNetworkDistribution(events: any[]) {
    const networkCounts = events.reduce((acc, event) => {
      const network = event.event_properties?.network || 'unknown';
      acc[network] = (acc[network] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(networkCounts);
  }

  private static calculateTokenCreationSuccessRate(events: any[]) {
    const attempts = events.filter(e => 
      e.event_name === 'token_creation_started' || e.event_name === 'form_completed'
    ).length;
    const successes = events.filter(e => e.event_name === 'token_created').length;
    
    return attempts > 0 ? (successes / attempts * 100).toFixed(2) : '100';
  }

  private static calculateErrorRate(events: any[]) {
    const totalEvents = events.length;
    const errorEvents = events.filter(e => e.event_name.includes('error')).length;
    return totalEvents > 0 ? (errorEvents / totalEvents * 100).toFixed(2) : '0';
  }

  private static getAverageSessionDuration(events: any[]): number {
    const sessions = events.reduce((acc, event) => {
      const sessionId = event.session_id || event.wallet_address;
      if (!acc[sessionId]) acc[sessionId] = [];
      acc[sessionId].push(new Date(event.created_at).getTime());
      return acc;
    }, {} as Record<string, number[]>);

    const durations = Object.values(sessions)
      .filter((timestamps): timestamps is number[] => Array.isArray(timestamps) && timestamps.length > 1)
      .map(timestamps => {
        const sorted = timestamps.sort((a, b) => a - b);
        return sorted[sorted.length - 1] - sorted[0];
      });

    if (durations.length === 0) return 0;
    
    const avgMs = durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
    return Math.round(avgMs / 1000 / 60); // Convert to minutes
  }

  private static calculateBounceRate(events: any[]): string {
    const sessions = events.reduce((acc, event) => {
      const sessionId = event.session_id || event.wallet_address;
      if (!acc[sessionId]) acc[sessionId] = 0;
      acc[sessionId]++;
      return acc;
    }, {} as Record<string, number>);

    const totalSessions = Object.keys(sessions).length;
    const bouncedSessions = Object.values(sessions).filter(count => count === 1).length;
    
    return totalSessions > 0 ? (bouncedSessions / totalSessions * 100).toFixed(2) + '%' : '0%';
  }

  private static getPeakUsageHours(events: any[]) {
    const hourCounts = events.reduce((acc, event) => {
      const hour = new Date(event.created_at).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return Object.entries(hourCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }));
  }

  private static calculateAverageSessionTime(events: any[]): string {
    const sessions = events.reduce((acc, event) => {
      const sessionKey = `${event.wallet_address}_${new Date(event.created_at).getDate()}`;
      if (!acc[sessionKey]) {
        acc[sessionKey] = [];
      }
      acc[sessionKey].push(new Date(event.created_at).getTime());
      return acc;
    }, {} as Record<string, number[]>);

    const sessionDurations = Object.values(sessions)
      .filter((timestamps): timestamps is number[] => Array.isArray(timestamps) && timestamps.length > 1)
      .map(timestamps => {
        const sorted = timestamps.sort((a, b) => a - b);
        return sorted[sorted.length - 1] - sorted[0];
      });

    if (sessionDurations.length === 0) return '0m';

    const avgDuration = sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length;
    const minutes = Math.floor(avgDuration / (1000 * 60));
    
    return `${minutes}m`;
  }

  private static getRecentActivity(events: any[]) {
    return events
      .slice(0, 10)
      .map(event => ({
        event: event.event_name,
        user: event.wallet_address?.slice(0, 8) + '...' || 'Anonymous',
        timestamp: new Date(event.created_at)
      }));
  }

  private static getHourlyStats(events: any[]) {
    const hourlyData = events.reduce((acc, event) => {
      const hour = new Date(event.created_at).getHours();
      if (!acc[hour]) {
        acc[hour] = { requests: 0, errors: 0 };
      }
      acc[hour].requests++;
      if (event.event_name === 'error' || event.event_name === 'failed_creation') {
        acc[hour].errors++;
      }
      return acc;
    }, {} as Record<number, { requests: number; errors: number }>);

    return Array.from({ length: 24 }, (_, hour) => ({
      hour,
      requests: hourlyData[hour]?.requests || 0,
      errors: hourlyData[hour]?.errors || 0
    }));
  }
}
