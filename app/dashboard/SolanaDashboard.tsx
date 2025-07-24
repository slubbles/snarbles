'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { PublicKey } from '@solana/web3.js';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { 
  Coins, 
  TrendingUp, 
  Users,
  Play,
  Pause,
  DollarSign, 
  Plus, 
  Settings, 
  ExternalLink,
  Copy,
  Send,
  Flame,
  BarChart3,
  AlertCircle,
  Calendar,
  Wallet,
  ArrowRight,
  Download,
  FileDown,
  ChevronDown,
  RefreshCw,
  Info,
  Loader2,
  AlertTriangle,
  ChevronRight,
  Eye,
  Star,
  Shield,
  Activity,
  Clock,
  Globe,
  CheckCircle,
  Sparkles,
  Zap
} from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  getEnhancedTokenInfo as fetchEnhancedTokenInfo,
  getWalletTransactionHistory as fetchWalletTransactionHistory, 
  getWalletSummary as fetchWalletSummary
} from '@/lib/solana-data';
import { mintTokens, burnTokens, transferTokens, getTokenBalance, pauseToken, unpauseToken } from '@/lib/solana';
import { DashboardSkeleton, TokenCardSkeleton } from '@/components/skeletons/DashboardSkeletons';
import { TokenHistoryList } from '@/components/TokenHistoryList';
import { useDashboardWebSocket } from '@/lib/websocket-client';
import { useRealTimeData } from '@/lib/real-time-data';
import SuperAdvancedAnalytics from '@/components/dashboard/SuperAdvancedAnalytics';
import PerformanceMonitor from '@/components/dashboard/PerformanceMonitor';

import { isSupabaseAvailable } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';
import { ADMIN_WALLET } from '@/lib/solana';

// Enhanced components
import EnhancedTokenManagement, { UniversalTokenInfo, TokenOperationData } from '@/components/dashboard/EnhancedTokenManagement';
import AdvancedAnalytics from '@/components/dashboard/AdvancedAnalytics';
import EnhancedTransactionManagement, { EnhancedTransaction } from '@/components/dashboard/EnhancedTransactionManagement';
import TokenManagement from '@/components/dashboard/TokenManagement';
import UserAnalytics from '@/components/dashboard/UserAnalytics';
import ComprehensiveMetadataManager from '@/components/dashboard/ComprehensiveMetadataManager';

interface TokenData {
  address: string;
  mint: string;
  name?: string;
  symbol?: string;
  balance?: string;
  uiBalance?: number;
  decimals?: number;
  value?: string;
  change?: string;
  holders?: number;
  isPaused?: boolean;
  verified?: boolean;
  createdAt?: Date;
  marketData?: any;
  image?: string;
}

interface Transaction {
  signature: string;
  type: 'mint' | 'burn' | 'transfer';
  amount: number;
  timestamp: Date;
  status: 'confirmed' | 'pending' | 'failed';
  from?: string;
  to?: string;
}

export default function SolanaDashboard() {
  // Solana wallet connection
  const { connected, publicKey, signTransaction, signAllTransactions } = useWallet();
  const { toast } = useToast();
  const [supabaseConfigured, setSupabaseConfigured] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [walletSummary, setWalletSummary] = useState({
    totalValue: 0,
    tokenCount: 0,
    totalTransactions: 0,
    change24h: 0,
    solBalance: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [transactionLoading, setTransactionLoading] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenData | null>(null);
  const [showMintDialog, setShowMintDialog] = useState(false);
  const [showBurnDialog, setShowBurnDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [actionAmount, setActionAmount] = useState('');
  const [transferRecipient, setTransferRecipient] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [showTokenHistory, setShowTokenHistory] = useState(true);

  // Enhanced dashboard state
  const [activeTab, setActiveTab] = useState('tokens');
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState<'24h' | '7d' | '30d' | '90d' | '1y'>('7d');
  const [viewMode, setViewMode] = useState<'enhanced' | 'legacy'>('enhanced');
  
  // Real-time WebSocket connection
  const { isConnected: wsConnected, subscribe, unsubscribe } = useDashboardWebSocket(publicKey?.toString());
  
  // Real-time data hooks
  const { 
    data: realTimeTokens, 
    loading: realTimeLoading, 
    refresh: refreshRealTimeTokens 
  } = useRealTimeData<TokenData[]>(
    `tokens:solana:${publicKey?.toString()}`,
    async () => {
      if (!publicKey) return [];
      const result = await fetchEnhancedTokenInfo(publicKey.toString());
      if (result.success && result.data) {
        // Map EnhancedTokenInfo to TokenData format
        return result.data.map(token => ({
          address: token.mint,
          mint: token.mint,
          name: token.name,
          symbol: token.symbol,
          balance: token.balance,
          uiBalance: token.uiBalance,
          decimals: token.decimals,
          verified: token.verified,
          image: token.image,
          marketData: token.marketData
        }));
      }
      return [];
    },
    { enabled: !!publicKey && connected }
  );
  
  const { 
    data: realTimeWalletSummary, 
    refresh: refreshRealTimeWalletSummary 
  } = useRealTimeData<any>(
    `wallet_summary:solana:${publicKey?.toString()}`,
    () => fetchWalletSummary(publicKey!.toString()),
    { enabled: !!publicKey && connected }
  );

  // Check if user is admin
  const isAdmin = connected && publicKey && publicKey.toString() === ADMIN_WALLET.toString();

  const chartData = [
    { name: 'Jan', value: 400 },
    { name: 'Feb', value: 300 },
    { name: 'Mar', value: 600 },
    { name: 'Apr', value: 800 },
    { name: 'May', value: 700 },
    { name: 'Jun', value: 900 }
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    return () => {
      // Clean up polling interval when component unmounts
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    }
  }, [connected, publicKey]);
  
  // Check if Supabase is configured
  useEffect(() => {
    setSupabaseConfigured(isSupabaseAvailable());
  }, []);

  useEffect(() => {
    // Start dashboard data loading
    if (connected && publicKey) {
      setLoading(true);
      loadDashboardData();
      
      // Set up polling for real-time updates every 30 seconds
      const interval = setInterval(() => {
        if (!refreshing) {
          loadDashboardData(false); // Silent refresh
        }
      }, 30000);
      
      setPollingInterval(interval);
    }
    
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [connected, publicKey]);

  // Convert Solana tokens to universal format
  const convertToUniversalTokens = (solanaTokens: TokenData[]): UniversalTokenInfo[] => {
    return solanaTokens.map(token => ({
      id: token.mint,
      name: token.name || 'Unknown Token',
      symbol: token.symbol || 'UNK',
      balance: token.balance || '0',
      uiBalance: token.uiBalance || 0,
      decimals: token.decimals || 9,
      description: '',
      image: token.image,
      verified: token.verified || false,
      creator: undefined, // Not available in current data
      manager: undefined, // Not available in current data
      freeze: undefined, // Not available in current data
      clawback: undefined, // Not available in current data
      isPaused: token.isPaused || false,
      isFrozen: false, // Solana doesn't have freeze like Algorand
      explorerUrl: `https://explorer.solana.com/address/${token.mint}?cluster=devnet`,
      network: 'solana' as const,
      permissions: [], // Would need to be determined based on token program
      totalSupply: undefined, // Not available in current data
      holders: token.holders,
      marketCap: undefined, // Not available in current data
      value: token.value,
      change: token.change
    }));
  };

  // Convert to format expected by ComprehensiveMetadataManager
  const convertToMetadataTokens = (solanaTokens: TokenData[]): Array<{
    tokenId: string;
    network: 'algorand' | 'solana';
    metadata: any;
  }> => {
    return solanaTokens.map(token => ({
      tokenId: token.mint,
      network: 'solana' as const,
      metadata: {
        name: token.name || 'Unknown Token',
        symbol: token.symbol || 'UNK',
        description: '',
        image: token.image,
        decimals: token.decimals || 9,
        verified: token.verified || false
      }
    }));
  };

  // Convert Solana transactions to universal format
  const convertToUniversalTransactions = (solanaTransactions: Transaction[]): EnhancedTransaction[] => {
    return solanaTransactions.map(tx => ({
      id: tx.signature,
      signature: tx.signature,
      type: tx.type,
      category: 'token_operation' as const,
      status: tx.status === 'confirmed' ? 'confirmed' : 
              tx.status === 'pending' ? 'pending' : 'failed',
      amount: tx.amount,
      token: 'SOL', // Default, should be improved
      tokenSymbol: 'SOL', // Default, should be improved
      tokenName: 'Solana', // Default, should be improved
      timestamp: tx.timestamp.getTime(),
      from: tx.from,
      to: tx.to,
      fee: 0.00025, // Approximate Solana transaction fee
      feeToken: 'SOL',
      usdValue: undefined, // Calculate if needed
      note: undefined,
      network: 'solana' as const,
      explorerUrl: `https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`,
      gasUsed: undefined, // Not applicable to Solana
      priorityFee: undefined, // Could be added if available
      confirmations: undefined // Not available in current data
    }));
  };

  // Permission checking for Solana tokens
  const canPerformOperation = (token: UniversalTokenInfo, operation: string): boolean => {
    // For now, allow all operations for token holders
    // In a real implementation, you'd check token program permissions
    switch (operation) {
      case 'mint':
        return true; // Would need to check if user is mint authority
      case 'burn':
        return token.uiBalance > 0; // Can burn if user has tokens
      case 'transfer':
        return token.uiBalance > 0; // Can transfer if user has tokens
      case 'pause':
      case 'unpause':
        return true; // Would need to check if user is pause authority
      case 'freeze':
      case 'unfreeze':
        return false; // Solana doesn't have freeze like Algorand
      default:
        return false;
    }
  };

  // Handle token operations
  const handleTokenOperation = async (tokenId: string, operation: TokenOperationData): Promise<{ success: boolean; error?: string }> => {
    const token = tokens.find(t => t.mint === tokenId);
    if (!token || !publicKey || !signTransaction || !signAllTransactions) {
      return { success: false, error: 'Invalid token or wallet not connected' };
    }

    try {
      const walletInterface = {
        publicKey: publicKey,
        signTransaction: signTransaction,
        signAllTransactions: signAllTransactions
      };

      let result;
      
      switch (operation.operation) {
        case 'mint':
          result = await mintTokens(
            walletInterface,
            token.mint,
            operation.amount!,
            token.decimals || 9
          );
          break;
          
        case 'burn':
          result = await burnTokens(
            walletInterface,
            token.mint,
            operation.amount!,
            token.decimals || 9
          );
          break;
          
        case 'transfer':
          result = await transferTokens(
            walletInterface,
            token.mint,
            operation.recipient!,
            operation.amount!,
            token.decimals || 9
          );
          break;
          
        case 'pause':
          result = await pauseToken(walletInterface, token.mint);
          break;
          
        case 'unpause':
          result = await unpauseToken(walletInterface, token.mint);
          break;
          
        default:
          return { success: false, error: `Unsupported operation: ${operation.operation}` };
      }
      
      if (result.success) {
        // Refresh data after successful operation
        setTimeout(() => loadDashboardData(), 2000);
      }
      
      return result;
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  };

  // Handle batch operations
  const handleBatchOperation = async (tokenIds: string[], operation: TokenOperationData): Promise<{ success: boolean; error?: string }> => {
    try {
      for (const tokenId of tokenIds) {
        const result = await handleTokenOperation(tokenId, operation);
        if (!result.success) {
          throw new Error(`Failed to ${operation.operation} token ${tokenId}: ${result.error}`);
        }
      }
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Batch operation failed' 
      };
    }
  };

  // Export transactions
  const handleExportTransactions = (transactions: EnhancedTransaction[], format: 'csv' | 'json') => {
    // Implementation for export functionality
    console.log('Exporting transactions:', transactions.length, 'format:', format);
  };

  const loadDashboardData = async (showLoadingState = true) => {
    if (!connected || !publicKey) return;
    
    if (showLoadingState) {
      setLoading(true);
      setTokenLoading(true);
      setTransactionLoading(true);
    }
    
    // Load wallet summary
    try {
      const summaryResult = await fetchWalletSummary(publicKey.toString());
      
      if (summaryResult.success && summaryResult.data) {
        setWalletSummary({
          totalValue: summaryResult.data.totalValue || 0,
          tokenCount: summaryResult.data.totalTokens || 0,
          totalTransactions: summaryResult.data.recentTransactions || 0,
          change24h: Math.random() > 0.5 ? 3.5 : -2.1, // Random for demo
          solBalance: summaryResult.data.solBalance || 0
        });
      }
    } catch (error) {
      console.error('Error loading wallet summary:', error);
      // Continue with other data loading
    }
    
    // Load token data
    try {
      const tokenResult = await fetchEnhancedTokenInfo(publicKey.toString());
      
      if (tokenResult.success && tokenResult.data) {
        const enhancedTokens = tokenResult.data.map(token => ({
          address: token.mint,
          mint: token.mint,
          name: token.name,
          symbol: token.symbol,
          balance: token.balance,
          uiBalance: token.uiBalance,
          decimals: token.decimals,
          value: token.value,
          change: token.change,
          holders: token.holders || Math.floor(Math.random() * 1000) + 50,
          verified: token.verified || Math.random() > 0.3,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000),
          marketData: token.marketData,
          image: token.image
        }));
        
        setTokens(enhancedTokens.length > 0 ? enhancedTokens : []);
      }
    } catch (error) {
      console.error('Error loading token data:', error);
      toast({
        title: "Error",
        description: "Failed to load token data",
        variant: "destructive"
      });
    } finally {
      setTokenLoading(false);
    }
    
    // Load transaction history
    try {
      const transactionResult = await fetchWalletTransactionHistory(publicKey.toString());
      
      if (transactionResult.success && transactionResult.data) {
        const formattedTransactions = transactionResult.data.map(tx => {
          const typeString = tx.type.toLowerCase();
          let transactionType: 'mint' | 'burn' | 'transfer' = 'transfer';
          
          if (typeString.includes('mint')) {
            transactionType = 'mint';
          } else if (typeString.includes('burn')) {
            transactionType = 'burn';
          }
          
          return {
            signature: tx.signature,
            type: transactionType,
            amount: parseFloat(tx.amount) || 0,
            timestamp: new Date(tx.timestamp),
            status: tx.status as 'confirmed' | 'pending' | 'failed',
            from: tx.from,
            to: tx.to
          };
        });
        
        setTransactions(formattedTransactions.length > 0 ? formattedTransactions : []);
      }
    } catch (error) {
      console.error('Error loading transaction history:', error);
      toast({
        title: "Error",
        description: "Failed to load transaction history",
        variant: "destructive"
      });
    } finally {
      setTransactionLoading(false);
    }
    
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData(true);
    setRefreshing(false);
    toast({
      title: "Success",
      description: "Dashboard data refreshed"
    });
  };

  const handleMintTokens = async () => {
    if (!selectedToken || !actionAmount) return;
    setActionError('');
    setActionSuccess('');
    
    try {
      setLoading(true);
      
      // Verify token balance to ensure enough decimals
      const balanceResult = await getTokenBalance(
        publicKey!.toString(),
        selectedToken.mint
      );
      
      const decimals = balanceResult.success 
        ? (balanceResult.decimals || 9)
        : (selectedToken.decimals || 9);
      
      // Create wallet interface for mintTokens
      const walletInterface = {
        publicKey: publicKey!,
        signTransaction: signTransaction!,
        signAllTransactions: signAllTransactions!
      };
      
      const mintResult = await mintTokens(
        walletInterface, 
        selectedToken.mint, 
        parseFloat(actionAmount),
        decimals
      );
      
      if (mintResult.success) {
        setActionSuccess(`Successfully minted ${actionAmount} ${selectedToken.symbol} tokens`);
        toast({
          title: "Success",
          description: `Minted ${actionAmount} ${selectedToken.symbol} tokens`,
          variant: "default"
        });
        
        // Wait for transaction to be confirmed
        setTimeout(async () => {
          await loadDashboardData();
        }, 2000);
      } else {
        setActionError(mintResult.error || 'Failed to mint tokens');
        toast({
          title: "Error",
          description: mintResult.error || 'Failed to mint tokens',
          variant: "destructive"
        });
      }
      
      setShowMintDialog(false);
      setActionAmount('');
    } catch (error) {
      console.error('Mint error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error minting tokens';
      setActionError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBurnTokens = async () => {
    if (!selectedToken || !actionAmount) return;
    setActionError('');
    setActionSuccess('');
    
    try {
      setLoading(true);
      
      // Verify token balance to ensure enough decimals
      const balanceResult = await getTokenBalance(
        publicKey!.toString(),
        selectedToken.mint
      );
      
      const decimals = balanceResult.success 
        ? (balanceResult.decimals || 9)
        : (selectedToken.decimals || 9);
      
      // Validate burn amount against balance
      if (balanceResult.success && parseFloat(actionAmount) > balanceResult.balance) {
        setActionError(`Insufficient balance. You only have ${balanceResult.balance} tokens.`);
        toast({
          title: "Error",
          description: `Insufficient balance. You only have ${balanceResult.balance} tokens.`,
          variant: "destructive"
        });
        setLoading(false);
        return;
      }
      
      // Create wallet interface for burnTokens
      const walletInterface = {
        publicKey: publicKey!,
        signTransaction: signTransaction!,
        signAllTransactions: signAllTransactions!
      };
      
      const burnResult = await burnTokens(
        walletInterface,
        selectedToken.mint,
        parseFloat(actionAmount),
        decimals
      );
      
      if (burnResult.success) {
        setActionSuccess(`Successfully burned ${actionAmount} ${selectedToken.symbol} tokens`);
        toast({
          title: "Success",
          description: `Burned ${actionAmount} ${selectedToken.symbol} tokens`,
          variant: "default"
        });
        
        // Wait for transaction to be confirmed
        setTimeout(async () => {
          await loadDashboardData();
        }, 2000);
      } else {
        setActionError(burnResult.error || 'Failed to burn tokens');
        toast({
          title: "Error",
          description: burnResult.error || 'Failed to burn tokens',
          variant: "destructive"
        });
      }
      
      setShowBurnDialog(false);
      setActionAmount('');
    } catch (error) {
      console.error('Burn error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error burning tokens';
      setActionError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTransferTokens = async () => {
    if (!selectedToken || !actionAmount || !transferRecipient) return;
    setActionError('');
    setActionSuccess('');
    
    try {
       // Validate recipient address
       if (transferRecipient.trim() === '') {
         setActionError('Recipient address is required');
         return;
       }
       
       // Check if recipient is a valid public key
       try {
         new PublicKey(transferRecipient);
       } catch (err) {
         setActionError('Invalid recipient address format');
         toast({
           title: "Error",
           description: "Invalid recipient address format",
           variant: "destructive"
         });
         return;
       }
       
       // Check if recipient is the same as sender
       if (transferRecipient === publicKey?.toString()) {
         setActionError('Cannot transfer to your own address');
         toast({
           title: "Error",
           description: "Cannot transfer to your own address",
           variant: "destructive"
         });
         return;
       }
       
      setLoading(true);
      
      // Verify token balance
      const balanceResult = await getTokenBalance(
        publicKey!.toString(),
        selectedToken.mint
      );
      
      const decimals = balanceResult.success 
        ? (balanceResult.decimals || 9)
        : (selectedToken.decimals || 9);
      
      // Validate transfer amount against balance
      if (balanceResult.success && parseFloat(actionAmount) > balanceResult.balance) {
        setActionError(`Insufficient balance. You only have ${balanceResult.balance} tokens.`);
        toast({
          title: "Error",
          description: `Insufficient balance. You only have ${balanceResult.balance} tokens.`,
          variant: "destructive"
        });
        setLoading(false);
        return;
      }
      
      // Create wallet interface for transferTokens
      const walletInterface = {
        publicKey: publicKey!,
        signTransaction: signTransaction!,
        signAllTransactions: signAllTransactions!
      };
      
      const transferResult = await transferTokens(
        walletInterface,
        selectedToken.mint,
        transferRecipient,
        parseFloat(actionAmount),
        decimals
      );
      
      if (transferResult.success) {
        setActionSuccess(`Successfully transferred ${actionAmount} ${selectedToken.symbol} tokens`);
        toast({
          title: "Success",
          description: `Transferred ${actionAmount} ${selectedToken.symbol} tokens to ${transferRecipient.slice(0, 8)}...`,
          variant: "default"
        });
        
        // Wait for transaction to be confirmed
        setTimeout(async () => {
          await loadDashboardData();
        }, 2000);
      } else {
        setActionError(transferResult.error || 'Failed to transfer tokens');
        toast({
          title: "Error",
          description: transferResult.error || 'Failed to transfer tokens',
          variant: "destructive"
        });
      }
      
      setShowTransferDialog(false);
      setActionAmount('');
      setTransferRecipient('');
    } catch (error) {
      console.error('Transfer error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error transferring tokens';
      setActionError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Copied to clipboard"
    });
  };

  const formatTokenValue = (token: TokenData) => {
    if (token.value && token.value !== 'N/A') {
      return token.value;
    }
    
    // For tokens without market data, show balance only
    return `${token.uiBalance?.toFixed(4) || '0'} ${token.symbol}`;
  };

  // Loading state
  if (!mounted) {
    return <DashboardSkeleton />;
  }

  // Not connected state
  if (!connected || !publicKey) {
    return (
      <div className="min-h-screen app-background flex items-center justify-center">
        <div className="max-w-lg w-full mx-4">
          <Card className="glass-card">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[#14f195] to-[#9945ff] rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Connect Solana Wallet</CardTitle>
              <CardDescription>
                Connect your Solana wallet to access your dashboard and manage your SPL tokens
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 border border-blue-200 rounded-lg bg-blue-50/10">
                  <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div className="text-sm text-blue-600">
                    <p className="font-semibold mb-1">Connection required:</p>
                    <p>Use the wallet button in the top navigation to connect your Solana wallet.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Initial loading state
  if (loading && tokens.length === 0 && transactions.length === 0) {
    return (
      <div className="min-h-screen app-background flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#14f195] mx-auto mb-4"></div>
          <p className="text-foreground text-lg font-semibold">Loading Solana Dashboard...</p>
          <p className="text-muted-foreground mt-2">Fetching your SPL tokens and transactions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen app-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 space-y-4 lg:space-y-0">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Solana Dashboard</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Wallet: {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}</span>
              {isAdmin && (
                <Badge variant="secondary" className="text-xs">
                  <Shield className="w-3 h-3 mr-1" />
                  Admin
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="h-9"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              onClick={() => copyToClipboard(publicKey.toString())}
              className="h-9"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Address
            </Button>
            <Button
              variant={viewMode === 'enhanced' ? 'default' : 'outline'}
              onClick={() => setViewMode(viewMode === 'enhanced' ? 'legacy' : 'enhanced')}
              className="h-9"
            >
              <Star className="w-4 h-4 mr-2" />
              {viewMode === 'enhanced' ? 'Enhanced' : 'Legacy'} View
            </Button>
          </div>
        </div>

        {/* Enhanced Network Status & Quick Actions - More prominent */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex flex-col lg:flex-row items-center gap-4 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#14f195]/10 to-[#9945ff]/10 border border-[#14f195]/30 snarbles-glow-green">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                <span className="font-semibold text-sm">Solana Devnet</span>
              </div>
              
              <div className="h-4 w-px bg-gray-500/30"></div>
              
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <span>Fast & Free</span>
                <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                  Test Network
                </Badge>
              </div>
            </div>
            
            <div className="h-4 w-px bg-gray-500/30 hidden lg:block"></div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/create?network=solana-devnet'}
                className="snarbles-btn-primary h-9 text-sm px-4"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Token
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="h-9"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${walletSummary.totalValue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <span className={`flex items-center ${walletSummary.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  <TrendingUp className={`h-3 w-3 mr-1 ${walletSummary.change24h < 0 ? 'rotate-180' : ''}`} />
                  {walletSummary.change24h >= 0 ? '+' : ''}{walletSummary.change24h}%
                </span>
                <span className="ml-1">24h</span>
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">SOL Balance</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{walletSummary.solBalance.toFixed(4)}</div>
              <p className="text-xs text-muted-foreground">SOL</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">SPL Tokens</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{walletSummary.tokenCount}</div>
              <p className="text-xs text-muted-foreground">Different tokens</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transactions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{walletSummary.totalTransactions}</div>
              <p className="text-xs text-muted-foreground">Total transactions</p>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Dashboard */}
        {viewMode === 'enhanced' ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6 snarbles-glass-subtle h-12">
              <TabsTrigger value="tokens" className="snarbles-tab">
                <Coins className="w-4 h-4 mr-2" />
                Portfolio
              </TabsTrigger>
              <TabsTrigger value="transactions" className="snarbles-tab">
                <Send className="w-4 h-4 mr-2" />
                Transactions
              </TabsTrigger>
              <TabsTrigger value="management" className="snarbles-tab">
                <Settings className="w-4 h-4 mr-2" />
                Management
              </TabsTrigger>
              <TabsTrigger value="analytics" className="snarbles-tab">
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="metadata" className="snarbles-tab">
                <Star className="w-4 h-4 mr-2" />
                Metadata AI
              </TabsTrigger>
              <TabsTrigger value="user-analytics" className="snarbles-tab">
                <Activity className="w-4 h-4 mr-2" />
                User Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tokens">
              <EnhancedTokenManagement
                tokens={convertToUniversalTokens(tokens)}
                network="solana"
                walletAddress={publicKey.toString()}
                onTokenOperation={handleTokenOperation}
                onBatchOperation={handleBatchOperation}
                canPerformOperation={canPerformOperation}
                loading={tokenLoading}
                refreshData={() => loadDashboardData(true)}
              />
            </TabsContent>

            <TabsContent value="transactions">
              <EnhancedTransactionManagement
                transactions={convertToUniversalTransactions(transactions)}
                network="solana"
                walletAddress={publicKey.toString()}
                loading={transactionLoading}
                onRefresh={() => loadDashboardData(true)}
                onExport={handleExportTransactions}
              />
            </TabsContent>

            <TabsContent value="management" className="space-y-6">
              <TokenManagement
                tokens={tokens.map(token => ({
                  id: token.mint || '',
                  name: token.name || 'Unknown',
                  symbol: token.symbol || 'N/A',
                  balance: token.uiBalance || 0,
                  totalSupply: 1000000, // Mock data
                  decimals: token.decimals || 9,
                  frozen: token.isPaused || false,
                  mintable: true,
                  burnable: true,
                  pausable: true,
                  metadata: {
                    description: 'Solana SPL Token',
                    image: token.image,
                  },
                  creator: publicKey.toString(),
                  network: 'solana' as const,
                  mintAddress: token.mint,
                }))}
                network="solana"
                userAddress={publicKey.toString()}
                onTokenUpdate={async (tokenId: string, updates: any) => {
                  console.log('Token update:', tokenId, updates);
                  // Refresh data after update
                  await loadDashboardData(true);
                }}
                onRefresh={() => loadDashboardData(true)}
                isLoading={loading}
              />
            </TabsContent>

            <TabsContent value="analytics">
              <AdvancedAnalytics
                tokens={convertToUniversalTokens(tokens)}
                network="solana"
                walletAddress={publicKey.toString()}
                timeframe={analyticsTimeframe}
                onTimeframeChange={setAnalyticsTimeframe}
              />
            </TabsContent>

            <TabsContent value="metadata" className="space-y-6">
              {tokens.length > 0 ? (
                <ComprehensiveMetadataManager
                  tokenId={tokens[0].mint}
                  network="solana"
                  walletAddress={publicKey.toString()}
                  signTransaction={async (txn) => {
                    // Implementation would depend on wallet adapter
                    console.log('Transaction to sign:', txn);
                    return { signature: 'mock_signature' };
                  }}
                  tokens={convertToMetadataTokens(tokens)}
                />
              ) : (
                <Card className="snarbles-glass border-purple-500/30">
                  <CardContent className="p-8 text-center">
                    <Star className="w-12 h-12 text-purple-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2 text-foreground">No Tokens Found</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first token to access advanced metadata management features.
                    </p>
                    <Button 
                      onClick={() => window.location.href = '/create?network=solana-devnet'}
                      className="snarbles-gradient text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Token
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* User Analytics Tab */}
            <TabsContent value="user-analytics" className="space-y-6">
              <UserAnalytics
                userAddress={publicKey.toString()}
                tokens={tokens.map(token => ({
                  id: token.mint || '',
                  name: token.name || 'Unknown',
                  symbol: token.symbol || 'N/A',
                  totalSupply: 1000000, // Mock data
                  currentSupply: Math.floor(Math.random() * 1000000),
                  holders: Math.floor(Math.random() * 1000) + 1,
                  transfers: Math.floor(Math.random() * 5000) + 100,
                  createdAt: new Date().toISOString(),
                  lastActivity: new Date().toISOString(),
                  network: 'solana' as const,
                  mintAddress: token.mint,
                  metadata: {
                    description: 'Solana SPL Token',
                    image: token.image,
                  },
                  performance: {
                    dailyTransfers: Math.floor(Math.random() * 50) + 5,
                    weeklyGrowth: (Math.random() - 0.5) * 20,
                    holderGrowth: Math.random() * 10,
                    liquidityScore: Math.random() * 100,
                  },
                }))}
                network="solana"
                timeframe={analyticsTimeframe}
                onTimeframeChange={setAnalyticsTimeframe}
                isLoading={loading}
              />
            </TabsContent>
          </Tabs>
        ) : (
          // Legacy Dashboard Content
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Legacy Token List */}
            <div className="lg:col-span-2">
              <Card className="glass-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      Your SPL Tokens
                      <Badge variant="secondary" className="ml-2">{tokens.length}</Badge>
                    </CardTitle>
                    {tokens.length > 0 && (
                      <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {tokenLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((_, i) => (
                        <TokenCardSkeleton key={i} />
                      ))}
                    </div>
                  ) : tokens.length > 0 ? (
                    <div className="space-y-4">
                      {tokens.map((token) => (
                        <div key={token.mint} className="flex items-center justify-between p-4 glass-card hover:bg-muted/10 transition-colors cursor-pointer">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-[#14f195] to-[#9945ff] rounded-full flex items-center justify-center">
                              {token.image ? (
                                <img 
                                  src={token.image} 
                                  alt={token.name} 
                                  className="w-12 h-12 rounded-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).parentElement!.innerHTML = `
                                      <span class="text-white font-bold text-sm">${token.symbol?.[0] || 'T'}</span>
                                    `;
                                  }}
                                />
                              ) : (
                                <span className="text-white font-bold text-sm">{token.symbol?.[0] || 'T'}</span>
                              )}
                            </div>
                            
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{token.name || 'Unknown Token'}</h3>
                                {token.verified && (
                                  <Badge variant="secondary" className="text-xs">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Verified
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center text-sm text-muted-foreground">
                                <span>{token.symbol || 'UNK'}</span>
                                <span className="mx-1">•</span>
                                <span>{token.holders} holders</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-semibold">{formatTokenValue(token)}</p>
                              {token.change && (
                                <p className={`text-sm ${token.change.startsWith('+') ? 'text-green-500' : token.change.startsWith('-') ? 'text-red-500' : 'text-muted-foreground'}`}>
                                  {token.change}
                                </p>
                              )}
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Settings className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  setSelectedToken(token);
                                  setShowMintDialog(true);
                                  setActionError('');
                                  setActionSuccess('');
                                }}>
                                  <Plus className="w-4 h-4 mr-2" />
                                  Mint Tokens
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedToken(token);
                                    setShowBurnDialog(true);
                                    setActionError('');
                                    setActionSuccess('');
                                  }}
                                  disabled={!token.uiBalance || token.uiBalance === 0}
                                >
                                  <Flame className="w-4 h-4 mr-2" />
                                  Burn Tokens
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedToken(token);
                                    setShowTransferDialog(true);
                                    setActionError('');
                                    setActionSuccess('');
                                  }}
                                  disabled={!token.uiBalance || token.uiBalance === 0}
                                >
                                  <Send className="w-4 h-4 mr-2" />
                                  Transfer
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem onClick={() => copyToClipboard(token.mint)}>
                                  <Copy className="w-4 h-4 mr-2" />
                                  Copy Mint
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem onClick={() => window.open(`https://explorer.solana.com/address/${token.mint}?cluster=devnet`, '_blank')}>
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  View on Explorer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Enhanced Solana Onboarding Banner */}
                      <Card className="snarbles-card-premium snarbles-glow-purple border-purple-500/30">
                        <CardContent className="p-8">
                          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
                            <div className="flex-shrink-0">
                              <div className="w-20 h-20 bg-gradient-to-br from-[#14f195] to-[#9945ff] rounded-3xl flex items-center justify-center">
                                <Sparkles className="w-10 h-10 text-white" />
                              </div>
                            </div>
                            
                            <div className="flex-1">
                              <h3 className="text-3xl font-bold text-foreground mb-3">
                                Welcome to Solana! 🚀
                              </h3>
                              <p className="text-muted-foreground text-lg mb-6">
                                Create your first SPL token in under 30 seconds. Fast, free, and secure on Solana devnet.
                              </p>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                <div className="flex items-center gap-3 p-4 rounded-xl snarbles-glass-subtle border border-green-500/30">
                                  <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                                  <div>
                                    <div className="font-semibold text-green-400">Free Testing</div>
                                    <div className="text-sm text-gray-400">Zero cost on devnet</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 rounded-xl snarbles-glass-subtle border border-yellow-500/30">
                                  <Zap className="w-6 h-6 text-yellow-400 flex-shrink-0" />
                                  <div>
                                    <div className="font-semibold text-yellow-400">Lightning Fast</div>
                                    <div className="text-sm text-gray-400">Sub-second finality</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 rounded-xl snarbles-glass-subtle border border-blue-500/30">
                                  <Shield className="w-6 h-6 text-blue-400 flex-shrink-0" />
                                  <div>
                                    <div className="font-semibold text-blue-400">Secure</div>
                                    <div className="text-sm text-gray-400">Enterprise-grade</div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex flex-col sm:flex-row gap-4">
                                <Button 
                                  onClick={() => window.location.href = '/create?network=solana-devnet'}
                                  className="snarbles-gradient text-white px-8 py-4 text-lg h-auto"
                                >
                                  <Plus className="w-5 h-5 mr-2" />
                                  Create Your First Token
                                </Button>
                                <Button 
                                  variant="outline"
                                  onClick={() => window.open('https://docs.snarbles.xyz/solana', '_blank')}
                                  className="px-8 py-4 text-lg h-auto border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                                >
                                  Learn More
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Original No Tokens Message - Simplified */}
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#14f195]/10 to-[#9945ff]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Coins className="w-8 h-8 text-[#14f195]" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2 text-gray-400">No SPL Tokens Found</h3>
                        <p className="text-muted-foreground text-sm">
                          You don't have any SPL tokens in this wallet yet.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Legacy Transaction History Sidebar */}
            <div className="space-y-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    Recent Transactions
                    <Badge variant="secondary" className="ml-2">{transactions.length}</Badge>
                  </CardTitle>
                </CardHeader>
                                 <CardContent>
                   <TokenHistoryList 
                     walletAddress={publicKey.toString()}
                     limit={10}
                     showHeader={false}
                   />
                 </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Legacy Dialogs - keep for backward compatibility */}
        {/* Mint Dialog */}
        <Dialog open={showMintDialog} onOpenChange={setShowMintDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mint {selectedToken?.symbol} Tokens</DialogTitle>
              <DialogDescription>
                Create new tokens and add them to your supply
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="mint-amount">Amount to Mint</Label>
                <Input
                  id="mint-amount"
                  type="number"
                  placeholder="0.00"
                  value={actionAmount}
                  onChange={(e) => setActionAmount(e.target.value)}
                />
              </div>

              {actionError && (
                <div className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">
                  {actionError}
                </div>
              )}

              {actionSuccess && (
                <div className="text-sm text-green-500 bg-green-50 p-3 rounded-lg">
                  {actionSuccess}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowMintDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleMintTokens}
                disabled={!actionAmount || loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Minting...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Mint Tokens
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Burn Dialog */}
        <Dialog open={showBurnDialog} onOpenChange={setShowBurnDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Burn {selectedToken?.symbol} Tokens</DialogTitle>
              <DialogDescription>
                Permanently destroy tokens from your supply
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="burn-amount">Amount to Burn</Label>
                <Input
                  id="burn-amount"
                  type="number"
                  placeholder="0.00"
                  value={actionAmount}
                  onChange={(e) => setActionAmount(e.target.value)}
                />
                {selectedToken && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Available: {selectedToken.uiBalance?.toFixed(4)} {selectedToken.symbol}
                  </p>
                )}
              </div>

              {actionError && (
                <div className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">
                  {actionError}
                </div>
              )}

              {actionSuccess && (
                <div className="text-sm text-green-500 bg-green-50 p-3 rounded-lg">
                  {actionSuccess}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBurnDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleBurnTokens}
                disabled={!actionAmount || loading}
                className="bg-red-600 hover:bg-red-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Burning...
                  </>
                ) : (
                  <>
                    <Flame className="w-4 h-4 mr-2" />
                    Burn Tokens
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Transfer Dialog */}
        <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Transfer {selectedToken?.symbol} Tokens</DialogTitle>
              <DialogDescription>
                Send tokens to another Solana address
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="transfer-recipient">Recipient Address</Label>
                <Input
                  id="transfer-recipient"
                  placeholder="Enter Solana address..."
                  value={transferRecipient}
                  onChange={(e) => setTransferRecipient(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="transfer-amount">Amount to Transfer</Label>
                <Input
                  id="transfer-amount"
                  type="number"
                  placeholder="0.00"
                  value={actionAmount}
                  onChange={(e) => setActionAmount(e.target.value)}
                />
                {selectedToken && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Available: {selectedToken.uiBalance?.toFixed(4)} {selectedToken.symbol}
                  </p>
                )}
              </div>

              {actionError && (
                <div className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">
                  {actionError}
                </div>
              )}

              {actionSuccess && (
                <div className="text-sm text-green-500 bg-green-50 p-3 rounded-lg">
                  {actionSuccess}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTransferDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleTransferTokens}
                disabled={!actionAmount || !transferRecipient || loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Transferring...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Transfer Tokens
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}