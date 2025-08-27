/**
 * Enhanced ASA Verification Test Page
 * 
 * This component demonstrates the enhanced ASA verification capabilities
 * and provides quick testing functionality for known Algorand assets.
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { verifyASAEnhanced, ASAVerificationResult } from '@/lib/algorand-asa-verification';
import { ASAVerificationDisplay } from '@/components/ASAVerificationDisplay';
import { 
  TestTube, 
  Zap, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  Database,
  Shield,
  Globe
} from 'lucide-react';

// Known test assets for demonstration
const TEST_ASSETS = {
  mainnet: [
    { id: 31566704, name: 'USDC', description: 'USD Coin on Algorand' },
    { id: 386192725, name: 'goBTC', description: 'Wrapped Bitcoin' },
    { id: 386195940, name: 'goETH', description: 'Wrapped Ethereum' },
    { id: 287867876, name: 'USDt', description: 'Tether USD' }
  ],
  testnet: [
    { id: 10458941, name: 'TestCoin', description: 'Algorand Test Asset' },
    { id: 12345678, name: 'TestUSDC', description: 'Test USDC Asset' }
  ]
};

export default function ASAVerificationTest() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [results, setResults] = useState<Record<string, ASAVerificationResult>>({});
  const [selectedNetwork, setSelectedNetwork] = useState<'mainnet' | 'testnet'>('mainnet');
  const [customAssetId, setCustomAssetId] = useState('');

  const testASA = async (assetId: number, network: 'mainnet' | 'testnet') => {
    const key = `${network}-${assetId}`;
    setIsVerifying(true);
    
    try {
      console.log(`🧪 Testing ASA ${assetId} on ${network}`);
      
      const result = await verifyASAEnhanced(assetId, network, {
        includeDistributionAnalysis: true,
        validateMetadata: true,
        checkCrossNetwork: true,
        timeout: 15000
      });
      
      setResults(prev => ({ ...prev, [key]: result }));
      
      console.log(`✅ Test completed for ASA ${assetId}:`, result);
    } catch (error) {
      console.error(`❌ Test failed for ASA ${assetId}:`, error);
    } finally {
      setIsVerifying(false);
    }
  };

  const testCustomASA = async () => {
    if (!customAssetId || isNaN(Number(customAssetId))) return;
    
    await testASA(Number(customAssetId), selectedNetwork);
  };

  const runBulkTest = async () => {
    setIsVerifying(true);
    const testAssets = TEST_ASSETS[selectedNetwork];
    
    for (const asset of testAssets.slice(0, 2)) { // Test first 2 to avoid rate limits
      await testASA(asset.id, selectedNetwork);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Rate limiting
    }
    
    setIsVerifying(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'caution': return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'risky': return <AlertTriangle className="w-5 h-5 text-orange-400" />;
      case 'danger': return <AlertTriangle className="w-5 h-5 text-red-400" />;
      default: return <Shield className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center space-x-3 glass-card px-6 py-3 rounded-full border border-primary/20">
          <TestTube className="w-5 h-5 text-primary animate-pulse" />
          <span className="text-sm uppercase tracking-wider text-primary font-bold">
            Enhanced ASA Verification Testing
          </span>
        </div>
        
        <h1 className="text-4xl font-bold text-foreground leading-tight">
          ASA Security Analysis 
          <span className="bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent"> Demo</span>
        </h1>
        
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Test the enhanced Algorand Standard Asset verification system with comprehensive security analysis,
          ARC standard compliance checking, and distribution analysis.
        </p>
      </div>

      {/* Network Selection */}
      <div className="flex justify-center">
        <div className="glass-card p-4 border border-border rounded-xl">
          <div className="flex items-center space-x-4">
            <Globe className="w-6 h-6 text-primary" />
            <div className="flex space-x-2">
              <Button
                variant={selectedNetwork === 'mainnet' ? 'default' : 'outline'}
                onClick={() => setSelectedNetwork('mainnet')}
                className="px-6"
              >
                Mainnet
              </Button>
              <Button
                variant={selectedNetwork === 'testnet' ? 'default' : 'outline'}
                onClick={() => setSelectedNetwork('testnet')}
                className="px-6"
              >
                Testnet
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Test Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Predefined Assets */}
        <Card className="glass-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-blue-400" />
              <span>Test Known Assets</span>
            </CardTitle>
            <CardDescription>
              Test verification with well-known {selectedNetwork} assets
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              {TEST_ASSETS[selectedNetwork].map((asset) => (
                <div key={asset.id} className="flex items-center justify-between p-3 glass-card rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">{asset.name}</p>
                    <p className="text-sm text-muted-foreground">ID: {asset.id}</p>
                  </div>
                  <Button
                    onClick={() => testASA(asset.id, selectedNetwork)}
                    disabled={isVerifying}
                    size="sm"
                    variant="outline"
                  >
                    {isVerifying ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
            
            <Button 
              onClick={runBulkTest} 
              disabled={isVerifying}
              className="w-full"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing Assets...
                </>
              ) : (
                <>
                  <TestTube className="w-4 h-4 mr-2" />
                  Test First 2 Assets
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Custom Asset */}
        <Card className="glass-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-green-400" />
              <span>Custom Asset Test</span>
            </CardTitle>
            <CardDescription>
              Enter any Asset ID to test verification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Asset ID</label>
              <input
                type="number"
                placeholder="Enter Asset ID..."
                value={customAssetId}
                onChange={(e) => setCustomAssetId(e.target.value)}
                className="w-full px-3 py-2 glass-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground"
              />
            </div>
            
            <Button 
              onClick={testCustomASA}
              disabled={isVerifying || !customAssetId}
              className="w-full"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Verify Asset
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Results Summary */}
      {Object.keys(results).length > 0 && (
        <Card className="glass-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span>Test Results Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {Object.entries(results).map(([key, result]) => (
                <div key={key} className="glass-card p-4 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(result.status)}
                      <span className="font-medium text-foreground">
                        {result.basicInfo.name}
                      </span>
                    </div>
                    <Badge variant={result.status === 'safe' ? 'default' : 'destructive'}>
                      {result.score}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {result.basicInfo.unitName} • {result.network}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ID: {result.assetId}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Results */}
      {Object.entries(results).map(([key, result]) => (
        <div key={key}>
          <div className="flex items-center space-x-3 mb-4">
            <Badge className="bg-primary/10 text-primary border-primary/30">
              Test Result: {result.basicInfo.name}
            </Badge>
          </div>
          <ASAVerificationDisplay 
            result={result}
            onCopy={(text, label) => {
              navigator.clipboard.writeText(text);
              console.log(`Copied ${label}: ${text}`);
            }}
            onShare={() => {
              console.log('Share functionality would be implemented here');
            }}
            onOpenExplorer={() => window.open(result.explorerUrl, '_blank')}
          />
        </div>
      ))}
      
      {/* Info Alert */}
      <Alert className="glass-card border-blue-500/30 bg-blue-500/5">
        <TestTube className="h-5 w-5 text-blue-400" />
        <AlertDescription className="text-blue-400">
          <strong>Testing Information:</strong> This demonstration uses the enhanced ASA verification system 
          with comprehensive security analysis, ARC standard compliance checking, distribution analysis, 
          and cross-network detection. Results include detailed risk assessment and management role analysis.
        </AlertDescription>
      </Alert>
    </div>
  );
}
