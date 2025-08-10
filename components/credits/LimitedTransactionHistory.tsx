'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  History, 
  ArrowRight, 
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface Transaction {
  id: string;
  type: 'credit_purchase' | 'token_creation' | 'credit_usage';
  amount: number;
  description: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
  credits?: number;
}

interface LimitedTransactionHistoryProps {
  className?: string;
}

export default function LimitedTransactionHistory({ className }: LimitedTransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Mock data for now - in real implementation, fetch from API
  useEffect(() => {
    const mockTransactions: Transaction[] = [
      {
        id: '1',
        type: 'token_creation',
        amount: 30,
        description: 'Create token EXAMPLE on algorand-mainnet',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
        status: 'completed',
        credits: 30
      },
      {
        id: '2',
        type: 'credit_purchase',
        amount: 1,
        description: 'USDT credit purchase - 1 credits',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        status: 'completed',
        credits: 1
      },
      {
        id: '3',
        type: 'credit_purchase',
        amount: 30,
        description: 'ALGO Credit Purchase: 10 ALGO → 20 credits',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        status: 'completed',
        credits: 30
      },
      {
        id: '4',
        type: 'token_creation',
        amount: 30,
        description: 'Create token TEST on algorand-mainnet',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
        status: 'completed',
        credits: 30
      },
      {
        id: '5',
        type: 'credit_purchase',
        amount: 30,
        description: 'ALGO Credit Purchase: 15 ALGO → 30 credits',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
        status: 'completed',
        credits: 30
      }
    ];

    // Simulate API loading
    setTimeout(() => {
      setTransactions(mockTransactions);
      setIsLoading(false);
    }, 500);
  }, []);

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'token_creation':
        return '🪙';
      case 'credit_purchase':
        return '💳';
      case 'credit_usage':
        return '⚡';
      default:
        return '📝';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-3 h-3 text-green-400" />;
      case 'pending':
        return <Clock className="w-3 h-3 text-yellow-400" />;
      case 'failed':
        return <AlertCircle className="w-3 h-3 text-red-400" />;
      default:
        return <Clock className="w-3 h-3 text-muted-foreground" />;
    }
  };

  return (
    <Card className={`glass-card border-purple-500/10 ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
              <History className="w-4 h-4 text-purple-400" />
            </div>
            Recent Activity
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard?tab=transactions')}
            className="text-xs h-8"
          >
            View All
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg animate-pulse">
                <div className="w-8 h-8 bg-muted/30 rounded-lg"></div>
                <div className="flex-1 space-y-1">
                  <div className="h-3 bg-muted/30 rounded w-3/4"></div>
                  <div className="h-2 bg-muted/20 rounded w-1/2"></div>
                </div>
                <div className="w-12 h-4 bg-muted/20 rounded"></div>
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted/20 flex items-center justify-center">
              <History className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No transactions yet</p>
            <p className="text-xs text-muted-foreground mt-1">Your credit activity will appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div 
                key={tx.id} 
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/10 transition-colors group"
              >
                {/* Transaction Icon */}
                <div className="w-8 h-8 rounded-lg bg-muted/20 flex items-center justify-center text-sm flex-shrink-0">
                  {getTransactionIcon(tx.type)}
                </div>

                {/* Transaction Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {tx.description}
                    </p>
                    {getStatusIcon(tx.status)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimeAgo(tx.timestamp)}</span>
                  </div>
                </div>

                {/* Credits Badge */}
                <div className="flex-shrink-0">
                  <Badge 
                    variant={tx.type === 'credit_purchase' ? 'default' : 'secondary'}
                    className="text-xs font-mono"
                  >
                    {tx.type === 'credit_purchase' ? '+' : '-'}{tx.credits || tx.amount}
                  </Badge>
                </div>
              </div>
            ))}

            {/* View More Button */}
            <div className="pt-3 border-t border-border mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard?tab=transactions')}
                className="w-full text-sm text-muted-foreground hover:text-foreground"
              >
                View All Transaction History
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
