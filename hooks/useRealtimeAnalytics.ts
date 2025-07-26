import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

interface RealtimeMetrics {
  activeUsers: number;
  conversionRate: number;
  tokenSuccessRate: number;
  revenueToday: number;
  events: any[];
  lastUpdate: Date;
}

export function useRealtimeAnalytics() {
  const [metrics, setMetrics] = useState<RealtimeMetrics>({
    activeUsers: 0,
    conversionRate: 0,
    tokenSuccessRate: 0,
    revenueToday: 0,
    events: [],
    lastUpdate: new Date()
  });

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient(
    'https://gsrzxzrpxtyjddqkperq.supabase.co',
    'sb_publishable_QwnDdAaitz2ID9WwgsfRkg_9ag-M-Ss'
  );

  const calculateMetrics = useCallback((events: any[]) => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Active users (last hour)
    const recentEvents = events.filter(e => new Date(e.created_at) > oneHourAgo);
    const activeUsers = new Set(recentEvents.map(e => e.wallet_address).filter(Boolean)).size;

    // Token success rate
    const tokenEvents = events.filter(e => 
      e.event_name?.includes('token') || 
      e.event_properties?.action === 'create_token'
    );
    const successfulTokens = tokenEvents.filter(e => 
      e.event_name === 'token_created' || 
      e.event_properties?.status === 'success'
    );
    const tokenSuccessRate = tokenEvents.length > 0 ? 
      (successfulTokens.length / tokenEvents.length) * 100 : 0;

    // Conversion rate (page views to token creation)
    const pageViews = events.filter(e => e.event_name === 'page_view');
    const conversions = successfulTokens.length;
    const conversionRate = pageViews.length > 0 ? 
      (conversions / pageViews.length) * 100 : 0;

    // Revenue (today)
    const todayTokens = successfulTokens.filter(e => new Date(e.created_at) > oneDayAgo);
    const revenueToday = todayTokens.length * 5; // $5 per token

    return {
      activeUsers,
      conversionRate: Math.round(conversionRate * 100) / 100,
      tokenSuccessRate: Math.round(tokenSuccessRate),
      revenueToday,
      events: recentEvents.slice(0, 10),
      lastUpdate: new Date()
    };
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const { data: events, error } = await supabase
        .from('analytics_events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const calculatedMetrics = calculateMetrics(events || []);
      setMetrics(calculatedMetrics);
      setIsConnected(true);
      setError(null);
      
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsConnected(false);
    }
  }, [calculateMetrics, supabase]);

  useEffect(() => {
    fetchData();

    // Set up real-time subscription
    const subscription = supabase
      .channel('realtime_analytics')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'analytics_events'
      }, () => {
        fetchData();
      })
      .subscribe();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [fetchData, supabase]);

  return {
    metrics,
    isConnected,
    error,
    refresh: fetchData
  };
}

// Hook for tracking events
export function useEventTracking() {
  const supabase = createClient(
    'https://gsrzxzrpxtyjddqkperq.supabase.co',
    'sb_publishable_QwnDdAaitz2ID9WwgsfRkg_9ag-M-Ss'
  );

  const trackEvent = useCallback(async (
    eventName: string, 
    properties: any = {}, 
    walletAddress?: string
  ) => {
    try {
      const { error } = await supabase
        .from('analytics_events')
        .insert({
          event_name: eventName,
          event_properties: properties,
          wallet_address: walletAddress,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      
      console.log(`📊 Event tracked: ${eventName}`, properties);
      
    } catch (err) {
      console.error('Error tracking event:', err);
    }
  }, [supabase]);

  return { trackEvent };
}

// Hook for user journey optimization
export function useUserJourneyOptimization() {
  const [journeyData, setJourneyData] = useState<any[]>([]);
  const [optimizations, setOptimizations] = useState<string[]>([]);

  const supabase = createClient(
    'https://gsrzxzrpxtyjddqkperq.supabase.co',
    'sb_publishable_QwnDdAaitz2ID9WwgsfRkg_9ag-M-Ss'
  );

  const analyzeJourney = useCallback(async () => {
    try {
      const { data: events } = await supabase
        .from('analytics_events')
        .select('*')
        .order('created_at', { ascending: false });

      if (!events) return;

      // Group events by user session
      const sessions = new Map();
      events.forEach(event => {
        const sessionKey = event.wallet_address || `anon_${event.id.slice(0, 8)}`;
        if (!sessions.has(sessionKey)) {
          sessions.set(sessionKey, []);
        }
        sessions.get(sessionKey).push(event);
      });

      // Analyze common drop-off points
      const journeySteps = [
        'page_view',
        'wallet_connect',
        'create_token_start',
        'token_created'
      ];

      const stepCounts = journeySteps.map(step => {
        const count = events.filter(e => e.event_name === step).length;
        return { step, count };
      });

      setJourneyData(stepCounts);

      // Generate optimization suggestions
      const suggestions = [];
      
      // Low conversion from page view to wallet connect
      const pageViews = stepCounts.find(s => s.step === 'page_view')?.count || 0;
      const walletConnects = stepCounts.find(s => s.step === 'wallet_connect')?.count || 0;
      if (pageViews > 0 && (walletConnects / pageViews) < 0.3) {
        suggestions.push('Consider improving wallet connection UX - low conversion from page views');
      }

      // High drop-off from token start to completion
      const tokenStarts = stepCounts.find(s => s.step === 'create_token_start')?.count || 0;
      const tokenCreated = stepCounts.find(s => s.step === 'token_created')?.count || 0;
      if (tokenStarts > 0 && (tokenCreated / tokenStarts) < 0.7) {
        suggestions.push('Token creation flow needs optimization - high abandonment rate');
      }

      setOptimizations(suggestions);

    } catch (error) {
      console.error('Error analyzing user journey:', error);
    }
  }, [supabase]);

  useEffect(() => {
    analyzeJourney();
    const interval = setInterval(analyzeJourney, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [analyzeJourney]);

  return {
    journeyData,
    optimizations,
    refresh: analyzeJourney
  };
}
