"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Activity, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Zap,
  Shield,
  Brain
} from 'lucide-react';
import { MCPAnalyticsService } from '@/lib/mcp-analytics-service';

interface PlatformInsights {
  totalEvents: number;
  uniqueUsers: number;
  avgSessionTime: string;
  bounceRate: string;
  conversionRate: string;
  topFeatures: [string, unknown][];
  recentActivity: Array<{
    event: string;
    user: string;
    timestamp: Date;
  }>;
}

interface PerformanceMetrics {
  averageResponseTime: number;
  uptime: string;
  errorRate: string;
  throughput: number;
  cpuUsage: number;
  memoryUsage: number;
  activeConnections: number;
  hourlyStats: Array<{
    hour: number;
    requests: number;
    errors: number;
  }>;
}

interface TokenMetrics {
  totalTokensCreated: number;
  successfulCreations: number;
  failedCreations: number;
  mostActiveNetworks: [string, unknown][];
  successRate: string;
}

export function MCPAdminDashboard() {
  const [insights, setInsights] = useState<PlatformInsights | null>(null);
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null);
  const [tokenMetrics, setTokenMetrics] = useState<TokenMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('7d');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, [timeframe]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [insightsData, performanceData, tokenData] = await Promise.all([
        MCPAnalyticsService.getPlatformInsights(timeframe),
        MCPAnalyticsService.getPerformanceMetrics(),
        MCPAnalyticsService.getTokenCreationMetrics()
      ]);

      setInsights(insightsData);
      setPerformance(performanceData);
      setTokenMetrics(tokenData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Dashboard data loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  };

  if (loading && !insights) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
            <RefreshCw className="w-5 h-5 animate-spin text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Loading MCP Intelligence...</h3>
            <p className="text-sm text-muted-foreground">Gathering real-time platform insights</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="snarbles-card-premium border-red-500/20 bg-black/40 backdrop-blur-xl animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-red-500/10 rounded w-1/2 mb-2"></div>
                <div className="w-8 h-8 rounded-lg bg-red-500/10"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-red-500/10 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-red-500/5 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-lg border border-red-500/20 bg-gradient-to-r from-red-500/10 via-red-600/5 to-purple-600/10 p-6">
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
        <div className="relative z-10">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">MCP Intelligence</h2>
              <p className="text-muted-foreground">Real-time platform analytics and user insights</p>
            </div>
          </div>
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-green-400">Live Monitoring Active</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            {(['24h', '7d', '30d'] as const).map((period) => (
              <Button
                key={period}
                variant={timeframe === period ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeframe(period)}
                className={timeframe === period ? 'bg-red-500 hover:bg-red-600' : ''}
              >
                {period}
              </Button>
            ))}
          </div>
          <Button onClick={loadDashboardData} size="sm" variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="snarbles-card-active border-none bg-gradient-to-br from-red-500/10 to-red-600/5 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-400">Total Events</CardTitle>
              <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                <Activity className="h-4 w-4 text-red-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{insights?.totalEvents?.toLocaleString() || '0'}</div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1 text-green-400" />
                Last {timeframe}
              </p>
            </CardContent>
          </Card>

          <Card className="snarbles-card-active border-none bg-gradient-to-br from-blue-500/10 to-blue-600/5 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-400">Active Users</CardTitle>
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{insights?.uniqueUsers?.toLocaleString() || '0'}</div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1 text-green-400" />
                {insights?.bounceRate || '0%'} bounce rate
              </p>
            </CardContent>
          </Card>

          <Card className="snarbles-card-active border-none bg-gradient-to-br from-green-500/10 to-green-600/5 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-400">Conversion Rate</CardTitle>
              <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Zap className="h-4 w-4 text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{insights?.conversionRate || '0%'}</div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1 text-green-400" />
                {insights?.avgSessionTime || '0s'} avg session
              </p>
            </CardContent>
          </Card>

          <Card className="snarbles-card-active border-none bg-gradient-to-br from-purple-500/10 to-purple-600/5 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-400">Response Time</CardTitle>
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Zap className="h-4 w-4 text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{performance?.averageResponseTime || 0}ms</div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
                {performance?.uptime || '99.9%'} uptime
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="snarbles-card-premium border-red-500/20 bg-black/40 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Hourly Activity</CardTitle>
              <CardDescription>Request patterns over the last 24 hours</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performance?.hourlyStats || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="hour" 
                    stroke="#9CA3AF" 
                    tickFormatter={formatHour}
                  />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                    labelFormatter={(hour) => `Time: ${formatHour(Number(hour))}`}
                  />
                  <Bar dataKey="requests" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="snarbles-card-premium border-red-500/20 bg-black/40 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Token Creation Networks</CardTitle>
              <CardDescription>Distribution of token creation by network</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tokenMetrics?.mostActiveNetworks?.slice(0, 5).map(([network, count], index) => (
                  <div key={network} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        index === 0 ? 'bg-red-500' : 
                        index === 1 ? 'bg-blue-500' :
                        index === 2 ? 'bg-green-500' :
                        index === 3 ? 'bg-yellow-500' : 'bg-purple-500'
                      }`}></div>
                      <span className="text-sm font-medium capitalize">{network}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            index === 0 ? 'bg-red-500' : 
                            index === 1 ? 'bg-blue-500' :
                            index === 2 ? 'bg-green-500' :
                            index === 3 ? 'bg-yellow-500' : 'bg-purple-500'
                          }`}
                          style={{ 
                            width: `${Math.min(100, (Number(count) / Number(tokenMetrics?.mostActiveNetworks?.[0]?.[1] || 1)) * 100)}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-sm text-muted-foreground">{Number(count)} tokens</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity & System Health */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="snarbles-card-premium border-red-500/20 bg-black/40 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-red-400" />
                <span>Recent Activity</span>
              </CardTitle>
              <CardDescription>Latest user interactions and events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights?.recentActivity?.slice(0, 5).map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-800/50">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.event}</p>
                      <p className="text-xs text-muted-foreground">User: {activity.user}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="snarbles-card-premium border-red-500/20 bg-black/40 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-blue-400" />
                <span>System Health</span>
              </CardTitle>
              <CardDescription>Performance metrics and alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">System Uptime</p>
                      <p className="text-xs text-muted-foreground">{performance?.uptime || '99.9%'}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                    Healthy
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10">
                  <div className="flex items-center space-x-3">
                    <Activity className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">Active Connections</p>
                      <p className="text-xs text-muted-foreground">{performance?.activeConnections || 0} connections</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                    Normal
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10">
                  <div className="flex items-center space-x-3">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    <div>
                      <p className="text-sm font-medium">Error Rate</p>
                      <p className="text-xs text-muted-foreground">{performance?.errorRate || '0.1%'}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">
                    Good
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Alerts */}
        {performance && performance.averageResponseTime > 1000 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              High response time detected ({performance.averageResponseTime}ms). Consider scaling resources.
            </AlertDescription>
          </Alert>
        )}

        {insights && parseFloat(insights.conversionRate) < 1 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Low conversion rate ({insights.conversionRate}%). Consider optimizing the token creation flow.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}

// Export as default as well for flexibility
export default MCPAdminDashboard;
