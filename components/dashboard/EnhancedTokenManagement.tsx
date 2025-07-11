'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Coins, 
  Plus, 
  Flame, 
  Send, 
  Pause, 
  Play, 
  Settings, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Loader2, 
  X,
  Users,
  Calendar,
  TrendingUp,
  Shield,
  Zap,
  Lock,
  Unlock,
  MoreHorizontal,
  Eye,
  EyeOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Network type definition
export type NetworkType = 'algorand' | 'solana';

// Token interface for both networks
export interface UniversalTokenInfo {
  id: string; // assetId for Algorand, mint for Solana
  name: string;
  symbol: string;
  balance: string;
  uiBalance: number;
  decimals: number;
  description?: string;
  image?: string;
  verified: boolean;
  creator?: string;
  manager?: string;
  freeze?: string;
  clawback?: string;
  isPaused?: boolean;
  isFrozen?: boolean;
  explorerUrl: string;
  network: NetworkType;
  permissions?: string[];
  totalSupply?: number;
  holders?: number;
  marketCap?: number;
  value?: string;
  change?: string;
}

// Operation types
export type TokenOperation = 'mint' | 'burn' | 'transfer' | 'pause' | 'unpause' | 'freeze' | 'unfreeze';

// Enhanced operation interface
export interface TokenOperationData {
  operation: TokenOperation;
  amount?: number;
  recipient?: string;
  note?: string;
  validateOnly?: boolean;
}

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  estimatedFee?: number;
  confirmationRequired?: boolean;
}

// Props interface
interface EnhancedTokenManagementProps {
  tokens: UniversalTokenInfo[];
  network: NetworkType;
  walletAddress: string;
  onTokenOperation: (tokenId: string, operation: TokenOperationData) => Promise<{ success: boolean; error?: string }>;
  onBatchOperation: (tokenIds: string[], operation: TokenOperationData) => Promise<{ success: boolean; error?: string }>;
  canPerformOperation: (token: UniversalTokenInfo, operation: TokenOperation) => boolean;
  loading?: boolean;
  refreshData: () => void;
}

export default function EnhancedTokenManagement({
  tokens,
  network,
  walletAddress,
  onTokenOperation,
  onBatchOperation,
  canPerformOperation,
  loading = false,
  refreshData
}: EnhancedTokenManagementProps) {
  const { toast } = useToast();

  // State management
  const [selectedTokens, setSelectedTokens] = useState<Set<string>>(new Set());
  const [currentOperation, setCurrentOperation] = useState<TokenOperation | null>(null);
  const [selectedToken, setSelectedToken] = useState<UniversalTokenInfo | null>(null);
  const [operationData, setOperationData] = useState<TokenOperationData>({
    operation: 'mint',
    amount: undefined,
    recipient: '',
    note: ''
  });
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isOperating, setIsOperating] = useState(false);
  const [showOperationDialog, setShowOperationDialog] = useState(false);
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [operationProgress, setOperationProgress] = useState(0);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paused' | 'frozen'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'balance' | 'value' | 'created'>('name');

  // Filter and sort tokens
  const filteredAndSortedTokens = tokens
    .filter(token => {
      if (filterStatus === 'all') return true;
      if (filterStatus === 'active') return !token.isPaused && !token.isFrozen;
      if (filterStatus === 'paused') return token.isPaused;
      if (filterStatus === 'frozen') return token.isFrozen;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'balance':
          return b.uiBalance - a.uiBalance;
        case 'value':
          const aValue = parseFloat(a.value?.replace('$', '') || '0');
          const bValue = parseFloat(b.value?.replace('$', '') || '0');
          return bValue - aValue;
        case 'created':
          return a.name.localeCompare(b.name); // Fallback to name
        default:
          return 0;
      }
    });

  // Validation logic
  const validateOperation = async (token: UniversalTokenInfo, operation: TokenOperationData): Promise<ValidationResult> => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Permission checks
    if (!canPerformOperation(token, operation.operation)) {
      errors.push(`You don't have permission to ${operation.operation} this token`);
    }

    // Amount validation
    if (['mint', 'burn', 'transfer'].includes(operation.operation)) {
      if (!operation.amount || operation.amount <= 0) {
        errors.push('Amount must be greater than 0');
      }

      if (operation.operation === 'burn' && operation.amount && operation.amount > token.uiBalance) {
        errors.push(`Insufficient balance. You have ${token.uiBalance} ${token.symbol}`);
      }

      if (operation.operation === 'transfer' && operation.amount && operation.amount > token.uiBalance) {
        errors.push(`Insufficient balance for transfer. You have ${token.uiBalance} ${token.symbol}`);
      }

      // Large amount warnings
      if (operation.amount && operation.amount > token.uiBalance * 0.5) {
        warnings.push('You are transferring/burning more than 50% of your balance');
      }
    }

    // Recipient validation for transfers
    if (operation.operation === 'transfer') {
      if (!operation.recipient?.trim()) {
        errors.push('Recipient address is required for transfers');
      } else {
        // Network-specific address validation
        if (network === 'algorand') {
          if (operation.recipient.length !== 58) {
            errors.push('Invalid Algorand address format');
          }
        } else if (network === 'solana') {
          try {
            // Basic Solana address validation (Base58, 32-44 chars)
            if (operation.recipient.length < 32 || operation.recipient.length > 44) {
              errors.push('Invalid Solana address format');
            }
          } catch {
            errors.push('Invalid Solana address format');
          }
        }

        if (operation.recipient === walletAddress) {
          errors.push('Cannot transfer to your own address');
        }
      }
    }

    // Status checks
    if (token.isPaused && ['mint', 'burn', 'transfer'].includes(operation.operation)) {
      errors.push('Token is currently paused');
    }

    if (token.isFrozen && ['transfer'].includes(operation.operation)) {
      errors.push('Token is currently frozen');
    }

    // Estimate fees (simplified)
    let estimatedFee = 0;
    if (network === 'algorand') {
      estimatedFee = 0.001; // 1000 microAlgos
    } else if (network === 'solana') {
      estimatedFee = 0.00025; // ~2500 lamports
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      estimatedFee,
      confirmationRequired: warnings.length > 0 || operation.amount !== undefined && operation.amount > 1000
    };
  };

  // Handle operation start
  const startOperation = (token: UniversalTokenInfo, operation: TokenOperation) => {
    setSelectedToken(token);
    setCurrentOperation(operation);
    setOperationData({
      operation,
      amount: undefined,
      recipient: '',
      note: ''
    });
    setValidationResult(null);
    setShowOperationDialog(true);
  };

  // Handle batch operation start
  const startBatchOperation = (operation: TokenOperation) => {
    if (selectedTokens.size === 0) {
      toast({
        title: "No tokens selected",
        description: "Please select tokens for batch operation",
        variant: "destructive"
      });
      return;
    }

    setCurrentOperation(operation);
    setOperationData({
      operation,
      amount: undefined,
      recipient: '',
      note: ''
    });
    setShowBatchDialog(true);
  };

  // Execute operation
  const executeOperation = async () => {
    if (!selectedToken || !currentOperation) return;

    setIsOperating(true);
    setOperationProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setOperationProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const result = await onTokenOperation(selectedToken.id, operationData);

      clearInterval(progressInterval);
      setOperationProgress(100);

      if (result.success) {
        toast({
          title: "Operation successful",
          description: `Successfully ${currentOperation}ed ${selectedToken.symbol}`,
        });
        setShowOperationDialog(false);
        refreshData();
      } else {
        toast({
          title: "Operation failed",
          description: result.error || 'Unknown error occurred',
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Operation failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      });
    } finally {
      setIsOperating(false);
      setOperationProgress(0);
    }
  };

  // Execute batch operation
  const executeBatchOperation = async () => {
    if (selectedTokens.size === 0 || !currentOperation) return;

    setIsOperating(true);
    setOperationProgress(0);

    try {
      const tokenIds = Array.from(selectedTokens);
      const progressStep = 100 / tokenIds.length;

      for (let i = 0; i < tokenIds.length; i++) {
        setOperationProgress((i / tokenIds.length) * 100);
        
        const result = await onTokenOperation(tokenIds[i], operationData);
        
        if (!result.success) {
          throw new Error(`Failed to ${currentOperation} token ${tokenIds[i]}: ${result.error}`);
        }
      }

      setOperationProgress(100);
      
      toast({
        title: "Batch operation successful",
        description: `Successfully ${currentOperation}ed ${selectedTokens.size} tokens`,
      });
      
      setShowBatchDialog(false);
      setSelectedTokens(new Set());
      refreshData();
    } catch (error) {
      toast({
        title: "Batch operation failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      });
    } finally {
      setIsOperating(false);
      setOperationProgress(0);
    }
  };

  // Validate on data change
  useEffect(() => {
    if (selectedToken && currentOperation && operationData) {
      validateOperation(selectedToken, operationData).then(setValidationResult);
    }
  }, [selectedToken, currentOperation, operationData, network, walletAddress]);

  // Clear selection when tokens change
  useEffect(() => {
    setSelectedTokens(new Set());
  }, [tokens]);

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">Token Management</h3>
          <Badge variant="outline" className="capitalize">
            {network}
          </Badge>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter and Sort */}
          <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tokens</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="frozen">Frozen</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="balance">Balance</SelectItem>
              <SelectItem value="value">Value</SelectItem>
            </SelectContent>
          </Select>

          {/* Batch Operations */}
          {selectedTokens.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedTokens.size} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => startBatchOperation('pause')}
              >
                <Pause className="w-4 h-4 mr-1" />
                Pause
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => startBatchOperation('unpause')}
              >
                <Play className="w-4 h-4 mr-1" />
                Unpause
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTokens(new Set())}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Token List */}
      <div className="space-y-3">
        {filteredAndSortedTokens.map((token) => (
          <Card key={token.id} className="glass-card hover:bg-muted/5 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {/* Selection Checkbox */}
                <Checkbox
                  checked={selectedTokens.has(token.id)}
                  onCheckedChange={(checked) => {
                    const newSelected = new Set(selectedTokens);
                    if (checked) {
                      newSelected.add(token.id);
                    } else {
                      newSelected.delete(token.id);
                    }
                    setSelectedTokens(newSelected);
                  }}
                />

                {/* Token Icon */}
                <div className="flex-shrink-0">
                  {token.image ? (
                    <img 
                      src={token.image} 
                      alt={token.name} 
                      className="w-12 h-12 rounded-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).parentElement!.innerHTML = `
                          <div class="w-12 h-12 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center">
                            <span class="text-primary-foreground font-bold">${token.symbol?.[0] || 'T'}</span>
                          </div>
                        `;
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center">
                      <span className="text-primary-foreground font-bold">{token.symbol?.[0] || 'T'}</span>
                    </div>
                  )}
                </div>

                {/* Token Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold truncate">{token.name}</h4>
                    {token.verified && (
                      <Badge variant="secondary" className="text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                    {token.isPaused && (
                      <Badge variant="destructive" className="text-xs">
                        <Pause className="w-3 h-3 mr-1" />
                        Paused
                      </Badge>
                    )}
                    {token.isFrozen && (
                      <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-600">
                        <Lock className="w-3 h-3 mr-1" />
                        Frozen
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span>{token.symbol}</span>
                    <span>Balance: {token.uiBalance.toLocaleString()}</span>
                    {token.value && <span>Value: {token.value}</span>}
                    {token.change && (
                      <span className={token.change.startsWith('+') ? 'text-green-500' : token.change.startsWith('-') ? 'text-red-500' : ''}>
                        {token.change}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  {canPerformOperation(token, 'mint') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startOperation(token, 'mint')}
                      disabled={loading || token.isPaused}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Mint
                    </Button>
                  )}
                  
                  {canPerformOperation(token, 'burn') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startOperation(token, 'burn')}
                      disabled={loading || token.isPaused || token.uiBalance === 0}
                    >
                      <Flame className="w-4 h-4 mr-1" />
                      Burn
                    </Button>
                  )}
                  
                  {canPerformOperation(token, 'transfer') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startOperation(token, 'transfer')}
                      disabled={loading || token.isPaused || token.isFrozen || token.uiBalance === 0}
                    >
                      <Send className="w-4 h-4 mr-1" />
                      Transfer
                    </Button>
                  )}
                  
                  {canPerformOperation(token, 'pause') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startOperation(token, token.isPaused ? 'unpause' : 'pause')}
                      disabled={loading}
                    >
                      {token.isPaused ? (
                        <>
                          <Play className="w-4 h-4 mr-1" />
                          Unpause
                        </>
                      ) : (
                        <>
                          <Pause className="w-4 h-4 mr-1" />
                          Pause
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredAndSortedTokens.length === 0 && (
        <Card className="glass-card">
          <CardContent className="p-8 text-center">
            <Coins className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">No Tokens Found</h3>
            <p className="text-muted-foreground">
              {filterStatus === 'all' 
                ? 'No tokens available for management'
                : `No ${filterStatus} tokens found`
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Operation Dialog */}
      <Dialog open={showOperationDialog} onOpenChange={setShowOperationDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {currentOperation === 'mint' && <Plus className="w-5 h-5" />}
              {currentOperation === 'burn' && <Flame className="w-5 h-5" />}
              {currentOperation === 'transfer' && <Send className="w-5 h-5" />}
              {currentOperation === 'pause' && <Pause className="w-5 h-5" />}
              {currentOperation === 'unpause' && <Play className="w-5 h-5" />}
              {currentOperation && currentOperation.charAt(0).toUpperCase() + currentOperation.slice(1)} {selectedToken?.symbol}
            </DialogTitle>
            <DialogDescription>
              {selectedToken && `${currentOperation} tokens for ${selectedToken.name}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Amount Input */}
            {['mint', 'burn', 'transfer'].includes(currentOperation || '') && (
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={operationData.amount || ''}
                  onChange={(e) => setOperationData(prev => ({
                    ...prev,
                    amount: parseFloat(e.target.value) || undefined
                  }))}
                />
                {selectedToken && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Available: {selectedToken.uiBalance.toLocaleString()} {selectedToken.symbol}
                  </p>
                )}
              </div>
            )}

            {/* Recipient Input */}
            {currentOperation === 'transfer' && (
              <div>
                <Label htmlFor="recipient">Recipient Address</Label>
                <Input
                  id="recipient"
                  placeholder={network === 'algorand' ? 'Algorand address...' : 'Solana address...'}
                  value={operationData.recipient || ''}
                  onChange={(e) => setOperationData(prev => ({
                    ...prev,
                    recipient: e.target.value
                  }))}
                />
              </div>
            )}

            {/* Advanced Options */}
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                className="p-0 h-auto"
              >
                {showAdvancedOptions ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                Advanced Options
              </Button>
              
              {showAdvancedOptions && (
                <div className="mt-2 space-y-3">
                  <div>
                    <Label htmlFor="note">Note (Optional)</Label>
                    <Textarea
                      id="note"
                      placeholder="Add a note for this transaction..."
                      value={operationData.note || ''}
                      onChange={(e) => setOperationData(prev => ({
                        ...prev,
                        note: e.target.value
                      }))}
                      rows={2}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Validation Results */}
            {validationResult && (
              <div className="space-y-2">
                {validationResult.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <ul className="list-disc list-inside space-y-1">
                        {validationResult.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {validationResult.warnings.length > 0 && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <ul className="list-disc list-inside space-y-1">
                        {validationResult.warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {validationResult.estimatedFee && (
                  <p className="text-xs text-muted-foreground">
                    Estimated fee: {validationResult.estimatedFee} {network === 'algorand' ? 'ALGO' : 'SOL'}
                  </p>
                )}
              </div>
            )}

            {/* Operation Progress */}
            {isOperating && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Processing operation...</span>
                </div>
                <Progress value={operationProgress} className="w-full" />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowOperationDialog(false)}
              disabled={isOperating}
            >
              Cancel
            </Button>
            <Button
              onClick={executeOperation}
              disabled={!validationResult?.isValid || isOperating}
            >
              {isOperating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Confirm ${currentOperation?.charAt(0).toUpperCase()}${currentOperation?.slice(1)}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Operation Dialog */}
      <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Batch {currentOperation?.charAt(0).toUpperCase()}{currentOperation?.slice(1)}
            </DialogTitle>
            <DialogDescription>
              Apply {currentOperation} to {selectedTokens.size} selected tokens
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                This operation will be applied to all selected tokens. Make sure you want to proceed.
              </AlertDescription>
            </Alert>

            {/* Selected Tokens List */}
            <div className="max-h-32 overflow-y-auto space-y-1">
              {Array.from(selectedTokens).map(tokenId => {
                const token = tokens.find(t => t.id === tokenId);
                return token && (
                  <div key={tokenId} className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{token.symbol}</span>
                    <span className="text-muted-foreground">{token.name}</span>
                  </div>
                );
              })}
            </div>

            {/* Batch Progress */}
            {isOperating && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Processing batch operation...</span>
                </div>
                <Progress value={operationProgress} className="w-full" />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBatchDialog(false)}
              disabled={isOperating}
            >
              Cancel
            </Button>
            <Button
              onClick={executeBatchOperation}
              disabled={isOperating}
            >
              {isOperating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Confirm Batch ${currentOperation?.charAt(0).toUpperCase()}${currentOperation?.slice(1)}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 