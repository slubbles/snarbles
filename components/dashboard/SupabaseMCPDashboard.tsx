'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Activity, 
  Brain, 
  AlertTriangle,
  BarChart3,
  PieChart,
  LineChart,
  RefreshCw,
  Download,
  Zap
} from 'lucide-react';
import { 
  LineChart as RechartsLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  Pie
} from 'recharts';
import { mcpAnalytics, type AdvancedAnalytics } from '@/lib/supabase-mcp-analytics';
import { toast } from 'sonner';

interface SupabaseMCPDashboardProps {
  walletAddress?: string;
  isAdmin?: boolean;
}

export default function SupabaseMCPDashboard({ walletAddress, isAdmin = false }: SupabaseMCPDashboardProps) {
  const [analytics, setAnalytics] = useState<AdvancedAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await mcpAnalytics.getPlatformAnalytics(timeframe);
      setAnalytics(data);
      toast.success('Analytics loaded successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load analytics';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin || walletAddress) {
      loadAnalytics();
    }
  }, [timeframe, isAdmin, walletAddress]);

  const exportAnalytics = () => {
    if (!analytics) return;
    
    const dataStr = JSON.stringify(analytics, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `snarbles-analytics-${timeframe}-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Analytics exported successfully');
  };

  if (!isAdmin && !walletAddress) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 mx-auto text-amber-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Required</h3>
            <p className="text-muted-foreground">
              Connect your wallet or admin access required to view analytics
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadAnalytics}
            className="ml-2"
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Advanced Analytics
          </h1>
          <p className="text-muted-foreground">
            AI-powered insights via Supabase MCP
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Tabs value={timeframe} onValueChange={(value) => setTimeframe(value as any)}>
            <TabsList>
              <TabsTrigger value="24h">24H</TabsTrigger>
              <TabsTrigger value="7d">7D</TabsTrigger>
              <TabsTrigger value="30d">30D</TabsTrigger>
              <TabsTrigger value="90d">90D</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button
            variant="outline"
            size="sm"
            onClick={loadAnalytics}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={exportAnalytics}
            disabled={!analytics}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center p-8">
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 animate-pulse text-primary" />
            <span>Analyzing data with AI...</span>
          </div>
        </div>
      )}

      {analytics && (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tokens">Tokens</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="predictions">AI Insights</TabsTrigger>
          </TabsList>

          {/* Platform Overview */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics.platform_overview.total_tokens_created.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {analytics.platform_overview.growth_metrics.daily_growth > 0 ? '+' : ''}
                    {analytics.platform_overview.growth_metrics.daily_growth.toFixed(1)}% daily
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics.platform_overview.total_users.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Across {analytics.platform_overview.active_networks.length} networks
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics.platform_overview.success_rate.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Token creation success
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${analytics.revenue_insights.total_revenue.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Platform revenue
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Revenue Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="w-5 h-5" />
                  Revenue Trend
                </CardTitle>
                <CardDescription>
                  Daily revenue over the selected period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={analytics.revenue_insights.revenue_by_period.daily}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Revenue']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="amount" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Token Performance */}
          <TabsContent value="tokens" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Top Performing Tokens
                </CardTitle>
                <CardDescription>
                  Tokens ranked by performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.token_performance.slice(0, 10).map((token, index) => (
                    <div key={token.token_id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-semibold">{token.name}</div>
                          <div className="text-sm text-muted-foreground">{token.symbol}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {token.metrics.holder_count} holders
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {token.metrics.transaction_count} transactions
                          </div>
                        </div>
                        <Badge variant={
                          token.performance_grade === 'A' ? 'default' :
                          token.performance_grade === 'B' ? 'secondary' :
                          'outline'
                        }>
                          Grade {token.performance_grade}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Analytics */}
          <TabsContent value="users" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    User Segments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={[
                            { name: 'Creators', value: analytics.user_behavior.user_segments.creators, fill: 'hsl(var(--primary))' },
                            { name: 'Traders', value: analytics.user_behavior.user_segments.traders, fill: 'hsl(var(--secondary))' },
                            { name: 'Hodlers', value: analytics.user_behavior.user_segments.hodlers, fill: 'hsl(var(--accent))' },
                            { name: 'Inactive', value: analytics.user_behavior.user_segments.inactive, fill: 'hsl(var(--muted))' }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                        </Pie>
                        <Tooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Engagement Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Session</span>
                    <span className="font-semibold">
                      {analytics.user_behavior.engagement_metrics.avg_session_duration.toFixed(1)} min
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Pages per Session</span>
                    <span className="font-semibold">
                      {analytics.user_behavior.engagement_metrics.pages_per_session.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Retention Rate</span>
                    <span className="font-semibold">
                      {(analytics.user_behavior.engagement_metrics.retention_rate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Bounce Rate</span>
                    <span className="font-semibold">
                      {(analytics.user_behavior.engagement_metrics.bounce_rate * 100).toFixed(1)}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Revenue Analytics */}
          <TabsContent value="revenue" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Token Fees</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${analytics.revenue_insights.revenue_sources.token_creation_fees.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">USDT Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${analytics.revenue_insights.revenue_sources.usdt_payments.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Enterprise</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${analytics.revenue_insights.revenue_sources.enterprise_subscriptions.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Conversion Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Free to Paid Conversion</span>
                  <span className="font-semibold">
                    {(analytics.revenue_insights.conversion_metrics.free_to_paid_rate * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Average Customer Value</span>
                  <span className="font-semibold">
                    ${analytics.revenue_insights.conversion_metrics.average_customer_value}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Customer Lifetime Value</span>
                  <span className="font-semibold">
                    ${analytics.revenue_insights.conversion_metrics.customer_lifetime_value}
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Predictions */}
          <TabsContent value="predictions" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    Revenue Forecast
                  </CardTitle>
                  <CardDescription>
                    AI-powered revenue predictions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Next Month</span>
                    <span className="font-semibold text-green-600">
                      ${analytics.predictive_metrics.revenue_forecast.next_month.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Next Quarter</span>
                    <span className="font-semibold text-green-600">
                      ${analytics.predictive_metrics.revenue_forecast.next_quarter.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Confidence interval: ${analytics.predictive_metrics.revenue_forecast.confidence_interval[0].toLocaleString()} - ${analytics.predictive_metrics.revenue_forecast.confidence_interval[1].toLocaleString()}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    User Growth Forecast
                  </CardTitle>
                  <CardDescription>
                    Predicted user acquisition
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Next Month</span>
                    <span className="font-semibold text-blue-600">
                      {analytics.predictive_metrics.user_growth_forecast.next_month.toLocaleString()} users
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Next Quarter</span>
                    <span className="font-semibold text-blue-600">
                      {analytics.predictive_metrics.user_growth_forecast.next_quarter.toLocaleString()} users
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Churn Risk</span>
                    <Badge variant={
                      analytics.predictive_metrics.user_growth_forecast.churn_risk < 0.1 ? 'default' :
                      analytics.predictive_metrics.user_growth_forecast.churn_risk < 0.2 ? 'secondary' :
                      'destructive'
                    }>
                      {(analytics.predictive_metrics.user_growth_forecast.churn_risk * 100).toFixed(1)}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Risk Factors
                </CardTitle>
                <CardDescription>
                  AI-identified business risks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.predictive_metrics.token_success_prediction.risk_factors.map((risk, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span className="text-sm">{risk}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
