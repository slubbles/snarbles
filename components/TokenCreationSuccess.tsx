'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ExternalLink, 
  Copy, 
  CheckCircle, 
  BarChart3, 
  Plus, 
  X,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { SuccessConfetti } from '@/components/SuccessConfetti';

interface TokenData {
  name: string;
  symbol: string;
  assetId: number;
  transactionId: string;
  explorerUrl: string;
  network: string;
  decimals?: number;
  totalSupply?: number;
}

interface TokenCreationSuccessProps {
  tokenData: TokenData;
  onClose: () => void;
  onCreateAnother?: () => void;
  onGoToDashboard?: () => void;
}

export default function TokenCreationSuccess({
  tokenData,
  onClose,
  onCreateAnother,
  onGoToDashboard
}: TokenCreationSuccessProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(label);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
      
      // Reset copy state after 2 seconds
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const handleGoToDashboard = () => {
    if (onGoToDashboard) {
      onGoToDashboard();
    } else {
      router.push('/dashboard');
    }
    onClose();
  };

  const handleCreateAnother = () => {
    if (onCreateAnother) {
      onCreateAnother();
    }
    onClose();
  };

  const formatSupply = (supply?: number, decimals?: number) => {
    if (!supply || !decimals) return 'N/A';
    return (supply / Math.pow(10, decimals)).toLocaleString();
  };

  return (
    <>
      <SuccessConfetti show={true} />
      
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-[rgb(17,17,17)] border-2 border-[rgb(38,38,38)] rounded-xl w-full max-w-lg mx-4 glass-card overflow-hidden">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-[rgb(239,68,68)]/20 to-[rgb(239,68,68)]/10 p-6 border-b border-[rgb(38,38,38)]">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="absolute top-4 right-4 text-[rgb(163,163,163)] hover:text-[rgb(254,254,235)]"
            >
              <X className="w-4 h-4" />
            </Button>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-500/20 rounded-full">
                <Sparkles className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <h2 className="snarbles-heading text-2xl font-bold text-[rgb(254,254,235)]">
                  Token Created!
                </h2>
                <p className="snarbles-body text-[rgb(163,163,163)]">
                  Your token is now live on {tokenData.network}
                </p>
              </div>
            </div>
          </div>

          {/* Token Details */}
          <div className="p-6 space-y-4">
            <Card className="glass-card border-[rgb(38,38,38)]">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="snarbles-heading text-lg font-semibold text-[rgb(254,254,235)]">
                    {tokenData.name}
                  </h3>
                  <Badge className="bg-[rgb(239,68,68)] text-white">
                    {tokenData.symbol}
                  </Badge>
                </div>

                {/* Key Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {tokenData.totalSupply && tokenData.decimals && (
                    <div>
                      <span className="snarbles-body text-[rgb(163,163,163)]">Total Supply:</span>
                      <div className="snarbles-heading text-[rgb(254,254,235)] font-medium">
                        {formatSupply(tokenData.totalSupply, tokenData.decimals)}
                      </div>
                    </div>
                  )}
                  <div>
                    <span className="snarbles-body text-[rgb(163,163,163)]">Network:</span>
                    <div className="snarbles-heading text-[rgb(254,254,235)] font-medium">
                      {tokenData.network}
                    </div>
                  </div>
                </div>

                {/* Copyable Fields */}
                <div className="space-y-3">
                  <div>
                    <label className="snarbles-body text-sm text-[rgb(163,163,163)]">
                      Asset ID:
                    </label>
                    <div className="flex items-center gap-2 mt-1 p-2 bg-[rgb(38,38,38)]/50 rounded border">
                      <span className="snarbles-heading text-sm text-[rgb(254,254,235)] font-mono flex-1">
                        {tokenData.assetId}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(tokenData.assetId.toString(), 'Asset ID')}
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
                    <label className="snarbles-body text-sm text-[rgb(163,163,163)]">
                      Transaction ID:
                    </label>
                    <div className="flex items-center gap-2 mt-1 p-2 bg-[rgb(38,38,38)]/50 rounded border">
                      <span className="snarbles-heading text-sm text-[rgb(254,254,235)] font-mono flex-1 truncate">
                        {tokenData.transactionId}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(tokenData.transactionId, 'Transaction ID')}
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
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={() => window.open(tokenData.explorerUrl, '_blank')}
                className="w-full bg-[rgb(239,68,68)] hover:bg-[rgb(239,68,68)]/80 text-white flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                View on Explorer
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleGoToDashboard}
                  variant="outline"
                  className="border-[rgb(163,163,163)] text-[rgb(163,163,163)] hover:bg-[rgb(38,38,38)] flex items-center gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  Dashboard
                </Button>
                
                <Button
                  onClick={handleCreateAnother}
                  variant="outline"
                  className="border-[rgb(239,68,68)] text-[rgb(239,68,68)] hover:bg-[rgb(239,68,68)]/10 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Another
                </Button>
              </div>
            </div>

            {/* Next Steps Info */}
            <Card className="glass-card border-[rgb(38,38,38)] bg-blue-500/5">
              <CardContent className="p-4">
                <h4 className="snarbles-heading text-sm font-semibold text-blue-300 mb-2">
                  🎯 What's Next?
                </h4>
                <ul className="snarbles-body text-sm text-blue-200 space-y-1">
                  <li>• Your token is now live and tradeable</li>
                  <li>• Add liquidity to create a market</li>
                  <li>• Share your token with the community</li>
                  <li>• Monitor analytics in your dashboard</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
