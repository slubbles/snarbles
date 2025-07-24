'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, Wifi, Clock, Database, Zap, AlertTriangle, 
  CheckCircle, RefreshCw, Settings, TrendingUp
} from 'lucide-react';
import { useRealTimeData } from '@/lib/real-time-data';

interface PerformanceMetrics {
  webSocket: {
    connected: boolean;
    latency: number;
    reconnections: number;
    messagesReceived: number;
    lastMessageTime: number;
  };
  api: {
    responseTime: number;
    successRate: number;
    errorRate: number;
    requestsPerMinute: number;
  };
  cache: {
    hitRate: number;
    totalKeys: number;
    memoryUsage: number;
    evictions: number;
  };
  blockchain: {
    algorand: {
      nodeLatency: number;
      blockHeight: number;
      transactionThroughput: number;
    };
    solana: {
      nodeLatency: number;
      slotHeight: number;
      transactionThroughput: number;
    };
  };
  system: {
    cpuUsage: number;
    memoryUsage: number;
    networkSpeed: number;
    batteryLevel?: number;
  };
}

interface PerformanceMonitorProps {
  walletAddress?: string;
  network?: 'algorand' | 'solana' | 'all';
  compact?: boolean;
}

export default function PerformanceMonitor({ 
  walletAddress, 
  network = 'all', 
  compact = false 
}: PerformanceMonitorProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Real-time performance data
  const { 
    data: performanceMetrics, 
    loading, 
    refresh: refreshMetrics 
  } = useRealTimeData<PerformanceMetrics>(
    `performance:${network}:${walletAddress || 'global'}`,
    fetchPerformanceMetrics,
    { enabled: true }
  );

  // Auto-refresh performance metrics
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refreshMetrics();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, refreshMetrics]);

  async function fetchPerformanceMetrics(): Promise<PerformanceMetrics> {
    // Simulate real performance monitoring
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      webSocket: {
        connected: Math.random() > 0.1, // 90% uptime
        latency: Math.random() * 100 + 20,
        reconnections: Math.floor(Math.random() * 3),
        messagesReceived: Math.floor(Math.random() * 1000),
        lastMessageTime: Date.now() - Math.random() * 30000
      },
      api: {
        responseTime: Math.random() * 500 + 100,
        successRate: 95 + Math.random() * 5,
        errorRate: Math.random() * 5,
        requestsPerMinute: Math.floor(Math.random() * 100 + 50)
      },
      cache: {
        hitRate: 80 + Math.random() * 20,
        totalKeys: Math.floor(Math.random() * 100 + 50),
        memoryUsage: Math.random() * 50 + 20,
        evictions: Math.floor(Math.random() * 10)
      },
      blockchain: {
        algorand: {
          nodeLatency: Math.random() * 200 + 50,
          blockHeight: Math.floor(Math.random() * 1000000),
          transactionThroughput: Math.random() * 1000 + 500
        },
        solana: {
          nodeLatency: Math.random() * 100 + 30,
          slotHeight: Math.floor(Math.random() * 2000000),
          transactionThroughput: Math.random() * 5000 + 2000
        }
      },
      system: {
        cpuUsage: Math.random() * 60 + 20,
        memoryUsage: Math.random() * 70 + 30,
        networkSpeed: Math.random() * 100 + 50,
        batteryLevel: typeof navigator !== 'undefined' && 'getBattery' in navigator 
          ? Math.random() * 100 
          : undefined
      }
    };
  }

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return 'text-green-500';
    if (value >= thresholds.warning) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getLatencyColor = (latency: number) => {
    if (latency < 100) return 'text-green-500';
    if (latency < 300) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (loading && !performanceMetrics) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="h-32 bg-muted/20 animate-pulse rounded-lg"></div>
        </CardContent>
      </Card>
    );
  }

  if (compact && performanceMetrics) {
    return (
      <Card className="glass-card border-blue-500/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${performanceMetrics.webSocket.connected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm font-medium">System Status</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {performanceMetrics.api.responseTime.toFixed(0)}ms
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="h-6 w-6 p-0"
              >
                <Settings className="w-3 h-3" />
              </Button>
            </div>
          </div>
          
          {showDetails && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span>API Success Rate</span>
                <span className={getStatusColor(performanceMetrics.api.successRate, { good: 95, warning: 90 })}>
                  {performanceMetrics.api.successRate.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Cache Hit Rate</span>
                <span className={getStatusColor(performanceMetrics.cache.hitRate, { good: 80, warning: 60 })}>
                  {performanceMetrics.cache.hitRate.toFixed(1)}%
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!performanceMetrics) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Performance Monitor</h3>
          <p className="text-muted-foreground text-sm">
            Real-time system and network performance metrics
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-500/10 border-green-500/30' : ''}
          >
            <Activity className={`w-4 h-4 mr-2 ${autoRefresh ? 'text-green-500' : ''}`} />
            Auto-refresh
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={refreshMetrics}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Real-time Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* WebSocket Status */}
        <Card className="glass-card border-blue-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">WebSocket</CardTitle>
            <Wifi className={`h-4 w-4 ${performanceMetrics.webSocket.connected ? 'text-green-500' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performanceMetrics.webSocket.connected ? 'Connected' : 'Disconnected'}
            </div>
            <div className={`text-xs ${getLatencyColor(performanceMetrics.webSocket.latency)}`}>
              Latency: {performanceMetrics.webSocket.latency.toFixed(0)}ms
            </div>
          </CardContent>
        </Card>

        {/* API Performance */}
        <Card className="glass-card border-green-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Response</CardTitle>
            <Clock className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performanceMetrics.api.responseTime.toFixed(0)}ms
            </div>
            <div className={`text-xs ${getStatusColor(performanceMetrics.api.successRate, { good: 95, warning: 90 })}`}>
              Success: {performanceMetrics.api.successRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        {/* Cache Performance */}
        <Card className="glass-card border-purple-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache</CardTitle>
            <Database className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performanceMetrics.cache.hitRate.toFixed(0)}%
            </div>
            <div className="text-xs text-muted-foreground">
              {performanceMetrics.cache.totalKeys} keys
            </div>
          </CardContent>
        </Card>

        {/* System Resources */}
        <Card className="glass-card border-orange-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System</CardTitle>
            <Zap className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performanceMetrics.system.cpuUsage.toFixed(0)}%
            </div>
            <div className="text-xs text-muted-foreground">
              CPU Usage
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Blockchain Performance */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Blockchain Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Algorand */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Algorand</span>
                <Badge variant="outline" className="text-green-400 border-green-400">
                  {performanceMetrics.blockchain.algorand.nodeLatency.toFixed(0)}ms
                </Badge>
              </div>
              <Progress 
                value={Math.min(100, (300 - performanceMetrics.blockchain.algorand.nodeLatency) / 3)} 
                className="h-2"
              />
              <div className="text-xs text-muted-foreground">
                Block: {performanceMetrics.blockchain.algorand.blockHeight.toLocaleString()}
              </div>
            </div>

            {/* Solana */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Solana</span>
                <Badge variant="outline" className="text-purple-400 border-purple-400">
                  {performanceMetrics.blockchain.solana.nodeLatency.toFixed(0)}ms
                </Badge>
              </div>
              <Progress 
                value={Math.min(100, (200 - performanceMetrics.blockchain.solana.nodeLatency) / 2)} 
                className="h-2"
              />
              <div className="text-xs text-muted-foreground">
                Slot: {performanceMetrics.blockchain.solana.slotHeight.toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Real-time Activity */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Real-time Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">WebSocket Messages</span>
              <span className="font-mono text-sm">
                {performanceMetrics.webSocket.messagesReceived.toLocaleString()}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">API Requests/min</span>
              <span className="font-mono text-sm">
                {performanceMetrics.api.requestsPerMinute}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">Cache Evictions</span>
              <span className="font-mono text-sm">
                {performanceMetrics.cache.evictions}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">Last Update</span>
              <span className="text-xs text-muted-foreground">
                {new Date(performanceMetrics.webSocket.lastMessageTime).toLocaleTimeString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Health Indicators */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>System Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              {performanceMetrics.webSocket.connected ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-500" />
              )}
              <div>
                <div className="font-medium">Real-time Connection</div>
                <div className="text-xs text-muted-foreground">
                  {performanceMetrics.webSocket.reconnections} reconnections
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {performanceMetrics.api.successRate > 95 ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
              )}
              <div>
                <div className="font-medium">API Health</div>
                <div className="text-xs text-muted-foreground">
                  {performanceMetrics.api.errorRate.toFixed(1)}% error rate
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {performanceMetrics.cache.hitRate > 80 ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
              )}
              <div>
                <div className="font-medium">Cache Efficiency</div>
                <div className="text-xs text-muted-foreground">
                  {performanceMetrics.cache.memoryUsage.toFixed(1)}MB used
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
