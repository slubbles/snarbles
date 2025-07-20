'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Coins, 
  Settings, 
  Send, 
  Flame, 
  Pause, 
  Play, 
  RefreshCw, 
  Plus, 
  Minus,
  Edit,
  AlertTriangle,
  CheckCircle,
  Copy,
  ExternalLink,
  Lock,
  Unlock,
  Info,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Token {
  id: string;
  name: string;
  symbol: string;
  balance: number;
  totalSupply: number;
  decimals: number;
  frozen: boolean;
  mintable: boolean;
  burnable: boolean;
  pausable: boolean;
  metadata?: {
    description?: string;
    image?: string;
    website?: string;
    twitter?: string;
  };
  creator: string;
  network: 'algorand' | 'solana';
  assetId?: number;
  mintAddress?: string;
}

interface TokenManagementProps {
  tokens: Token[];
  network: 'algorand' | 'solana';
  userAddress: string;
  onTokenUpdate: (tokenId: string, updates: Partial<Token>) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export default function TokenManagement({
  tokens,
  network,
  userAddress,
  onTokenUpdate,
  onRefresh,
  isLoading = false
}: TokenManagementProps) {
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [activeOperation, setActiveOperation] = useState<'mint' | 'burn' | 'transfer' | 'freeze' | 'metadata' | null>(null);
  const [operationLoading, setOperationLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  // Form states
  const [mintAmount, setMintAmount] = useState('');
  const [burnAmount, setBurnAmount] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferRecipient, setTransferRecipient] = useState('');
  const [freezeTarget, setFreezeTarget] = useState('');
  const [metadataForm, setMetadataForm] = useState({
    name: '',
    description: '',
    image: '',
    website: '',
    twitter: ''
  });

  const { toast } = useToast();

  useEffect(() => {
    if (selectedToken) {
      setMetadataForm({
        name: selectedToken.name || '',
        description: selectedToken.metadata?.description || '',
        image: selectedToken.metadata?.image || '',
        website: selectedToken.metadata?.website || '',
        twitter: selectedToken.metadata?.twitter || ''
      });
    }
  }, [selectedToken]);

  const userOwnedTokens = tokens.filter(token => token.creator === userAddress);

  const handleOperation = async (operation: string) => {
    if (!selectedToken) return;

    setOperationLoading(true);
    try {
      switch (operation) {
        case 'mint':
          await handleMint();
          break;
        case 'burn':
          await handleBurn();
          break;
        case 'transfer':
          await handleTransfer();
          break;
        case 'freeze':
          await handleFreeze();
          break;
        case 'unfreeze':
          await handleUnfreeze();
          break;
        case 'metadata':
          await handleMetadataUpdate();
          break;
        default:
          throw new Error('Unknown operation');
      }

      toast({
        title: "Operation Successful",
        description: `${operation} operation completed successfully`,
      });

      // Close dialogs and refresh
      setActiveOperation(null);
      setShowConfirmDialog(false);
      onRefresh();
    } catch (error) {
      console.error(`${operation} error:`, error);
      toast({
        title: "Operation Failed",
        description: error instanceof Error ? error.message : `Failed to ${operation} token`,
        variant: "destructive",
      });
    } finally {
      setOperationLoading(false);
    }
  };

  const handleMint = async () => {
    if (!selectedToken || !mintAmount) throw new Error('Missing parameters');
    
    // Simulate mint operation - replace with actual implementation
    const amount = parseFloat(mintAmount);
    if (amount <= 0) throw new Error('Amount must be positive');

    // Mock implementation - replace with actual blockchain calls
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    onTokenUpdate(selectedToken.id, {
      totalSupply: selectedToken.totalSupply + amount,
      balance: selectedToken.balance + amount
    });
  };

  const handleBurn = async () => {
    if (!selectedToken || !burnAmount) throw new Error('Missing parameters');
    
    const amount = parseFloat(burnAmount);
    if (amount <= 0) throw new Error('Amount must be positive');
    if (amount > selectedToken.balance) throw new Error('Insufficient balance');

    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    onTokenUpdate(selectedToken.id, {
      totalSupply: selectedToken.totalSupply - amount,
      balance: selectedToken.balance - amount
    });
  };

  const handleTransfer = async () => {
    if (!selectedToken || !transferAmount || !transferRecipient) {
      throw new Error('Missing parameters');
    }
    
    const amount = parseFloat(transferAmount);
    if (amount <= 0) throw new Error('Amount must be positive');
    if (amount > selectedToken.balance) throw new Error('Insufficient balance');

    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    onTokenUpdate(selectedToken.id, {
      balance: selectedToken.balance - amount
    });
  };

  const handleFreeze = async () => {
    if (!selectedToken) throw new Error('No token selected');

    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    onTokenUpdate(selectedToken.id, { frozen: true });
  };

  const handleUnfreeze = async () => {
    if (!selectedToken) throw new Error('No token selected');

    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    onTokenUpdate(selectedToken.id, { frozen: false });
  };

  const handleMetadataUpdate = async () => {
    if (!selectedToken) throw new Error('No token selected');

    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    onTokenUpdate(selectedToken.id, {
      name: metadataForm.name,
      metadata: {
        description: metadataForm.description,
        image: metadataForm.image,
        website: metadataForm.website,
        twitter: metadataForm.twitter
      }
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Address copied to clipboard",
      duration: 2000,
    });
  };

  const TokenCard = ({ token }: { token: Token }) => (
    <Card className="snarbles-card hover:snarbles-card-active transition-all duration-300 cursor-pointer"
          onClick={() => setSelectedToken(token)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full snarbles-gradient-blue flex items-center justify-center">
              <Coins className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="snarbles-heading text-lg">{token.name}</CardTitle>
              <p className="snarbles-body-muted text-sm">{token.symbol}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {token.frozen && (
              <Badge variant="destructive" className="text-xs">
                <Lock className="w-3 h-3 mr-1" />
                Frozen
              </Badge>
            )}
            {token.creator === userAddress && (
              <Badge variant="outline" className="text-xs text-green-400 border-green-400">
                Owned
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="snarbles-body-muted">Balance:</span>
            <span className="snarbles-body font-semibold">{token.balance.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="snarbles-body-muted">Total Supply:</span>
            <span className="snarbles-body">{token.totalSupply.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="snarbles-body-muted">Network:</span>
            <Badge variant="outline" className={network === 'algorand' ? 'border-blue-400 text-blue-400' : 'border-purple-400 text-purple-400'}>
              {network === 'algorand' ? 'Algorand' : 'Solana'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const OperationDialog = () => (
    <Dialog open={!!activeOperation} onOpenChange={() => setActiveOperation(null)}>
      <DialogContent className="snarbles-card-premium max-w-2xl">
        <DialogHeader>
          <DialogTitle className="snarbles-heading text-xl flex items-center gap-2">
            {activeOperation === 'mint' && <><Plus className="w-5 h-5 text-green-400" />Mint Tokens</>}
            {activeOperation === 'burn' && <><Flame className="w-5 h-5 text-red-400" />Burn Tokens</>}
            {activeOperation === 'transfer' && <><Send className="w-5 h-5 text-blue-400" />Transfer Tokens</>}
            {activeOperation === 'freeze' && <><Lock className="w-5 h-5 text-orange-400" />Freeze Token</>}
            {activeOperation === 'metadata' && <><Edit className="w-5 h-5 text-purple-400" />Update Metadata</>}
          </DialogTitle>
          <DialogDescription className="snarbles-body-muted">
            {selectedToken && `Managing ${selectedToken.name} (${selectedToken.symbol})`}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="operation" className="w-full">
          <TabsList className="grid w-full grid-cols-2 snarbles-glass-subtle">
            <TabsTrigger value="operation">Operation</TabsTrigger>
            <TabsTrigger value="info">Token Info</TabsTrigger>
          </TabsList>

          <TabsContent value="operation" className="space-y-6 mt-6">
            {activeOperation === 'mint' && (
              <div className="space-y-4">
                <Alert className="border-green-500/50 bg-green-500/10">
                  <Info className="w-4 h-4" />
                  <AlertDescription>
                    Minting will increase the total supply and add tokens to your balance.
                  </AlertDescription>
                </Alert>
                <div>
                  <Label htmlFor="mint-amount">Amount to Mint</Label>
                  <Input
                    id="mint-amount"
                    type="number"
                    value={mintAmount}
                    onChange={(e) => setMintAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="snarbles-glass-subtle mt-2"
                  />
                </div>
              </div>
            )}

            {activeOperation === 'burn' && (
              <div className="space-y-4">
                <Alert className="border-red-500/50 bg-red-500/10">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    Burning tokens permanently removes them from circulation.
                  </AlertDescription>
                </Alert>
                <div>
                  <Label htmlFor="burn-amount">Amount to Burn</Label>
                  <Input
                    id="burn-amount"
                    type="number"
                    value={burnAmount}
                    onChange={(e) => setBurnAmount(e.target.value)}
                    placeholder="Enter amount"
                    max={selectedToken?.balance}
                    className="snarbles-glass-subtle mt-2"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Max: {selectedToken?.balance.toLocaleString()} {selectedToken?.symbol}
                  </p>
                </div>
              </div>
            )}

            {activeOperation === 'transfer' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="transfer-recipient">Recipient Address</Label>
                  <Input
                    id="transfer-recipient"
                    value={transferRecipient}
                    onChange={(e) => setTransferRecipient(e.target.value)}
                    placeholder={network === 'algorand' ? 'Algorand address...' : 'Solana address...'}
                    className="snarbles-glass-subtle mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="transfer-amount">Amount to Transfer</Label>
                  <Input
                    id="transfer-amount"
                    type="number"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="Enter amount"
                    max={selectedToken?.balance}
                    className="snarbles-glass-subtle mt-2"
                  />
                </div>
              </div>
            )}

            {activeOperation === 'metadata' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="meta-name">Token Name</Label>
                  <Input
                    id="meta-name"
                    value={metadataForm.name}
                    onChange={(e) => setMetadataForm({...metadataForm, name: e.target.value})}
                    placeholder="Token name"
                    className="snarbles-glass-subtle mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="meta-description">Description</Label>
                  <Textarea
                    id="meta-description"
                    value={metadataForm.description}
                    onChange={(e) => setMetadataForm({...metadataForm, description: e.target.value})}
                    placeholder="Token description"
                    className="snarbles-glass-subtle mt-2"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="meta-website">Website</Label>
                    <Input
                      id="meta-website"
                      value={metadataForm.website}
                      onChange={(e) => setMetadataForm({...metadataForm, website: e.target.value})}
                      placeholder="https://..."
                      className="snarbles-glass-subtle mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="meta-twitter">Twitter</Label>
                    <Input
                      id="meta-twitter"
                      value={metadataForm.twitter}
                      onChange={(e) => setMetadataForm({...metadataForm, twitter: e.target.value})}
                      placeholder="@username"
                      className="snarbles-glass-subtle mt-2"
                    />
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="info" className="space-y-4 mt-6">
            {selectedToken && (
              <div className="snarbles-glass-subtle p-4 rounded-xl space-y-3">
                <div className="flex justify-between">
                  <span className="snarbles-body-muted">Asset ID:</span>
                  <div className="flex items-center gap-2">
                    <span className="snarbles-body font-mono">
                      {network === 'algorand' ? selectedToken.assetId : selectedToken.mintAddress}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(network === 'algorand' ? selectedToken.assetId?.toString() || '' : selectedToken.mintAddress || '')}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="snarbles-body-muted">Creator:</span>
                  <div className="flex items-center gap-2">
                    <span className="snarbles-body font-mono text-xs">
                      {selectedToken.creator.slice(0, 8)}...{selectedToken.creator.slice(-8)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(selectedToken.creator)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="snarbles-body-muted">Decimals:</span>
                  <span className="snarbles-body">{selectedToken.decimals}</span>
                </div>
                <div className="flex justify-between">
                  <span className="snarbles-body-muted">Mintable:</span>
                  <CheckCircle className={`w-4 h-4 ${selectedToken.mintable ? 'text-green-400' : 'text-gray-400'}`} />
                </div>
                <div className="flex justify-between">
                  <span className="snarbles-body-muted">Burnable:</span>
                  <CheckCircle className={`w-4 h-4 ${selectedToken.burnable ? 'text-green-400' : 'text-gray-400'}`} />
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setActiveOperation(null)}>
            Cancel
          </Button>
          <Button
            onClick={() => setShowConfirmDialog(true)}
            disabled={operationLoading}
            className="snarbles-btn-primary"
          >
            {operationLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              `${activeOperation?.charAt(0).toUpperCase()}${activeOperation?.slice(1)}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="snarbles-heading text-2xl">Token Management</h2>
          <p className="snarbles-body-muted">Manage your created tokens and perform operations</p>
        </div>
        <Button onClick={onRefresh} disabled={isLoading} variant="outline" className="snarbles-btn-secondary">
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Badge variant="outline" className="text-blue-400 border-blue-400">
          {userOwnedTokens.length} Owned Tokens
        </Badge>
        <Badge variant="outline" className="text-gray-400 border-gray-400">
          {tokens.length} Total Tokens
        </Badge>
      </div>

      {/* Token Grid */}
      {userOwnedTokens.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userOwnedTokens.map((token) => (
            <TokenCard key={token.id} token={token} />
          ))}
        </div>
      ) : (
        <Card className="snarbles-glass-subtle p-12 text-center">
          <Coins className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="snarbles-heading text-xl mb-2">No Tokens Found</h3>
          <p className="snarbles-body-muted mb-6">You haven't created any tokens yet.</p>
          <Button className="snarbles-btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Token
          </Button>
        </Card>
      )}

      {/* Token Operations Panel */}
      {selectedToken && (
        <Card className="snarbles-card-premium">
          <CardHeader>
            <CardTitle className="snarbles-heading flex items-center gap-3">
              <div className="w-10 h-10 rounded-full snarbles-gradient-blue flex items-center justify-center">
                <Coins className="w-5 h-5 text-white" />
              </div>
              {selectedToken.name} Operations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {selectedToken.mintable && (
                <Button
                  onClick={() => setActiveOperation('mint')}
                  className="snarbles-glass-subtle hover:bg-green-500/20 flex flex-col items-center gap-2 h-20"
                >
                  <Plus className="w-5 h-5 text-green-400" />
                  <span className="text-sm">Mint</span>
                </Button>
              )}
              {selectedToken.burnable && (
                <Button
                  onClick={() => setActiveOperation('burn')}
                  className="snarbles-glass-subtle hover:bg-red-500/20 flex flex-col items-center gap-2 h-20"
                >
                  <Flame className="w-5 h-5 text-red-400" />
                  <span className="text-sm">Burn</span>
                </Button>
              )}
              <Button
                onClick={() => setActiveOperation('transfer')}
                className="snarbles-glass-subtle hover:bg-blue-500/20 flex flex-col items-center gap-2 h-20"
              >
                <Send className="w-5 h-5 text-blue-400" />
                <span className="text-sm">Transfer</span>
              </Button>
              <Button
                onClick={() => selectedToken.frozen ? handleOperation('unfreeze') : setActiveOperation('freeze')}
                className="snarbles-glass-subtle hover:bg-orange-500/20 flex flex-col items-center gap-2 h-20"
              >
                {selectedToken.frozen ? (
                  <><Unlock className="w-5 h-5 text-green-400" /><span className="text-sm">Unfreeze</span></>
                ) : (
                  <><Lock className="w-5 h-5 text-orange-400" /><span className="text-sm">Freeze</span></>
                )}
              </Button>
              <Button
                onClick={() => setActiveOperation('metadata')}
                className="snarbles-glass-subtle hover:bg-purple-500/20 flex flex-col items-center gap-2 h-20"
              >
                <Edit className="w-5 h-5 text-purple-400" />
                <span className="text-sm">Metadata</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Operation Dialog */}
      <OperationDialog />

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="snarbles-card">
          <DialogHeader>
            <DialogTitle className="snarbles-heading flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              Confirm Operation
            </DialogTitle>
            <DialogDescription className="snarbles-body-muted">
              This action cannot be undone. Please confirm you want to proceed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => handleOperation(activeOperation!)}
              disabled={operationLoading}
              className="snarbles-btn-primary"
            >
              {operationLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
