import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Zap, 
  Brain, 
  Shield, 
  BarChart3, 
  CheckCircle, 
  AlertTriangle,
  Info,
  Sparkles,
  Users,
  TrendingUp,
  Clock,
  Layers
} from 'lucide-react';
import { toast } from 'sonner';

// Import all Phase 3 components and hooks
import EnhancedTokenMetadata from './EnhancedTokenMetadata';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { MultisigAuthorityManager } from './MultisigAuthorityManager';
import { useAdvancedMetadataManager } from '@/hooks/use-advanced-metadata-manager';

interface ComprehensiveMetadataManagerProps {
  tokenId: string;
  network: 'algorand' | 'solana';
  walletAddress: string;
  signTransaction: (txn: any) => Promise<any>;
  currentAuthority?: string;
  metadata?: any;
  tokens?: Array<{
    tokenId: string;
    network: 'algorand' | 'solana';
    metadata: any;
  }>;
  onMetadataUpdate?: (metadata: any) => void;
  onAuthorityUpdate?: (newAuthority: string) => void;
}

export function ComprehensiveMetadataManager({
  tokenId,
  network,
  walletAddress,
  signTransaction,
  currentAuthority,
  metadata,
  tokens = [],
  onMetadataUpdate,
  onAuthorityUpdate
}: ComprehensiveMetadataManagerProps) {
  const [activeTab, setActiveTab] = React.useState('metadata');
  const [systemStatus, setSystemStatus] = React.useState({
    metadata: 'active',
    analytics: 'active',
    ai: 'active',
    realtime: 'active',
    multisig: 'inactive'
  });

  // Use advanced metadata manager with all features enabled
  const {
    updateMetadata,
    updateAuthority,
    generateAIMetadata,
    analyzeMetadata,
    executeBatchOperation,
    loading,
    error,
    lastUpdate,
    analytics,
    isConnected,
    metadataUpdates,
    authorityUpdates,
    config,
    updateConfig
  } = useAdvancedMetadataManager(walletAddress, signTransaction, {
    enableRealTimeUpdates: true,
    enableAnalytics: true,
    enableAIFeatures: true,
    enableBatchOperations: true,
    autoValidation: true,
    cacheDuration: 30
  });

  React.useEffect(() => {
    // Update system status based on configuration and connection state
    setSystemStatus({
      metadata: 'active',
      analytics: config.enableAnalytics ? 'active' : 'inactive',
      ai: config.enableAIFeatures ? 'active' : 'inactive',
      realtime: isConnected ? 'active' : 'warning',
      multisig: currentAuthority ? 'active' : 'inactive'
    });
  }, [config, isConnected, currentAuthority]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'inactive': return <Clock className="h-4 w-4 text-gray-400" />;
      default: return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'warning': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'inactive': return <Badge variant="outline" className="text-gray-600">Inactive</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleMetadataUpdate = React.useCallback((newMetadata: any) => {
    onMetadataUpdate?.(newMetadata);
    toast.success('Metadata updated across all systems');
  }, [onMetadataUpdate]);

  const handleAuthorityUpdate = React.useCallback((newAuthority: string) => {
    onAuthorityUpdate?.(newAuthority);
    toast.success('Authority updated successfully');
  }, [onAuthorityUpdate]);

  const toggleFeature = (feature: keyof typeof systemStatus) => {
    switch (feature) {
      case 'analytics':
        updateConfig({ enableAnalytics: !config.enableAnalytics });
        break;
      case 'ai':
        updateConfig({ enableAIFeatures: !config.enableAIFeatures });
        break;
      case 'realtime':
        updateConfig({ enableRealTimeUpdates: !config.enableRealTimeUpdates });
        break;
      default:
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with System Status */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Layers className="h-8 w-8 text-blue-600" />
              Comprehensive Metadata Manager
            </h1>
            <p className="text-gray-600">
              Complete metadata management with AI, analytics, and real-time features
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-blue-600">
              Token: {tokenId.substring(0, 8)}...
            </Badge>
            <Badge variant="outline" className="text-purple-600">
              {network.charAt(0).toUpperCase() + network.slice(1)}
            </Badge>
          </div>
        </div>

        {/* System Status Dashboard */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5" />
              System Status
            </CardTitle>
            <CardDescription>
              Real-time status of all metadata management features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-2">
                  {getStatusIcon(systemStatus.metadata)}
                  <span className="text-sm font-medium">Metadata Core</span>
                </div>
                {getStatusBadge(systemStatus.metadata)}
              </div>

              <div className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-2">
                  {getStatusIcon(systemStatus.analytics)}
                  <span className="text-sm font-medium">Analytics</span>
                </div>
                <button 
                  onClick={() => toggleFeature('analytics')}
                  className="text-xs underline text-blue-600"
                >
                  {getStatusBadge(systemStatus.analytics)}
                </button>
              </div>

              <div className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-2">
                  {getStatusIcon(systemStatus.ai)}
                  <span className="text-sm font-medium">AI Features</span>
                </div>
                <button 
                  onClick={() => toggleFeature('ai')}
                  className="text-xs underline text-blue-600"
                >
                  {getStatusBadge(systemStatus.ai)}
                </button>
              </div>

              <div className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-2">
                  {getStatusIcon(systemStatus.realtime)}
                  <span className="text-sm font-medium">Real-time</span>
                </div>
                <button 
                  onClick={() => toggleFeature('realtime')}
                  className="text-xs underline text-blue-600"
                >
                  {getStatusBadge(systemStatus.realtime)}
                </button>
              </div>

              <div className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-2">
                  {getStatusIcon(systemStatus.multisig)}
                  <span className="text-sm font-medium">Multisig</span>
                </div>
                {getStatusBadge(systemStatus.multisig)}
              </div>
            </div>

            {/* Real-time Activity Indicator */}
            {(metadataUpdates.length > 0 || authorityUpdates.length > 0) && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Recent Activity</span>
                </div>
                <div className="text-sm text-blue-700">
                  {metadataUpdates.length > 0 && (
                    <p>• {metadataUpdates.length} metadata update(s)</p>
                  )}
                  {authorityUpdates.length > 0 && (
                    <p>• {authorityUpdates.length} authority update(s)</p>
                  )}
                  <p className="text-xs mt-1">Last update: {lastUpdate?.toLocaleTimeString()}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Main Feature Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="metadata" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Metadata
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics & AI
          </TabsTrigger>
          <TabsTrigger value="authority" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Authority
          </TabsTrigger>
          <TabsTrigger value="multisig" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Multisig
          </TabsTrigger>
        </TabsList>

        {/* Enhanced Metadata Management */}
        <TabsContent value="metadata" className="space-y-4">
          <EnhancedTokenMetadata
            tokenId={tokenId}
            network={network}
            walletAddress={walletAddress}
            signTransaction={signTransaction}
            currentMetadata={metadata}
            onMetadataUpdate={handleMetadataUpdate}
          />
        </TabsContent>

        {/* Analytics & AI Dashboard */}
        <TabsContent value="analytics" className="space-y-4">
          <AnalyticsDashboard
            walletAddress={walletAddress}
            signTransaction={signTransaction}
            tokens={tokens}
          />
        </TabsContent>

        {/* Authority Management */}
        <TabsContent value="authority" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Authority Management
              </CardTitle>
              <CardDescription>
                Manage token authority and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Current Authority</h4>
                    <p className="text-sm text-gray-600 break-all">
                      {currentAuthority || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Authority Type</h4>
                    <Badge variant={currentAuthority === walletAddress ? 'default' : 'secondary'}>
                      {currentAuthority === walletAddress ? 'You' : 'External'}
                    </Badge>
                  </div>
                </div>

                {currentAuthority === walletAddress && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      You have full authority over this token. You can update metadata, transfer authority, 
                      or set up multisig management below.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Multisig Management */}
        <TabsContent value="multisig" className="space-y-4">
          {currentAuthority === walletAddress ? (
            <MultisigAuthorityManager
              tokenId={tokenId}
              network={network}
              walletAddress={walletAddress}
              signTransaction={signTransaction}
              currentAuthority={currentAuthority}
              onAuthorityUpdate={handleAuthorityUpdate}
            />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Multisig Not Available</h3>
                <p className="text-gray-600 mb-4">
                  You need to be the token authority to set up multisig management.
                </p>
                <p className="text-sm text-gray-500">
                  Current authority: {currentAuthority || 'Not set'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Performance Metrics Footer */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Loading: {loading ? 'Active' : 'Idle'}</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                <span>Analytics: {analytics.length} tokens</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="h-4 w-4" />
                <span>WebSocket: {isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Last update: {lastUpdate ? lastUpdate.toLocaleString() : 'Never'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ComprehensiveMetadataManager;
