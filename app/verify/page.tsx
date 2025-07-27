'use client';

import React, { useState, useEffect, useCallback, memo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useWalletAuth } from '@/components/providers/WalletAuthProvider';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider';
import { 
  CheckCircle, 
  AlertTriangle, 
  Search, 
  ExternalLink, 
  Shield, 
  Clock, 
  Users, 
  Copy, 
  RefreshCw, 
  Globe, 
  Eye,
  AlertCircle,
  TrendingUp,
  Wallet,
  Hash,
  BarChart3,
  Check,
  Sparkles,
  Star,
  History,
  Bookmark,
  Share2,
  Plus,
  Filter,
  ChevronRight,
  Activity,
  Zap,
  Target,
  Award,
  Database,
  Link,
  Layers
} from 'lucide-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { getAlgorandAssetInfo, getAlgorandNetwork } from '@/lib/algorand';
import { getTokenMetadata, getEnhancedTokenInfo, TokenMetadata as SolanaTokenMetadata } from '@/lib/solana-data';
import { getAlgorandEnhancedTokenInfo } from '@/lib/algorand-data';
import { supabase } from '@/lib/supabase-client';
import { mcpAnalytics } from '@/lib/supabase-mcp-analytics';

type NetworkType = 'solana-devnet' | 'algorand-mainnet' | 'algorand-testnet';

interface TokenMetadata {
  name: string;
  symbol: string;
  totalSupply?: string;
  decimals: number;
  description?: string;
  image?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  verified?: boolean;
}

interface VerificationResult {
  verified: boolean;
  score: number;
  status: 'success' | 'warning' | 'error';
  network: NetworkType;
  tokenId: string;
  checks: {
    tokenExists: boolean;
    metadataValid: boolean;
    liquidityAvailable: boolean;
    contractVerified: boolean;
    communityTrust: boolean;
    holderDistribution: boolean;
    socialPresence: boolean;
  };
  warnings: string[];
  metadata?: TokenMetadata;
  metrics?: {
    holders?: number | string;
    marketCap?: string;
    volume24h?: string;
    priceChange24h?: string;
    liquidity?: string;
    totalSupply?: string;
  };
  explorerUrl?: string;
  shareUrl?: string;
  timestamp: number;
}

// Memoized VerificationResult component for performance
const VerificationResultDisplay = memo(({ 
  result, 
  onShare, 
  onCopy 
}: { 
  result: VerificationResult; 
  onShare: () => void; 
  onCopy: (text: string, label: string) => void; 
}) => {
  const getStatusIcon = (status: 'success' | 'warning' | 'error') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-12 h-12 text-green-400" />;
      case 'warning':
        return <AlertTriangle className="w-12 h-12 text-yellow-400" />;
      case 'error':
        return <AlertCircle className="w-12 h-12 text-red-400" />;
      default:
        return <Shield className="w-12 h-12 text-gray-400" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-blue-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    if (score >= 40) return 'outline';
    return 'destructive';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Main Results */}
      <div className="lg:col-span-8 space-y-8">
        {/* Status Overview */}
        <Card className={`glass-card ${result.verified ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-6">
                {getStatusIcon(result.status)}
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    {result.verified ? 'Token Verified ✓' : 'Verification Issues Found'}
                  </h2>
                  <p className="text-muted-foreground">
                    Security Score: <span className={`font-bold text-xl ${getScoreColor(result.score)}`}>
                      {result.score}/100
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Button onClick={onShare} variant="outline" className="border-border hover:bg-muted">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button onClick={() => onCopy(result.tokenId, 'Token ID')} variant="outline" className="border-border hover:bg-muted">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy ID
                </Button>
              </div>
            </div>

            {/* Enhanced Progress Bar */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-medium">Comprehensive Security Assessment</span>
                <Badge variant={getScoreBadgeVariant(result.score)} className="px-4 py-2">
                  {result.score >= 80 ? 'SAFE' : 
                   result.score >= 60 ? 'CAUTION' : 
                   result.score >= 40 ? 'RISKY' : 'DANGER'}
                </Badge>
              </div>
              <Progress value={result.score} className="h-6" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>0</span>
                <span>Danger</span>
                <span>Risky</span>
                <span>Caution</span>
                <span>Safe</span>
                <span>100</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Checks */}
        <Card className="glass-card border-border">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-foreground flex items-center space-x-3">
              <Shield className="w-6 h-6 text-primary" />
              <span>Comprehensive Security Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            {Object.entries(result.checks).map(([key, passed]) => {
              const checkLabels = {
                tokenExists: 'Token Exists',
                metadataValid: 'Valid Metadata',
                liquidityAvailable: 'Liquidity Available', 
                contractVerified: 'Contract Verified',
                communityTrust: 'Community Trust',
                holderDistribution: 'Healthy Distribution',
                socialPresence: 'Social Media Presence'
              };
              
              return (
                <div key={key} className={`flex items-center justify-between p-6 rounded-xl transition-all duration-200 ${
                  passed 
                    ? 'bg-green-500/10 border border-green-500/30 hover:bg-green-500/15' 
                    : 'bg-red-500/10 border border-red-500/30 hover:bg-red-500/15'
                }`}>
                  <div className="flex items-center space-x-4">
                    {passed ? 
                      <CheckCircle className="w-6 h-6 text-green-400" /> : 
                      <AlertTriangle className="w-6 h-6 text-red-400" />
                    }
                    <span className="text-muted-foreground font-medium">
                      {checkLabels[key as keyof typeof checkLabels] || key}
                    </span>
                  </div>
                  <Badge variant={passed ? 'default' : 'destructive'} className="px-4 py-2">
                    {passed ? 'PASSED' : 'FAILED'}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Warnings */}
        {result.warnings.length > 0 && (
          <Card className="glass-card border-red-500/30 bg-red-500/5">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-red-400 flex items-center space-x-3">
                <AlertTriangle className="w-6 h-6" />
                <span>Security Warnings & Recommendations</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-4">
              {result.warnings.map((warning, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl hover:bg-red-500/15 transition-colors">
                  <AlertTriangle className="w-5 h-5 text-red-400 mt-1 flex-shrink-0" />
                  <p className="text-red-400">{warning}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sidebar Info */}
      <div className="lg:col-span-4 space-y-8">
        {/* Token Information */}
        <Card className="glass-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground flex items-center space-x-2">
              <Hash className="w-5 h-5 text-blue-400" />
              <span>Token Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {result.metadata && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                  <p className="font-bold mt-1 text-foreground">{result.metadata.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Symbol</Label>
                  <p className="font-bold mt-1 text-foreground">{result.metadata.symbol}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Network</Label>
                  <p className="font-bold mt-1 text-foreground capitalize">
                    {result.network.replace('-', ' ')}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Total Supply</Label>
                  <p className="font-bold mt-1 text-foreground">
                    {result.metadata.totalSupply?.toLocaleString() || 'Unknown'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Decimals</Label>
                  <p className="font-bold mt-1 text-foreground">{result.metadata.decimals}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

VerificationResultDisplay.displayName = 'VerificationResultDisplay';

interface UserToken {
  id: string;
  tokenName: string;
  tokenSymbol: string;
  network: string;
  contractAddress: string;
  createdAt: string;
  assetId?: number;
}

interface RecentVerification {
  tokenId: string;
  network: NetworkType;
  result: VerificationResult;
  timestamp: number;
}

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  // Wallet connections
  const { isAuthenticated, walletAddress, walletType } = useWalletAuth();
  const { connected: solanaConnected, publicKey } = useWallet();
  const { connected: algorandConnected, address: algorandAddress } = useAlgorandWallet();
  
  // State management
  const [activeTab, setActiveTab] = useState('search');
  const [network, setNetwork] = useState<NetworkType>('algorand-mainnet');
  const [tokenId, setTokenId] = useState(searchParams?.get('id') || '');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  
  // User tokens and history
  const [userTokens, setUserTokens] = useState<UserToken[]>([]);
  const [loadingUserTokens, setLoadingUserTokens] = useState(false);
  const [recentVerifications, setRecentVerifications] = useState<RecentVerification[]>([]);
  const [selectedTokens, setSelectedTokens] = useState<string[]>([]);
  const [bulkVerifying, setBulkVerifying] = useState(false);
  
  // Search and filtering
  const [searchFilter, setSearchFilter] = useState('');
  const [networkFilter, setNetworkFilter] = useState<string>('all');

  // Enhanced search tracking
  const handleSearchChange = (searchTerm: string) => {
    setSearchFilter(searchTerm);
    
    // Track search usage with debounced analytics
    if (searchTerm.length > 2) {
      trackAnalyticsEvent('token_search_performed', {
        search_term_length: searchTerm.length,
        search_term_type: /^[a-fA-F0-9]+$/.test(searchTerm) ? 'address_like' : 'text',
        network_filter: networkFilter,
        available_tokens: userTokens.length,
        current_tab: activeTab
      });
    }
  };

  // Network filter tracking
  const handleNetworkFilterChange = (newFilter: string) => {
    const oldFilter = networkFilter;
    setNetworkFilter(newFilter);
    
    trackAnalyticsEvent('network_filter_changed', {
      from_filter: oldFilter,
      to_filter: newFilter,
      tokens_before_filter: userTokens.length,
      tokens_after_filter: userTokens.filter(token => 
        newFilter === 'all' || token.network === newFilter
      ).length,
      has_search_term: searchFilter.length > 0
    });
  };

  // Analytics tracking function
  const trackAnalyticsEvent = async (eventType: string, eventData: any, silent = true) => {
    try {
      await supabase.from('analytics_events').insert({
        wallet_address: walletAddress || 'anonymous',
        event_type: eventType,
        event_data: {
          ...eventData,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
          authenticated: isAuthenticated,
          wallet_type: walletType || 'none'
        },
        network: network,
        timestamp: new Date().toISOString()
      });
      if (!silent) console.log(`📊 Event tracked: ${eventType}`);
    } catch (error) {
      if (!silent) console.warn(`Failed to track ${eventType}:`, error);
    }
  };

  // Handle tab changes with analytics
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    trackAnalyticsEvent('tab_switch', {
      from_tab: activeTab,
      to_tab: newTab,
      user_tokens_count: userTokens.length,
      recent_verifications_count: recentVerifications.length
    });
  };

  // Handle network changes with analytics
  const handleNetworkChange = (newNetwork: NetworkType) => {
    const oldNetwork = network;
    setNetwork(newNetwork);
    trackAnalyticsEvent('network_switch', {
      from_network: oldNetwork,
      to_network: newNetwork,
      has_token_input: !!tokenId,
      current_tab: activeTab
    });
  };

  useEffect(() => {
    setMounted(true);
    loadRecentVerifications();
    
    // Track page view analytics
    const trackPageView = async () => {
      try {
        await supabase.from('analytics_events').insert({
          wallet_address: walletAddress || 'anonymous',
          event_type: 'page_view',
          event_data: {
            page: 'verify',
            user_agent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            authenticated: isAuthenticated,
            wallet_type: walletType || 'none',
            initial_network: network,
            has_recent_verifications: recentVerifications.length > 0,
            session_start: Date.now()
          },
          network: network,
          timestamp: new Date().toISOString()
        });
        console.log('📊 Page view tracked');
      } catch (error) {
        console.warn('Failed to track page view:', error);
      }
    };

    trackPageView();
    
    const urlTokenId = searchParams?.get('id');
    const urlNetwork = searchParams?.get('network') as NetworkType;
    
    if (urlTokenId) {
      setTokenId(urlTokenId);
      if (urlNetwork && ['solana-devnet', 'algorand-mainnet', 'algorand-testnet'].includes(urlNetwork)) {
        setNetwork(urlNetwork);
      }
      handleVerification(urlTokenId, urlNetwork || network);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isAuthenticated && walletAddress) {
      loadUserTokens();
    }
  }, [isAuthenticated, walletAddress]);

  // Load user's created tokens
  const loadUserTokens = async () => {
    if (!walletAddress) return;
    
    setLoadingUserTokens(true);
    try {
      const { data, error } = await supabase
        .from('token_creation_history')
        .select('*')
        .eq('wallet_address', walletAddress)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const tokens: UserToken[] = (data || []).map(token => ({
        id: token.id,
        tokenName: token.token_name,
        tokenSymbol: token.token_symbol,
        network: token.network,
        contractAddress: token.contract_address,
        createdAt: token.created_at,
        assetId: token.asset_id
      }));

      setUserTokens(tokens);
      console.log(`✅ Loaded ${tokens.length} user tokens`);
    } catch (err) {
      console.error('Error loading user tokens:', err);
      toast({
        title: "Error",
        description: "Failed to load your token history",
        variant: "destructive"
      });
    } finally {
      setLoadingUserTokens(false);
    }
  };

  // Load/save recent verifications from localStorage
  const loadRecentVerifications = () => {
    try {
      const saved = localStorage.getItem('snarbles-recent-verifications');
      if (saved) {
        const parsed = JSON.parse(saved);
        setRecentVerifications(parsed.slice(0, 10)); // Keep only 10 most recent
      }
    } catch (error) {
      console.warn('Failed to load recent verifications:', error);
    }
  };

  const saveRecentVerification = (tokenId: string, network: NetworkType, result: VerificationResult) => {
    try {
      const verification: RecentVerification = {
        tokenId,
        network,
        result,
        timestamp: Date.now()
      };
      
      const updated = [verification, ...recentVerifications.filter(v => v.tokenId !== tokenId || v.network !== network)];
      const limited = updated.slice(0, 10);
      
      setRecentVerifications(limited);
      localStorage.setItem('snarbles-recent-verifications', JSON.stringify(limited));
    } catch (error) {
      console.warn('Failed to save recent verification:', error);
    }
  };

  const validateTokenId = (id: string, networkType: NetworkType): boolean => {
    if (!id.trim()) return false;
    
    if (networkType === 'solana-devnet') {
      try {
        new PublicKey(id);
        return true;
      } catch {
        return false;
      }
    } else {
      return /^\d+$/.test(id) && parseInt(id) > 0;
    }
  };

  const fetchSolanaTokenData = async (tokenMint: string): Promise<Partial<VerificationResult>> => {
    try {
      setCurrentStep('Connecting to Solana network...');
      const connection = new Connection('https://api.devnet.solana.com');
      const mintPubkey = new PublicKey(tokenMint);
      
      setCurrentStep('Fetching token supply...');
      const supply = await connection.getTokenSupply(mintPubkey);
      
      setCurrentStep('Analyzing token accounts...');
      const tokenAccounts = await connection.getTokenAccountsByOwner(
        mintPubkey,
        { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
      );

      setCurrentStep('Fetching metadata...');
      const metadataResult = await getTokenMetadata(tokenMint);
      const solanaMetadata = metadataResult.data;
      
      const metadata: TokenMetadata = {
        name: solanaMetadata?.name || 'Unknown Token',
        symbol: solanaMetadata?.symbol || 'UNK',
        decimals: supply.value.decimals,
        totalSupply: supply.value.uiAmountString || '0',
        verified: solanaMetadata?.verified || false,
        description: solanaMetadata?.description || '',
        image: solanaMetadata?.image || '',
        website: solanaMetadata?.website || '',
        twitter: solanaMetadata?.twitter || ''
      };

      setCurrentStep('Calculating security score...');
      const checks = {
        tokenExists: true,
        metadataValid: !!(metadata.name && metadata.symbol),
        liquidityAvailable: tokenAccounts.value.length > 5,
        contractVerified: metadataResult.success && !!metadata.verified,
        communityTrust: tokenAccounts.value.length > 10,
        holderDistribution: tokenAccounts.value.length > 20,
        socialPresence: !!(metadata.website || metadata.twitter)
      };

      const score = Math.round((Object.values(checks).filter(Boolean).length / Object.keys(checks).length) * 100);

      const metrics = {
        holders: tokenAccounts.value.length,
        totalSupply: supply.value.uiAmountString || '0',
        marketCap: 'N/A',
        volume24h: 'N/A',
        priceChange24h: 'N/A',
        liquidity: tokenAccounts.value.length > 0 ? 'Available' : 'Limited'
      };

      return {
        verified: score >= 70,
        score,
        status: score >= 70 ? 'success' : score >= 50 ? 'warning' : 'error',
        checks,
        metadata: metadata as TokenMetadata,
        metrics,
        explorerUrl: `https://explorer.solana.com/address/${tokenMint}?cluster=devnet`,
        warnings: score < 70 ? [
          ...(score < 50 ? ['Low security score - exercise extreme caution'] : []),
          ...(tokenAccounts.value.length < 5 ? ['Limited liquidity detected'] : []),
          ...(!metadata.verified ? ['Token metadata not verified'] : []),
          ...(!metadata.website && !metadata.twitter ? ['No social media presence'] : [])
        ] : []
      };
    } catch (error) {
      throw new Error('Unable to fetch Solana token data. Please check the token address.');
    }
  };

  const fetchAlgorandTokenData = async (assetId: string, networkType: NetworkType): Promise<Partial<VerificationResult>> => {
    try {
      setCurrentStep('Connecting to Algorand network...');
      const isMainnet = networkType === 'algorand-mainnet';
      const networkName = isMainnet ? 'mainnet' : 'testnet';
      
      setCurrentStep('Searching for asset...');
      let assetInfo = await getAlgorandAssetInfo(parseInt(assetId), networkName);
      let actualNetwork = networkName;
      
      // Cross-network detection with better error handling
      if (!assetInfo.success && networkType === 'algorand-mainnet') {
        setCurrentStep('Asset not found on mainnet, checking testnet...');
        try {
          assetInfo = await getAlgorandAssetInfo(parseInt(assetId), 'testnet');
          if (assetInfo.success) {
            actualNetwork = 'testnet';
            toast({
              title: "Network Auto-Switch",
              description: "Asset found on Algorand Testnet instead of Mainnet",
              duration: 5000,
            });
          }
        } catch (testnetError) {
          console.log('Asset not found on testnet either:', testnetError);
        }
      } else if (!assetInfo.success && networkType === 'algorand-testnet') {
        setCurrentStep('Asset not found on testnet, checking mainnet...');
        try {
          assetInfo = await getAlgorandAssetInfo(parseInt(assetId), 'mainnet');
          if (assetInfo.success) {
            actualNetwork = 'mainnet';
            toast({
              title: "Network Auto-Switch", 
              description: "Asset found on Algorand Mainnet instead of Testnet",
              duration: 5000,
            });
          }
        } catch (mainnetError) {
          console.log('Asset not found on mainnet either:', mainnetError);
        }
      }
      
      if (!assetInfo.success || !assetInfo.data) {
        throw new Error(`Asset ${assetId} not found on either Algorand Mainnet or Testnet. Please verify the Asset ID is correct.`);
      }

      const asset = assetInfo.data;
      
      setCurrentStep('Analyzing asset properties...');
      const metadata: TokenMetadata = {
        name: asset.assetName || 'Unknown Asset',
        symbol: asset.unitName || 'UNK',
        decimals: asset.decimals || 0,
        totalSupply: asset.totalSupply?.toString() || '0',
        description: asset.url || undefined,
        verified: false
      };

      setCurrentStep('Calculating security score...');
      const checks = {
        tokenExists: true,
        metadataValid: !!(asset.assetName && asset.unitName),
        liquidityAvailable: !!asset.totalSupply && asset.totalSupply > 0,
        contractVerified: !asset.manager, // No manager = immutable
        communityTrust: !!asset.totalSupply && asset.totalSupply > 1000,
        holderDistribution: !asset.defaultFrozen,
        socialPresence: !!asset.url
      };

      const score = Math.round((Object.values(checks).filter(Boolean).length / Object.keys(checks).length) * 100);
      
      const metrics = {
        totalSupply: asset.totalSupply?.toLocaleString() || '0',
        holders: 'N/A',
        marketCap: 'N/A',
        volume24h: 'N/A',
        priceChange24h: 'N/A',
        liquidity: asset.totalSupply ? 'Available' : 'Limited'
      };

      return {
        verified: score >= 70,
        score,
        status: score >= 70 ? 'success' : score >= 50 ? 'warning' : 'error',
        checks,
        metadata,
        metrics,
        explorerUrl: actualNetwork === 'mainnet'
          ? `https://explorer.perawallet.app/asset/${assetId}`
          : `https://testnet.algoexplorer.io/asset/${assetId}`,
        warnings: score < 70 ? [
          ...(score < 50 ? ['Low security score - proceed with caution'] : []),
          ...(asset.manager ? ['Asset has manager - not fully decentralized'] : []),
          ...(asset.defaultFrozen ? ['Asset is frozen by default'] : []),
          ...(!asset.url ? ['No metadata URL provided'] : [])
        ] : []
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Unable to fetch Algorand asset data.');
    }
  };

  const handleVerification = async (id?: string, selectedNetwork?: NetworkType) => {
    const tokenToVerify = id || tokenId;
    const networkToUse = selectedNetwork || network;
    const verificationStartTime = Date.now();
    
    if (!validateTokenId(tokenToVerify, networkToUse)) {
      setError(`Invalid ${networkToUse.includes('solana') ? 'token address' : 'asset ID'} format`);
      
      // Track validation error
      trackAnalyticsEvent('verification_error', {
        error_type: 'invalid_format',
        token_id: tokenToVerify,
        network: networkToUse,
        error_message: 'Invalid format'
      });
      return;
    }

    // Track verification start
    trackAnalyticsEvent('verification_started', {
      token_id: tokenToVerify,
      network: networkToUse,
      input_method: id ? 'programmatic' : 'manual',
      user_tokens_count: userTokens.length
    });

    setIsVerifying(true);
    setProgress(0);
    setCurrentStep('Initializing verification...');
    setVerificationResult(null);
    setError(null);

    const steps = [
      'Connecting to network...',
      'Validating token/asset...',
      'Fetching metadata...',
      'Checking liquidity...',
      'Analyzing security...',
      'Calculating trust score...',
      'Finalizing results...'
    ];

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = Math.min(prev + Math.random() * 15, 95);
          return newProgress;
        });
      }, 500);

      let result: Partial<VerificationResult>;
      let apiResponseTimes: number[] = [];
      
      if (networkToUse === 'solana-devnet') {
        const solanaStartTime = Date.now();
        result = await fetchSolanaTokenData(tokenToVerify);
        apiResponseTimes.push(Date.now() - solanaStartTime);
      } else {
        const algorandStartTime = Date.now();
        result = await fetchAlgorandTokenData(tokenToVerify, networkToUse);
        apiResponseTimes.push(Date.now() - algorandStartTime);
      }

      clearInterval(progressInterval);
      setProgress(100);
      setCurrentStep('Verification complete!');

      const finalResult: VerificationResult = {
        network: networkToUse,
        tokenId: tokenToVerify,
        timestamp: Date.now(),
        shareUrl: `${window.location.origin}/verify?id=${tokenToVerify}&network=${networkToUse}`,
        ...result
      } as VerificationResult;

      const verificationDuration = Date.now() - verificationStartTime;

      setVerificationResult(finalResult);
      saveRecentVerification(tokenToVerify, networkToUse, finalResult);
      
      // Enhanced verification tracking with performance metrics
      try {
        await Promise.all([
          // Original verification event
          supabase.from('analytics_events').insert({
            wallet_address: walletAddress,
            event_type: 'token_verification',
            event_data: {
              tokenId: tokenToVerify,
              network: networkToUse,
              score: finalResult.score,
              verified: finalResult.verified
            },
            network: networkToUse,
            timestamp: new Date().toISOString()
          }),
          
          // Enhanced verification analytics
          trackAnalyticsEvent('verification_completed', {
            token_id: tokenToVerify,
            network: networkToUse,
            score: finalResult.score,
            verified: finalResult.verified,
            status: finalResult.status,
            duration_ms: verificationDuration,
            api_response_times: apiResponseTimes,
            checks_passed: Object.values(finalResult.checks).filter(Boolean).length,
            warnings_count: finalResult.warnings.length,
            metadata_quality: finalResult.metadata ? 'complete' : 'partial'
          }),

          // Security score distribution tracking
          trackAnalyticsEvent('security_score_recorded', {
            score: finalResult.score,
            score_category: finalResult.score >= 80 ? 'safe' : 
                           finalResult.score >= 60 ? 'caution' : 
                           finalResult.score >= 40 ? 'risky' : 'danger',
            network: networkToUse,
            token_metadata: finalResult.metadata ? {
              has_name: !!finalResult.metadata.name,
              has_symbol: !!finalResult.metadata.symbol,
              has_website: !!finalResult.metadata.website,
              has_social: !!(finalResult.metadata.twitter || finalResult.metadata.telegram)
            } : null
          }),

          // Performance tracking
          trackAnalyticsEvent('verification_performance', {
            duration_ms: verificationDuration,
            network: networkToUse,
            api_response_avg: apiResponseTimes.reduce((a, b) => a + b, 0) / apiResponseTimes.length,
            performance_grade: verificationDuration < 3000 ? 'fast' : 
                              verificationDuration < 10000 ? 'normal' : 'slow'
          })
        ]);
      } catch (analyticsError) {
        console.warn('Failed to track verification analytics:', analyticsError);
      }
      
      toast({
        title: "Verification Complete",
        description: `Token scored ${finalResult.score}/100 - ${finalResult.status.toUpperCase()}`,
        variant: finalResult.verified ? "default" : "destructive"
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Verification failed';
      const verificationDuration = Date.now() - verificationStartTime;
      
      setError(errorMessage);
      setProgress(0);
      setCurrentStep('');

      // Track verification failure
      trackAnalyticsEvent('verification_failed', {
        token_id: tokenToVerify,
        network: networkToUse,
        error_message: errorMessage,
        duration_ms: verificationDuration,
        failure_point: currentStep
      });
      
      toast({
        title: "Verification Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBulkVerification = async () => {
    if (selectedTokens.length === 0) return;
    
    const bulkStartTime = Date.now();
    setBulkVerifying(true);
    const results: VerificationResult[] = [];
    
    // Track bulk verification start
    trackAnalyticsEvent('bulk_verification_started', {
      tokens_selected: selectedTokens.length,
      networks: [...new Set(userTokens.filter(t => selectedTokens.includes(t.contractAddress)).map(t => t.network))],
      user_total_tokens: userTokens.length
    });
    
    for (const tokenAddress of selectedTokens) {
      try {
        const token = userTokens.find(t => t.contractAddress === tokenAddress);
        if (token) {
          const networkType = token.network as NetworkType;
          await handleVerification(token.contractAddress, networkType);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
        }
      } catch (error) {
        console.error(`Bulk verification failed for ${tokenAddress}:`, error);
        trackAnalyticsEvent('bulk_verification_item_failed', {
          token_address: tokenAddress,
          error_message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    const bulkDuration = Date.now() - bulkStartTime;
    
    // Track bulk verification completion
    trackAnalyticsEvent('bulk_verification_completed', {
      tokens_processed: selectedTokens.length,
      duration_ms: bulkDuration,
      average_time_per_token: bulkDuration / selectedTokens.length,
      success_rate: results.length / selectedTokens.length
    });
    
    setBulkVerifying(false);
    setSelectedTokens([]);
    toast({
      title: "Bulk Verification Complete",
      description: `Verified ${selectedTokens.length} tokens`,
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    
    // Track copy action
    trackAnalyticsEvent('content_copied', {
      content_type: label.toLowerCase().replace(' ', '_'),
      content_length: text.length,
      current_tab: activeTab,
      has_verification_result: !!verificationResult
    });
    
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`,
    });
  };

  const shareVerification = () => {
    if (verificationResult?.shareUrl) {
      navigator.clipboard.writeText(verificationResult.shareUrl);
      
      // Track share action with detailed analytics
      trackAnalyticsEvent('verification_shared', {
        token_id: verificationResult.tokenId,
        network: verificationResult.network,
        score: verificationResult.score,
        verified: verificationResult.verified,
        share_method: 'copy_link',
        warnings_count: verificationResult.warnings.length
      });
      
      toast({
        title: "Share Link Copied",
        description: "Verification link copied to clipboard",
      });
    }
  };

  const getNetworkStatus = () => {
    const statusMap = {
      'solana-devnet': { label: 'Solana Devnet', color: 'bg-purple-500', icon: Globe },
      'algorand-mainnet': { label: 'Algorand Mainnet', color: 'bg-green-500', icon: Globe },
      'algorand-testnet': { label: 'Algorand Testnet', color: 'bg-orange-500', icon: Globe }
    };
    return statusMap[network];
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-6 h-6 text-green-400" />;
      case 'warning': return <AlertTriangle className="w-6 h-6 text-yellow-400" />;
      case 'error': return <AlertCircle className="w-6 h-6 text-red-400" />;
      default: return <AlertTriangle className="w-6 h-6 text-gray-400" />;
    }
  };

  const filteredUserTokens = userTokens.filter(token => {
    const matchesSearch = !searchFilter || 
      token.tokenName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      token.tokenSymbol.toLowerCase().includes(searchFilter.toLowerCase()) ||
      token.contractAddress.toLowerCase().includes(searchFilter.toLowerCase());
    
    const matchesNetwork = networkFilter === 'all' || token.network === networkFilter;
    
    return matchesSearch && matchesNetwork;
  });

  const networkStatus = getNetworkStatus();

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center app-background">
        <div className="glass-card p-8 text-center">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Token Verification...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-40 right-20 w-72 h-72 bg-gradient-to-br from-green-500/8 to-emerald-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.7s' }} />
        <div className="absolute bottom-32 left-1/4 w-64 h-64 bg-gradient-to-br from-blue-500/8 to-blue-600/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-3 glass-card px-6 py-3 rounded-full border border-primary/20 mb-6">
            <Shield className="w-5 h-5 text-primary animate-pulse" />
            <span className="text-sm uppercase tracking-wider text-primary font-bold">Professional Token Verification</span>
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight mb-6">
            Verify Token 
            <span className="bg-gradient-to-r from-primary via-blue-500 to-green-500 bg-clip-text text-transparent"> Safety & Authenticity</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            Advanced blockchain verification with 
            <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent font-semibold"> real-time security analysis</span>, 
            cross-network detection, and comprehensive scoring for Solana and Algorand tokens.
          </p>
        </div>

        {/* Network Status */}
        <div className="flex justify-center mb-12">
          <div className="glass-card p-6 border border-green-500/30 bg-green-500/5 rounded-xl">
            <div className="flex items-center space-x-4">
              <div className={`w-6 h-6 rounded-full ${networkStatus.color} shadow-lg animate-pulse`}></div>
              <networkStatus.icon className="w-7 h-7 text-green-400" />
              <span className="text-xl font-bold bg-gradient-to-r from-green-400 to-green-500 bg-clip-text text-transparent">{networkStatus.label}</span>
              <div className="flex items-center space-x-2 text-green-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Live Network</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabbed Interface */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-8">
          <div className="flex justify-center">
            <TabsList className="glass-card border border-border p-2 rounded-xl">
              <TabsTrigger value="search" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg">
                <Search className="w-4 h-4 mr-2" />
                Search & Verify
              </TabsTrigger>
              {isAuthenticated && (
                <TabsTrigger value="my-tokens" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg">
                  <Wallet className="w-4 h-4 mr-2" />
                  My Tokens ({userTokens.length})
                </TabsTrigger>
              )}
              <TabsTrigger value="recent" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg">
                <History className="w-4 h-4 mr-2" />
                Recent ({recentVerifications.length})
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Search & Verify Tab */}
          <TabsContent value="search">
            <Card className="glass-card border border-primary/30 bg-primary/5 shadow-2xl rounded-xl">
              <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-white rounded-t-xl p-8">
                <CardTitle className="flex items-center space-x-3 text-2xl font-bold">
                  <Search className="w-7 h-7" />
                  <span>Advanced Token Verification</span>
                </CardTitle>
                <CardDescription className="text-white/90 text-lg mt-3 leading-relaxed">
                  Enter token address or asset ID for comprehensive blockchain verification with security analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Network Selection */}
                  <div className="space-y-4">
                    <Label htmlFor="network" className="text-lg font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                      Network
                    </Label>
                    <Select value={network} onValueChange={handleNetworkChange}>
                      <SelectTrigger className="h-14 glass-card border border-border text-foreground rounded-xl">
                        <SelectValue placeholder="Select network" />
                      </SelectTrigger>
                      <SelectContent className="glass-card border-border rounded-xl">
                        <SelectItem value="solana-devnet" className="text-foreground hover:bg-muted py-4 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-4 h-4 bg-purple-500 rounded-full animate-pulse"></div>
                            <span>Solana Devnet</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="algorand-mainnet" className="text-foreground hover:bg-muted py-4 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                            <span>Algorand Mainnet</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="algorand-testnet" className="text-foreground hover:bg-muted py-4 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                            <span>Algorand Testnet</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Token ID Input */}
                  <div className="lg:col-span-2 space-y-4">
                    <Label htmlFor="token-id" className="text-lg font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                      {network.includes('solana') ? 'Token Address' : 'Asset ID'}
                    </Label>
                    <div className="flex gap-4">
                      <Input
                        id="token-id"
                        placeholder={network.includes('solana') ? 'Enter Solana token address...' : 'Enter Algorand asset ID...'}
                        value={tokenId}
                        onChange={(e) => setTokenId(e.target.value)}
                        disabled={isVerifying}
                        className="flex-1 h-14 glass-card border border-border text-foreground placeholder:text-muted-foreground rounded-xl"
                      />
                      <Button 
                        onClick={() => handleVerification()}
                        disabled={!tokenId || isVerifying || !validateTokenId(tokenId, network)}
                        className="px-8 h-14 bg-primary hover:bg-primary/90 text-white font-bold shadow-xl rounded-xl transition-all duration-300"
                      >
                        {isVerifying ? (
                          <div className="flex items-center space-x-3">
                            <RefreshCw className="w-6 h-6 animate-spin" />
                            <span>Verifying...</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-3">
                            <Search className="w-6 h-6" />
                            <span>Verify</span>
                          </div>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Error Display */}
                {error && (
                  <Alert className="glass-card border border-red-500/30 bg-red-500/5 p-6 rounded-xl">
                    <AlertCircle className="h-7 w-7 text-red-400" />
                    <AlertDescription className="text-red-400 ml-4 text-lg">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Tokens Tab */}
          {isAuthenticated && (
            <TabsContent value="my-tokens">
              <Card className="glass-card border border-blue-500/30 bg-blue-500/5">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-xl p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-3 text-2xl">
                        <Wallet className="w-7 h-7" />
                        <span>My Created Tokens</span>
                      </CardTitle>
                      <CardDescription className="text-blue-100 text-lg mt-3">
                        Verify tokens you've created from your connected wallet
                      </CardDescription>
                    </div>
                    {selectedTokens.length > 0 && (
                      <div className="flex items-center space-x-4">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 px-4 py-2 text-lg">
                          {selectedTokens.length} selected
                        </Badge>
                        <Button
                          onClick={handleBulkVerification}
                          disabled={bulkVerifying}
                          className="bg-primary hover:bg-primary/90"
                        >
                          {bulkVerifying ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            <>
                              <Shield className="w-4 h-4 mr-2" />
                              Verify Selected
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  {/* Search and Filter */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <div className="flex-1">
                      <Input
                        placeholder="Search tokens by name, symbol, or address..."
                        value={searchFilter}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="h-12 glass-card border border-border text-foreground placeholder:text-muted-foreground"
                      />
                    </div>
                    <Select value={networkFilter} onValueChange={handleNetworkFilterChange}>
                      <SelectTrigger className="w-48 h-12 glass-card border border-border text-foreground">
                        <SelectValue placeholder="Filter by network" />
                      </SelectTrigger>
                      <SelectContent className="glass-card border-border">
                        <SelectItem value="all" className="text-foreground hover:bg-muted">All Networks</SelectItem>
                        <SelectItem value="solana-devnet" className="text-foreground hover:bg-muted">Solana Devnet</SelectItem>
                        <SelectItem value="algorand-mainnet" className="text-foreground hover:bg-muted">Algorand Mainnet</SelectItem>
                        <SelectItem value="algorand-testnet" className="text-foreground hover:bg-muted">Algorand Testnet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tokens List */}
                  {loadingUserTokens ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-20 w-full bg-muted" />
                      ))}
                    </div>
                  ) : filteredUserTokens.length > 0 ? (
                    <div className="space-y-4">
                      {filteredUserTokens.map((token) => (
                        <div
                          key={token.id}
                          className={`p-6 rounded-xl border transition-all duration-200 cursor-pointer ${
                            selectedTokens.includes(token.contractAddress)
                              ? 'border-red-500 bg-red-500/10 shadow-[0_0_0_1px_rgb(239_68_68_/_0.3)]'
                              : 'border-border hover:border-border/70 glass-card'
                          }`}
                          onClick={() => {
                            const isCurrentlySelected = selectedTokens.includes(token.contractAddress);
                            
                            // Track token selection analytics
                            trackAnalyticsEvent('user_token_selected', {
                              token_id: token.contractAddress,
                              token_name: token.tokenName,
                              token_symbol: token.tokenSymbol,
                              network: token.network,
                              action: isCurrentlySelected ? 'deselected' : 'selected',
                              total_selected_after: isCurrentlySelected ? 
                                selectedTokens.length - 1 : selectedTokens.length + 1,
                              created_days_ago: Math.floor((Date.now() - new Date(token.createdAt).getTime()) / (1000 * 60 * 60 * 24))
                            });
                            
                            if (isCurrentlySelected) {
                              setSelectedTokens(prev => prev.filter(t => t !== token.contractAddress));
                            } else {
                              setSelectedTokens(prev => [...prev, token.contractAddress]);
                            }
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-lg">
                                  {token.tokenSymbol.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <h3 className="text-xl font-bold text-foreground">{token.tokenName}</h3>
                                <p className="text-muted-foreground">{token.tokenSymbol} • {token.network}</p>
                                <p className="text-sm text-muted-foreground font-mono">
                                  {token.contractAddress.slice(0, 8)}...{token.contractAddress.slice(-8)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="text-right">
                                <p className="text-sm text-muted-foreground">Created</p>
                                <p className="text-foreground font-medium">
                                  {new Date(token.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  
                                  // Track individual token verification
                                  trackAnalyticsEvent('individual_token_verify_clicked', {
                                    token_id: token.contractAddress,
                                    token_name: token.tokenName,
                                    network: token.network,
                                    source: 'my_tokens_list',
                                    created_days_ago: Math.floor((Date.now() - new Date(token.createdAt).getTime()) / (1000 * 60 * 60 * 24))
                                  });
                                  
                                  setTokenId(token.contractAddress);
                                  setNetwork(token.network as NetworkType);
                                  setActiveTab('search');
                                  handleVerification(token.contractAddress, token.network as NetworkType);
                                }}
                                variant="ghost"
                                className="hover:bg-muted"
                              >
                                <Shield className="w-4 h-4 mr-2" />
                                Verify
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="w-24 h-24 bg-gradient-to-br from-muted/50 to-muted rounded-full flex items-center justify-center mx-auto mb-6">
                        <Database className="w-12 h-12 text-muted-foreground" />
                      </div>
                      <h3 className="text-2xl font-bold text-foreground mb-4">No Tokens Found</h3>
                      <p className="text-muted-foreground text-lg mb-8">
                        {searchFilter || networkFilter !== 'all' 
                          ? 'No tokens match your current filters'
                          : 'You haven\'t created any tokens yet'
                        }
                      </p>
                      {!searchFilter && networkFilter === 'all' && (
                        <Button 
                          onClick={() => window.location.href = '/create'} 
                          className="bg-primary hover:bg-primary/90"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Create Your First Token
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Recent Verifications Tab */}
          <TabsContent value="recent">
            <Card className="glass-card border border-purple-500/30 bg-purple-500/5">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-t-xl p-8">
                <CardTitle className="flex items-center space-x-3 text-2xl">
                  <History className="w-7 h-7" />
                  <span>Recent Verifications</span>
                </CardTitle>
                <CardDescription className="text-purple-100 text-lg mt-3">
                  Access your recent token verification results
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                {recentVerifications.length > 0 ? (
                  <div className="space-y-4">
                    {recentVerifications.map((verification, index) => (
                      <div
                        key={`${verification.tokenId}-${verification.network}-${index}`}
                        className="p-6 rounded-xl glass-card border border-border hover:border-border/70 transition-all duration-200 cursor-pointer"
                        onClick={() => {
                          // Track recent verification click
                          trackAnalyticsEvent('recent_verification_clicked', {
                            token_id: verification.tokenId,
                            network: verification.network,
                            score: verification.result.score,
                            age_hours: (Date.now() - verification.timestamp) / (1000 * 60 * 60),
                            position_in_list: index
                          });
                          
                          setTokenId(verification.tokenId);
                          setNetwork(verification.network);
                          setVerificationResult(verification.result);
                          setActiveTab('search');
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            {getStatusIcon(verification.result.status)}
                            <div>
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="text-lg font-bold text-foreground">
                                  {verification.result.metadata?.name || `Token ${verification.tokenId.slice(0, 8)}...`}
                                </h3>
                                <Badge 
                                  variant={getScoreBadgeVariant(verification.result.score)}
                                  className="text-sm"
                                >
                                  {verification.result.score}/100
                                </Badge>
                              </div>
                              <p className="text-muted-foreground">
                                {verification.result.metadata?.symbol || 'UNK'} • {verification.network}
                              </p>
                              <p className="text-sm text-muted-foreground font-mono">
                                {verification.tokenId.slice(0, 12)}...{verification.tokenId.slice(-8)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Verified</p>
                            <p className="text-foreground font-medium">
                              {new Date(verification.timestamp).toLocaleDateString()}
                            </p>
                            <ChevronRight className="w-5 h-5 text-muted-foreground mt-2" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 bg-gradient-to-br from-muted/50 to-muted rounded-full flex items-center justify-center mx-auto mb-6">
                      <History className="w-12 h-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-4">No Recent Verifications</h3>
                    <p className="text-muted-foreground text-lg">
                      Your recent verification history will appear here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Enhanced Verification Progress */}
        {isVerifying && (
          <Card className="glass-card border border-red-500/30 bg-red-500/5">
            <CardContent className="pt-8 p-8">
              <div className="space-y-8">
                <div className="flex justify-between items-center text-xl">
                  <div className="flex items-center space-x-3">
                    <RefreshCw className="w-7 h-7 animate-spin text-red-400" />
                    <span className="text-muted-foreground">Advanced Verification in Progress</span>
                  </div>
                  <span className="font-bold text-red-500 text-2xl">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-6" />
                <div className="text-center">
                  <p className="text-muted-foreground text-lg">{currentStep}</p>
                  <p className="text-muted-foreground/70 mt-2">Analyzing security, metadata, and market data...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Verification Results */}
        {verificationResult && (
          <VerificationResultDisplay 
            result={verificationResult}
            onShare={shareVerification}
            onCopy={copyToClipboard}
          />
        )}
      </div>
    </div>
  );
}
