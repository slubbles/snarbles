'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Flame, 
  Send, 
  Settings, 
  AlertTriangle,
  Loader2,
  Copy,
  ExternalLink,
  Shield,
  Lock,
  Unlock,
  RotateCcw,
  FileText,
  Coins
} from 'lucide-react';

interface AlgorandAsset {
  assetId: number;
  name: string;
  unitName: string;
  decimals: number;
  total: number;
  creator: string;
  manager?: string;
  reserve?: string;
  freeze?: string;
  clawback?: string;
  defaultFrozen: boolean;
  url?: string;
  metadata?: string;
  isFrozen?: boolean;
  balance?: number;
  canManage?: boolean;
  canFreeze?: boolean;
  canClawback?: boolean;
}

interface AlgorandAssetManagerProps {
  assets: AlgorandAsset[];
  onOperation: (operation: string, params: any) => Promise<void>;
  onRefresh: () => void;
}

interface OperationDialog {
  type: 'mint' | 'burn' | 'transfer' | 'freeze' | 'unfreeze' | 'clawback' | 'config' | null;
  asset: AlgorandAsset | null;
}

export function AlgorandAssetManager({ assets, onOperation, onRefresh }: AlgorandAssetManagerProps) {
  const [operationDialog, setOperationDialog] = useState<OperationDialog>({ type: null, asset: null });
  const [operationParams, setOperationParams] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleOperation = async (type: string, params: any) => {
    setIsLoading(true);
    try {
      await onOperation(type, params);
      setOperationDialog({ type: null, asset: null });
      setOperationParams({});
      onRefresh();
      
      toast({
        title: "Operation Successful",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} operation completed successfully`,
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Operation Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (asset: AlgorandAsset) => {
    if (asset.isFrozen) {
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Frozen</Badge>;
    }
    if (asset.canManage) {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Manageable</Badge>;
    }
    return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Standard</Badge>;
  };

  const getPermissionBadges = (asset: AlgorandAsset) => {
    const badges = [];
    
    if (asset.canManage) {
      badges.push(
        <Badge key="manage" className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
          <Settings className="w-3 h-3 mr-1" />
          Manager
        </Badge>
      );
    }
    
    if (asset.canFreeze) {
      badges.push(
        <Badge key="freeze" className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">
          <Lock className="w-3 h-3 mr-1" />
          Freezer
        </Badge>
      );
    }
    
    if (asset.canClawback) {
      badges.push(
        <Badge key="clawback" className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
          <RotateCcw className="w-3 h-3 mr-1" />
          Clawback
        </Badge>
      );
    }
    
    return badges;
  };

  const renderOperationDialog = () => {
    if (!operationDialog.type || !operationDialog.asset) return null;

    const { type, asset } = operationDialog;

    return (
      <Dialog open={true} onOpenChange={() => setOperationDialog({ type: null, asset: null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {type === 'mint' && <Plus className="w-5 h-5 text-green-500" />}
              {type === 'burn' && <Flame className="w-5 h-5 text-red-500" />}
              {type === 'transfer' && <Send className="w-5 h-5 text-blue-500" />}
              {type === 'freeze' && <Lock className="w-5 h-5 text-orange-500" />}
              {type === 'unfreeze' && <Unlock className="w-5 h-5 text-green-500" />}
              {type === 'clawback' && <RotateCcw className="w-5 h-5 text-red-500" />}
              {type === 'config' && <Settings className="w-5 h-5 text-purple-500" />}
              {type.charAt(0).toUpperCase() + type.slice(1)} {asset.name}
            </DialogTitle>
            <DialogDescription>
              Asset ID: {asset.assetId} • {asset.unitName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Mint Operation */}
            {type === 'mint' && (
              <>
                <div>
                  <Label htmlFor="mintAmount">Amount to Mint</Label>
                  <Input
                    id="mintAmount"
                    type="number"
                    placeholder="Enter amount"
                    value={operationParams.amount || ''}
                    onChange={(e) => setOperationParams({ ...operationParams, amount: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="mintTo">Mint to Address</Label>
                  <Input
                    id="mintTo"
                    placeholder="Recipient address"
                    value={operationParams.to || ''}
                    onChange={(e) => setOperationParams({ ...operationParams, to: e.target.value })}
                  />
                </div>
              </>
            )}

            {/* Burn Operation */}
            {type === 'burn' && (
              <>
                <div>
                  <Label htmlFor="burnAmount">Amount to Burn</Label>
                  <Input
                    id="burnAmount"
                    type="number"
                    placeholder="Enter amount"
                    value={operationParams.amount || ''}
                    onChange={(e) => setOperationParams({ ...operationParams, amount: e.target.value })}
                  />
                </div>
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <span>This action permanently destroys tokens and cannot be undone.</span>
                  </div>
                </div>
              </>
            )}

            {/* Transfer Operation */}
            {type === 'transfer' && (
              <>
                <div>
                  <Label htmlFor="transferAmount">Amount to Transfer</Label>
                  <Input
                    id="transferAmount"
                    type="number"
                    placeholder="Enter amount"
                    value={operationParams.amount || ''}
                    onChange={(e) => setOperationParams({ ...operationParams, amount: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="transferTo">Transfer to Address</Label>
                  <Input
                    id="transferTo"
                    placeholder="Recipient address"
                    value={operationParams.to || ''}
                    onChange={(e) => setOperationParams({ ...operationParams, to: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="transferNote">Note (Optional)</Label>
                  <Input
                    id="transferNote"
                    placeholder="Transaction note"
                    value={operationParams.note || ''}
                    onChange={(e) => setOperationParams({ ...operationParams, note: e.target.value })}
                  />
                </div>
              </>
            )}

            {/* Freeze/Unfreeze Operations */}
            {(type === 'freeze' || type === 'unfreeze') && (
              <>
                <div>
                  <Label htmlFor="freezeTarget">Target Address</Label>
                  <Input
                    id="freezeTarget"
                    placeholder="Address to freeze/unfreeze"
                    value={operationParams.target || ''}
                    onChange={(e) => setOperationParams({ ...operationParams, target: e.target.value })}
                  />
                </div>
                <div className={`${type === 'freeze' ? 'bg-orange-500/10 border-orange-500/30' : 'bg-green-500/10 border-green-500/30'} border rounded-lg p-3`}>
                  <div className={`flex items-center gap-2 ${type === 'freeze' ? 'text-orange-400' : 'text-green-400'} text-sm`}>
                    {type === 'freeze' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    <span>
                      This will {type} the asset for the specified address.
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Clawback Operation */}
            {type === 'clawback' && (
              <>
                <div>
                  <Label htmlFor="clawbackAmount">Amount to Clawback</Label>
                  <Input
                    id="clawbackAmount"
                    type="number"
                    placeholder="Enter amount"
                    value={operationParams.amount || ''}
                    onChange={(e) => setOperationParams({ ...operationParams, amount: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="clawbackFrom">Clawback from Address</Label>
                  <Input
                    id="clawbackFrom"
                    placeholder="Source address"
                    value={operationParams.from || ''}
                    onChange={(e) => setOperationParams({ ...operationParams, from: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="clawbackTo">Clawback to Address</Label>
                  <Input
                    id="clawbackTo"
                    placeholder="Destination address"
                    value={operationParams.to || ''}
                    onChange={(e) => setOperationParams({ ...operationParams, to: e.target.value })}
                  />
                </div>
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Clawback forcibly moves assets from one account to another.</span>
                  </div>
                </div>
              </>
            )}

            {/* Config Operation */}
            {type === 'config' && (
              <>
                <div>
                  <Label htmlFor="configUrl">Asset URL</Label>
                  <Input
                    id="configUrl"
                    placeholder="Asset metadata URL"
                    value={operationParams.url || asset.url || ''}
                    onChange={(e) => setOperationParams({ ...operationParams, url: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="configManager">Manager Address</Label>
                  <Input
                    id="configManager"
                    placeholder="Manager address (empty to remove)"
                    value={operationParams.manager || ''}
                    onChange={(e) => setOperationParams({ ...operationParams, manager: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="configFreeze">Freeze Address</Label>
                  <Input
                    id="configFreeze"
                    placeholder="Freeze address (empty to remove)"
                    value={operationParams.freeze || ''}
                    onChange={(e) => setOperationParams({ ...operationParams, freeze: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="configClawback">Clawback Address</Label>
                  <Input
                    id="configClawback"
                    placeholder="Clawback address (empty to remove)"
                    value={operationParams.clawback || ''}
                    onChange={(e) => setOperationParams({ ...operationParams, clawback: e.target.value })}
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOperationDialog({ type: null, asset: null })}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleOperation(type, { ...operationParams, assetId: asset.assetId })}
              disabled={isLoading}
              className={
                type === 'burn' || type === 'clawback' 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : type === 'freeze'
                  ? 'bg-orange-500 hover:bg-orange-600'
                  : 'bg-green-500 hover:bg-green-600'
              }
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirm {type.charAt(0).toUpperCase() + type.slice(1)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6">
      {/* Assets Grid */}
      <div className="grid gap-6">
        {assets.map((asset) => (
          <Card key={asset.assetId} className="glass-card">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-xl">{asset.name}</CardTitle>
                    {getStatusBadge(asset)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Asset ID: {asset.assetId}</span>
                    <span>•</span>
                    <span>{asset.unitName}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => {
                        navigator.clipboard.writeText(asset.assetId.toString());
                        toast({ title: "Copied asset ID to clipboard", duration: 2000 });
                      }}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {getPermissionBadges(asset)}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-2xl font-bold text-foreground">
                    {asset.balance?.toLocaleString() || '0'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    of {asset.total.toLocaleString()} total
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {/* Asset Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Decimals:</span>
                    <span className="ml-2 font-medium">{asset.decimals}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Default Frozen:</span>
                    <span className="ml-2 font-medium">{asset.defaultFrozen ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Creator:</span>
                    <span className="ml-2 font-mono text-xs">{asset.creator.slice(0, 20)}...</span>
                  </div>
                </div>

                {/* Asset URL */}
                {asset.url && (
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <a 
                      href={asset.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      View Metadata
                    </a>
                    <ExternalLink className="w-3 h-3" />
                  </div>
                )}

                {/* Management Actions */}
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="basic">Basic</TabsTrigger>
                    <TabsTrigger value="freeze">Freeze</TabsTrigger>
                    <TabsTrigger value="advanced">Advanced</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      {asset.canManage && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setOperationDialog({ type: 'mint', asset })}
                          className="bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Mint
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setOperationDialog({ type: 'burn', asset })}
                        className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                      >
                        <Flame className="w-4 h-4 mr-2" />
                        Burn
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setOperationDialog({ type: 'transfer', asset })}
                        className="bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20 col-span-2"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Transfer
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="freeze" className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      {asset.canFreeze && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setOperationDialog({ type: 'freeze', asset })}
                            className="bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/20"
                          >
                            <Lock className="w-4 h-4 mr-2" />
                            Freeze
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setOperationDialog({ type: 'unfreeze', asset })}
                            className="bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20"
                          >
                            <Unlock className="w-4 h-4 mr-2" />
                            Unfreeze
                          </Button>
                        </>
                      )}
                    </div>
                    
                    {!asset.canFreeze && (
                      <div className="text-center py-4 text-muted-foreground text-sm">
                        <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        No freeze permissions for this asset
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="advanced" className="space-y-3">
                    <div className="grid grid-cols-1 gap-2">
                      {asset.canClawback && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setOperationDialog({ type: 'clawback', asset })}
                          className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Clawback
                        </Button>
                      )}
                      
                      {asset.canManage && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setOperationDialog({ type: 'config', asset })}
                          className="bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20"
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Configure
                        </Button>
                      )}
                    </div>
                    
                    {!asset.canClawback && !asset.canManage && (
                      <div className="text-center py-4 text-muted-foreground text-sm">
                        <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        No advanced permissions for this asset
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {assets.length === 0 && (
        <Card className="glass-card">
          <CardContent className="text-center py-12">
            <Coins className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No Assets Found</h3>
            <p className="text-muted-foreground mb-6">
              You don't have any ASA tokens yet. Create your first token to get started.
            </p>
            <Button className="bg-green-500 hover:bg-green-600">
              <Plus className="w-4 h-4 mr-2" />
              Create New Asset
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Operation Dialog */}
      {renderOperationDialog()}
    </div>
  );
}
