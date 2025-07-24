'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  History, 
  Clock, 
  User, 
  FileText, 
  Image, 
  Link, 
  Settings, 
  Eye, 
  GitBranch, 
  Undo, 
  Download, 
  ExternalLink,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Filter,
  Search,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export interface MetadataChange {
  field: string;
  oldValue: any;
  newValue: any;
  changeType: 'added' | 'modified' | 'removed';
}

export interface MetadataHistoryEntry {
  id: string;
  version: number;
  timestamp: Date;
  updatedBy: string;
  transactionHash: string;
  blockNumber?: number;
  changes: MetadataChange[];
  changeDescription: string;
  metadataSnapshot: any;
  gasUsed?: number;
  status: 'confirmed' | 'pending' | 'failed';
  rollbackAvailable: boolean;
}

interface MetadataHistoryProps {
  tokenId: string;
  network: 'algorand' | 'solana';
  history: MetadataHistoryEntry[];
  onRevert: (versionId: string) => Promise<{ success: boolean; error?: string }>;
  onRefresh: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const CHANGE_TYPE_COLORS = {
  added: 'bg-green-500/20 text-green-400 border-green-500/30',
  modified: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  removed: 'bg-red-500/20 text-red-400 border-red-500/30'
};

const STATUS_COLORS = {
  confirmed: 'bg-green-500/20 text-green-400 border-green-500/30',
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  failed: 'bg-red-500/20 text-red-400 border-red-500/30'
};

export default function MetadataHistory({
  tokenId,
  network,
  history,
  onRevert,
  onRefresh,
  isOpen,
  onClose
}: MetadataHistoryProps) {
  const { toast } = useToast();
  
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const [selectedEntry, setSelectedEntry] = useState<MetadataHistoryEntry | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isReverting, setIsReverting] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');

  // Filter history entries
  const filteredHistory = history.filter(entry => {
    // Search filter
    if (searchTerm && !entry.changeDescription.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !entry.updatedBy.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Status filter
    if (statusFilter !== 'all' && entry.status !== statusFilter) {
      return false;
    }
    
    // User filter
    if (userFilter !== 'all' && entry.updatedBy !== userFilter) {
      return false;
    }
    
    // Date range filter
    if (dateRange !== 'all') {
      const entryDate = new Date(entry.timestamp);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (dateRange) {
        case '24h':
          if (daysDiff > 1) return false;
          break;
        case '7d':
          if (daysDiff > 7) return false;
          break;
        case '30d':
          if (daysDiff > 30) return false;
          break;
      }
    }
    
    return true;
  });

  // Get unique users for filter
  const uniqueUsers = Array.from(new Set(history.map(entry => entry.updatedBy)));

  // Toggle entry expansion
  const toggleExpansion = (entryId: string) => {
    const newExpanded = new Set(expandedEntries);
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId);
    } else {
      newExpanded.add(entryId);
    }
    setExpandedEntries(newExpanded);
  };

  // Show entry details
  const showEntryDetails = (entry: MetadataHistoryEntry) => {
    setSelectedEntry(entry);
    setShowDetails(true);
  };

  // Handle revert
  const handleRevert = async (entry: MetadataHistoryEntry) => {
    if (!entry.rollbackAvailable) {
      toast({
        title: "Revert Unavailable",
        description: "This version cannot be reverted to",
        variant: "destructive"
      });
      return;
    }

    setIsReverting(true);
    
    try {
      const result = await onRevert(entry.id);
      
      if (result.success) {
        toast({
          title: "Metadata Reverted",
          description: `Successfully reverted to version ${entry.version}`,
        });
        onRefresh();
      } else {
        throw new Error(result.error || 'Failed to revert metadata');
      }
    } catch (error) {
      console.error('Revert failed:', error);
      toast({
        title: "Revert Failed",
        description: error instanceof Error ? error.message : 'Failed to revert metadata',
        variant: "destructive"
      });
    } finally {
      setIsReverting(false);
    }
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

  // Format time ago
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  };

  // Get change icon
  const getChangeIcon = (field: string) => {
    switch (field) {
      case 'name':
      case 'description':
        return <FileText className="w-4 h-4" />;
      case 'image':
      case 'animation_url':
        return <Image className="w-4 h-4" />;
      case 'external_url':
      case 'website':
        return <Link className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  // Export history as JSON
  const exportHistory = () => {
    const exportData = {
      tokenId,
      network,
      exportedAt: new Date().toISOString(),
      history: filteredHistory
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metadata-history-${tokenId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "History Exported",
      description: "Metadata history has been downloaded as JSON",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-400" />
            Metadata History
          </DialogTitle>
          <DialogDescription>
            Complete change history for token {tokenId} on {network}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {/* Filters */}
          <div className="mb-6 p-4 border rounded-lg bg-muted/50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search changes..."
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>User</Label>
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {uniqueUsers.map(user => (
                      <SelectItem key={user} value={user}>
                        {user.slice(0, 8)}...{user.slice(-4)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Time Range</Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="24h">Last 24 Hours</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {filteredHistory.length} of {history.length} entries
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportHistory}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" size="sm" onClick={onRefresh}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          {/* History Timeline */}
          <ScrollArea className="h-[500px]">
            {filteredHistory.length > 0 ? (
              <div className="space-y-4">
                {filteredHistory.map((entry, index) => (
                  <Card key={entry.id} className="relative">
                    {/* Timeline connector */}
                    {index < filteredHistory.length - 1 && (
                      <div className="absolute left-6 top-12 w-0.5 h-8 bg-border" />
                    )}
                    
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Timeline dot */}
                        <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${
                          entry.status === 'confirmed' ? 'bg-green-500' :
                          entry.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        
                        {/* Entry content */}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Version {entry.version}</span>
                              <Badge className={STATUS_COLORS[entry.status]}>
                                {entry.status}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {formatTimeAgo(entry.timestamp)}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => showEntryDetails(entry)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              
                              {entry.rollbackAvailable && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRevert(entry)}
                                  disabled={isReverting}
                                  className="text-blue-400 hover:text-blue-300"
                                >
                                  <Undo className="w-4 h-4" />
                                </Button>
                              )}
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleExpansion(entry.id)}
                              >
                                {expandedEntries.has(entry.id) ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                          
                          <div className="mt-1">
                            <p className="text-sm">{entry.changeDescription}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>By: {entry.updatedBy.slice(0, 8)}...{entry.updatedBy.slice(-4)}</span>
                              <span>At: {formatDate(entry.timestamp)}</span>
                              {entry.gasUsed && (
                                <span>Gas: {entry.gasUsed.toLocaleString()}</span>
                              )}
                            </div>
                          </div>
                          
                          {/* Changes summary */}
                          <div className="mt-3 flex flex-wrap gap-1">
                            {entry.changes.slice(0, 3).map((change, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {getChangeIcon(change.field)}
                                <span className="ml-1">{change.field}</span>
                              </Badge>
                            ))}
                            {entry.changes.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{entry.changes.length - 3} more
                              </Badge>
                            )}
                          </div>
                          
                          {/* Expanded details */}
                          {expandedEntries.has(entry.id) && (
                            <div className="mt-4 space-y-3 border-t pt-3">
                              <div>
                                <h4 className="font-medium text-sm mb-2">Changes Detail:</h4>
                                <div className="space-y-2">
                                  {entry.changes.map((change, idx) => (
                                    <div key={idx} className="p-2 border rounded text-sm">
                                      <div className="flex items-center gap-2 mb-1">
                                        {getChangeIcon(change.field)}
                                        <span className="font-medium">{change.field}</span>
                                        <Badge className={CHANGE_TYPE_COLORS[change.changeType]}>
                                          {change.changeType}
                                        </Badge>
                                      </div>
                                      
                                      <div className="grid grid-cols-2 gap-2 text-xs">
                                        {change.changeType !== 'added' && (
                                          <div>
                                            <span className="text-muted-foreground">Before:</span>
                                            <div className="bg-red-500/10 p-1 rounded mt-1">
                                              {typeof change.oldValue === 'object' 
                                                ? JSON.stringify(change.oldValue, null, 2)
                                                : String(change.oldValue)
                                              }
                                            </div>
                                          </div>
                                        )}
                                        
                                        {change.changeType !== 'removed' && (
                                          <div>
                                            <span className="text-muted-foreground">After:</span>
                                            <div className="bg-green-500/10 p-1 rounded mt-1">
                                              {typeof change.newValue === 'object' 
                                                ? JSON.stringify(change.newValue, null, 2)
                                                : String(change.newValue)
                                              }
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 pt-2 border-t">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    navigator.clipboard.writeText(entry.transactionHash);
                                    toast({
                                      title: "Copied",
                                      description: "Transaction hash copied to clipboard",
                                    });
                                  }}
                                >
                                  Copy Tx Hash
                                </Button>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const explorerUrl = network === 'algorand' 
                                      ? `https://testnet.algoexplorer.io/tx/${entry.transactionHash}`
                                      : `https://explorer.solana.com/tx/${entry.transactionHash}?cluster=devnet`;
                                    window.open(explorerUrl, '_blank');
                                  }}
                                >
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  View on Explorer
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <History className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">No History Found</h3>
                <p className="text-muted-foreground">
                  {history.length === 0 
                    ? "No metadata changes have been recorded yet"
                    : "No entries match your current filters"
                  }
                </p>
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Entry Details Dialog */}
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Version {selectedEntry?.version} Details</DialogTitle>
              <DialogDescription>
                Complete metadata snapshot and transaction details
              </DialogDescription>
            </DialogHeader>
            
            {selectedEntry && (
              <Tabs defaultValue="snapshot" className="h-[600px]">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="snapshot">Metadata Snapshot</TabsTrigger>
                  <TabsTrigger value="changes">Changes</TabsTrigger>
                  <TabsTrigger value="transaction">Transaction</TabsTrigger>
                </TabsList>
                
                <ScrollArea className="h-[550px] mt-4">
                  <TabsContent value="snapshot">
                    <Card>
                      <CardHeader>
                        <CardTitle>Complete Metadata at Version {selectedEntry.version}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="text-xs bg-muted p-4 rounded overflow-x-auto">
                          {JSON.stringify(selectedEntry.metadataSnapshot, null, 2)}
                        </pre>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="changes">
                    <div className="space-y-4">
                      {selectedEntry.changes.map((change, idx) => (
                        <Card key={idx}>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              {getChangeIcon(change.field)}
                              {change.field}
                              <Badge className={CHANGE_TYPE_COLORS[change.changeType]}>
                                {change.changeType}
                              </Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {change.changeType !== 'added' && (
                                <div>
                                  <h4 className="font-medium mb-2">Previous Value:</h4>
                                  <pre className="text-xs bg-red-500/10 p-3 rounded overflow-x-auto">
                                    {typeof change.oldValue === 'object' 
                                      ? JSON.stringify(change.oldValue, null, 2)
                                      : String(change.oldValue)
                                    }
                                  </pre>
                                </div>
                              )}
                              
                              {change.changeType !== 'removed' && (
                                <div>
                                  <h4 className="font-medium mb-2">New Value:</h4>
                                  <pre className="text-xs bg-green-500/10 p-3 rounded overflow-x-auto">
                                    {typeof change.newValue === 'object' 
                                      ? JSON.stringify(change.newValue, null, 2)
                                      : String(change.newValue)
                                    }
                                  </pre>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="transaction">
                    <Card>
                      <CardHeader>
                        <CardTitle>Transaction Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Transaction Hash</Label>
                            <code className="block bg-muted p-2 rounded text-sm">
                              {selectedEntry.transactionHash}
                            </code>
                          </div>
                          
                          <div>
                            <Label>Status</Label>
                            <div className="mt-2">
                              <Badge className={STATUS_COLORS[selectedEntry.status]}>
                                {selectedEntry.status}
                              </Badge>
                            </div>
                          </div>
                          
                          <div>
                            <Label>Updated By</Label>
                            <code className="block bg-muted p-2 rounded text-sm">
                              {selectedEntry.updatedBy}
                            </code>
                          </div>
                          
                          <div>
                            <Label>Timestamp</Label>
                            <p className="text-sm mt-2">{formatDate(selectedEntry.timestamp)}</p>
                          </div>
                          
                          {selectedEntry.blockNumber && (
                            <div>
                              <Label>Block Number</Label>
                              <p className="text-sm mt-2">{selectedEntry.blockNumber.toLocaleString()}</p>
                            </div>
                          )}
                          
                          {selectedEntry.gasUsed && (
                            <div>
                              <Label>Gas Used</Label>
                              <p className="text-sm mt-2">{selectedEntry.gasUsed.toLocaleString()}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="pt-4 border-t">
                          <Button
                            variant="outline"
                            onClick={() => {
                              const explorerUrl = network === 'algorand' 
                                ? `https://testnet.algoexplorer.io/tx/${selectedEntry.transactionHash}`
                                : `https://explorer.solana.com/tx/${selectedEntry.transactionHash}?cluster=devnet`;
                              window.open(explorerUrl, '_blank');
                            }}
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View on {network === 'algorand' ? 'AlgoExplorer' : 'Solana Explorer'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </ScrollArea>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
