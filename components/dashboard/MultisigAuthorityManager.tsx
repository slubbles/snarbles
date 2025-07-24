import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Shield, 
  Key, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Plus, 
  Trash2,
  Edit3,
  Send,
  UserPlus,
  UserMinus,
  Vote,
  Timer,
  Lock,
  Unlock
} from 'lucide-react';
import { toast } from 'sonner';
import { metadataService } from '@/lib/metadata-service';

export interface MultisigConfig {
  threshold: number;
  signers: Array<{
    address: string;
    name?: string;
    role: 'owner' | 'manager' | 'signer';
    addedAt: Date;
    addedBy: string;
  }>;
  timelock?: number; // seconds
  expirationTime?: number; // seconds
}

export interface MultisigProposal {
  id: string;
  type: 'update_metadata' | 'transfer_authority' | 'add_signer' | 'remove_signer' | 'change_threshold';
  tokenId: string;
  network: 'algorand' | 'solana';
  proposer: string;
  title: string;
  description: string;
  data: any;
  status: 'pending' | 'approved' | 'rejected' | 'executed' | 'expired';
  signatures: Array<{
    signer: string;
    signed: boolean;
    signedAt?: Date;
    signature?: string;
  }>;
  createdAt: Date;
  expiresAt: Date;
  executedAt?: Date;
  transactionHash?: string;
}

interface MultisigAuthorityManagerProps {
  tokenId: string;
  network: 'algorand' | 'solana';
  walletAddress: string;
  signTransaction: (txn: any) => Promise<any>;
  currentAuthority?: string;
  onAuthorityUpdate?: (newAuthority: string) => void;
}

export function MultisigAuthorityManager({
  tokenId,
  network,
  walletAddress,
  signTransaction,
  currentAuthority,
  onAuthorityUpdate
}: MultisigAuthorityManagerProps) {
  const [activeTab, setActiveTab] = React.useState('overview');
  const [loading, setLoading] = React.useState(false);
  
  // Multisig Configuration State
  const [multisigConfig, setMultisigConfig] = React.useState<MultisigConfig>({
    threshold: 2,
    signers: [
      { address: walletAddress, role: 'owner', addedAt: new Date(), addedBy: walletAddress }
    ]
  });
  
  // Proposals State
  const [proposals, setProposals] = React.useState<MultisigProposal[]>([]);
  const [selectedProposal, setSelectedProposal] = React.useState<MultisigProposal | null>(null);
  
  // New Proposal State
  const [newProposal, setNewProposal] = React.useState({
    type: 'update_metadata' as MultisigProposal['type'],
    title: '',
    description: '',
    data: {}
  });
  
  // Dialog States
  const [showCreateProposal, setShowCreateProposal] = React.useState(false);
  const [showAddSigner, setShowAddSigner] = React.useState(false);
  const [newSignerAddress, setNewSignerAddress] = React.useState('');
  const [newSignerName, setNewSignerName] = React.useState('');
  const [newSignerRole, setNewSignerRole] = React.useState<'manager' | 'signer'>('signer');

  React.useEffect(() => {
    loadMultisigData();
  }, [tokenId, network]);

  const loadMultisigData = async () => {
    try {
      setLoading(true);
      // In a real implementation, this would load from blockchain/database
      await loadMockMultisigData();
    } catch (error) {
      console.error('❌ Failed to load multisig data:', error);
      toast.error('Failed to load multisig configuration');
    } finally {
      setLoading(false);
    }
  };

  const loadMockMultisigData = async () => {
    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock proposals
    const mockProposals: MultisigProposal[] = [
      {
        id: 'prop-1',
        type: 'update_metadata',
        tokenId,
        network,
        proposer: walletAddress,
        title: 'Update Token Description',
        description: 'Updating token description to include new features and improved SEO',
        data: {
          metadata: {
            description: 'Updated token description with improved SEO keywords and feature highlights'
          }
        },
        status: 'pending',
        signatures: [
          { signer: walletAddress, signed: true, signedAt: new Date() },
          { signer: 'ADDR2...', signed: false },
          { signer: 'ADDR3...', signed: true, signedAt: new Date() }
        ],
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'prop-2',
        type: 'add_signer',
        tokenId,
        network,
        proposer: 'ADDR2...',
        title: 'Add New Team Member',
        description: 'Adding new development team member with signer permissions',
        data: {
          newSigner: {
            address: 'NEWADDR...',
            role: 'signer'
          }
        },
        status: 'approved',
        signatures: [
          { signer: walletAddress, signed: true, signedAt: new Date() },
          { signer: 'ADDR2...', signed: true, signedAt: new Date() },
          { signer: 'ADDR3...', signed: true, signedAt: new Date() }
        ],
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        executedAt: new Date(),
        transactionHash: '0x123...'
      }
    ];

    setProposals(mockProposals);
    
    // Update multisig config with additional signers
    setMultisigConfig(prev => ({
      ...prev,
      signers: [
        ...prev.signers,
        { address: 'ADDR2...', name: 'Team Lead', role: 'manager', addedAt: new Date(), addedBy: walletAddress },
        { address: 'ADDR3...', name: 'Developer', role: 'signer', addedAt: new Date(), addedBy: walletAddress }
      ]
    }));
  };

  const createProposal = async () => {
    if (!newProposal.title.trim()) {
      toast.error('Please provide a title for the proposal');
      return;
    }

    try {
      setLoading(true);
      
      const proposal: MultisigProposal = {
        id: `prop-${Date.now()}`,
        type: newProposal.type,
        tokenId,
        network,
        proposer: walletAddress,
        title: newProposal.title,
        description: newProposal.description,
        data: newProposal.data,
        status: 'pending',
        signatures: multisigConfig.signers.map(signer => ({
          signer: signer.address,
          signed: signer.address === walletAddress,
          signedAt: signer.address === walletAddress ? new Date() : undefined
        })),
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      };

      setProposals(prev => [proposal, ...prev]);
      setShowCreateProposal(false);
      setNewProposal({ type: 'update_metadata', title: '', description: '', data: {} });
      
      toast.success('Proposal created successfully!');
    } catch (error) {
      console.error('❌ Failed to create proposal:', error);
      toast.error('Failed to create proposal');
    } finally {
      setLoading(false);
    }
  };

  const signProposal = async (proposalId: string) => {
    try {
      setLoading(true);
      
      setProposals(prev => prev.map(proposal => {
        if (proposal.id === proposalId) {
          const updatedSignatures = proposal.signatures.map(sig => 
            sig.signer === walletAddress 
              ? { ...sig, signed: true, signedAt: new Date() }
              : sig
          );
          
          const signedCount = updatedSignatures.filter(sig => sig.signed).length;
          const status = signedCount >= multisigConfig.threshold ? 'approved' : 'pending';
          
          return {
            ...proposal,
            signatures: updatedSignatures,
            status
          };
        }
        return proposal;
      }));
      
      toast.success('Proposal signed successfully!');
    } catch (error) {
      console.error('❌ Failed to sign proposal:', error);
      toast.error('Failed to sign proposal');
    } finally {
      setLoading(false);
    }
  };

  const executeProposal = async (proposalId: string) => {
    const proposal = proposals.find(p => p.id === proposalId);
    if (!proposal) return;

    try {
      setLoading(true);
      
      // Execute the proposal based on its type
      let result: any;
      switch (proposal.type) {
        case 'update_metadata':
          result = await metadataService.updateMetadata({
            tokenId,
            network,
            metadata: proposal.data.metadata,
            walletAddress,
            signTransaction
          });
          break;
          
        case 'transfer_authority':
          result = await metadataService.updateAuthority({
            tokenId,
            network,
            operation: 'transfer',
            targetAddress: proposal.data.newAuthority,
            walletAddress,
            signTransaction
          });
          break;
          
        case 'add_signer':
          // Add signer to multisig config
          setMultisigConfig(prev => ({
            ...prev,
            signers: [...prev.signers, {
              address: proposal.data.newSigner.address,
              name: proposal.data.newSigner.name,
              role: proposal.data.newSigner.role,
              addedAt: new Date(),
              addedBy: walletAddress
            }]
          }));
          result = { success: true, transactionHash: '0x' + Math.random().toString(16).substr(2, 8) };
          break;
          
        default:
          throw new Error('Unsupported proposal type');
      }

      if (result.success) {
        setProposals(prev => prev.map(p => 
          p.id === proposalId 
            ? { ...p, status: 'executed', executedAt: new Date(), transactionHash: result.transactionHash }
            : p
        ));
        
        toast.success('Proposal executed successfully!');
        
        if (proposal.type === 'transfer_authority' && onAuthorityUpdate) {
          onAuthorityUpdate(proposal.data.newAuthority);
        }
      } else {
        throw new Error(result.error || 'Execution failed');
      }
      
    } catch (error) {
      console.error('❌ Failed to execute proposal:', error);
      toast.error('Failed to execute proposal');
    } finally {
      setLoading(false);
    }
  };

  const addSigner = () => {
    if (!newSignerAddress.trim()) {
      toast.error('Please provide a signer address');
      return;
    }

    if (multisigConfig.signers.some(s => s.address === newSignerAddress)) {
      toast.error('Address is already a signer');
      return;
    }

    setMultisigConfig(prev => ({
      ...prev,
      signers: [...prev.signers, {
        address: newSignerAddress,
        name: newSignerName || undefined,
        role: newSignerRole,
        addedAt: new Date(),
        addedBy: walletAddress
      }]
    }));

    setNewSignerAddress('');
    setNewSignerName('');
    setShowAddSigner(false);
    toast.success('Signer added successfully!');
  };

  const removeSigner = (address: string) => {
    if (address === walletAddress) {
      toast.error('Cannot remove yourself');
      return;
    }

    setMultisigConfig(prev => ({
      ...prev,
      signers: prev.signers.filter(s => s.address !== address)
    }));
    
    toast.success('Signer removed successfully!');
  };

  const getProposalStatusIcon = (status: MultisigProposal['status']) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'executed': return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'expired': return <AlertCircle className="h-4 w-4 text-gray-600" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getSignatureProgress = (proposal: MultisigProposal) => {
    const signedCount = proposal.signatures.filter(s => s.signed).length;
    return (signedCount / multisigConfig.threshold) * 100;
  };

  const canExecuteProposal = (proposal: MultisigProposal) => {
    const signedCount = proposal.signatures.filter(s => s.signed).length;
    return proposal.status === 'approved' && signedCount >= multisigConfig.threshold;
  };

  const hasUserSigned = (proposal: MultisigProposal) => {
    return proposal.signatures.find(s => s.signer === walletAddress)?.signed || false;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            Multisig Authority Management
          </h2>
          <p className="text-gray-600">Manage token authority with multi-signature security</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Signers</p>
                <p className="text-2xl font-bold">{multisigConfig.signers.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Threshold</p>
                <p className="text-2xl font-bold">{multisigConfig.threshold}</p>
              </div>
              <Key className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Proposals</p>
                <p className="text-2xl font-bold">
                  {proposals.filter(p => p.status === 'pending' || p.status === 'approved').length}
                </p>
              </div>
              <Vote className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Executed</p>
                <p className="text-2xl font-bold">
                  {proposals.filter(p => p.status === 'executed').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="proposals">Proposals</TabsTrigger>
          <TabsTrigger value="signers">Signers</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Current Configuration
                </CardTitle>
                <CardDescription>
                  Active multisig settings for {tokenId}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-semibold">Network</Label>
                    <p className="text-lg">{network.charAt(0).toUpperCase() + network.slice(1)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Signature Threshold</Label>
                    <p className="text-lg">{multisigConfig.threshold} of {multisigConfig.signers.length}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold">Current Authority</Label>
                  <p className="text-sm text-gray-600 break-all">{currentAuthority || 'Not set'}</p>
                </div>

                <div>
                  <Label className="text-sm font-semibold">Security Level</Label>
                  <div className="flex items-center gap-2">
                    <Progress value={(multisigConfig.threshold / multisigConfig.signers.length) * 100} className="flex-1" />
                    <span className="text-sm font-medium">
                      {multisigConfig.threshold >= 3 ? 'High' : multisigConfig.threshold >= 2 ? 'Medium' : 'Low'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Latest multisig operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {proposals.slice(0, 5).map((proposal) => (
                    <div key={proposal.id} className="flex items-center gap-3 p-2 border rounded">
                      {getProposalStatusIcon(proposal.status)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{proposal.title}</p>
                        <p className="text-xs text-gray-500">
                          {proposal.createdAt.toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={proposal.status === 'executed' ? 'default' : 'secondary'}>
                        {proposal.status}
                      </Badge>
                    </div>
                  ))}
                  {proposals.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Proposals Tab */}
        <TabsContent value="proposals" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Active Proposals</h3>
            <Dialog open={showCreateProposal} onOpenChange={setShowCreateProposal}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Proposal
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Proposal</DialogTitle>
                  <DialogDescription>
                    Create a new multisig proposal for token operations
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="proposal-type">Proposal Type</Label>
                    <Select 
                      value={newProposal.type} 
                      onValueChange={(value) => setNewProposal(prev => ({ ...prev, type: value as MultisigProposal['type'] }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="update_metadata">Update Metadata</SelectItem>
                        <SelectItem value="transfer_authority">Transfer Authority</SelectItem>
                        <SelectItem value="add_signer">Add Signer</SelectItem>
                        <SelectItem value="remove_signer">Remove Signer</SelectItem>
                        <SelectItem value="change_threshold">Change Threshold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="proposal-title">Title</Label>
                    <Input
                      id="proposal-title"
                      value={newProposal.title}
                      onChange={(e) => setNewProposal(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Brief proposal title"
                    />
                  </div>

                  <div>
                    <Label htmlFor="proposal-description">Description</Label>
                    <Textarea
                      id="proposal-description"
                      value={newProposal.description}
                      onChange={(e) => setNewProposal(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Detailed description of the proposal"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateProposal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createProposal} disabled={loading}>
                    Create Proposal
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {proposals.map((proposal) => (
              <Card key={proposal.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getProposalStatusIcon(proposal.status)}
                        <h4 className="font-semibold">{proposal.title}</h4>
                        <Badge variant="outline">{proposal.type.replace('_', ' ')}</Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">{proposal.description}</p>
                      
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Proposer</p>
                          <p className="font-medium truncate">{proposal.proposer}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Created</p>
                          <p className="font-medium">{proposal.createdAt.toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Expires</p>
                          <p className="font-medium">{proposal.expiresAt.toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Signatures</p>
                          <div className="flex items-center gap-2">
                            <Progress value={getSignatureProgress(proposal)} className="h-2 flex-1" />
                            <span className="text-xs">
                              {proposal.signatures.filter(s => s.signed).length}/{multisigConfig.threshold}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      {!hasUserSigned(proposal) && proposal.status === 'pending' && (
                        <Button
                          onClick={() => signProposal(proposal.id)}
                          disabled={loading}
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Send className="h-3 w-3" />
                          Sign
                        </Button>
                      )}
                      
                      {canExecuteProposal(proposal) && (
                        <Button
                          onClick={() => executeProposal(proposal.id)}
                          disabled={loading}
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <CheckCircle className="h-3 w-3" />
                          Execute
                        </Button>
                      )}
                      
                      {hasUserSigned(proposal) && (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Signed
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {proposals.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Vote className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No proposals yet</p>
                  <p className="text-sm text-gray-500">Create your first multisig proposal</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Signers Tab */}
        <TabsContent value="signers" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Authorized Signers</h3>
            <Dialog open={showAddSigner} onOpenChange={setShowAddSigner}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Add Signer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Signer</DialogTitle>
                  <DialogDescription>
                    Add a new authorized signer to the multisig
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="signer-address">Address</Label>
                    <Input
                      id="signer-address"
                      value={newSignerAddress}
                      onChange={(e) => setNewSignerAddress(e.target.value)}
                      placeholder="Enter wallet address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signer-name">Name (Optional)</Label>
                    <Input
                      id="signer-name"
                      value={newSignerName}
                      onChange={(e) => setNewSignerName(e.target.value)}
                      placeholder="Enter display name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signer-role">Role</Label>
                    <Select value={newSignerRole} onValueChange={(value) => setNewSignerRole(value as 'manager' | 'signer')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="signer">Signer</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddSigner(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addSigner}>
                    Add Signer
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {multisigConfig.signers.map((signer, index) => (
              <Card key={signer.address} className={signer.address === walletAddress ? 'border-blue-500' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">
                          {signer.name || `Signer ${index + 1}`}
                        </h4>
                        <Badge variant={signer.role === 'owner' ? 'default' : 'secondary'}>
                          {signer.role}
                        </Badge>
                        {signer.address === walletAddress && (
                          <Badge variant="outline" className="text-blue-600">You</Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 break-all mb-2">{signer.address}</p>
                      
                      <div className="text-xs text-gray-500">
                        <p>Added: {signer.addedAt.toLocaleDateString()}</p>
                        <p>By: {signer.addedBy === walletAddress ? 'You' : signer.addedBy}</p>
                      </div>
                    </div>
                    
                    {signer.address !== walletAddress && signer.role !== 'owner' && (
                      <Button
                        onClick={() => removeSigner(signer.address)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <UserMinus className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Threshold Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Signature Threshold
              </CardTitle>
              <CardDescription>
                Minimum number of signatures required to execute proposals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="threshold">Required Signatures</Label>
                  <Select 
                    value={multisigConfig.threshold.toString()} 
                    onValueChange={(value) => setMultisigConfig(prev => ({ ...prev, threshold: parseInt(value) }))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: multisigConfig.signers.length }, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-sm text-gray-600">
                  <p>Out of {multisigConfig.signers.length} total signers</p>
                  <p>Security: {multisigConfig.threshold >= 3 ? 'High' : multisigConfig.threshold >= 2 ? 'Medium' : 'Low'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default MultisigAuthorityManager;
