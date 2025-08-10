'use client';

import { useState, useEffect, useCallback } from 'react';
import { TokenAssetTable } from '@/components/dashboard/tokens/TokenAssetTable';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface UserToken {
  id: string;
  name: string;
  symbol: string;
  network: 'algorand' | 'solana';
  icon?: string;
  totalSupply: number;
  circulatingSupply: number;
  holders: number;
  price: number;
  marketCap: number;
  change24h: number;
  volume24h: number;
  status: 'active' | 'paused' | 'frozen';
  decimals: number;
  contractAddress: string;
  createdAt: Date;
  lastActivity: Date;
  canManage: boolean;
  canFreeze: boolean;
  canBurn: boolean;
}

interface TokenManagementPageProps {
  network: 'algorand' | 'solana';
  walletAddress?: string;
}

export default function TokenManagementPage({ network, walletAddress }: TokenManagementPageProps) {
  const [tokens, setTokens] = useState<UserToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  // Use useCallback to create a stable reference for the loading function
  const loadUserTokens = useCallback(async (showRefreshToast = false) => {
    const refreshing = showRefreshToast;
    if (refreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    
    try {
      if (!walletAddress) {
        setTokens([]);
        if (refreshing) setIsRefreshing(false);
        else setIsLoading(false);
        return;
      }

      // Get user's created tokens from Supabase
      const { data: dbTokens, error } = await supabase
        .from('token_creation_history')
        .select(`
          id,
          token_name,
          token_symbol,
          network,
          contract_address,
          created_at,
          description,
          total_supply,
          decimals,
          logo_url,
          website,
          github,
          twitter,
          transaction_hash,
          mintable,
          burnable,
          pausable
        `)
        .eq('wallet_address', walletAddress)
        .eq('network', network === 'algorand' ? 'algorand-mainnet' : 'solana-devnet')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tokens from Supabase:', error);
        toast({
          title: "Error Loading Tokens",
          description: "Failed to load your tokens from database. Please try again.",
          variant: "destructive",
        });
        setTokens([]);
        return;
      }

      // Transform Supabase data to UserToken format
      const userTokens: UserToken[] = (dbTokens || []).map(token => ({
        id: token.id,
        name: token.token_name,
        symbol: token.token_symbol,
        network: network,
        icon: token.logo_url || undefined,
        totalSupply: Number(token.total_supply || 0),
        circulatingSupply: Number(token.total_supply || 0), // Same as total for now
        holders: 1, // Start with 1 (creator), can be enhanced later with blockchain data
        price: 0, // No external price APIs yet - will show as $0.00
        marketCap: 0, // Will be 0 until we have price data
        change24h: 0, // No price history yet
        volume24h: 0, // No trading data yet
        status: 'active' as const, // Assume active until we can check blockchain status
        decimals: Number(token.decimals || 6),
        contractAddress: token.contract_address,
        createdAt: new Date(token.created_at),
        lastActivity: new Date(token.created_at), // Use creation date as last activity for now
        canManage: true, // User created it, so they can manage
        canFreeze: Boolean(token.pausable), // Based on token features
        canBurn: Boolean(token.burnable) // Based on token features
      }));

      setTokens(userTokens);
      
      if (userTokens.length === 0) {
        toast({
          title: "No Tokens Found",
          description: `You haven't created any tokens on ${network === 'algorand' ? 'Algorand' : 'Solana'} yet.`,
        });
      }

    } catch (error) {
      console.error('Error loading tokens:', error);
      toast({
        title: "Error Loading Tokens",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setTokens([]);
    } finally {
      if (refreshing) {
        setIsRefreshing(false);
        if (showRefreshToast) {
          toast({
            title: "Tokens Refreshed",
            description: "Your token list has been updated.",
          });
        }
      } else {
        setIsLoading(false);
      }
    }
  }, [network, walletAddress, toast]);

  // Manual refresh function
  const handleManualRefresh = () => {
    loadUserTokens(true);
  };

  // Set up automatic refresh on component mount and dependency changes
  useEffect(() => {
    loadUserTokens();
  }, [loadUserTokens]);

  // Set up page focus refresh (Option 1)
  useEffect(() => {
    const handleFocus = () => {
      if (!document.hidden && walletAddress) {
        console.log('Page focused - refreshing tokens...');
        loadUserTokens();
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && walletAddress) {
        console.log('Page visible - refreshing tokens...');
        loadUserTokens();
      }
    };

    // Listen for focus and visibility changes
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [walletAddress, loadUserTokens]);

  const handleTokenAction = async (action: string, token: UserToken) => {
    toast({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Token`,
      description: `${action.charAt(0).toUpperCase() + action.slice(1)} action for ${token.symbol} token`,
      duration: 3000,
    });

    // Handle different actions
    switch (action) {
      case 'view':
        // Navigate to token details
        break;
      case 'analytics':
        // Navigate to token analytics
        break;
      case 'transfer':
        // Open transfer modal
        break;
      case 'manage':
        // Open management modal
        break;
      case 'freeze':
        // Handle freeze/unfreeze
        break;
      case 'burn':
        // Open burn modal
        break;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Token Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage your created tokens on the {network === 'algorand' ? 'Algorand' : 'Solana'} network
          </p>
        </div>
        
        {/* Manual Refresh Button (Option 2) */}
        <Button 
          onClick={handleManualRefresh}
          disabled={isLoading || isRefreshing}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      <TokenAssetTable
        network={network}
        tokens={tokens}
        isLoading={isLoading}
        onRefresh={loadUserTokens}
        onTokenAction={handleTokenAction}
      />
    </div>
  );
}
