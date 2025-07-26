'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { createClient } from '@supabase/supabase-js';
import { Users, TrendingUp, DollarSign, Activity, Clock, Target, Eye, Wallet } from 'lucide-react';

interface AnalyticsEvent {
  id: string;
  wallet_address: string | null;
  event_name: string;
  event_properties: Record<string, any>;
  created_at: string;
}

interface DashboardMetrics {
  activeUsers: number;
  totalEvents: number;
  tokenCreationRate: number;
  revenueToday: number;
  conversionRate: number;
  avgSessionTime: number;
  bounceRate: number;
  retentionRate: number;
}

interface TimeSeriesData {
  timestamp: string;
  users: number;
  events: number;
  revenue: number;
  tokens: number;
}

interface EventBreakdownData {
  name: string;
  value: number;
  color: string;
}

interface UserJourneyStep {
  step: string;
  count: number;
}

const LiveAnalyticsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    activeUsers: 0,
    totalEvents: 0,
    tokenCreationRate: 0,
    revenueToday: 0,
    conversionRate: 0,
    avgSessionTime: 0,
    bounceRate: 0,
    retentionRate: 0
  });

  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [eventBreakdown, setEventBreakdown] = useState<EventBreakdownData[]>([]);
  const [userJourney, setUserJourney] = useState<UserJourneyStep[]>([]);
  const [realtimeEvents, setRealtimeEvents] = useState<AnalyticsEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Initialize Supabase client
  const supabase = createClient(
    'https://gsrzxzrpxtyjddqkperq.supabase.co',
    'sb_publishable_QwnDdAaitz2ID9WwgsfRkg_9ag-M-Ss'
  );

  // Fetch all analytics data
  const fetchAnalytics = useCallback(async () => {
    try {
      console.log('🔄 Fetching analytics data...');
      
      // Get all events
      const { data: events, error } = await supabase
        .from('analytics_events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching events:', error);
        return;
      }

      if (!events || events.length === 0) {
        console.log('No events found');
        setIsLoading(false);
        return;
      }

      console.log(`📊 Processing ${events.length} events...`);

      // Calculate time ranges
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Filter events by time
      const recentEvents = events.filter(e => new Date(e.created_at) > oneHourAgo);
      const todayEvents = events.filter(e => new Date(e.created_at) > oneDayAgo);
      const weekEvents = events.filter(e => new Date(e.created_at) > oneWeekAgo);

      // Calculate metrics
      const uniqueWallets = new Set(events.map(e => e.wallet_address).filter(Boolean));
      const activeWallets = new Set(recentEvents.map(e => e.wallet_address).filter(Boolean));
      
      // Token creation events
      const tokenEvents = events.filter(e => 
        e.event_name?.includes('token') || 
        e.event_properties?.action === 'create_token' ||
        e.event_properties?.page === 'create_token'
      );

      const tokenSuccessEvents = tokenEvents.filter(e => 
        e.event_name === 'token_created' || 
        e.event_properties?.status === 'success'
      );

      // Calculate success rate
      const tokenCreationRate = tokenEvents.length > 0 
        ? (tokenSuccessEvents.length / tokenEvents.length) * 100 
        : 0;

      // Revenue calculation (mock for now - you can add real revenue tracking)
      const revenuePerToken = 5; // $5 per token creation
      const todayTokens = tokenSuccessEvents.filter(e => new Date(e.created_at) > oneDayAgo);
      const revenueToday = todayTokens.length * revenuePerToken;

      // User journey analysis
      const pageViews = events.filter(e => e.event_name === 'page_view');
      const conversions = tokenSuccessEvents.length;
      const conversionRate = pageViews.length > 0 ? (conversions / pageViews.length) * 100 : 0;

      // Calculate session metrics
      const sessions = new Map<string, Date[]>();
      events.forEach(event => {
        const sessionKey = event.wallet_address || `anon_${event.id.slice(0, 8)}`;
        if (!sessions.has(sessionKey)) {
          sessions.set(sessionKey, []);
        }
        sessions.get(sessionKey)!.push(new Date(event.created_at));
      });

      let totalSessionTime = 0;
      let sessionCount = 0;
      sessions.forEach((timestamps: Date[], sessionKey: string) => {
        if (timestamps.length > 1) {
          timestamps.sort((a: Date, b: Date) => a.getTime() - b.getTime());
          const sessionDuration = timestamps[timestamps.length - 1].getTime() - timestamps[0].getTime();
          totalSessionTime += sessionDuration;
          sessionCount++;
        }
      });

      const avgSessionTime = sessionCount > 0 ? totalSessionTime / sessionCount / 1000 / 60 : 0; // in minutes

      // Update metrics
      setMetrics({
        activeUsers: activeWallets.size,
        totalEvents: events.length,
        tokenCreationRate: Math.round(tokenCreationRate),
        revenueToday: revenueToday,
        conversionRate: Math.round(conversionRate * 100) / 100,
        avgSessionTime: Math.round(avgSessionTime * 100) / 100,
        bounceRate: Math.round(Math.random() * 30 + 20), // Mock for now
        retentionRate: Math.round((uniqueWallets.size / events.length) * 100)
      });

      // Generate time series data (last 24 hours, hourly)
      const timeSeriesMap = new Map<number, TimeSeriesData>();
      for (let i = 23; i >= 0; i--) {
        const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
        const hourKey = hour.getHours();
        timeSeriesMap.set(hourKey, {
          timestamp: hour.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          users: 0,
          events: 0,
          revenue: 0,
          tokens: 0
        });
      }

      todayEvents.forEach(event => {
        const eventHour = new Date(event.created_at).getHours();
        if (timeSeriesMap.has(eventHour)) {
          const data = timeSeriesMap.get(eventHour)!;
          data.events += 1;
          if (event.wallet_address) data.users += 1;
          if (tokenSuccessEvents.includes(event)) {
            data.tokens += 1;
            data.revenue += revenuePerToken;
          }
        }
      });

      setTimeSeriesData(Array.from(timeSeriesMap.values()));

      // Event breakdown for pie chart
      const eventCounts: Record<string, number> = {};
      events.forEach(event => {
        const name = event.event_name || 'unknown';
        eventCounts[name] = (eventCounts[name] || 0) + 1;
      });

      const colors = ['rgb(239, 68, 68)', 'rgb(34, 197, 94)', 'rgb(59, 130, 246)', 'rgb(168, 85, 247)', 'rgb(245, 158, 11)', 'rgb(236, 72, 153)'];
      const eventBreakdownData = Object.entries(eventCounts)
        .map(([name, count], index) => ({
          name: name.replace('_', ' ').toUpperCase(),
          value: count as number,
          color: colors[index % colors.length]
        }))
        .sort((a, b) => b.value - a.value);

      setEventBreakdown(eventBreakdownData);

      // User journey funnel
      const journeySteps: UserJourneyStep[] = [
        { step: 'Page View', count: pageViews.length },
        { step: 'Wallet Connect', count: events.filter(e => e.event_name === 'wallet_connect').length },
        { step: 'Token Create Start', count: tokenEvents.length },
        { step: 'Token Created', count: tokenSuccessEvents.length }
      ];

      setUserJourney(journeySteps);

      // Recent events for real-time feed
      setRealtimeEvents(recentEvents.slice(0, 10));
      setLastUpdate(new Date());
      
      console.log('✅ Analytics data processed successfully');
      
    } catch (error) {
      console.error('Error in fetchAnalytics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // Real-time updates
  useEffect(() => {
    fetchAnalytics();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('analytics_events')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'analytics_events'
      }, (payload) => {
        console.log('🔔 Real-time event received:', payload);
        fetchAnalytics(); // Refresh data
      })
      .subscribe();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAnalytics, 30000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [fetchAnalytics]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-medium text-foreground">Loading Analytics Dashboard...</p>
          <p className="text-sm text-muted-foreground">Connecting to live data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Add top padding for navbar */}
      <div className="pt-16">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Analytics Dashboard</h1>
              <p className="text-muted-foreground mt-2">Real-time insights for Snarbles platform</p>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="mb-2 bg-primary/10 text-primary border-primary/20">
                <Activity className="w-4 h-4 mr-1" />
                Live
              </Badge>
              <p className="text-sm text-muted-foreground">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </p>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Card className="glass-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{metrics.activeUsers}</div>
                <p className="text-xs text-muted-foreground">Online right now</p>
              </CardContent>
            </Card>

            <Card className="glass-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Token Success Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{metrics.tokenCreationRate}%</div>
                <p className="text-xs text-muted-foreground">Creation success rate</p>
              </CardContent>
            </Card>

            <Card className="glass-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Revenue Today</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">${metrics.revenueToday}</div>
                <p className="text-xs text-muted-foreground">Today's earnings</p>
              </CardContent>
            </Card>

            <Card className="glass-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Conversion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{metrics.conversionRate}%</div>
                <p className="text-xs text-muted-foreground">Visitor to token creator</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Dashboard */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-muted/10 border-border">
              <TabsTrigger value="overview" className="text-foreground data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Overview</TabsTrigger>
              <TabsTrigger value="users" className="text-foreground data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Users</TabsTrigger>
              <TabsTrigger value="revenue" className="text-foreground data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Revenue</TabsTrigger>
              <TabsTrigger value="journey" className="text-foreground data-[state=active]:bg-primary/20 data-[state=active]:text-primary">User Journey</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Activity Timeline */}
                <Card className="glass-card border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground">Activity Timeline (24h)</CardTitle>
                    <CardDescription className="text-muted-foreground">Hourly user activity and events</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={timeSeriesData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgb(38, 38, 38)" />
                        <XAxis dataKey="timestamp" stroke="rgb(163, 163, 163)" fontSize={12} />
                        <YAxis stroke="rgb(163, 163, 163)" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(8, 8, 8, 0.95)', 
                            border: '1px solid rgb(38, 38, 38)', 
                            borderRadius: '8px',
                            color: 'rgb(254, 254, 235)'
                          }} 
                        />
                        <Area type="monotone" dataKey="events" stackId="1" stroke="rgb(239, 68, 68)" fill="rgb(239, 68, 68)" fillOpacity={0.3} />
                        <Area type="monotone" dataKey="users" stackId="1" stroke="rgb(34, 197, 94)" fill="rgb(34, 197, 94)" fillOpacity={0.3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Event Breakdown */}
                <Card className="glass-card border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground">Event Distribution</CardTitle>
                    <CardDescription className="text-muted-foreground">Types of user interactions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={eventBreakdown}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="rgb(239, 68, 68)"
                          dataKey="value"
                        >
                          {eventBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(8, 8, 8, 0.95)', 
                            border: '1px solid rgb(38, 38, 38)', 
                            borderRadius: '8px',
                            color: 'rgb(254, 254, 235)'
                          }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Real-time Feed */}
              <Card className="glass-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Real-time Event Feed</CardTitle>
                  <CardDescription className="text-muted-foreground">Live user activity as it happens</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {realtimeEvents.map((event, index) => (
                      <div key={event.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-muted/5 border border-border rounded-lg space-y-2 sm:space-y-0">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                          <span className="font-medium text-foreground">{event.event_name?.replace('_', ' ') || 'Activity'}</span>
                          {event.wallet_address && (
                            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                              <Wallet className="w-3 h-3 mr-1" />
                              {event.wallet_address.slice(0, 8)}...
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(event.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                    {realtimeEvents.length === 0 && (
                      <div className="text-center py-8">
                        <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">Waiting for live events...</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <Card className="glass-card border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground">User Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Active Users (1h)</span>
                      <span className="font-bold text-primary">{metrics.activeUsers}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Avg Session Time</span>
                      <span className="font-bold text-primary">{metrics.avgSessionTime} min</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Bounce Rate</span>
                      <span className="font-bold text-primary">{metrics.bounceRate}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Retention Rate</span>
                      <span className="font-bold text-primary">{metrics.retentionRate}%</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground">User Activity Heatmap</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={timeSeriesData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgb(38, 38, 38)" />
                        <XAxis dataKey="timestamp" stroke="rgb(163, 163, 163)" fontSize={12} />
                        <YAxis stroke="rgb(163, 163, 163)" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(8, 8, 8, 0.95)', 
                            border: '1px solid rgb(38, 38, 38)', 
                            borderRadius: '8px',
                            color: 'rgb(254, 254, 235)'
                          }} 
                        />
                        <Bar dataKey="users" fill="rgb(239, 68, 68)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="revenue" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <Card className="glass-card border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground">Revenue Tracking</CardTitle>
                    <CardDescription className="text-muted-foreground">Real-time revenue metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={timeSeriesData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgb(38, 38, 38)" />
                        <XAxis dataKey="timestamp" stroke="rgb(163, 163, 163)" fontSize={12} />
                        <YAxis stroke="rgb(163, 163, 163)" fontSize={12} />
                        <Tooltip 
                          formatter={(value) => [`$${value}`, 'Revenue']}
                          contentStyle={{ 
                            backgroundColor: 'rgba(8, 8, 8, 0.95)', 
                            border: '1px solid rgb(38, 38, 38)', 
                            borderRadius: '8px',
                            color: 'rgb(254, 254, 235)'
                          }} 
                        />
                        <Line type="monotone" dataKey="revenue" stroke="rgb(34, 197, 94)" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="glass-card border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground">Token Creation Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={timeSeriesData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgb(38, 38, 38)" />
                        <XAxis dataKey="timestamp" stroke="rgb(163, 163, 163)" fontSize={12} />
                        <YAxis stroke="rgb(163, 163, 163)" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(8, 8, 8, 0.95)', 
                            border: '1px solid rgb(38, 38, 38)', 
                            borderRadius: '8px',
                            color: 'rgb(254, 254, 235)'
                          }} 
                        />
                        <Bar dataKey="tokens" fill="rgb(239, 68, 68)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="journey" className="space-y-6">
              <Card className="glass-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">User Journey Funnel</CardTitle>
                  <CardDescription className="text-muted-foreground">Conversion funnel analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {userJourney.map((step, index) => {
                      const maxCount = Math.max(...userJourney.map(s => s.count));
                      const percentage = maxCount > 0 ? (step.count / maxCount) * 100 : 0;
                      
                      return (
                        <div key={step.step} className="space-y-2">
                          <div className="flex justify-between">
                            <span className="font-medium text-foreground">{step.step}</span>
                            <span className="text-sm text-muted-foreground">{step.count} users</span>
                          </div>
                          <div className="w-full bg-muted/20 rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          {index < userJourney.length - 1 && (
                            <div className="text-center text-sm text-muted-foreground">
                              ↓ {index < userJourney.length - 1 ? 
                                Math.round((userJourney[index + 1].count / step.count) * 100) : 0}% conversion
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default LiveAnalyticsDashboard;
