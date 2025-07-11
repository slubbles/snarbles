'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Coins, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Target,
  Zap
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

// Mock data - replace with real API calls
const mockRevenueData = [
  { date: '2025-01-01', revenue: 150, tokens: 30, users: 15 },
  { date: '2025-01-02', revenue: 280, tokens: 56, users: 28 },
  { date: '2025-01-03', revenue: 420, tokens: 84, users: 42 },
  { date: '2025-01-04', revenue: 380, tokens: 76, users: 38 },
  { date: '2025-01-05', revenue: 650, tokens: 130, users: 65 },
  { date: '2025-01-06', revenue: 520, tokens: 104, users: 52 },
  { date: '2025-01-07', revenue: 890, tokens: 178, users: 89 },
];

const tierData = [
  { name: 'Basic', value: 60, color: '#3b82f6' },
  { name: 'Pro', value: 30, color: '#8b5cf6' },
  { name: 'Enterprise', value: 10, color: '#ef4444' },
];

export default function RevenueDashboard() {
  const [timeRange, setTimeRange] = useState('7d');
  const [totalRevenue, setTotalRevenue] = useState(3290);
  const [monthlyGrowth, setMonthlyGrowth] = useState(24.5);
  const [tokensCreated, setTokensCreated] = useState(658);
  const [activeUsers, setActiveUsers] = useState(329);

  // Calculate metrics
  const avgRevenuePerToken = totalRevenue / tokensCreated;
  const conversionRate = (tokensCreated / activeUsers) * 100;

  return (
    <div className="min-h-screen app-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Revenue Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Track your Snarbles platform earnings and growth
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant={timeRange === '7d' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setTimeRange('7d')}
            >
              7 Days
            </Button>
            <Button 
              variant={timeRange === '30d' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setTimeRange('30d')}
            >
              30 Days
            </Button>
            <Button 
              variant={timeRange === '90d' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setTimeRange('90d')}
            >
              90 Days
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="glass-card border-green-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">${totalRevenue.toLocaleString()}</div>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +{monthlyGrowth}% from last month
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-blue-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tokens Created</CardTitle>
              <Coins className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{tokensCreated.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground mt-1">
                ${avgRevenuePerToken.toFixed(2)} avg per token
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-purple-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-500">{activeUsers.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {conversionRate.toFixed(1)}% conversion rate
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-orange-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Goal</CardTitle>
              <Target className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">$5,000</div>
              <div className="mt-2">
                <Progress value={(totalRevenue / 5000) * 100} className="h-2" />
                <div className="text-xs text-muted-foreground mt-1">
                  {((totalRevenue / 5000) * 100).toFixed(1)}% of goal
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
                Revenue Trend
              </CardTitle>
              <CardDescription>Daily revenue over the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={mockRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#22c55e" 
                    strokeWidth={3}
                    dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Tier Distribution */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="h-5 w-5 mr-2 text-blue-500" />
                Plan Distribution
              </CardTitle>
              <CardDescription>Revenue by pricing tier</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={tierData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {tierData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2 text-yellow-500" />
              Recent Transactions
            </CardTitle>
            <CardDescription>Latest token creations and revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { user: 'john_crypto', token: 'MOON', tier: 'Pro', amount: '$12', time: '2 min ago' },
                { user: 'alice_dev', token: 'ALICE', tier: 'Basic', amount: '$5', time: '15 min ago' },
                { user: 'bob_startup', token: 'STARTUP', tier: 'Enterprise', amount: '$75', time: '1 hour ago' },
                { user: 'crypto_guru', token: 'GURU', tier: 'Pro', amount: '$12', time: '2 hours ago' },
                { user: 'defi_master', token: 'DEFI', tier: 'Basic', amount: '$5', time: '3 hours ago' },
              ].map((tx, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/10 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {tx.token.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{tx.user}</p>
                      <p className="text-sm text-muted-foreground">Created {tx.token}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <Badge variant={tx.tier === 'Enterprise' ? 'default' : tx.tier === 'Pro' ? 'secondary' : 'outline'}>
                        {tx.tier}
                      </Badge>
                      <span className="font-bold text-green-500">{tx.amount}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{tx.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-card border-blue-500/20">
            <CardHeader>
              <CardTitle className="text-lg">Marketing Boost</CardTitle>
              <CardDescription>Increase visibility and conversions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button className="w-full" variant="outline">
                  Create Twitter Thread
                </Button>
                <Button className="w-full" variant="outline">
                  Launch Referral Campaign
                </Button>
                <Button className="w-full" variant="outline">
                  Contact Influencers
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-green-500/20">
            <CardHeader>
              <CardTitle className="text-lg">Revenue Optimization</CardTitle>
              <CardDescription>Maximize earnings potential</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button className="w-full" variant="outline">
                  A/B Test Pricing
                </Button>
                <Button className="w-full" variant="outline">
                  Add Premium Features
                </Button>
                <Button className="w-full" variant="outline">
                  Launch Enterprise Sales
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-lg">Growth Metrics</CardTitle>
              <CardDescription>Key performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Monthly Recurring Revenue</span>
                    <span className="font-bold">$1,250</span>
                  </div>
                  <Progress value={62} className="h-2 mt-1" />
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Customer Lifetime Value</span>
                    <span className="font-bold">$45</span>
                  </div>
                  <Progress value={75} className="h-2 mt-1" />
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Monthly Growth Rate</span>
                    <span className="font-bold">24.5%</span>
                  </div>
                  <Progress value={84} className="h-2 mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
