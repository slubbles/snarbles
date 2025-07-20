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
        <Card className={`snarbles-card ${result.verified ? 'snarbles-glow-green' : 'snarbles-glow-red'}`}>
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-6">
                {getStatusIcon(result.status)}
                <div>
                  <h2 className="snarbles-heading-4 mb-2">
                    {result.verified ? 'Token Verified ✓' : 'Verification Issues Found'}
                  </h2>
                  <p className="snarbles-body text-muted-foreground">
                    Security Score: <span className={`font-bold snarbles-heading-5 ${getScoreColor(result.score)}`}>
                      {result.score}/100
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Button onClick={onShare} className="snarbles-button-ghost">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button onClick={() => onCopy(result.tokenId, 'Token ID')} className="snarbles-button-ghost">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy ID
                </Button>
              </div>
            </div>

            {/* Enhanced Progress Bar */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="snarbles-body text-muted-foreground font-medium">Comprehensive Security Assessment</span>
                <Badge variant={getScoreBadgeVariant(result.score)} className="snarbles-body px-4 py-2">
                  {result.score >= 80 ? 'SAFE' : 
                   result.score >= 60 ? 'CAUTION' : 
                   result.score >= 40 ? 'RISKY' : 'DANGER'}
                </Badge>
              </div>
              <Progress value={result.score} className="h-6" />
              <div className="flex justify-between text-sm text-gray-400">
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
        <Card className="snarbles-card snarbles-border-glow">
          <CardHeader>
            <CardTitle className="snarbles-heading-4 flex items-center space-x-3">
              <Shield className="w-6 h-6 text-red-400" />
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
                    <span className="snarbles-body text-muted-foreground font-medium">
                      {checkLabels[key as keyof typeof checkLabels] || key}
                    </span>
                  </div>
                  <Badge variant={passed ? 'default' : 'destructive'} className="snarbles-body-small px-4 py-2">
                    {passed ? 'PASSED' : 'FAILED'}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Warnings */}
        {result.warnings.length > 0 && (
          <Card className="snarbles-card snarbles-glow-red">
            <CardHeader>
              <CardTitle className="snarbles-heading-4 flex items-center space-x-3 text-red-400">
                <AlertTriangle className="w-6 h-6" />
                <span>Security Warnings & Recommendations</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-4">
              {result.warnings.map((warning, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl hover:bg-red-500/15 transition-colors">
                  <AlertTriangle className="w-5 h-5 text-red-400 mt-1 flex-shrink-0" />
                  <p className="snarbles-body text-red-400">{warning}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sidebar Info */}
      <div className="lg:col-span-4 space-y-8">
        {/* Token Information */}
        <Card className="snarbles-card snarbles-border-glow">
          <CardHeader>
            <CardTitle className="snarbles-heading-5 flex items-center space-x-2">
              <Hash className="w-5 h-5 text-blue-400" />
              <span>Token Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {result.metadata && (
              <div className="space-y-4">
                <div>
                  <Label className="snarbles-body-small font-medium text-gray-400">Name</Label>
                  <p className="snarbles-body font-bold mt-1 text-foreground">{result.metadata.name}</p>
                </div>
                <div>
                  <Label className="snarbles-body-small font-medium text-gray-400">Symbol</Label>
                  <p className="snarbles-body font-bold mt-1 text-foreground">{result.metadata.symbol}</p>
                </div>
                <div>
                  <Label className="snarbles-body-small font-medium text-gray-400">Network</Label>
                  <p className="snarbles-body font-bold mt-1 text-foreground capitalize">
                    {result.network.replace('-', ' ')}
                  </p>
                </div>
                <div>
                  <Label className="snarbles-body-small font-medium text-gray-400">Total Supply</Label>
                  <p className="snarbles-body font-bold mt-1 text-foreground">
                    {result.metadata.totalSupply?.toLocaleString() || 'Unknown'}
                  </p>
                </div>
                <div>
                  <Label className="snarbles-body-small font-medium text-gray-400">Decimals</Label>
                  <p className="snarbles-body font-bold mt-1 text-foreground">{result.metadata.decimals}</p>
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

  useEffect(() => {
    setMounted(true);
    loadRecentVerifications();
    
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
      
      setCurrentStep('Fetching asset information...');
      let assetInfo = await getAlgorandAssetInfo(parseInt(assetId), networkName);
      
      // Cross-network detection
      if (!assetInfo.success && networkType === 'algorand-mainnet') {
        setCurrentStep('Asset not found on mainnet, checking testnet...');
        assetInfo = await getAlgorandAssetInfo(parseInt(assetId), 'testnet');
        if (assetInfo.success) {
          toast({
            title: "Network Auto-Switch",
            description: "Asset found on Algorand Testnet instead of Mainnet",
          });
        }
      } else if (!assetInfo.success && networkType === 'algorand-testnet') {
        setCurrentStep('Asset not found on testnet, checking mainnet...');
        assetInfo = await getAlgorandAssetInfo(parseInt(assetId), 'mainnet');
        if (assetInfo.success) {
          toast({
            title: "Network Auto-Switch", 
            description: "Asset found on Algorand Mainnet instead of Testnet",
          });
        }
      }
      
      if (!assetInfo.success || !assetInfo.data) {
        throw new Error(assetInfo.error || `Asset ${assetId} not found on either Algorand network.`);
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
      
      const actualNetwork = assetInfo.success ? (isMainnet ? 'mainnet' : 'testnet') : 'unknown';
      
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
    
    if (!validateTokenId(tokenToVerify, networkToUse)) {
      setError(`Invalid ${networkToUse.includes('solana') ? 'token address' : 'asset ID'} format`);
      return;
    }

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
      
      if (networkToUse === 'solana-devnet') {
        result = await fetchSolanaTokenData(tokenToVerify);
      } else {
        result = await fetchAlgorandTokenData(tokenToVerify, networkToUse);
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

      setVerificationResult(finalResult);
      saveRecentVerification(tokenToVerify, networkToUse, finalResult);
      
      // Track verification event
      try {
        await supabase.from('analytics_events').insert({
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
        });
      } catch (analyticsError) {
        console.warn('Failed to track verification event:', analyticsError);
      }
      
      toast({
        title: "Verification Complete",
        description: `Token scored ${finalResult.score}/100 - ${finalResult.status.toUpperCase()}`,
        variant: finalResult.verified ? "default" : "destructive"
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Verification failed';
      setError(errorMessage);
      setProgress(0);
      setCurrentStep('');
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
    
    setBulkVerifying(true);
    const results: VerificationResult[] = [];
    
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
      }
    }
    
    setBulkVerifying(false);
    setSelectedTokens([]);
    toast({
      title: "Bulk Verification Complete",
      description: `Verified ${selectedTokens.length} tokens`,
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`,
    });
  };

  const shareVerification = () => {
    if (verificationResult?.shareUrl) {
      navigator.clipboard.writeText(verificationResult.shareUrl);
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
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Enhanced animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-primary/15 to-primary/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-40 right-20 w-72 h-72 bg-gradient-to-br from-green-500/12 to-emerald-500/12 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.7s' }} />
        <div className="absolute bottom-32 left-1/4 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-br from-purple-500/8 to-purple-600/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10 space-y-12">
        {/* Enhanced Header */}
        <div className="text-center mb-20 space-y-8">
          <div className="inline-flex items-center space-x-3 glass-card px-6 py-3 rounded-full">
            <Shield className="w-5 h-5 text-primary animate-pulse" />
            <span className="snarbles-body-small uppercase tracking-wider text-primary font-bold">Professional Token Verification</span>
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          </div>
          
          <h1 className="snarbles-heading-1 text-foreground leading-tight">
            Verify Token 
            <span className="bg-gradient-to-r from-primary via-blue-500 to-green-500 bg-clip-text text-transparent"> Safety & Authenticity</span>
          </h1>
          
          <p className="snarbles-body-large text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            Advanced blockchain verification with 
            <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent font-semibold"> real-time security analysis</span>, 
            cross-network detection, and comprehensive scoring for Solana and Algorand tokens.
          </p>
        </div>

        {/* Enhanced Network Status */}
        <div className="flex justify-center mb-12">
          <div className="glass-card-premium p-6 snarbles-glow-green">
            <div className="flex items-center space-x-4">
              <div className={`w-6 h-6 rounded-full ${networkStatus.color} shadow-lg snarbles-animate-pulse`}></div>
              <networkStatus.icon className="w-7 h-7 text-green-400" />
              <span className="snarbles-heading-4 font-bold snarbles-gradient-text-green">{networkStatus.label}</span>
              <div className="flex items-center space-x-2 text-green-400">
                <div className="w-2 h-2 bg-green-400 rounded-full snarbles-animate-pulse"></div>
                <span className="snarbles-body-small font-medium">Live Network</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Tabbed Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="flex justify-center">
            <TabsList className="glass-card snarbles-border-glow p-2">
              <TabsTrigger value="search" className="snarbles-tab-trigger">
                <Search className="w-4 h-4 mr-2" />
                Search & Verify
              </TabsTrigger>
              {isAuthenticated && (
                <TabsTrigger value="my-tokens" className="snarbles-tab-trigger">
                  <Wallet className="w-4 h-4 mr-2" />
                  My Tokens ({userTokens.length})
                </TabsTrigger>
              )}
              <TabsTrigger value="recent" className="snarbles-tab-trigger">
                <History className="w-4 h-4 mr-2" />
                Recent ({recentVerifications.length})
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Search & Verify Tab */}
          <TabsContent value="search">
            <Card className="glass-card-premium snarbles-border-glow shadow-2xl">
              <CardHeader className="snarbles-gradient-red text-white rounded-t-2xl p-8">
                <CardTitle className="flex items-center space-x-3 text-2xl">
                  <Search className="w-7 h-7" />
                  <span>Advanced Token Verification</span>
                </CardTitle>
                <CardDescription className="text-red-100 text-lg mt-3">
                  Enter token address or asset ID for comprehensive blockchain verification with security analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Network Selection */}
                  <div className="space-y-3">
                    <Label htmlFor="network" className="snarbles-heading-5 font-bold snarbles-gradient-text-red">Network</Label>
                    <Select value={network} onValueChange={(value) => setNetwork(value as NetworkType)}>
                      <SelectTrigger className="h-14 snarbles-card snarbles-border-glow text-foreground snarbles-body">
                        <SelectValue placeholder="Select network" />
                      </SelectTrigger>
                      <SelectContent className="snarbles-glass border-gray-700">
                        <SelectItem value="solana-devnet" className="text-foreground hover:bg-gray-700 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-4 h-4 bg-purple-500 rounded-full snarbles-animate-pulse"></div>
                            <span className="snarbles-body">Solana Devnet</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="algorand-mainnet" className="text-foreground hover:bg-gray-700 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-4 h-4 bg-green-500 rounded-full snarbles-animate-pulse"></div>
                            <span className="snarbles-body">Algorand Mainnet</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="algorand-testnet" className="text-foreground hover:bg-gray-700 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                            <span className="snarbles-body">Algorand Testnet</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Token ID Input */}
                  <div className="lg:col-span-2 space-y-3">
                    <Label htmlFor="token-id" className="snarbles-heading-5 font-bold snarbles-gradient-text-red">
                      {network.includes('solana') ? 'Token Address' : 'Asset ID'}
                    </Label>
                    <div className="flex gap-4">
                      <Input
                        id="token-id"
                        placeholder={network.includes('solana') ? 'Enter Solana token address...' : 'Enter Algorand asset ID...'}
                        value={tokenId}
                        onChange={(e) => setTokenId(e.target.value)}
                        disabled={isVerifying}
                        className="flex-1 h-14 snarbles-card snarbles-border-glow text-foreground placeholder-gray-400 snarbles-body"
                      />
                      <Button 
                        onClick={() => handleVerification()}
                        disabled={!tokenId || isVerifying || !validateTokenId(tokenId, network)}
                        className="px-8 h-14 snarbles-btn-primary snarbles-body font-bold shadow-xl"
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
                  <Alert className="snarbles-card snarbles-glow-red p-6">
                    <AlertCircle className="h-7 w-7 text-red-400" />
                    <AlertDescription className="text-red-400 snarbles-body ml-4">
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
              <Card className="glass-card-premium snarbles-border-glow">
                <CardHeader className="snarbles-gradient-blue text-white rounded-t-2xl p-8">
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
                        onChange={(e) => setSearchFilter(e.target.value)}
                        className="h-12 glass-card snarbles-border-glow text-white placeholder-gray-400"
                      />
                    </div>
                    <Select value={networkFilter} onValueChange={setNetworkFilter}>
                      <SelectTrigger className="w-48 h-12 glass-card snarbles-border-glow text-white">
                        <SelectValue placeholder="Filter by network" />
                      </SelectTrigger>
                      <SelectContent className="snarbles-glass border-gray-700">
                        <SelectItem value="all" className="text-white hover:bg-gray-700">All Networks</SelectItem>
                        <SelectItem value="solana-devnet" className="text-white hover:bg-gray-700">Solana Devnet</SelectItem>
                        <SelectItem value="algorand-mainnet" className="text-white hover:bg-gray-700">Algorand Mainnet</SelectItem>
                        <SelectItem value="algorand-testnet" className="text-white hover:bg-gray-700">Algorand Testnet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tokens List */}
                  {loadingUserTokens ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-20 w-full bg-gray-700" />
                      ))}
                    </div>
                  ) : filteredUserTokens.length > 0 ? (
                    <div className="space-y-4">
                      {filteredUserTokens.map((token) => (
                        <div
                          key={token.id}
                          className={`p-6 rounded-xl border transition-all duration-200 cursor-pointer ${
                            selectedTokens.includes(token.contractAddress)
                              ? 'border-red-500 bg-red-500/10 snarbles-glow-red'
                              : 'border-gray-600/50 hover:border-gray-500/50 snarbles-glass-subtle'
                          }`}
                          onClick={() => {
                            if (selectedTokens.includes(token.contractAddress)) {
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
                                <h3 className="text-xl font-bold snarbles-gradient-text-white">{token.tokenName}</h3>
                                <p className="text-gray-400">{token.tokenSymbol} • {token.network}</p>
                                <p className="text-sm text-gray-500 font-mono">
                                  {token.contractAddress.slice(0, 8)}...{token.contractAddress.slice(-8)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="text-right">
                                <p className="text-sm text-gray-400">Created</p>
                                <p className="text-white font-medium">
                                  {new Date(token.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTokenId(token.contractAddress);
                                  setNetwork(token.network as NetworkType);
                                  setActiveTab('search');
                                  handleVerification(token.contractAddress, token.network as NetworkType);
                                }}
                                className="snarbles-button-ghost"
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
                      <div className="w-24 h-24 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Database className="w-12 h-12 text-gray-400" />
                      </div>
                      <h3 className="text-2xl font-bold snarbles-gradient-text-white mb-4">No Tokens Found</h3>
                      <p className="text-gray-400 text-lg mb-8">
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
            <Card className="glass-card-premium snarbles-border-glow">
              <CardHeader className="snarbles-gradient-purple text-white rounded-t-2xl p-8">
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
                        className="p-6 rounded-xl snarbles-glass-subtle hover:border-gray-500/50 transition-all duration-200 cursor-pointer"
                        onClick={() => {
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
                                <h3 className="text-lg font-bold snarbles-gradient-text-white">
                                  {verification.result.metadata?.name || `Token ${verification.tokenId.slice(0, 8)}...`}
                                </h3>
                                <Badge 
                                  variant={getScoreBadgeVariant(verification.result.score)}
                                  className="text-sm"
                                >
                                  {verification.result.score}/100
                                </Badge>
                              </div>
                              <p className="text-gray-400">
                                {verification.result.metadata?.symbol || 'UNK'} • {verification.network}
                              </p>
                              <p className="text-sm text-gray-500 font-mono">
                                {verification.tokenId.slice(0, 12)}...{verification.tokenId.slice(-8)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-400">Verified</p>
                            <p className="text-white font-medium">
                              {new Date(verification.timestamp).toLocaleDateString()}
                            </p>
                            <ChevronRight className="w-5 h-5 text-gray-400 mt-2" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                      <History className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-2xl font-bold snarbles-gradient-text-white mb-4">No Recent Verifications</h3>
                    <p className="text-gray-400 text-lg">
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
          <Card className="glass-card-premium snarbles-border-glow">
            <CardContent className="pt-8 p-8">
              <div className="space-y-8">
                <div className="flex justify-between items-center text-xl">
                  <div className="flex items-center space-x-3">
                    <RefreshCw className="w-7 h-7 animate-spin text-red-400" />
                    <span className="text-muted-foreground">Advanced Verification in Progress</span>
                  </div>
                  <span className="font-bold snarbles-gradient-text-red text-2xl">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-6 snarbles-glass-subtle" />
                <div className="text-center">
                  <p className="snarbles-body text-muted-foreground text-lg">{currentStep}</p>
                  <p className="snarbles-body-small text-gray-300 mt-2">Analyzing security, metadata, and market data...</p>
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
