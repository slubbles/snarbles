'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Activity, Zap, Shield, TrendingUp, Network, Search } from 'lucide-react';
import ASATestPage from '@/components/ASATestPage';
import AlgorandProviderDashboard from '@/components/AlgorandProviderDashboard';

export default function AlgorandTestSuitePage() {
  const [activeTab, setActiveTab] = useState('verification');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center space-x-3 glass-card px-6 py-3 rounded-full border border-primary/20">
              <Activity className="w-5 h-5 text-primary animate-pulse" />
              <span className="text-sm uppercase tracking-wider text-primary font-bold">
                Algorand Test Suite
              </span>
            </div>
            
            <h1 className="text-4xl font-bold text-foreground leading-tight">
              Algorand Development 
              <span className="bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent"> Testing Tools</span>
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Comprehensive testing tools for Algorand ASA verification and provider performance monitoring.
              Test Nodely.io integration and enhanced verification systems.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 lg:grid-cols-3 bg-card/50 backdrop-blur-sm border border-border">
            <TabsTrigger 
              value="verification" 
              className="flex items-center space-x-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Search className="w-4 h-4" />
              <span>ASA Verification</span>
            </TabsTrigger>
            <TabsTrigger 
              value="providers" 
              className="flex items-center space-x-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Network className="w-4 h-4" />
              <span>Provider Performance</span>
            </TabsTrigger>
            <TabsTrigger 
              value="creation" 
              className="flex items-center space-x-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Zap className="w-4 h-4" />
              <span>Token Creation</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="verification" className="space-y-6">
            <div className="text-center space-y-4 mb-8">
              <div className="inline-flex items-center space-x-2 bg-green-500/10 text-green-400 px-4 py-2 rounded-full border border-green-500/30">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">Enhanced ASA Verification System</span>
              </div>
              <h2 className="text-2xl font-bold">Algorand Standard Asset Verification</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Test the enhanced ASA verification system with comprehensive security analysis, 
                ARC-3/ARC-19 compliance checking, and detailed asset information retrieval.
              </p>
            </div>

            <Alert className="glass-card border-blue-500/30 bg-blue-500/5 mb-6">
              <Activity className="h-5 w-5 text-blue-400" />
              <AlertDescription className="text-blue-400">
                <strong>Test Asset IDs:</strong> Try 3182277509 (example asset), 312769 (USDC), 
                or any valid Algorand ASA ID to see the enhanced verification in action.
              </AlertDescription>
            </Alert>

            <ASATestPage />
          </TabsContent>

          <TabsContent value="providers" className="space-y-6">
            <div className="text-center space-y-4 mb-8">
              <div className="inline-flex items-center space-x-2 bg-purple-500/10 text-purple-400 px-4 py-2 rounded-full border border-purple-500/30">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">Provider Performance Monitoring</span>
              </div>
              <h2 className="text-2xl font-bold">Algorand API Provider Dashboard</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Monitor and compare Algorand API provider performance including Nodely.io and Algonode.cloud. 
                Test response times, reliability, and automatic failover systems.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="glass-card border-green-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span>Nodely.io</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p className="text-muted-foreground">High-performance Algorand APIs</p>
                    <div className="flex justify-between">
                      <span>Rate Limit:</span>
                      <Badge variant="secondary">Enhanced</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Reliability:</span>
                      <Badge className="bg-green-500/10 text-green-400 border-green-500/30">Excellent</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-blue-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                    <span>Algonode.cloud</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p className="text-muted-foreground">Reliable community endpoints</p>
                    <div className="flex justify-between">
                      <span>Rate Limit:</span>
                      <Badge variant="secondary">Standard</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Reliability:</span>
                      <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30">Good</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-yellow-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span>Auto-Failover</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p className="text-muted-foreground">Intelligent provider switching</p>
                    <div className="flex justify-between">
                      <span>Health Checks:</span>
                      <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">Active</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Redundancy:</span>
                      <Badge className="bg-green-500/10 text-green-400 border-green-500/30">Multi-Provider</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <AlgorandProviderDashboard />
          </TabsContent>

          <TabsContent value="creation" className="space-y-6">
            <div className="text-center space-y-4 mb-8">
              <div className="inline-flex items-center space-x-2 bg-orange-500/10 text-orange-400 px-4 py-2 rounded-full border border-orange-500/30">
                <Zap className="w-4 h-4" />
                <span className="text-sm font-medium">Token Creation Testing</span>
              </div>
              <h2 className="text-2xl font-bold">Algorand Token Creation</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Test Algorand token creation with Pera Wallet integration. 
                Supports both testnet and mainnet token creation with comprehensive validation.
              </p>
            </div>

            <Alert className="glass-card border-orange-500/30 bg-orange-500/5 mb-6">
              <Activity className="h-5 w-5 text-orange-400" />
              <AlertDescription className="text-orange-400">
                <strong>Note:</strong> Token creation testing is available on the dedicated mainnet test page. 
                <Button variant="link" className="p-0 h-auto text-orange-400 underline ml-2" asChild>
                  <a href="/test-algo-mainnet">Access Token Creation Testing →</a>
                </Button>
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="glass-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-green-400" />
                    <span>Testnet Creation</span>
                  </CardTitle>
                  <CardDescription>
                    Safe testing environment for token creation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Cost</span>
                      <span className="text-green-400">Free (Testnet ALGO)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Risk</span>
                      <span className="text-green-400">None</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Features</span>
                      <span className="text-muted-foreground">Full testing</span>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" asChild>
                    <a href="/test-algo-mainnet">
                      Test on Algorand Testnet
                    </a>
                  </Button>
                </CardContent>
              </Card>

              <Card className="glass-card border-red-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-red-400" />
                    <span>Mainnet Creation</span>
                  </CardTitle>
                  <CardDescription>
                    Production token creation with real ALGO
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Cost</span>
                      <span className="text-red-400">~0.3 ALGO</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Risk</span>
                      <span className="text-red-400">Real funds</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Features</span>
                      <span className="text-muted-foreground">Production ready</span>
                    </div>
                  </div>
                  <Button variant="destructive" className="w-full" asChild>
                    <a href="/test-algo-mainnet">
                      Create on Algorand Mainnet
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
