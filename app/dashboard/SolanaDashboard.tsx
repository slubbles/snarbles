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
  CheckCircle
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
import { SupabaseAuthModal } from '@/components/SupabaseAuthModal';
import { isSupabaseAvailable } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';
import { ADMIN_WALLET } from '@/lib/solana';

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
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [supabaseConfigured, setSupabaseConfigured] = useState(false);
  
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
          description: `Transferred ${actionAmount} ${selectedToken.symbol} tokens to ${transferRecipient.slice(0, 6)}...${transferRecipient.slice(-4)}`,
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
      description: "Address copied to clipboard"
    });
  };

  // Format token value for display
  const formatTokenValue = (token: TokenData) => {
    if (!token.value || token.value === 'N/A') return 'N/A';
    
    // If value is already a formatted string like "$250.50"
    if (typeof token.value === 'string' && token.value.startsWith('$')) {
      return token.value;
    }
    
    // If it's a number or numeric string
    const value = typeof token.value === 'string' ? parseFloat(token.value) : token.value;
    return isNaN(value) ? 'N/A' : `$${value.toFixed(2)}`;
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4 border-red-200 shadow-xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Connect Your Solana Wallet</CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Please connect your Solana wallet to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 text-center mb-4">
              Your wallet needs to be connected to view tokens and perform transactions.
            </p>
            <div className="text-center">
              <Button 
                onClick={() => window.location.href = '/'}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
              >
                Go to Home Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Display loading state while data is being fetched initially
  if (loading && !tokens.length && !transactions.length) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header with Admin Badge */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent">Solana Dashboard</h1>
              {isAdmin && (
                <Badge variant="destructive" className="bg-red-500 hover:bg-red-600">
                  <Shield className="w-3 h-3 mr-1" />
                  Admin
                </Badge>
              )}
            </div>
            <p className="text-gray-600">
              Wallet: {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
            </p>
            {isAdmin && (
              <p className="text-sm text-red-600 font-medium">
                ⚡ Admin privileges enabled - You can manage platform tokens
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={refreshing}
              className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              onClick={() => copyToClipboard(publicKey?.toString() || '')}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Address
            </Button>
            {supabaseConfigured && (
              <Button 
                variant="outline" 
                onClick={() => setShowAuthModal(true)}
                className="ml-2 border-red-200 text-red-600 hover:bg-red-50"
              >
                Account
              </Button>
            )}
          </div>
        </div>

        {/* Admin Quick Actions */}
        {isAdmin && (
          <Card className="mb-8 border-red-200 bg-gradient-to-r from-red-50 to-red-100 shadow-lg">
            <CardHeader>
              <CardTitle className="text-red-700 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Admin Quick Actions
              </CardTitle>
              <CardDescription className="text-red-600">
                Platform administration tools for token management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={() => window.location.href = '/create'}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-md"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Platform Token
                </Button>
                <Button 
                  onClick={() => window.location.href = '/admin'}
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-100 hover:border-red-400"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Admin Panel
                </Button>
                <Button 
                  onClick={() => window.location.href = '/verify'}
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-100 hover:border-red-400"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Verify Tokens
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-red-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Total Value</CardTitle>
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                ${typeof walletSummary.totalValue === 'number' 
                  ? walletSummary.totalValue.toFixed(2) 
                  : '0.00'}
              </div>
              <p className="text-xs text-muted-foreground">
                <span className={walletSummary.change24h >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {walletSummary.change24h >= 0 ? '+' : ''}{walletSummary.change24h}%
                </span>
                {' '}from yesterday
              </p>
            </CardContent>
          </Card>

          <Card className="border-red-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Tokens</CardTitle>
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                <Coins className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{walletSummary.tokenCount}</div>
              <p className="text-xs text-muted-foreground">
                {walletSummary.tokenCount === 1 ? 'Token' : 'Tokens'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-red-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"> 
              <CardTitle className="text-sm font-medium text-gray-700">SOL Balance</CardTitle>
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                <Wallet className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{walletSummary.solBalance.toFixed(4)} SOL</div>
              <p className="text-xs text-muted-foreground">
                Network currency
              </p>
            </CardContent>
          </Card>

          <Card className="border-red-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Network</CardTitle>
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                <Globe className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">Devnet</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">●</span> Connected
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tokens List */}
          <div className="lg:col-span-2">
            <Card className="border-red-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 border-b border-red-200">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-red-800">Your Tokens</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="bg-red-100 text-red-700 border-red-300">{tokens.length}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {tokenLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="space-y-4 w-full">
                      {[1, 2, 3].map((_, i) => (
                        <TokenCardSkeleton key={i} />
                      ))}
                    </div>
                  </div>
                ) : tokens.length > 0 ? (
                  <div className="space-y-4">
                    {tokens.map((token) => (
                      <div key={token.address} className="flex items-center justify-between p-4 border border-red-100 rounded-lg hover:bg-red-50 hover:border-red-200 transition-all duration-200 shadow-sm">
                        <div className="flex items-center gap-3">
                          {token.image ? (
                            <img 
                              src={token.image} 
                              alt={token.symbol} 
                              className="w-10 h-10 rounded-full object-cover ring-2 ring-red-200"
                              onError={(e) => {
                                (e.target as HTMLImageElement).onerror = null;
                                (e.target as HTMLImageElement).src = ''; 
                                // Replace with div containing first letter
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).parentElement!.innerHTML = `
                                  <div class="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center ring-2 ring-red-200">
                                    <span class="text-white font-bold">${(token.symbol || '?')[0]}</span>
                                  </div>
                                `;
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center ring-2 ring-red-200">
                              <span className="text-white font-bold">{(token.symbol || '?')[0]}</span>
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900">{token.name}</h3>
                              {token.verified && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Shield className="w-4 h-4 text-green-600" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Verified Token</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{token.symbol}</p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-semibold">{token.uiBalance?.toLocaleString() || '0'} {token.symbol}</p>
                          <p className="text-sm text-gray-600">{formatTokenValue(token)}</p>
                          {token.change && (
                            <p className={`text-xs ${token.change?.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                              {token.change}
                            </p>
                          )}
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="hover:bg-red-100 text-gray-600 hover:text-red-600">
                              <Settings className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="border-red-200">
                            <DropdownMenuItem onClick={() => {
                              setSelectedToken(token);
                              setShowMintDialog(true);
                              setActionError('');
                              setActionSuccess('');
                            }} className="hover:bg-red-50 focus:bg-red-50">
                              <Plus className="w-4 h-4 mr-2 text-green-600" />
                              Mint Tokens
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedToken(token);
                              setShowBurnDialog(true);
                              setActionError('');
                              setActionSuccess('');
                            }} className="hover:bg-red-50 focus:bg-red-50">
                              <Flame className="w-4 h-4 mr-2 text-red-600" />
                              Burn Tokens
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedToken(token);
                              setShowTransferDialog(true);
                              setActionError('');
                              setActionSuccess('');
                            }} className="hover:bg-red-50 focus:bg-red-50">
                              <Send className="w-4 h-4 mr-2 text-red-600" />
                              Transfer
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => copyToClipboard(token.address)} className="hover:bg-red-50 focus:bg-red-50">
                              <Copy className="w-4 h-4 mr-2 text-gray-600" />
                              Copy Address
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Wallet className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No tokens found</h3>
                    <p className="text-gray-500 mt-2">You don't have any tokens in your wallet yet.</p>
                    <div className="mt-6">
                      <Button 
                        onClick={() => window.location.href = '/create'} 
                        className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg"
                      >
                        Create Your First Token
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Chart */}
            <Card className="border-red-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 border-b border-red-200">
                <CardTitle className="text-lg text-red-800">Token Allocation</CardTitle>
              </CardHeader>
              <CardContent>
                {tokens.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={tokens.map(token => ({
                          name: token.symbol,
                          value: token.uiBalance || 0
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {tokens.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={[
                            '#6366F1', '#EC4899', '#8B5CF6', '#14B8A6', '#F59E0B', '#F43F5E'
                          ][index % 6]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[200px] bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No token data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card className="border-red-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 border-b border-red-200">
                <CardTitle className="text-lg text-red-800">Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                {transactionLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-lg"></div>
                    ))}
                  </div>
                ) : transactions.length > 0 ? (
                  <div className="space-y-3">
                    {transactions.slice(0, 5).map((tx) => (
                      <div key={tx.signature} className="flex items-center justify-between p-3 border border-red-100 rounded-lg hover:bg-red-50 hover:border-red-200 transition-all duration-200 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            tx.type === 'mint' ? 'bg-green-100 ring-2 ring-green-200' :
                            tx.type === 'burn' ? 'bg-red-100 ring-2 ring-red-200' : 'bg-gray-100 ring-2 ring-gray-200'
                          }`}>
                            {tx.type === 'mint' ? <Plus className="w-4 h-4 text-green-600" /> :
                             tx.type === 'burn' ? <Flame className="w-4 h-4 text-red-600" /> :
                             <Send className="w-4 h-4 text-red-600" />}
                          </div>
                          <div>
                            <p className="font-medium capitalize text-gray-900">{tx.type}</p>
                            <p className="text-xs text-gray-500">
                              {formatDistanceToNow(tx.timestamp, { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{tx.amount.toLocaleString()}</p>
                          <Badge variant={tx.status === 'confirmed' ? 'default' : 'secondary'} className="text-xs">
                            {tx.status}
                          </Badge>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="ml-2 hover:bg-red-100 text-gray-600 hover:text-red-600" 
                          onClick={() => window.open(`https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No recent transactions</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Token Management Section for Admin */}
        {isAdmin && tokens.length > 0 && (
          <div className="mt-8">
            <Card className="border-red-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 border-b border-red-200">
                <CardTitle className="text-red-800 flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Token Management Center
                </CardTitle>
                <CardDescription className="text-red-600">
                  Manage your created tokens with advanced controls
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tokens.map((token) => (
                    <Card key={token.address} className="border-red-100 hover:border-red-200 transition-colors">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {token.image ? (
                              <img 
                                src={token.image} 
                                alt={token.symbol} 
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-xs">
                                  {token.symbol?.charAt(0) || 'T'}
                                </span>
                              </div>
                            )}
                            <div>
                              <h3 className="font-semibold text-gray-900">{token.symbol}</h3>
                              <p className="text-sm text-gray-500">{token.name}</p>
                            </div>
                          </div>
                          <Badge variant={token.isPaused ? "destructive" : "default"}>
                            {token.isPaused ? "Paused" : "Active"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Balance:</span>
                            <p className="font-medium">{token.uiBalance?.toLocaleString() || '0'}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Holders:</span>
                            <p className="font-medium">{token.holders || 0}</p>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedToken(token);
                              setShowMintDialog(true);
                              setActionError('');
                              setActionSuccess('');
                            }}
                            className="flex-1 border-green-200 text-green-700 hover:bg-green-50"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Mint
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedToken(token);
                              setShowBurnDialog(true);
                              setActionError('');
                              setActionSuccess('');
                            }}
                            className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
                          >
                            <Flame className="w-3 h-3 mr-1" />
                            Burn
                          </Button>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedToken(token);
                              setShowTransferDialog(true);
                              setActionError('');
                              setActionSuccess('');
                            }}
                            className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50"
                          >
                            <Send className="w-3 h-3 mr-1" />
                            Transfer
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`https://explorer.solana.com/address/${token.address}?cluster=devnet`, '_blank')}
                            className="border-gray-200 text-gray-700 hover:bg-gray-50"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Analytics Section */}
        {tokens.length > 0 && (
          <div className="mt-8">
            <Card className="border-red-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 border-b border-red-200">
                <CardTitle className="text-red-800 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Portfolio Analytics
                </CardTitle>
                <CardDescription className="text-red-600">
                  Basic analytics for your token portfolio
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-green-600">Total Tokens</p>
                          <p className="text-2xl font-bold text-green-800">{tokens.length}</p>
                        </div>
                        <Coins className="w-8 h-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-blue-600">Total Balance</p>
                          <p className="text-2xl font-bold text-blue-800">
                            {tokens.reduce((sum, token) => sum + (token.uiBalance || 0), 0).toLocaleString()}
                          </p>
                        </div>
                        <Wallet className="w-8 h-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-purple-200 bg-purple-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-purple-600">Est. Holders</p>
                          <p className="text-2xl font-bold text-purple-800">
                            {tokens.reduce((sum, token) => sum + (token.holders || 0), 0).toLocaleString()}
                          </p>
                        </div>
                        <Users className="w-8 h-8 text-purple-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Token Distribution Chart */}
                  <Card className="border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-lg">Token Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={tokens.map(token => ({
                              name: token.symbol,
                              value: token.uiBalance || 0
                            }))}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {tokens.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={[
                                '#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6'
                              ][index % 6]} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Recent Activity */}
                  <Card className="border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-lg">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {transactions.slice(0, 5).map((tx, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${
                                tx.type === 'mint' ? 'bg-green-500' :
                                tx.type === 'burn' ? 'bg-red-500' : 'bg-blue-500'
                              }`}></div>
                              <span className="text-sm font-medium capitalize">{tx.type}</span>
                              <span className="text-sm text-gray-500">{tx.amount}</span>
                            </div>
                            <span className="text-xs text-gray-400">
                              {formatDistanceToNow(tx.timestamp, { addSuffix: true })}
                            </span>
                          </div>
                        ))}
                        {transactions.length === 0 && (
                          <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Token History Section */}
        {supabaseConfigured && showTokenHistory && publicKey && (
          <div className="mt-8">
            <TokenHistoryList walletAddress={publicKey.toString()} limit={5} />
          </div>
        )}

        {/* Mint Dialog */}
        <Dialog open={showMintDialog} onOpenChange={setShowMintDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mint Tokens</DialogTitle>
              <DialogDescription>
                Mint new {selectedToken?.symbol} tokens
              </DialogDescription>
              {actionSuccess && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                    <p>{actionSuccess}</p>
                  </div>
                </div>
              )}
              {actionError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                    <p>{actionError}</p>
                  </div>
                </div>
              )}
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="mintAmount">Amount</Label>
                <Input
                  id="mintAmount"
                  type="number"
                  value={actionAmount}
                  onChange={(e) => setActionAmount(e.target.value)}
                  placeholder="Enter amount to mint"
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <Label>Current Balance</Label>
                  <span className="text-sm text-gray-500">{selectedToken?.uiBalance?.toLocaleString() || '0'} {selectedToken?.symbol}</span>
                </div>
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
                  <div className="flex items-start">
                    <Info className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    <p>Minting tokens requires ownership privileges. If you created this token, you can mint additional tokens to your wallet.</p>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowMintDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleMintTokens} disabled={!actionAmount || loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Mint Tokens
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Burn Dialog */}
        <Dialog open={showBurnDialog} onOpenChange={setShowBurnDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Burn Tokens</DialogTitle>
              <DialogDescription>
                Burn {selectedToken?.symbol} tokens (this action cannot be undone)
              </DialogDescription>
              {actionSuccess && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                    <p>{actionSuccess}</p>
                  </div>
                </div>
              )}
              {actionError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                    <p>{actionError}</p>
                  </div>
                </div>
              )}
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="burnAmount">Amount</Label>
                <Input
                  id="burnAmount"
                  type="number"
                  value={actionAmount}
                  onChange={(e) => setActionAmount(e.target.value)}
                  placeholder="Enter amount to burn"
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <Label>Current Balance</Label>
                  <span className="text-sm text-gray-500">{selectedToken?.uiBalance?.toLocaleString() || '0'} {selectedToken?.symbol}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <p className="text-sm text-red-700">
                  Warning: Burned tokens cannot be recovered
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBurnDialog(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleBurnTokens} 
                disabled={!actionAmount || loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Burn Tokens
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Transfer Dialog */}
        <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Transfer Tokens</DialogTitle>
              <DialogDescription>
                Transfer {selectedToken?.symbol} tokens to another address
              </DialogDescription>
              {actionSuccess && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                    <p>{actionSuccess}</p>
                  </div>
                </div>
              )}
              {actionError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                    <p>{actionError}</p>
                  </div>
                </div>
              )}
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="transferAmount">Amount</Label>
                <Input
                  id="transferAmount"
                  type="number"
                  value={actionAmount}
                  onChange={(e) => setActionAmount(e.target.value)}
                  placeholder="Enter amount to transfer"
                />
              </div>
              <div>
                <Label htmlFor="recipient">Recipient Address</Label>
                <Input
                  id="recipient"
                  value={transferRecipient}
                  onChange={(e) => setTransferRecipient(e.target.value)}
                  placeholder="Enter recipient's Solana address"
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <Label>Current Balance</Label>
                  <span className="text-sm text-gray-500">{selectedToken?.uiBalance?.toLocaleString() || '0'} {selectedToken?.symbol}</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTransferDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleTransferTokens} 
                disabled={!actionAmount || !transferRecipient || loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Transfer Tokens
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Supabase Auth Modal */}
        {showAuthModal && (
          <SupabaseAuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
          />
        )}
      </div>
    </div>
  );
}