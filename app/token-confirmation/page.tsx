'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ExternalLink, Copy, CheckCircle, BarChart3, Plus, Sparkles, Share2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { SuccessConfetti } from '@/components/SuccessConfetti';

interface TokenInfo {
  name: string;
  symbol: string;
  assetId: string;
  transactionId: string;
  network: string;
  explorerUrl: string;
  createdAt: string;
  totalSupply?: string;
  decimals?: string;
}

export default function TokenConfirmationPage() {
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(true);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    // Get token info from URL parameters or localStorage
    const assetId = searchParams.get('assetId');
    const txId = searchParams.get('txId');
    const network = searchParams.get('network') || 'algorand-testnet';
    
    if (assetId && txId) {
      // Get additional info from localStorage or API
      const storedTokenData = localStorage.getItem(`token_${assetId}`);
      
      if (storedTokenData) {
        const tokenData = JSON.parse(storedTokenData);
        setTokenInfo({
          name: tokenData.name || 'Unnamed Token',
          symbol: tokenData.symbol || 'TOKEN',
          assetId,
          transactionId: txId,
          network,
          explorerUrl: generateExplorerUrl(assetId, network),
          createdAt: tokenData.createdAt || new Date().toISOString(),
          totalSupply: tokenData.totalSupply,
          decimals: tokenData.decimals
        });
      } else {
        // Basic info from URL params
        setTokenInfo({
          name: searchParams.get('name') || 'Token',
          symbol: searchParams.get('symbol') || 'TOKEN',
          assetId,
          transactionId: txId,
          network,
          explorerUrl: generateExplorerUrl(assetId, network),
          createdAt: new Date().toISOString()
        });
      }
    }
    
    setIsLoading(false);
    
    // Hide confetti after 5 seconds
    setTimeout(() => setShowConfetti(false), 5000);
  }, [searchParams]);

  const generateExplorerUrl = (assetId: string, network: string) => {
    const isMainnet = network.includes('mainnet');
    const baseUrl = isMainnet 
      ? 'https://explorer.perawallet.app' 
      : 'https://testnet.explorer.perawallet.app';
    return `${baseUrl}/asset/${assetId}`;
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(label);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
      
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const shareToken = async () => {
    const shareData = {
      title: `Check out my new token: ${tokenInfo?.name}`,
      text: `I just created ${tokenInfo?.name} (${tokenInfo?.symbol}) on ${tokenInfo?.network} using Snarbles!`,
      url: tokenInfo?.explorerUrl
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback: copy to clipboard
      const shareText = `${shareData.text}\n\nView on explorer: ${shareData.url}`;
      await copyToClipboard(shareText, 'Share link');
    }
  };

  const formatSupply = (supply?: string, decimals?: string) => {
    if (!supply || !decimals) return 'N/A';
    const supplyNum = parseFloat(supply);
    const decimalsNum = parseInt(decimals);
    return (supplyNum / Math.pow(10, decimalsNum)).toLocaleString();
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[rgb(239,68,68)] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-[rgb(163,163,163)]">Loading token details...</p>
        </div>
      </div>
    );
  }

  if (!tokenInfo) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[rgb(254,254,235)] mb-4">Token Not Found</h1>
            <p className="text-[rgb(163,163,163)] mb-8">
              The token confirmation details could not be found.
            </p>
            <Link href="/create">
              <Button className="bg-[rgb(239,68,68)] hover:bg-[rgb(239,68,68)]/80 text-white">
                Create New Token
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {showConfetti && <SuccessConfetti show={true} />}
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-2 text-[rgb(163,163,163)] hover:text-[rgb(254,254,235)] transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-4 bg-green-500/20 rounded-full">
                <Sparkles className="w-12 h-12 text-green-400" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-[rgb(254,254,235)] mb-2">
              🎉 Token Created Successfully!
            </h1>
            <p className="text-xl text-[rgb(163,163,163)]">
              Your token is now live on the blockchain
            </p>
          </div>
        </div>

        {/* Token Details Card */}
        <Card className="glass-card border-2 border-[rgb(38,38,38)] mb-8">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <CardTitle className="text-3xl font-bold text-[rgb(254,254,235)]">
                {tokenInfo.name}
              </CardTitle>
              <Badge className="bg-[rgb(239,68,68)] text-white text-lg px-4 py-2">
                {tokenInfo.symbol}
              </Badge>
            </div>
            <p className="text-[rgb(163,163,163)]">
              Created on {formatDate(tokenInfo.createdAt)}
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Key Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass-card p-4 text-center">
                <div className="text-2xl font-bold text-[rgb(254,254,235)] mb-1">
                  {tokenInfo.assetId}
                </div>
                <div className="text-sm text-[rgb(163,163,163)]">Asset ID</div>
              </div>
              
              <div className="glass-card p-4 text-center">
                <div className="text-2xl font-bold text-[rgb(254,254,235)] mb-1">
                  {formatSupply(tokenInfo.totalSupply, tokenInfo.decimals)}
                </div>
                <div className="text-sm text-[rgb(163,163,163)]">Total Supply</div>
              </div>
              
              <div className="glass-card p-4 text-center">
                <div className="text-2xl font-bold text-[rgb(254,254,235)] mb-1">
                  {tokenInfo.network.replace('-', ' ').toUpperCase()}
                </div>
                <div className="text-sm text-[rgb(163,163,163)]">Network</div>
              </div>
            </div>

            {/* Copyable Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[rgb(254,254,235)]">
                Token Information
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-[rgb(163,163,163)] mb-2 block">
                    Asset ID:
                  </label>
                  <div className="flex items-center gap-2 p-3 bg-[rgb(38,38,38)]/50 rounded border">
                    <span className="text-[rgb(254,254,235)] font-mono flex-1">
                      {tokenInfo.assetId}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(tokenInfo.assetId, 'Asset ID')}
                      className="text-[rgb(163,163,163)] hover:text-[rgb(254,254,235)]"
                    >
                      {copiedField === 'Asset ID' ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-[rgb(163,163,163)] mb-2 block">
                    Transaction ID:
                  </label>
                  <div className="flex items-center gap-2 p-3 bg-[rgb(38,38,38)]/50 rounded border">
                    <span className="text-[rgb(254,254,235)] font-mono flex-1 truncate">
                      {tokenInfo.transactionId}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(tokenInfo.transactionId, 'Transaction ID')}
                      className="text-[rgb(163,163,163)] hover:text-[rgb(254,254,235)]"
                    >
                      {copiedField === 'Transaction ID' ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                onClick={() => window.open(tokenInfo.explorerUrl, '_blank')}
                className="bg-[rgb(239,68,68)] hover:bg-[rgb(239,68,68)]/80 text-white flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                View on Explorer
              </Button>
              
              <Button
                onClick={() => router.push('/dashboard')}
                variant="outline"
                className="border-[rgb(163,163,163)] text-[rgb(163,163,163)] hover:bg-[rgb(38,38,38)] flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                Dashboard
              </Button>
              
              <Button
                onClick={() => router.push('/create')}
                variant="outline"
                className="border-[rgb(239,68,68)] text-[rgb(239,68,68)] hover:bg-[rgb(239,68,68)]/10 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Another
              </Button>
              
              <Button
                onClick={shareToken}
                variant="outline"
                className="border-[rgb(163,163,163)] text-[rgb(163,163,163)] hover:bg-[rgb(38,38,38)] flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share Token
              </Button>
            </div>

            {/* Next Steps */}
            <Card className="glass-card border-[rgb(38,38,38)] bg-blue-500/5">
              <CardContent className="p-4">
                <h4 className="text-lg font-semibold text-blue-300 mb-3">
                  🚀 What's Next?
                </h4>
                <ul className="space-y-2 text-blue-200">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    Your token is now live and ready for trading
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    Add liquidity to create a market for your token
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    Share your token with the community
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    Monitor analytics and trading activity in your dashboard
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    Consider adding your token to DEX platforms
                  </li>
                </ul>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        {/* Additional Resources */}
        <div className="text-center">
          <p className="text-[rgb(163,163,163)] mb-4">
            Need help or have questions about your token?
          </p>
          <div className="space-x-4">
            <Link href="/support">
              <Button variant="outline" className="border-[rgb(163,163,163)] text-[rgb(163,163,163)] hover:bg-[rgb(38,38,38)]">
                Get Support
              </Button>
            </Link>
            <Link href="/about">
              <Button variant="outline" className="border-[rgb(163,163,163)] text-[rgb(163,163,163)] hover:bg-[rgb(38,38,38)]">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
