'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Key, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Eye, 
  Settings, 
  Trash2, 
  Plus, 
  Send,
  Copy,
  ExternalLink,
  Loader2,
  RefreshCw,
  Lock,
  Unlock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface AuthorityInfo {
  hasUpdatePermission: boolean;
  updateAuthority?: string;
  managerAuthority?: string;
  freezeAuthority?: string;
  mintAuthority?: string;
  isOwner: boolean;
  canDelegate: boolean;
  canRevoke: boolean;
  restrictions: string[];
  expirationDate?: Date;
  delegatedPermissions: DelegatedPermission[];
}

export interface DelegatedPermission {
  id: string;
  grantedTo: string;
  permissions: string[];
  grantedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  canSubDelegate: boolean;
}

interface AuthorityManagerProps {
  tokenId: string;
  network: 'algorand' | 'solana';
  userAddress: string;
  authorityInfo: AuthorityInfo;
  onAuthorityUpdate: (operation: string, params: any) => Promise<{ success: boolean; error?: string }>;
  onRefresh: () => void;
  isOpen: boolean;
  onClose: () => void;
}

interface PendingOperation {
  type: 'transfer' | 'delegate' | 'revoke';
  target: string;
  permissions: string[];
  expiresAt?: Date;
}

const PERMISSION_TYPES = {
  algorand: [
    { key: 'manager', label: 'Asset Manager', description: 'Can update asset configuration and metadata' },
    { key: 'freeze', label: 'Freeze Authority', description: 'Can freeze/unfreeze asset transfers' },
    { key: 'clawback', label: 'Clawback Authority', description: 'Can clawback assets from accounts' },
    { key: 'reserve', label: 'Reserve Authority', description: 'Can mint additional assets' }
  ],
  solana: [
    { key: 'update', label: 'Update Authority', description: 'Can update token metadata' },
    { key: 'mint', label: 'Mint Authority', description: 'Can mint additional tokens' },
    { key: 'freeze', label: 'Freeze Authority', description: 'Can freeze/unfreeze token accounts' }
  ]
};

export default function AuthorityManager({
  tokenId,
  network,
  userAddress,
  authorityInfo,
  onAuthorityUpdate,
  onRefresh,
  isOpen,
  onClose
}: AuthorityManagerProps) {
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [pendingOperation, setPendingOperation] = useState<PendingOperation | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  // Form states
  const [transferTarget, setTransferTarget] = useState('');
  const [delegateTarget, setDelegateTarget] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [delegationExpiry, setDelegationExpiry] = useState('');
  const [allowSubDelegation, setAllowSubDelegation] = useState(false);

  const permissions = PERMISSION_TYPES[network];

  // Get user's current permissions
  const getUserPermissions = () => {
    const perms = [];
    
    if (network === 'algorand') {
      if (authorityInfo.managerAuthority === userAddress) perms.push('manager');
      if (authorityInfo.freezeAuthority === userAddress) perms.push('freeze');
      // Add other Algorand authorities as needed
    } else {
      if (authorityInfo.updateAuthority === userAddress) perms.push('update');
      if (authorityInfo.mintAuthority === userAddress) perms.push('mint');
      if (authorityInfo.freezeAuthority === userAddress) perms.push('freeze');
    }
    
    return perms;
  };

  const userPermissions = getUserPermissions();

  // Handle authority transfer
  const handleTransferAuthority = async () => {
    if (!transferTarget.trim()) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid address",
        variant: "destructive"
      });
      return;
    }

    setPendingOperation({
      type: 'transfer',
      target: transferTarget,
      permissions: selectedPermissions
    });
    setShowConfirmDialog(true);
  };

  // Handle permission delegation
  const handleDelegatePermission = async () => {
    if (!delegateTarget.trim() || selectedPermissions.length === 0) {
      toast({
        title: "Invalid Parameters",
        description: "Please enter an address and select permissions",
        variant: "destructive"
      });
      return;
    }

    const expiresAt = delegationExpiry ? new Date(delegationExpiry) : undefined;
    
    setPendingOperation({
      type: 'delegate',
      target: delegateTarget,
      permissions: selectedPermissions,
      expiresAt
    });
    setShowConfirmDialog(true);
  };

  // Handle permission revocation
  const handleRevokePermission = async (delegationId: string) => {
    const delegation = authorityInfo.delegatedPermissions.find(d => d.id === delegationId);
    if (!delegation) return;

    setPendingOperation({
      type: 'revoke',
      target: delegation.grantedTo,
      permissions: delegation.permissions
    });
    setShowConfirmDialog(true);
  };

  // Execute pending operation
  const executePendingOperation = async () => {
    if (!pendingOperation) return;

    setIsProcessing(true);
    
    try {
      const result = await onAuthorityUpdate(pendingOperation.type, {
        target: pendingOperation.target,
        permissions: pendingOperation.permissions,
        expiresAt: pendingOperation.expiresAt,
        allowSubDelegation
      });

      if (result.success) {
        toast({
          title: "Authority Updated",
          description: `Successfully ${pendingOperation.type}d authority`,
        });
        
        // Reset form
        setTransferTarget('');
        setDelegateTarget('');
        setSelectedPermissions([]);
        setDelegationExpiry('');
        setAllowSubDelegation(false);
        
        // Refresh data
        onRefresh();
      } else {
        throw new Error(result.error || 'Failed to update authority');
      }
    } catch (error) {
      console.error('Authority operation failed:', error);
      toast({
        title: "Operation Failed",
        description: error instanceof Error ? error.message : 'Failed to update authority',
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setPendingOperation(null);
      setShowConfirmDialog(false);
    }
  };

  // Copy address to clipboard
  const copyToClipboard = (address: string, label: string) => {
    navigator.clipboard.writeText(address);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`,
    });
  };

  // Get permission badge color
  const getPermissionBadge = (permission: string, isActive: boolean = true) => {
    const colors = {
      manager: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      update: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      mint: 'bg-green-500/20 text-green-400 border-green-500/30',
      freeze: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      clawback: 'bg-red-500/20 text-red-400 border-red-500/30',
      reserve: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    };

    const permission_info = permissions.find(p => p.key === permission);
    
    return (
      <Badge 
        className={`${colors[permission as keyof typeof colors] || 'bg-gray-500/20 text-gray-400'} ${!isActive ? 'opacity-50' : ''}`}
      >
        {permission_info?.label || permission}
      </Badge>
    );
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            Authority Management
          </DialogTitle>
          <DialogDescription>
            Manage authorities and permissions for token {tokenId} on {network}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="transfer">Transfer</TabsTrigger>
              <TabsTrigger value="delegate">Delegate</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <div className="mt-6 h-[500px] overflow-y-auto">
              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {/* Current User Permissions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="w-5 h-5" />
                      Your Permissions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userPermissions.length > 0 ? (
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          {userPermissions.map(permission => (
                            getPermissionBadge(permission)
                          ))}
                        </div>
                        
                        <div className="space-y-2">
                          {userPermissions.map(permission => {
                            const permInfo = permissions.find(p => p.key === permission);
                            return permInfo ? (
                              <div key={permission} className="text-sm">
                                <span className="font-medium">{permInfo.label}:</span>
                                <span className="text-muted-foreground ml-2">{permInfo.description}</span>
                              </div>
                            ) : null;
                          })}
                        </div>
                      </div>
                    ) : (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          You don't have any administrative permissions for this token.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                {/* All Authorities */}
                <Card>
                  <CardHeader>
                    <CardTitle>Authority Addresses</CardTitle>
                    <CardDescription>
                      Current addresses with administrative permissions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {network === 'algorand' ? (
                      <>
                        {authorityInfo.managerAuthority && (
                          <div className="flex justify-between items-center p-3 border rounded-lg">
                            <div>
                              <div className="flex items-center gap-2">
                                <Settings className="w-4 h-4 text-purple-400" />
                                <span className="font-medium">Asset Manager</span>
                              </div>
                              <code className="text-xs text-muted-foreground">
                                {authorityInfo.managerAuthority}
                              </code>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(authorityInfo.managerAuthority!, 'Manager address')}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              {authorityInfo.managerAuthority === userAddress && (
                                <Badge variant="outline" className="text-green-400 border-green-400">
                                  You
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {authorityInfo.freezeAuthority && (
                          <div className="flex justify-between items-center p-3 border rounded-lg">
                            <div>
                              <div className="flex items-center gap-2">
                                <Lock className="w-4 h-4 text-orange-400" />
                                <span className="font-medium">Freeze Authority</span>
                              </div>
                              <code className="text-xs text-muted-foreground">
                                {authorityInfo.freezeAuthority}
                              </code>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(authorityInfo.freezeAuthority!, 'Freeze address')}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              {authorityInfo.freezeAuthority === userAddress && (
                                <Badge variant="outline" className="text-green-400 border-green-400">
                                  You
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {authorityInfo.updateAuthority && (
                          <div className="flex justify-between items-center p-3 border rounded-lg">
                            <div>
                              <div className="flex items-center gap-2">
                                <Settings className="w-4 h-4 text-purple-400" />
                                <span className="font-medium">Update Authority</span>
                              </div>
                              <code className="text-xs text-muted-foreground">
                                {authorityInfo.updateAuthority}
                              </code>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(authorityInfo.updateAuthority!, 'Update authority')}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              {authorityInfo.updateAuthority === userAddress && (
                                <Badge variant="outline" className="text-green-400 border-green-400">
                                  You
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {authorityInfo.mintAuthority && (
                          <div className="flex justify-between items-center p-3 border rounded-lg">
                            <div>
                              <div className="flex items-center gap-2">
                                <Plus className="w-4 h-4 text-green-400" />
                                <span className="font-medium">Mint Authority</span>
                              </div>
                              <code className="text-xs text-muted-foreground">
                                {authorityInfo.mintAuthority}
                              </code>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(authorityInfo.mintAuthority!, 'Mint authority')}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              {authorityInfo.mintAuthority === userAddress && (
                                <Badge variant="outline" className="text-green-400 border-green-400">
                                  You
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Restrictions */}
                {authorityInfo.restrictions.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                        Restrictions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {authorityInfo.restrictions.map((restriction, index) => (
                          <Alert key={index}>
                            <AlertDescription>{restriction}</AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Transfer Tab */}
              <TabsContent value="transfer" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Transfer Authority</CardTitle>
                    <CardDescription>
                      Permanently transfer authority to another address. This action cannot be undone.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {userPermissions.length > 0 ? (
                      <>
                        <div>
                          <Label htmlFor="transferTarget">Recipient Address</Label>
                          <Input
                            id="transferTarget"
                            value={transferTarget}
                            onChange={(e) => setTransferTarget(e.target.value)}
                            placeholder="Enter recipient address..."
                          />
                        </div>

                        <div>
                          <Label>Permissions to Transfer</Label>
                          <div className="mt-2 space-y-2">
                            {userPermissions.map(permission => {
                              const permInfo = permissions.find(p => p.key === permission);
                              if (!permInfo) return null;
                              
                              return (
                                <div key={permission} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id={`transfer-${permission}`}
                                    checked={selectedPermissions.includes(permission)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedPermissions([...selectedPermissions, permission]);
                                      } else {
                                        setSelectedPermissions(selectedPermissions.filter(p => p !== permission));
                                      }
                                    }}
                                  />
                                  <label 
                                    htmlFor={`transfer-${permission}`}
                                    className="text-sm font-medium cursor-pointer"
                                  >
                                    {permInfo.label}
                                  </label>
                                  <span className="text-xs text-muted-foreground">
                                    - {permInfo.description}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Warning:</strong> Authority transfer is permanent and irreversible. 
                            Make sure you trust the recipient address.
                          </AlertDescription>
                        </Alert>

                        <Button
                          onClick={handleTransferAuthority}
                          disabled={!transferTarget.trim() || selectedPermissions.length === 0}
                          className="w-full"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Transfer Authority
                        </Button>
                      </>
                    ) : (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          You don't have any transferable permissions for this token.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Delegate Tab */}
              <TabsContent value="delegate" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Delegate Permissions</CardTitle>
                    <CardDescription>
                      Grant temporary permissions to other addresses while retaining ownership
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {authorityInfo.canDelegate ? (
                      <>
                        <div>
                          <Label htmlFor="delegateTarget">Delegate To</Label>
                          <Input
                            id="delegateTarget"
                            value={delegateTarget}
                            onChange={(e) => setDelegateTarget(e.target.value)}
                            placeholder="Enter delegate address..."
                          />
                        </div>

                        <div>
                          <Label>Permissions to Delegate</Label>
                          <div className="mt-2 space-y-2">
                            {userPermissions.map(permission => {
                              const permInfo = permissions.find(p => p.key === permission);
                              if (!permInfo) return null;
                              
                              return (
                                <div key={permission} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id={`delegate-${permission}`}
                                    checked={selectedPermissions.includes(permission)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedPermissions([...selectedPermissions, permission]);
                                      } else {
                                        setSelectedPermissions(selectedPermissions.filter(p => p !== permission));
                                      }
                                    }}
                                  />
                                  <label 
                                    htmlFor={`delegate-${permission}`}
                                    className="text-sm font-medium cursor-pointer"
                                  >
                                    {permInfo.label}
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="delegationExpiry">Expiration (Optional)</Label>
                          <Input
                            id="delegationExpiry"
                            type="datetime-local"
                            value={delegationExpiry}
                            onChange={(e) => setDelegationExpiry(e.target.value)}
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="allowSubDelegation"
                            checked={allowSubDelegation}
                            onChange={(e) => setAllowSubDelegation(e.target.checked)}
                          />
                          <label htmlFor="allowSubDelegation" className="text-sm cursor-pointer">
                            Allow delegate to sub-delegate permissions
                          </label>
                        </div>

                        <Button
                          onClick={handleDelegatePermission}
                          disabled={!delegateTarget.trim() || selectedPermissions.length === 0}
                          className="w-full"
                        >
                          <Users className="w-4 h-4 mr-2" />
                          Delegate Permissions
                        </Button>
                      </>
                    ) : (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          You don't have delegation privileges for this token.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                {/* Active Delegations */}
                {authorityInfo.delegatedPermissions.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Active Delegations</CardTitle>
                      <CardDescription>
                        Permissions you've delegated to other addresses
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {authorityInfo.delegatedPermissions
                          .filter(delegation => delegation.isActive)
                          .map(delegation => (
                          <div key={delegation.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div className="space-y-2">
                                <div>
                                  <span className="font-medium">Delegated to:</span>
                                  <code className="ml-2 text-sm bg-muted px-2 py-1 rounded">
                                    {delegation.grantedTo.slice(0, 20)}...
                                  </code>
                                </div>
                                
                                <div className="flex flex-wrap gap-1">
                                  {delegation.permissions.map(permission => (
                                    getPermissionBadge(permission)
                                  ))}
                                </div>
                                
                                <div className="text-sm text-muted-foreground">
                                  <div>Granted: {formatDate(delegation.grantedAt)}</div>
                                  {delegation.expiresAt && (
                                    <div>Expires: {formatDate(delegation.expiresAt)}</div>
                                  )}
                                </div>
                              </div>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRevokePermission(delegation.id)}
                                className="text-red-500 hover:text-red-400"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Revoke
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Authority History
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onRefresh}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                      </Button>
                    </CardTitle>
                    <CardDescription>
                      Complete history of authority changes for this token
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* This would be populated with real history data */}
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Authority history will appear here</p>
                      <p className="text-sm">Track all transfers, delegations, and revocations</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                Confirm Authority Operation
              </DialogTitle>
              <DialogDescription>
                Please review the operation details before proceeding.
              </DialogDescription>
            </DialogHeader>

            {pendingOperation && (
              <div className="space-y-4">
                <div>
                  <span className="font-medium">Operation:</span>
                  <span className="ml-2 capitalize">{pendingOperation.type}</span>
                </div>
                
                <div>
                  <span className="font-medium">Target Address:</span>
                  <code className="ml-2 text-sm bg-muted px-2 py-1 rounded">
                    {pendingOperation.target}
                  </code>
                </div>
                
                <div>
                  <span className="font-medium">Permissions:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {pendingOperation.permissions.map(permission => 
                      getPermissionBadge(permission)
                    )}
                  </div>
                </div>
                
                {pendingOperation.expiresAt && (
                  <div>
                    <span className="font-medium">Expires:</span>
                    <span className="ml-2">{formatDate(pendingOperation.expiresAt)}</span>
                  </div>
                )}

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {pendingOperation.type === 'transfer' 
                      ? "This will permanently transfer authority to the target address."
                      : pendingOperation.type === 'delegate'
                      ? "This will grant temporary permissions to the target address."
                      : "This will revoke previously granted permissions."
                    }
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={executePendingOperation}
                disabled={isProcessing}
                className="min-w-[120px]"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirm
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
