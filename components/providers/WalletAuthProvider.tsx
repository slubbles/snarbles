'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAlgorandWallet } from './AlgorandWalletProvider';
import { supabase, isSupabaseAvailable } from '@/lib/supabase-client';
import { trackEvent } from '@/lib/analytics';

// Types
export type WalletType = 'solana' | 'algorand';
export type NetworkType = 'mainnet' | 'testnet' | 'devnet';

export interface WalletUser {
  walletAddress: string;
  walletType: WalletType;
  network: NetworkType;
  creditsBalance: number;
  totalTokensCreated: number;
  createdAt: string;
  lastConnected: string;
}

interface WalletAuthContextType {
  // Auth State
  isAuthenticated: boolean;
  user: WalletUser | null;
  isLoading: boolean;
  error: string | null;
  
  // Wallet Info
  walletAddress: string | null;
  walletType: WalletType | null;
  network: NetworkType;
  
  // Auth Actions
  connectWallet: (type: WalletType) => Promise<{ success: boolean; error?: string }>;
  disconnectWallet: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  switchNetwork: (network: NetworkType) => Promise<void>;
  
  // Profile Actions
  getCreditsBalance: () => Promise<number>;
  updateCreditsBalance: (amount: number) => Promise<{ success: boolean; error?: string }>;
}

const WalletAuthContext = createContext<WalletAuthContextType | undefined>(undefined);

export function WalletAuthProvider({ children }: { children: ReactNode }) {
  // State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<WalletUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<WalletType | null>(null);
  const [network, setNetwork] = useState<NetworkType>('testnet');

  // Wallet adapters
  const solanaWallet = useWallet();
  const algorandWallet = useAlgorandWallet();

  // Auto-detect wallet connection changes
  useEffect(() => {
    const checkWalletConnection = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Check Solana wallet
        if (solanaWallet.connected && solanaWallet.publicKey) {
          const address = solanaWallet.publicKey.toString();
          await handleWalletConnection(address, 'solana', 'devnet'); // Solana uses devnet
          return;
        }

        // Check Algorand wallet
        if (algorandWallet.connected && algorandWallet.address) {
          const networkMap: Record<string, NetworkType> = {
            'algorand-mainnet': 'mainnet',
            'algorand-testnet': 'testnet'
          };
          const detectedNetwork = networkMap[algorandWallet.selectedNetwork] || 'testnet';
          await handleWalletConnection(algorandWallet.address, 'algorand', detectedNetwork);
          return;
        }

        // No wallet connected
        await handleWalletDisconnection();
      } catch (err) {
        console.error('Error checking wallet connection:', err);
        setError(err instanceof Error ? err.message : 'Failed to check wallet connection');
      } finally {
        setIsLoading(false);
      }
    };

    checkWalletConnection();
  }, [
    solanaWallet.connected, 
    solanaWallet.publicKey, 
    algorandWallet.connected, 
    algorandWallet.address,
    algorandWallet.selectedNetwork
  ]);

  // Handle wallet connection
  const handleWalletConnection = async (address: string, type: WalletType, detectedNetwork: NetworkType) => {
    try {
      setWalletAddress(address);
      setWalletType(type);
      setNetwork(detectedNetwork);

      // Get or create user profile (always returns a profile now)
      const profile = await getOrCreateUserProfile(address, type, detectedNetwork);
      
      if (profile) {
        setUser(profile);
        setIsAuthenticated(true);
        
        // Update last connected timestamp (non-blocking)
        updateLastConnected(address).catch(err => 
          console.warn('Could not update last connected timestamp:', err)
        );
        
        // Track wallet connection analytics (non-blocking)
        trackEvent(
          'wallet_connection',
          {
            walletType: type,
            networkType: detectedNetwork,
            network: detectedNetwork === 'mainnet' ? 
              (type === 'solana' ? 'solana' : 'algorand') : 
              (type === 'solana' ? 'solana-devnet' : 'algorand-testnet'),
            timestamp: new Date().toISOString()
          },
          address
        ).catch(err => console.warn('Could not track wallet connection:', err));
        
        console.log(`✅ Wallet authenticated: ${type} (${address.slice(0, 8)}...)`);
      } else {
        // This should never happen now, but just in case
        console.error('❌ Failed to create user profile');
        setIsAuthenticated(false);
        setError('Failed to authenticate wallet');
      }
    } catch (err) {
      console.error('Error handling wallet connection:', err);
      setError(err instanceof Error ? err.message : 'Failed to authenticate wallet');
      setIsAuthenticated(false);
    }
  };

  // Handle wallet disconnection
  const handleWalletDisconnection = async () => {
    setIsAuthenticated(false);
    setUser(null);
    setWalletAddress(null);
    setWalletType(null);
    setError(null);
    console.log('🔌 Wallet disconnected');
  };

  // Get or create user profile in database
  const getOrCreateUserProfile = async (
    address: string, 
    type: WalletType, 
    networkType: NetworkType
  ): Promise<WalletUser | null> => {
    // Always create a local profile as fallback
    const createLocalProfile = () => ({
      walletAddress: address,
      walletType: type,
      network: networkType,
      creditsBalance: 10, // Default credits for testing
      totalTokensCreated: 0,
      createdAt: new Date().toISOString(),
      lastConnected: new Date().toISOString()
    });

    if (!isSupabaseAvailable()) {
      console.log('📋 Creating local profile (Supabase not available)');
      return createLocalProfile();
    }

    try {
      // Check if profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('wallet_address', address)
        .single();

      if (existingProfile && !fetchError) {
        console.log('✅ Found existing profile in database');
        // Profile exists, return it
        return {
          walletAddress: existingProfile.wallet_address,
          walletType: existingProfile.wallet_type,
          network: existingProfile.network,
          creditsBalance: existingProfile.credits_balance || 0,
          totalTokensCreated: existingProfile.total_tokens_created || 0,
          createdAt: existingProfile.created_at,
          lastConnected: existingProfile.updated_at
        };
      }

      // Profile doesn't exist, try to create new one
      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert([{
          wallet_address: address,
          wallet_type: type,
          network: networkType,
          credits_balance: 10, // Default credits
          total_tokens_created: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (createError) {
        console.warn('⚠️ Database profile creation failed, using local profile:', createError);
        return createLocalProfile();
      }

      console.log(`🆕 Created new profile in database for ${type} wallet: ${address.slice(0, 8)}...`);
      
      return {
        walletAddress: newProfile.wallet_address,
        walletType: newProfile.wallet_type,
        network: newProfile.network,
        creditsBalance: newProfile.credits_balance || 0,
        totalTokensCreated: newProfile.total_tokens_created || 0,
        createdAt: newProfile.created_at,
        lastConnected: newProfile.updated_at
      };

    } catch (err) {
      console.warn('⚠️ Database error, falling back to local profile:', err);
      return createLocalProfile();
    }
  };

  // Update last connected timestamp
  const updateLastConnected = async (address: string) => {
    if (!isSupabaseAvailable()) return;

    try {
      await supabase
        .from('user_profiles')
        .update({ updated_at: new Date().toISOString() })
        .eq('wallet_address', address);
    } catch (err) {
      console.error('Error updating last connected:', err);
    }
  };

  // Manual wallet connection
  const connectWallet = async (type: WalletType): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);

    try {
      if (type === 'solana') {
        if (!solanaWallet.connect) {
          throw new Error('Solana wallet not available');
        }
        await solanaWallet.connect();
      } else if (type === 'algorand') {
        await algorandWallet.connect();
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Manual wallet disconnection
  const disconnectWallet = async () => {
    setIsLoading(true);

    try {
      if (walletType === 'solana' && solanaWallet.disconnect) {
        await solanaWallet.disconnect();
      } else if (walletType === 'algorand') {
        await algorandWallet.disconnect();
      }

      await handleWalletDisconnection();
    } catch (err) {
      console.error('Error disconnecting wallet:', err);
      setError(err instanceof Error ? err.message : 'Failed to disconnect wallet');
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh user profile
  const refreshProfile = async () => {
    if (!walletAddress || !walletType) return;

    setIsLoading(true);
    try {
      const profile = await getOrCreateUserProfile(walletAddress, walletType, network);
      if (profile) {
        setUser(profile);
      }
    } catch (err) {
      console.error('Error refreshing profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh profile');
    } finally {
      setIsLoading(false);
    }
  };

  // Switch network
  const switchNetwork = async (newNetwork: NetworkType) => {
    if (!walletAddress || !isSupabaseAvailable()) {
      setNetwork(newNetwork);
      return;
    }

    try {
      await supabase
        .from('user_profiles')
        .update({ network: newNetwork, updated_at: new Date().toISOString() })
        .eq('wallet_address', walletAddress);

      setNetwork(newNetwork);
      if (user) {
        setUser({ ...user, network: newNetwork });
      }
    } catch (err) {
      console.error('Error switching network:', err);
      setError(err instanceof Error ? err.message : 'Failed to switch network');
    }
  };

  // Get credits balance
  const getCreditsBalance = async (): Promise<number> => {
    if (!walletAddress || !isSupabaseAvailable()) {
      console.log('📋 Using local/demo credits (Supabase not available)');
      return user?.creditsBalance || 10;
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('credits_balance')
        .eq('wallet_address', walletAddress)
        .single();

      if (error) {
        console.warn('⚠️ Database error, using demo credits:', error);
        return user?.creditsBalance || 10;
      }
      return data?.credits_balance || 0;
    } catch (err) {
      console.error('Error getting credits balance, using demo credits:', err);
      return user?.creditsBalance || 10;
    }
  };

  // Update credits balance
  const updateCreditsBalance = async (amount: number): Promise<{ success: boolean; error?: string }> => {
    if (!walletAddress || !isSupabaseAvailable()) {
      // Update local state
      if (user) {
        setUser({ ...user, creditsBalance: amount });
      }
      return { success: true };
    }

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          credits_balance: amount, 
          updated_at: new Date().toISOString() 
        })
        .eq('wallet_address', walletAddress);

      if (error) throw error;

      // Update local state
      if (user) {
        setUser({ ...user, creditsBalance: amount });
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update credits';
      return { success: false, error: errorMessage };
    }
  };

  const value: WalletAuthContextType = {
    // Auth State
    isAuthenticated,
    user,
    isLoading,
    error,
    
    // Wallet Info
    walletAddress,
    walletType,
    network,
    
    // Auth Actions
    connectWallet,
    disconnectWallet,
    refreshProfile,
    switchNetwork,
    
    // Profile Actions
    getCreditsBalance,
    updateCreditsBalance,
  };

  return (
    <WalletAuthContext.Provider value={value}>
      {children}
    </WalletAuthContext.Provider>
  );
}

export const useWalletAuth = () => {
  const context = useContext(WalletAuthContext);
  if (context === undefined) {
    throw new Error('useWalletAuth must be used within a WalletAuthProvider');
  }
  return context;
}; 