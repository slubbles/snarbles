'use client';

import { useState, useEffect } from 'react';
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider';
import { DashboardLayout } from '@/components/dashboard/shared/DashboardLayout';
import { AlgorandAssetManager } from '@/components/dashboard/algorand/AlgorandAssetManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Plus, ArrowLeft, Snowflake, Send, Settings } from 'lucide-react';
import Link from 'next/link';

export default function AlgorandAssetsPage() {
  const [mounted, setMounted] = useState(false);
  const { connected: algorandConnected, address } = useAlgorandWallet();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading asset management...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!algorandConnected) {
    return (
      <DashboardLayout 
        network="algorand" 
        walletAddress={undefined}
        isConnected={false}
      >
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Card className="glass-card border-green-500/30 bg-green-500/5">
            <CardContent className="text-center p-12">
              <BarChart3 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">Connect Algorand Wallet</h2>
              <p className="text-muted-foreground mb-6">
                You need to connect an Algorand wallet to manage assets
              </p>
              <Link 
                href="/dashboard/algorand"
                className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Link>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      network="algorand" 
      walletAddress={address || undefined}
      isConnected={algorandConnected}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Algorand Asset Management</h1>
            <p className="text-muted-foreground">
              Create, freeze, mint, and manage your ASA tokens with advanced controls
            </p>
          </div>
          
          <div className="flex gap-4">
            <Link 
              href="/create"
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              Create New Asset
            </Link>
          </div>
        </div>

        {/* Asset Management Section */}
        <div className="space-y-8">
          
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="glass-card border-green-500/30 bg-green-500/5">
              <CardContent className="p-6 text-center">
                <Plus className="w-8 h-8 text-green-500 mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-2">Create Asset</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create a new ASA token with custom properties
                </p>
                <Link 
                  href="/create"
                  className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create Asset
                </Link>
              </CardContent>
            </Card>

            <Card className="glass-card border-blue-500/30 bg-blue-500/5">
              <CardContent className="p-6 text-center">
                <Snowflake className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-2">Freeze Control</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Freeze or unfreeze asset accounts
                </p>
                <div className="text-sm text-blue-600 font-medium">
                  Available with assets
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-purple-500/30 bg-purple-500/5">
              <CardContent className="p-6 text-center">
                <Send className="w-8 h-8 text-purple-500 mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-2">Clawback</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Retrieve assets from accounts
                </p>
                <div className="text-sm text-purple-600 font-medium">
                  Admin function
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-orange-500/30 bg-orange-500/5">
              <CardContent className="p-6 text-center">
                <Settings className="w-8 h-8 text-orange-500 mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-2">Configure</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Update asset configuration
                </p>
                <Link 
                  href="/dashboard/algorand/analytics"
                  className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  View Analytics
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Asset Management Component */}
          <AlgorandAssetManager 
            assets={[]} // Will be populated with real data
            onOperation={async (operation, params) => {
              // Implement asset operations here
              console.log('Asset operation:', operation, params);
            }}
            onRefresh={() => {
              // Implement refresh logic here
              console.log('Refreshing assets...');
            }}
          />

          {/* Asset Management Features */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Advanced Asset Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Snowflake className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-foreground">Freeze Management</h4>
                    <p className="text-sm text-muted-foreground">
                      Control asset transferability on a per-account basis
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Send className="w-5 h-5 text-purple-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-foreground">Clawback Operations</h4>
                    <p className="text-sm text-muted-foreground">
                      Retrieve assets from any account for compliance
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Settings className="w-5 h-5 text-orange-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-foreground">Asset Configuration</h4>
                    <p className="text-sm text-muted-foreground">
                      Update URLs, metadata, and other asset properties
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Security Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <h4 className="font-semibold text-green-600 mb-2">Enterprise Security</h4>
                  <ul className="text-sm text-green-600 space-y-1">
                    <li>• Cryptographic proof of asset authenticity</li>
                    <li>• Immutable transaction history</li>
                    <li>• Role-based access controls</li>
                    <li>• Compliance-ready asset management</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
