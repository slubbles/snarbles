'use client';

import { useState, useEffect } from 'react';
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Wallet, Coins, Settings, Activity, BarChart3 } from 'lucide-react';
import TokenManagement from '@/components/dashboard/TokenManagement';
import UserAnalytics from '@/components/dashboard/UserAnalytics';

export default function AlgorandDashboardTest() {
  const { connected, address: walletAddress } = useAlgorandWallet();
  const [activeTab, setActiveTab] = useState<'overview' | 'portfolio' | 'management' | 'analytics'>('overview');
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState<'24h' | '7d' | '30d' | '90d' | '1y'>('7d');

  if (!connected || !walletAddress) {
    return (
      <div className="min-h-screen app-background flex items-center justify-center">
        <Card className="snarbles-card text-center p-8">
          <CardContent>
            <Wallet className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="snarbles-heading text-xl mb-2">Connect Algorand Wallet</h3>
            <p className="snarbles-body-muted">Please connect your wallet to view the dashboard</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen app-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="snarbles-heading text-3xl mb-8">Algorand Dashboard</h1>
        
        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 snarbles-glass-subtle h-12">
            <TabsTrigger value="overview" className="snarbles-tab">
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="snarbles-tab">
              <Coins className="w-4 h-4 mr-2" />
              Portfolio
            </TabsTrigger>
            <TabsTrigger value="management" className="snarbles-tab">
              <Settings className="w-4 h-4 mr-2" />
              Management
            </TabsTrigger>
            <TabsTrigger value="analytics" className="snarbles-tab">
              <Activity className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card className="snarbles-card">
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Dashboard overview content here</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="portfolio">
            <Card className="snarbles-card">
              <CardHeader>
                <CardTitle>Portfolio</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Portfolio content here</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="management">
            <TokenManagement
              tokens={[]}
              network="algorand"
              userAddress={walletAddress}
              onTokenUpdate={async () => {}}
              onRefresh={() => {}}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <UserAnalytics
              userAddress={walletAddress}
              tokens={[]}
              network="algorand"
              timeframe={analyticsTimeframe}
              onTimeframeChange={setAnalyticsTimeframe}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
