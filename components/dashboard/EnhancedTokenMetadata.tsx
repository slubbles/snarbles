'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { 
  Settings, 
  Edit, 
  Shield, 
  History, 
  Wand2, 
  Eye, 
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useMetadataManager } from '@/hooks/use-metadata-manager';
import { useToast } from '@/hooks/use-toast';

// Import our new metadata components
import MetadataEditor from './metadata/MetadataEditor';
import AuthorityManager from './metadata/AuthorityManager';
import MetadataHistory from './metadata/MetadataHistory';
import MetadataWizard from './metadata/MetadataWizard';

interface EnhancedTokenMetadataProps {
  tokenId: string;
  network: 'algorand' | 'solana';
  walletAddress?: string;
  currentMetadata?: any;
  signTransaction?: (txn: any) => Promise<any>;
  onMetadataUpdate?: (metadata: any) => void;
}

export default function EnhancedTokenMetadata({
  tokenId,
  network,
  walletAddress,
  currentMetadata,
  signTransaction,
  onMetadataUpdate
}: EnhancedTokenMetadataProps) {
  const { toast } = useToast();
  
  // State for dialog visibility
  const [showEditor, setShowEditor] = useState(false);
  const [showAuthority, setShowAuthority] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  
  // Use the metadata manager hook
  const {
    isLoading,
    isUpdating,
    hasError,
    error,
    lastUpdate,
    authorityInfo,
    history,
    updateMetadata,
    updateAuthority,
    refresh,
    estimateCost,
    validateMetadata,
    realtimeUpdates
  } = useMetadataManager({
    tokenId,
    network,
    walletAddress,
    autoSubscribe: true
  });

  // Handle metadata update from components
  const handleMetadataUpdate = async (metadata: any) => {
    if (!signTransaction) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to update metadata",
        variant: "destructive"
      });
      return { success: false, error: 'Wallet not connected' };
    }

    const result = await updateMetadata(metadata, signTransaction);
    
    if (result.success) {
      onMetadataUpdate?.(metadata);
      setShowEditor(false);
      setShowWizard(false);
    }
    
    return result;
  };

  // Handle authority update from components
  const handleAuthorityUpdate = async (operation: string, params: any) => {
    if (!signTransaction) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to update authority",
        variant: "destructive"
      });
      return { success: false, error: 'Wallet not connected' };
    }

    const result = await updateAuthority(operation, params, signTransaction);
    
    if (result.success) {
      setShowAuthority(false);
    }
    
    return result;
  };

  // Get status indicator
  const getStatusIndicator = () => {
    if (isUpdating) {
      return <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />;
    }
    if (hasError) {
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
    if (lastUpdate) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    return null;
  };

  // Get permission summary
  const getPermissionSummary = () => {
    if (!authorityInfo) return 'Loading...';
    
    const permissions = [];
    if (authorityInfo.hasUpdatePermission) permissions.push('Update');
    if (authorityInfo.mintAuthority === walletAddress) permissions.push('Mint');
    if (authorityInfo.freezeAuthority === walletAddress) permissions.push('Freeze');
    
    return permissions.length > 0 ? permissions.join(', ') : 'No permissions';
  };

  return (
    <div className="space-y-6">
      {/* Main Metadata Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Enhanced Metadata Management
                {getStatusIndicator()}
              </CardTitle>
              <CardDescription>
                Advanced metadata and authority management for {network} token {tokenId}
              </CardDescription>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                disabled={isLoading}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Status and Real-time Updates */}
          {(isUpdating || realtimeUpdates.metadata.length > 0 || realtimeUpdates.authority.length > 0) && (
            <div className="p-4 border rounded-lg bg-muted/50">
              <h4 className="font-medium mb-2">Real-time Status</h4>
              
              {isUpdating && (
                <div className="flex items-center gap-2 text-yellow-600">
                  <Clock className="w-4 h-4 animate-pulse" />
                  <span>Transaction pending...</span>
                </div>
              )}
              
              {realtimeUpdates.metadata.slice(0, 3).map((update, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <Badge variant={update.status === 'confirmed' ? 'default' : 'secondary'}>
                    {update.status}
                  </Badge>
                  <span>Metadata update by {update.updatedBy.slice(0, 8)}...</span>
                </div>
              ))}
              
              {realtimeUpdates.authority.slice(0, 3).map((update, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <Badge variant={update.status === 'confirmed' ? 'default' : 'secondary'}>
                    {update.status}
                  </Badge>
                  <span>Authority {update.operation} by {update.from.slice(0, 8)}...</span>
                </div>
              ))}
            </div>
          )}

          {/* Error Display */}
          {hasError && (
            <div className="p-4 border border-red-200 rounded-lg bg-red-50">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">Error</span>
              </div>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          )}

          {/* Authority Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Your Permissions</h4>
              <p className="text-sm text-muted-foreground">
                {getPermissionSummary()}
              </p>
              {authorityInfo?.restrictions.length > 0 && (
                <div className="text-xs text-yellow-600">
                  Restrictions: {authorityInfo.restrictions.join(', ')}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Last Updated</h4>
              <p className="text-sm text-muted-foreground">
                {lastUpdate ? lastUpdate.toLocaleString() : 'Never'}
              </p>
              {history && history.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  {history.length} total changes
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {/* Metadata Editor */}
            <Dialog open={showEditor} onOpenChange={setShowEditor}>
              <DialogTrigger asChild>
                <Button variant="outline" disabled={!authorityInfo?.hasUpdatePermission}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Metadata
                </Button>
              </DialogTrigger>
              <MetadataEditor
                token={{ id: tokenId, network } as any}
                userAddress={walletAddress || ''}
                onUpdate={handleMetadataUpdate}
                isOpen={showEditor}
                onClose={() => setShowEditor(false)}
              />
            </Dialog>

            {/* Metadata Wizard */}
            <Dialog open={showWizard} onOpenChange={setShowWizard}>
              <DialogTrigger asChild>
                <Button variant="outline" disabled={!authorityInfo?.hasUpdatePermission}>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Metadata Wizard
                </Button>
              </DialogTrigger>
              <MetadataWizard
                tokenId={tokenId}
                network={network}
                currentMetadata={currentMetadata}
                onComplete={handleMetadataUpdate}
                isOpen={showWizard}
                onClose={() => setShowWizard(false)}
              />
            </Dialog>

            {/* Authority Manager */}
            <Dialog open={showAuthority} onOpenChange={setShowAuthority}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  disabled={!authorityInfo?.hasUpdatePermission && !authorityInfo?.canRevoke}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Manage Authority
                </Button>
              </DialogTrigger>
              {authorityInfo && (
                <AuthorityManager
                  tokenId={tokenId}
                  network={network}
                  userAddress={walletAddress || ''}
                  authorityInfo={authorityInfo}
                  onAuthorityUpdate={handleAuthorityUpdate}
                  onRefresh={refresh}
                  isOpen={showAuthority}
                  onClose={() => setShowAuthority(false)}
                />
              )}
            </Dialog>

            {/* History Viewer */}
            <Dialog open={showHistory} onOpenChange={setShowHistory}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <History className="w-4 h-4 mr-2" />
                  View History
                </Button>
              </DialogTrigger>
              <MetadataHistory
                tokenId={tokenId}
                network={network}
                history={history || []}
                onRevert={async (versionId: string) => {
                  // Implement revert functionality
                  toast({
                    title: "Revert Not Implemented",
                    description: "Metadata revert functionality is coming soon",
                    variant: "default"
                  });
                  return { success: false, error: 'Not implemented' };
                }}
                onRefresh={refresh}
                isOpen={showHistory}
                onClose={() => setShowHistory(false)}
              />
            </Dialog>

            {/* Preview Current Metadata */}
            {currentMetadata && (
              <Button
                variant="outline"
                onClick={() => {
                  // Open metadata in a new tab/modal for preview
                  console.log('Current metadata:', currentMetadata);
                }}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
            )}

            {/* External Links */}
            {network === 'algorand' && (
              <Button
                variant="outline"
                onClick={() => {
                  const explorerUrl = `https://testnet.algoexplorer.io/asset/${tokenId}`;
                  window.open(explorerUrl, '_blank');
                }}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                AlgoExplorer
              </Button>
            )}

            {network === 'solana' && (
              <Button
                variant="outline"
                onClick={() => {
                  const explorerUrl = `https://explorer.solana.com/address/${tokenId}?cluster=devnet`;
                  window.open(explorerUrl, '_blank');
                }}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Solana Explorer
              </Button>
            )}
          </div>

          {/* Cost Estimates */}
          <div className="text-xs text-muted-foreground">
            <p>
              Estimated costs: Metadata update ~{network === 'algorand' ? '0.001 ALGO' : '0.0015 SOL'} • 
              Authority transfer ~{network === 'algorand' ? '0.001 ALGO' : '0.001 SOL'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
