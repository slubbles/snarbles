'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, DollarSign, Users, Activity, RefreshCw, Calendar, BarChart3, PieChart, AlertCircle } from 'lucide-react';
import {
  getFeeAnalytics,
  getDailyFeeStats,
  getPlatformRevenue,
  getUserFeeHistory,
  type FeeAnalytics as FeeAnalyticsType,
  type DailyFeeStats,
  type UserFeeHistory
} from '@/lib/fee-tracking';

interface FeeAnalyticsProps {
  className?: string;
  showUserHistory?: boolean;
}

export default function FeeAnalytics({ className = '', showUserHistory = false }: FeeAnalyticsProps) {
  const [analytics, setAnalytics] = useState<FeeAnalyticsType[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyFeeStats[]>([]);
  const [userHistory, setUserHistory] = useState<UserFeeHistory[]>([]);
  const [revenue, setRevenue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const [analyticsResult, dailyResult, revenueResult, userResult] = await Promise.all([
        getFeeAnalytics(),
        getDailyFeeStats(30),
        getPlatformRevenue(),
        showUserHistory ? getUserFeeHistory() : Promise.resolve({ success: true, data: [] })
      ]);

      if (!analyticsResult.success) {
        throw new Error(analyticsResult.error || 'Failed to fetch analytics');
      }

      if (!dailyResult.success) {
        throw new Error(dailyResult.error || 'Failed to fetch daily stats');
      }

      if (!revenueResult.success) {
        throw new Error(revenueResult.error || 'Failed to fetch revenue');
      }

      setAnalytics(analyticsResult.data || []);
      setDailyStats(dailyResult.data || []);
      setRevenue(revenueResult.data);
      
      if (showUserHistory && userResult.success) {
        setUserHistory(userResult.data || []);
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching fee analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [showUserHistory]);

  const formatAlgo = (amount: number) => {
    return amount.toFixed(6).replace(/\.?0+$/, '') + ' ALGO';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getSuccessRate = () => {
    if (!revenue) return 0;
    return revenue.totalTransactions > 0 
      ? (revenue.confirmedTransactions / revenue.totalTransactions * 100).toFixed(1)
      : 0;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          <span className="ml-2 text-gray-600">Loading fee analytics...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert className="border-red-500/50 bg-red-500/10">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-400">
              {error}
            </AlertDescription>
          </Alert>
          <Button 
            onClick={fetchAnalytics} 
            variant="outline" 
            className="mt-4"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Platform Fee Analytics</h2>
          <p className="text-gray-400">Real-time revenue and fee collection insights</p>
        </div>
        <div className="flex items-center space-x-4">
          {lastUpdated && (
            <span className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <Button 
            onClick={fetchAnalytics} 
            variant="outline" 
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Revenue Overview Cards */}
      {revenue && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="glass-card bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-300">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">
                {formatAlgo(revenue.totalAlgo)}
              </div>
              <p className="text-xs text-red-200 mt-1">
                From {revenue.confirmedTransactions} confirmed transactions
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card bg-gradient-to-br from-gray-500/10 to-gray-600/10 border-gray-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Mainnet Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {formatAlgo(revenue.mainnetRevenue)}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Production network fees
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card bg-gradient-to-br from-red-500/5 to-red-600/5 border-red-500/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Total Transactions</CardTitle>
              <Activity className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {revenue.totalTransactions.toLocaleString()}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                All fee collection attempts
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-300">Success Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                {getSuccessRate()}%
              </div>
              <p className="text-xs text-green-200 mt-1">
                Transaction confirmation rate
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Network Analytics */}
        <Card className="glass-card bg-gray-900/80 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <PieChart className="w-5 h-5 mr-2 text-red-500" />
              Network Breakdown
            </CardTitle>
            <CardDescription className="text-gray-400">Fee collections by network and status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 border border-gray-700/50">
                  <div className="flex items-center space-x-3">
                    <Badge 
                      variant={item.network.includes('mainnet') ? 'default' : 'secondary'}
                      className={item.network.includes('mainnet') ? 'bg-red-500 text-white' : 'bg-gray-600 text-white'}
                    >
                      {item.network.replace('algorand-', '').toUpperCase()}
                    </Badge>
                    <Badge 
                      variant={item.status === 'confirmed' ? 'default' : 'destructive'}
                      className={item.status === 'confirmed' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}
                    >
                      {item.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-semibold">
                      {formatAlgo(item.total_algos)}
                    </div>
                    <div className="text-sm text-gray-400">
                      {item.transaction_count} transactions
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Daily Statistics */}
        <Card className="glass-card bg-gray-900/80 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-red-500" />
              Recent Activity
            </CardTitle>
            <CardDescription className="text-gray-400">Daily fee collections (last 10 days)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {dailyStats.slice(0, 10).map((day, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded bg-gray-800/30 border border-gray-700/30">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-300 text-sm">
                      {formatDate(day.date)}
                    </span>
                    <Badge 
                      variant={day.network.includes('mainnet') ? 'default' : 'secondary'}
                      className={`text-xs ${day.network.includes('mainnet') ? 'bg-red-500 text-white' : 'bg-gray-600 text-white'}`}
                    >
                      {day.network.replace('algorand-', '')}
                    </Badge>
                    <Badge 
                      variant={day.status === 'confirmed' ? 'default' : 'destructive'}
                      className={`text-xs ${day.status === 'confirmed' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}
                    >
                      {day.status}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-white text-sm font-medium">
                      {formatAlgo(day.total_algos)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {day.transaction_count} txns
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User History (if enabled) */}
      {showUserHistory && userHistory.length > 0 && (
        <Card className="glass-card bg-gray-900/80 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Users className="w-5 h-5 mr-2 text-red-500" />
              Top Users
            </CardTitle>
            <CardDescription className="text-gray-400">Users with highest fee contributions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userHistory
                .sort((a, b) => b.total_fees_paid - a.total_fees_paid)
                .slice(0, 10)
                .map((user, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 border border-gray-700/50">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30 flex items-center justify-center">
                        <span className="text-red-400 font-bold text-sm">#{index + 1}</span>
                      </div>
                      <div>
                        <div className="text-white font-mono text-sm">
                          {user.user_address.slice(0, 8)}...{user.user_address.slice(-8)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {user.total_transactions} transactions • {user.network}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-semibold">
                        {formatAlgo(user.total_fees_paid)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {user.successful_transactions} successful
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer Info */}
      <Card className="glass-card bg-gradient-to-br from-red-500/5 to-red-600/5 border-red-500/20">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
            <span className="text-gray-300 flex items-center">
              <span className="text-red-500 mr-2">💰</span>
              Platform fees help maintain and improve the Snarbles token creation service
            </span>
            <span className="text-gray-400 font-mono text-xs">
              Fee destination: PJEI...WGZ3M
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 