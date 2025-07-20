'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ExternalLink, 
  Copy, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BaseTransaction {
  id: string;
  type: 'mint' | 'burn' | 'transfer' | 'freeze' | 'unfreeze' | 'metadata_update' | 'authority_transfer';
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: string;
  amount?: string;
  fees: string;
  network: 'solana' | 'algorand';
}

interface SolanaTransaction extends BaseTransaction {
  network: 'solana';
  signature: string;
  fromAddress?: string;
  toAddress?: string;
  mintAddress: string;
  tokenName: string;
  tokenSymbol: string;
}

interface AlgorandTransaction extends BaseTransaction {
  network: 'algorand';
  txId: string;
  fromAddress?: string;
  toAddress?: string;
  assetId: number;
  assetName: string;
  unitName: string;
}

type UniversalTransaction = SolanaTransaction | AlgorandTransaction;

interface TransactionHistoryProps {
  transactions: UniversalTransaction[];
  isLoading?: boolean;
  onRefresh?: () => void;
  maxItems?: number;
}

export function TransactionHistory({ 
  transactions, 
  isLoading = false, 
  onRefresh,
  maxItems = 10 
}: TransactionHistoryProps) {
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `${label} copied successfully`,
      duration: 2000,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-400" />;
      case 'pending':
        return <Loader2 className="h-4 w-4 text-yellow-400 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'failed':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'mint':
        return <ArrowUpRight className="h-4 w-4 text-green-400" />;
      case 'burn':
        return <ArrowDownRight className="h-4 w-4 text-red-400" />;
      case 'transfer':
        return <ArrowUpRight className="h-4 w-4 text-blue-400" />;
      case 'freeze':
      case 'unfreeze':
        return <div className="h-4 w-4 bg-orange-400 rounded-sm" />;
      default:
        return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
    }
  };

  const getExplorerUrl = (transaction: UniversalTransaction) => {
    if (transaction.network === 'solana') {
      const solTx = transaction as SolanaTransaction;
      return `https://explorer.solana.com/tx/${solTx.signature}`;
    } else {
      const algoTx = transaction as AlgorandTransaction;
      return `https://algoexplorer.io/tx/${algoTx.txId}`;
    }
  };

  const getTransactionId = (transaction: UniversalTransaction) => {
    if (transaction.network === 'solana') {
      return (transaction as SolanaTransaction).signature;
    } else {
      return (transaction as AlgorandTransaction).txId;
    }
  };

  const displayedTransactions = maxItems 
    ? transactions.slice(0, maxItems) 
    : transactions;

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Transaction History</CardTitle>
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <Clock className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {displayedTransactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No transactions found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedTransactions.map((transaction) => {
              const tokenInfo = transaction.network === 'solana' 
                ? { name: (transaction as SolanaTransaction).tokenName, symbol: (transaction as SolanaTransaction).tokenSymbol }
                : { name: (transaction as AlgorandTransaction).assetName, symbol: (transaction as AlgorandTransaction).unitName };

              return (
                <div key={transaction.id} className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(transaction.type)}
                      {getStatusIcon(transaction.status)}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-foreground capitalize">
                          {transaction.type.replace('_', ' ')}
                        </p>
                        <Badge className={getStatusColor(transaction.status)}>
                          {transaction.status}
                        </Badge>
                        <Badge className={
                          transaction.network === 'solana' 
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                            : 'bg-green-500/10 text-green-400 border-green-500/20'
                        }>
                          {transaction.network.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {tokenInfo.name} ({tokenInfo.symbol})
                        {transaction.amount && ` • ${transaction.amount}`}
                      </p>
                      
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">
                        Fee: {transaction.fees} {transaction.network === 'solana' ? 'SOL' : 'ALGO'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ID: {getTransactionId(transaction).slice(0, 8)}...
                      </p>
                    </div>
                    
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(getTransactionId(transaction), 'Transaction ID')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(getExplorerUrl(transaction), '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
