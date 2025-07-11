'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  DollarSign, 
  Settings, 
  TrendingUp, 
  Clock, 
  Shield, 
  Zap,
  RefreshCw,
  Calculator
} from 'lucide-react';
import { calculateTokenCreationFees, formatFeeDisplay, type FeeSummary } from '@/lib/algorand-fees';
import { getPricingConfig } from '@/lib/dynamic-pricing';
import { useToast } from '@/hooks/use-toast';

interface PricingDisplayProps {
  network: string;
  onFeesLoaded?: (fees: FeeSummary | null) => void;
  showRefresh?: boolean;
  className?: string;
}

export default function PricingDisplay({ 
  network, 
  onFeesLoaded, 
  showRefresh = false,
  className = '' 
}: PricingDisplayProps) {
  const [fees, setFees] = useState<FeeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isDynamic, setIsDynamic] = useState(false);
  const { toast } = useToast();

  const loadPricingData = async () => {
    if (!network) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Check if using dynamic pricing
      const networkType = network.includes('algorand') ? 
        (network.includes('mainnet') ? 'algorand-mainnet' : 'algorand-testnet') : network;
      
      const pricingConfig = await getPricingConfig(networkType);
      const usingDynamic = !!(pricingConfig.success && pricingConfig.data);
      setIsDynamic(usingDynamic);
      
      // Load fee calculation
      if (network.startsWith('algorand')) {
        const feeSummary = await calculateTokenCreationFees(network);
        setFees(feeSummary);
        setLastUpdated(new Date());
        onFeesLoaded?.(feeSummary);
      } else {
        // For Solana or other networks
        setFees(null);
        onFeesLoaded?.(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load pricing';
      setError(errorMessage);
      console.error('Error loading pricing:', err);
      onFeesLoaded?.(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadPricingData();
    toast({
      title: "Pricing Updated",
      description: "Latest pricing information has been loaded",
      duration: 2000,
    });
  };

  useEffect(() => {
    loadPricingData();
  }, [network]);

  const isMainnet = network.includes('mainnet');
  const isAlgorand = network.startsWith('algorand');

  if (loading) {
    return (
      <Card className={`snarbles-card ${className}`}>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-6 h-6 rounded-lg" />
              <Skeleton className="h-5 w-32" />
            </div>
            <Skeleton className="h-4 w-full" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert className={`border-red-500/30 bg-red-500/10 ${className}`}>
        <Shield className="w-4 h-4" />
        <AlertDescription className="text-red-400">
          {error}
          {showRefresh && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefresh}
              className="ml-2 h-6 px-2 text-red-400 hover:text-red-300"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Retry
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (!isAlgorand) {
    return (
      <Card className={`snarbles-card-premium bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/30 ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="snarbles-subheading">Solana Network Fees</h3>
              <p className="text-sm snarbles-body">Dynamic fee calculation</p>
            </div>
          </div>
          <div className="snarbles-glass-subtle p-4 rounded-lg">
            <p className="snarbles-body text-sm">
              Solana fees are calculated dynamically during token creation based on current network conditions.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`snarbles-card-premium ${isMainnet ? 'snarbles-glow-yellow' : 'snarbles-glow-green'} ${className}`}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isMainnet ? 'snarbles-gradient-yellow' : 'snarbles-gradient-green'
            }`}>
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className={`snarbles-subheading ${isMainnet ? 'text-yellow-300' : 'text-green-300'}`}>
                {isMainnet ? 'Mainnet Creation Costs' : 'Testnet (Free)'}
              </h3>
              <div className="flex items-center gap-2">
                <p className="text-sm snarbles-body">
                  {isDynamic ? 'Dynamic Pricing' : 'Standard Pricing'}
                </p>
                {isDynamic && (
                  <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-400">
                    <Settings className="w-3 h-3 mr-1" />
                    Admin Configured
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {showRefresh && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefresh}
              className="snarbles-button-ghost"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          )}
        </div>

        {/* Fee Breakdown */}
        {isMainnet && fees ? (
          <div className="space-y-4">
            {/* Platform Fee */}
            <div className="snarbles-glass-subtle p-4 rounded-lg snarbles-border-glow">
              <div className="flex justify-between items-center mb-2">
                <span className="snarbles-body text-sm font-medium">Platform Fee</span>
                <span className="snarbles-subheading text-lg">
                  {formatFeeDisplay(fees.platformFee)} ALGO
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs snarbles-body">
                <Calculator className="w-3 h-3" />
                <span>
                  {isDynamic ? 'Admin configured amount' : 'Standard platform fee'}
                </span>
              </div>
            </div>

            {/* Network Fees */}
            <div className="snarbles-glass-subtle p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="snarbles-body text-sm font-medium">Network Fees</span>
                <span className="snarbles-subheading">
                  ~{formatFeeDisplay(fees.networkFees)} ALGO
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs snarbles-body">
                <Zap className="w-3 h-3" />
                <span>Algorand transaction fees</span>
              </div>
            </div>

            {/* Total */}
            <div className={`p-4 rounded-lg border-2 ${
              isMainnet ? 'border-yellow-500/30 bg-yellow-500/10' : 'border-green-500/30 bg-green-500/10'
            }`}>
              <div className="flex justify-between items-center">
                <span className={`font-semibold ${isMainnet ? 'text-yellow-300' : 'text-green-300'}`}>
                  Total Cost
                </span>
                <span className={`text-xl font-bold ${isMainnet ? 'text-yellow-300' : 'text-green-300'}`}>
                  {formatFeeDisplay(fees.totalFees)} ALGO
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs snarbles-body">
                <TrendingUp className="w-3 h-3" />
                <span>≈ ${(fees.feesInAlgo.totalFees * 0.35).toFixed(2)} USD (estimated)</span>
              </div>
            </div>

            {/* Dynamic Pricing Indicator */}
            {isDynamic && (
              <div className="snarbles-glass-subtle p-3 rounded-lg border border-blue-500/30">
                <div className="flex items-center gap-2 mb-1">
                  <Settings className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-blue-400">Dynamic Pricing Active</span>
                </div>
                <p className="text-xs snarbles-body">
                  Pricing is configured through the admin panel and can be updated in real-time.
                </p>
              </div>
            )}

            {/* Last Updated */}
            {lastUpdated && (
              <div className="flex items-center gap-2 text-xs snarbles-body pt-2 border-t border-gray-700">
                <Clock className="w-3 h-3" />
                <span>Updated {lastUpdated.toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        ) : !isMainnet ? (
          <div className="space-y-4">
            <div className="snarbles-glass-subtle p-6 rounded-lg snarbles-glow-green text-center">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-green-400" />
              </div>
              <h4 className="snarbles-subheading text-green-300 mb-2">Free Token Creation</h4>
              <p className="snarbles-body text-sm">
                Perfect for testing! No fees required on the Algorand testnet.
              </p>
            </div>
            
            <div className="snarbles-glass-subtle p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="snarbles-body font-medium">Total Cost</span>
                <span className="text-2xl font-bold text-green-300">FREE</span>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
} 