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
  UserCheck,
  Key
} from 'lucide-react';

interface SolanaToken {
  mintAddress: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  mintAuthority?: string;
  freezeAuthority?: string;
  updateAuthority?: string;
  balance: string;
  metadataUri?: string;
  isOwner: boolean;
  canMint: boolean;
  canBurn: boolean;
  canFreeze: boolean;
  canUpdate: boolean;
}

interface SolanaTokenManagerProps {
  token: SolanaToken;
  onOperation: (operation: string, params: any) => Promise<string>;
  onRefresh: () => void;
}

export function SolanaTokenManager({ token, onOperation, onRefresh }: SolanaTokenManagerProps) {
  const [activeOperation, setActiveOperation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [operationParams, setOperationParams] = useState<any>({});
  const { toast } = useToast();

  const handleOperation = async (operation: string) => {
    setIsLoading(true);
    try {
      const signature = await onOperation(operation, operationParams);
      toast({
        title: "Transaction Successful",
        description: `${operation} operation completed successfully`,
        duration: 5000,
      });
      setActiveOperation(null);
      setOperationParams({});
      onRefresh();
    } catch (error) {
      toast({
        title: "Transaction Failed",
        description: error instanceof Error ? error.message : "Operation failed",
        variant: "destructive",
        duration: 5000,
      });
    }
    setIsLoading(false);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `${label} copied successfully`,
      duration: 2000,
    });
  };

  const formatBalance = (balance: string, decimals: number) => {
    const num = parseFloat(balance);
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(decimals > 0 ? Math.min(decimals, 4) : 0);
  };

  return (
    <div className="space-y-6">
      {/* Token Information */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <span className="font-bold text-primary">{token.symbol}</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{token.name}</h2>
                <p className="text-muted-foreground">{token.symbol}</p>
              </div>
            </div>
            <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">
              Solana SPL Token
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Mint Address</Label>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-foreground truncate">
                  {token.mintAddress}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(token.mintAddress, 'Mint address')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(`https://explorer.solana.com/address/${token.mintAddress}`, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Total Supply</Label>
              <p className="text-lg font-semibold text-foreground">
                {formatBalance(token.totalSupply, token.decimals)}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Your Balance</Label>
              <p className="text-lg font-semibold text-green-400">
                {formatBalance(token.balance, token.decimals)}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Decimals</Label>
              <p className="text-foreground">{token.decimals}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Permissions</Label>
              <div className="flex flex-wrap gap-1">
                {token.canMint && (
                  <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                    Can Mint
                  </Badge>
                )}
                {token.canBurn && (
                  <Badge className="bg-red-500/10 text-red-400 border-red-500/20">
                    Can Burn
                  </Badge>
                )}
                {token.canFreeze && (
                  <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                    Can Freeze
                  </Badge>
                )}
                {token.canUpdate && (
                  <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                    Can Update
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Token Management Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Mint Tokens */}
        {token.canMint && (
          <Card className="glass-card hover:shadow-lg transition-all cursor-pointer" 
                onClick={() => setActiveOperation('mint')}>
            <CardContent className="p-6 text-center">
              <Plus className="h-8 w-8 text-green-400 mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-2">Mint Tokens</h3>
              <p className="text-sm text-muted-foreground">
                Create additional tokens and add to supply
              </p>
            </CardContent>
          </Card>
        )}

        {/* Burn Tokens */}
        {token.canBurn && (
          <Card className="glass-card hover:shadow-lg transition-all cursor-pointer"
                onClick={() => setActiveOperation('burn')}>
            <CardContent className="p-6 text-center">
              <Flame className="h-8 w-8 text-red-400 mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-2">Burn Tokens</h3>
              <p className="text-sm text-muted-foreground">
                Permanently destroy tokens from supply
              </p>
            </CardContent>
          </Card>
        )}

        {/* Transfer Tokens */}
        <Card className="glass-card hover:shadow-lg transition-all cursor-pointer"
              onClick={() => setActiveOperation('transfer')}>
          <CardContent className="p-6 text-center">
            <Send className="h-8 w-8 text-blue-400 mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-2">Transfer Tokens</h3>
            <p className="text-sm text-muted-foreground">
              Send tokens to another address
            </p>
          </CardContent>
        </Card>

        {/* Update Metadata */}
        {token.canUpdate && (
          <Card className="glass-card hover:shadow-lg transition-all cursor-pointer"
                onClick={() => setActiveOperation('metadata')}>
            <CardContent className="p-6 text-center">
              <Settings className="h-8 w-8 text-purple-400 mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-2">Update Metadata</h3>
              <p className="text-sm text-muted-foreground">
                Modify token name, symbol, or image
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Authority Management */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Authority Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {token.mintAuthority && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Mint Authority
                </Label>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-foreground truncate">
                    {token.mintAuthority}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(token.mintAuthority!, 'Mint authority')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            {token.freezeAuthority && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Freeze Authority
                </Label>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-foreground truncate">
                    {token.freezeAuthority}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(token.freezeAuthority!, 'Freeze authority')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            {token.updateAuthority && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Update Authority
                </Label>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-foreground truncate">
                    {token.updateAuthority}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(token.updateAuthority!, 'Update authority')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Operation Dialogs */}
      {activeOperation && (
        <Dialog open={!!activeOperation} onOpenChange={() => setActiveOperation(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {activeOperation === 'mint' && 'Mint Tokens'}
                {activeOperation === 'burn' && 'Burn Tokens'}
                {activeOperation === 'transfer' && 'Transfer Tokens'}
                {activeOperation === 'metadata' && 'Update Metadata'}
              </DialogTitle>
              <DialogDescription>
                {activeOperation === 'mint' && 'Create additional tokens and add them to the supply.'}
                {activeOperation === 'burn' && 'Permanently destroy tokens from your balance.'}
                {activeOperation === 'transfer' && 'Send tokens to another Solana address.'}
                {activeOperation === 'metadata' && 'Update token metadata information.'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {activeOperation === 'mint' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="mint-amount">Amount to Mint</Label>
                    <Input
                      id="mint-amount"
                      type="number"
                      step={1 / Math.pow(10, token.decimals)}
                      placeholder={`Enter amount (decimals: ${token.decimals})`}
                      value={operationParams.amount || ''}
                      onChange={(e) => setOperationParams({...operationParams, amount: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mint-destination">Destination Address (optional)</Label>
                    <Input
                      id="mint-destination"
                      placeholder="Leave empty to mint to your address"
                      value={operationParams.destination || ''}
                      onChange={(e) => setOperationParams({...operationParams, destination: e.target.value})}
                    />
                  </div>
                </>
              )}

              {activeOperation === 'burn' && (
                <div className="space-y-2">
                  <Label htmlFor="burn-amount">Amount to Burn</Label>
                  <Input
                    id="burn-amount"
                    type="number"
                    step={1 / Math.pow(10, token.decimals)}
                    placeholder={`Max: ${formatBalance(token.balance, token.decimals)}`}
                    value={operationParams.amount || ''}
                    onChange={(e) => setOperationParams({...operationParams, amount: e.target.value})}
                  />
                  <div className="flex items-center gap-2 text-xs text-red-400">
                    <AlertTriangle className="h-4 w-4" />
                    This action is irreversible
                  </div>
                </div>
              )}

              {activeOperation === 'transfer' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="transfer-recipient">Recipient Address</Label>
                    <Input
                      id="transfer-recipient"
                      placeholder="Enter recipient's Solana address"
                      value={operationParams.recipient || ''}
                      onChange={(e) => setOperationParams({...operationParams, recipient: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transfer-amount">Amount to Transfer</Label>
                    <Input
                      id="transfer-amount"
                      type="number"
                      step={1 / Math.pow(10, token.decimals)}
                      placeholder={`Max: ${formatBalance(token.balance, token.decimals)}`}
                      value={operationParams.amount || ''}
                      onChange={(e) => setOperationParams({...operationParams, amount: e.target.value})}
                    />
                  </div>
                </>
              )}

              {activeOperation === 'metadata' && (
                <Tabs defaultValue="basic">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="advanced">Advanced</TabsTrigger>
                  </TabsList>
                  <TabsContent value="basic" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="meta-name">Token Name</Label>
                      <Input
                        id="meta-name"
                        placeholder={token.name}
                        value={operationParams.name || ''}
                        onChange={(e) => setOperationParams({...operationParams, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="meta-symbol">Token Symbol</Label>
                      <Input
                        id="meta-symbol"
                        placeholder={token.symbol}
                        value={operationParams.symbol || ''}
                        onChange={(e) => setOperationParams({...operationParams, symbol: e.target.value})}
                      />
                    </div>
                  </TabsContent>
                  <TabsContent value="advanced" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="meta-uri">Metadata URI</Label>
                      <Input
                        id="meta-uri"
                        placeholder="https://example.com/metadata.json"
                        value={operationParams.metadataUri || ''}
                        onChange={(e) => setOperationParams({...operationParams, metadataUri: e.target.value})}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setActiveOperation(null)}>
                Cancel
              </Button>
              <Button 
                onClick={() => handleOperation(activeOperation)}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Confirm {activeOperation}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
