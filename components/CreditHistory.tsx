'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  History, 
  CreditCard, 
  TrendingUp, 
  TrendingDown,
  Clock,
  ExternalLink
} from 'lucide-react';
import { useWalletAuth } from '@/components/providers/WalletAuthProvider';
import { getCreditHistory, CreditTransaction } from '@/lib/credit-system';

export default function CreditHistory() {
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { walletAddress } = useWalletAuth();

  useEffect(() => {
    const loadTransactionHistory = async () => {
      if (!walletAddress) {
        setTransactions([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const result = await getCreditHistory(walletAddress, 50);
        if (result.success && result.data) {
          setTransactions(result.data);
        } else {
          // If no real transactions, show demo data
          setTransactions([]);
        }
      } catch (error) {
        console.error('Error loading transaction history:', error);
        setTransactions([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadTransactionHistory();
  }, [walletAddress]);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'spend':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      case 'bonus':
        return <CreditCard className="w-4 h-4 text-purple-400" />;
      case 'refund':
        return <TrendingUp className="w-4 h-4 text-blue-400" />;
      case 'adjustment':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Failed</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Unknown</Badge>;
    }
  };

  const formatAmount = (amount: number, type: string) => {
    const sign = type === 'spend' ? '-' : '+';
    return `${sign}${Math.abs(amount).toLocaleString()}`;
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <Card className="snarbles-card">
        <CardHeader>
          <CardTitle className="snarbles-heading-4 flex items-center gap-2">
            <History className="w-5 h-5 text-blue-400" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
            <p className="snarbles-body text-gray-400 mt-4">Loading transaction history...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card className="snarbles-card">
        <CardHeader>
          <CardTitle className="snarbles-heading-4 flex items-center gap-2">
            <History className="w-5 h-5 text-blue-400" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <History className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="snarbles-heading-5 mb-2">No Transactions Yet</h3>
            <p className="snarbles-body text-gray-400 mb-4">
              Your credit purchase and spending history will appear here once you start using the platform.
            </p>
            <p className="snarbles-body-small text-gray-500">
              Purchase credits to deploy tokens on mainnet networks or spend credits on token creation.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="snarbles-card">
      <CardHeader>
        <CardTitle className="snarbles-heading-4 flex items-center gap-2">
          <History className="w-5 h-5 text-blue-400" />
          Transaction History
        </CardTitle>
        <p className="snarbles-body-small text-gray-400">
          Your complete credit transaction history
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div 
              key={transaction.id}
              className="snarbles-glass-subtle p-4 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  {getTransactionIcon(transaction.type)}
                  <div>
                    <h4 className="snarbles-heading font-semibold">
                      {transaction.description}
                    </h4>
                    <p className="snarbles-body-small text-gray-400">
                      {formatDate(transaction.timestamp)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`snarbles-heading font-bold ${
                    transaction.type === 'spend' ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {formatAmount(transaction.amount, transaction.type)} credits
                  </div>
                  {getStatusBadge(transaction.status)}
                </div>
              </div>
              
              {transaction.transaction_hash && (
                <div className="mt-3 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => {
                      // Open blockchain explorer (placeholder)
                      window.open(`https://algoexplorer.io/tx/${transaction.transaction_hash}`, '_blank');
                    }}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    View on Explorer
                  </Button>
                  <span className="snarbles-body-small text-gray-500">
                    {transaction.transaction_hash.slice(0, 8)}...{transaction.transaction_hash.slice(-8)}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {transactions.length >= 50 && (
          <div className="mt-6 text-center">
            <Button variant="outline" className="snarbles-btn-secondary">
              Load More Transactions
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
