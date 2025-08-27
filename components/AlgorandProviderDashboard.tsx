/**
 * Algorand Provider Performance Dashboard
 * 
 * This component displays real-time information about Algorand API providers,
 * their performance metrics, and allows users to test different endpoints.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  Zap, 
  Globe, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  BarChart3,
  RefreshCw,
  Clock,
  TrendingUp,
  TrendingDown,
  Wifi,
  WifiOff
} from 'lucide-react';
import { 
  providerManager, 
  benchmarkProviders,
  getEnhancedAlgorandClient,
  getEnhancedAlgorandIndexer 
} from '@/lib/algorand-enhanced-providers';

interface ProviderMetrics {
  name: string;
  responseTime: number;
  isHealthy: boolean;
  errorCount: number;
  successCount: number;
  lastChecked: number;
  status: 'fast' | 'slow' | 'error' | 'untested';
}

export default function AlgorandProviderDashboard() {
  const [metrics, setMetrics] = useState<Record<string, ProviderMetrics>>({});
  const [isTesting, setIsTesting] = useState(false);
  const [lastTest, setLastTest] = useState<Date | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<'mainnet' | 'testnet'>('mainnet');
  const [benchmarkResults, setBenchmarkResults] = useState<any>(null);

  useEffect(() => {
    loadProviderStats();
    const interval = setInterval(loadProviderStats, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadProviderStats = () => {
    const stats = providerManager.getProviderStats();
    const formattedMetrics: Record<string, ProviderMetrics> = {};
    
    Object.entries(stats).forEach(([name, health]) => {
      formattedMetrics[name] = {
        name,
        responseTime: health.responseTime,
        isHealthy: health.isHealthy,
        errorCount: health.errorCount,
        successCount: health.successCount,
        lastChecked: health.lastChecked,
        status: health.lastChecked === 0 ? 'untested' :
                health.isHealthy ? 
                  (health.responseTime < 2000 ? 'fast' : 'slow') : 
                  'error'
      };
    });
    
    setMetrics(formattedMetrics);
  };

  const runBenchmark = async () => {
    setIsTesting(true);
    try {
      console.log(`🏃‍♂️ Running provider benchmark for ${selectedNetwork}...`);
      
      const results = await benchmarkProviders(selectedNetwork);
      setBenchmarkResults(results);
      setLastTest(new Date());
      
      // Refresh metrics after benchmark
      setTimeout(loadProviderStats, 1000);
      
      console.log('✅ Benchmark completed:', results);
    } catch (error) {
      console.error('❌ Benchmark failed:', error);
    } finally {
      setIsTesting(false);
    }
  };

  const testProvider = async (providerName: string) => {
    setIsTesting(true);
    try {
      // Test both algod and indexer
      const { client: algodClient, provider: algodProvider } = await getEnhancedAlgorandClient(`algorand-${selectedNetwork}`);
      const { client: indexerClient, provider: indexerProvider } = await getEnhancedAlgorandIndexer(`algorand-${selectedNetwork}`);
      
      console.log(`✅ Successfully tested ${providerName} - Algod: ${algodProvider}, Indexer: ${indexerProvider}`);
      
      setTimeout(loadProviderStats, 1000);
    } catch (error) {
      console.error(`❌ Provider test failed:`, error);
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'fast': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'slow': return <Clock className="w-5 h-5 text-yellow-400" />;
      case 'error': return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case 'untested': return <Wifi className="w-5 h-5 text-gray-400" />;
      default: return <WifiOff className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'fast': return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'slow': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'error': return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'untested': return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    }
  };

  const formatResponseTime = (ms: number) => {
    if (ms === 0) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getHealthPercentage = (metrics: ProviderMetrics) => {
    const total = metrics.successCount + metrics.errorCount;
    if (total === 0) return 0;
    return Math.round((metrics.successCount / total) * 100);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center space-x-3 glass-card px-6 py-3 rounded-full border border-primary/20">
          <Activity className="w-5 h-5 text-primary animate-pulse" />
          <span className="text-sm uppercase tracking-wider text-primary font-bold">
            Algorand Provider Performance
          </span>
        </div>
        
        <h1 className="text-4xl font-bold text-foreground leading-tight">
          Network Performance 
          <span className="bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent"> Dashboard</span>
        </h1>
        
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Monitor Algorand API provider performance, response times, and reliability.
          Includes Nodely.io and Algonode.cloud endpoint comparison.
        </p>
      </div>

      {/* Network Selection & Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Globe className="w-6 h-6 text-primary" />
          <div className="flex space-x-2">
            <Button
              variant={selectedNetwork === 'mainnet' ? 'default' : 'outline'}
              onClick={() => setSelectedNetwork('mainnet')}
            >
              Mainnet
            </Button>
            <Button
              variant={selectedNetwork === 'testnet' ? 'default' : 'outline'}
              onClick={() => setSelectedNetwork('testnet')}
            >
              Testnet
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {lastTest && (
            <p className="text-sm text-muted-foreground">
              Last tested: {lastTest.toLocaleTimeString()}
            </p>
          )}
          <Button 
            onClick={runBenchmark}
            disabled={isTesting}
            className="bg-primary hover:bg-primary/90"
          >
            {isTesting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Run Benchmark
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Provider Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(metrics).map(([name, metric]) => (
          <Card key={name} className={`glass-card border-2 ${getStatusColor(metric.status)}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(metric.status)}
                  <div>
                    <CardTitle className="text-lg">{metric.name}</CardTitle>
                    <CardDescription className="capitalize">
                      {metric.status} provider
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={metric.isHealthy ? 'default' : 'destructive'}>
                  {metric.isHealthy ? 'Healthy' : 'Issues'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Response Time */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Response Time</span>
                  <span className="font-medium">{formatResponseTime(metric.responseTime)}</span>
                </div>
                <Progress 
                  value={Math.min((5000 - metric.responseTime) / 50, 100)} 
                  className="h-2" 
                />
              </div>

              {/* Success Rate */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Success Rate</span>
                  <span className="font-medium">{getHealthPercentage(metric)}%</span>
                </div>
                <Progress value={getHealthPercentage(metric)} className="h-2" />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Successful</p>
                  <p className="font-bold text-green-400">{metric.successCount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Errors</p>
                  <p className="font-bold text-red-400">{metric.errorCount}</p>
                </div>
              </div>

              {/* Test Button */}
              <Button 
                onClick={() => testProvider(name)}
                disabled={isTesting}
                variant="outline"
                className="w-full"
              >
                {isTesting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 mr-2" />
                )}
                Test Provider
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Benchmark Results */}
      {benchmarkResults && (
        <Card className="glass-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-green-400" />
              <span>Benchmark Results</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-foreground">Performance Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fastest Provider:</span>
                    <Badge className="bg-green-500/10 text-green-400 border-green-500/30">
                      {benchmarkResults.fastest}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Recommended:</span>
                    <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                      {benchmarkResults.recommended}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-foreground">Provider Rankings</h4>
                <div className="space-y-2">
                  {benchmarkResults.results
                    .sort((a: any, b: any) => a.responseTime - b.responseTime)
                    .map((result: any, index: number) => (
                      <div key={result.name} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-muted-foreground">#{index + 1}</span>
                          <span className="font-medium">{result.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatResponseTime(result.responseTime)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Alert */}
      <Alert className="glass-card border-blue-500/30 bg-blue-500/5">
        <Activity className="h-5 w-5 text-blue-400" />
        <AlertDescription className="text-blue-400">
          <strong>Provider Information:</strong> The system automatically selects the best performing provider 
          for each request. Nodely.io typically offers faster response times and higher rate limits, 
          while Algonode.cloud provides reliable fallback service. Response times under 2 seconds are considered fast.
        </AlertDescription>
      </Alert>
    </div>
  );
}
