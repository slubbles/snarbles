'use client';

import { useState, useCallback, useEffect } from 'react';
import { metadataService, type UnifiedMetadataUpdateParams, type UnifiedAuthorityOperation } from '@/lib/metadata-service';
import { useDashboardWebSocket, type MetadataUpdateData, type AuthorityUpdateData } from '@/lib/websocket-client';
import { useToast } from '@/hooks/use-toast';

export interface UseMetadataManagerOptions {
  tokenId: string;
  network: 'algorand' | 'solana';
  walletAddress?: string;
  autoSubscribe?: boolean;
}

export interface MetadataState {
  isLoading: boolean;
  isUpdating: boolean;
  hasError: boolean;
  error: string | null;
  lastUpdate: Date | null;
  authorityInfo: any | null;
  history: any[] | null;
}

export function useMetadataManager(options: UseMetadataManagerOptions) {
  const { tokenId, network, walletAddress, autoSubscribe = true } = options;
  const { toast } = useToast();
  const { metadataUpdates, authorityUpdates, subscribeToMetadata, subscribeToAuthority } = useDashboardWebSocket(walletAddress);

  const [state, setState] = useState<MetadataState>({
    isLoading: false,
    isUpdating: false,
    hasError: false,
    error: null,
    lastUpdate: null,
    authorityInfo: null,
    history: null
  });

  // Subscribe to real-time updates
  useEffect(() => {
    if (autoSubscribe && tokenId && network) {
      subscribeToMetadata(`${network}:${tokenId}`);
      subscribeToAuthority(`${network}:${tokenId}`);
      
      // Load initial data
      loadAuthorityInfo();
      loadHistory();
    }
  }, [tokenId, network, autoSubscribe]);

  // Handle real-time metadata updates
  useEffect(() => {
    const relevantUpdates = metadataUpdates.filter((update: MetadataUpdateData) => 
      update.tokenId === tokenId
    );
    
    if (relevantUpdates.length > 0) {
      const latestUpdate = relevantUpdates[0];
      setState(prev => ({
        ...prev,
        lastUpdate: new Date(),
        isUpdating: latestUpdate.status === 'pending'
      }));
      
      if (latestUpdate.status === 'confirmed') {
        toast({
          title: "Metadata Updated",
          description: "Token metadata has been successfully updated",
        });
        loadHistory(); // Refresh history
      } else if (latestUpdate.status === 'failed') {
        toast({
          title: "Update Failed",
          description: "Failed to update metadata",
          variant: "destructive"
        });
      }
    }
  }, [metadataUpdates, tokenId]);

  // Handle real-time authority updates
  useEffect(() => {
    const relevantUpdates = authorityUpdates.filter((update: AuthorityUpdateData) => 
      update.tokenId === tokenId
    );
    
    if (relevantUpdates.length > 0) {
      const latestUpdate = relevantUpdates[0];
      
      if (latestUpdate.status === 'confirmed') {
        toast({
          title: "Authority Updated",
          description: `Successfully ${latestUpdate.operation} authority`,
        });
        loadAuthorityInfo(); // Refresh authority info
      } else if (latestUpdate.status === 'failed') {
        toast({
          title: "Authority Update Failed",
          description: "Failed to update authority",
          variant: "destructive"
        });
      }
    }
  }, [authorityUpdates, tokenId]);

  // Load authority information
  const loadAuthorityInfo = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, hasError: false, error: null }));
    
    try {
      const result = await metadataService.getAuthorityInfo(tokenId, network);
      
      if (result.success) {
        setState(prev => ({
          ...prev,
          authorityInfo: result.data,
          isLoading: false
        }));
      } else {
        throw new Error(result.error || 'Failed to load authority info');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        hasError: true,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, [tokenId, network]);

  // Load metadata history
  const loadHistory = useCallback(async () => {
    try {
      const result = await metadataService.getMetadataHistory(tokenId, network);
      
      if (result.success) {
        setState(prev => ({
          ...prev,
          history: result.data || []
        }));
      }
    } catch (error) {
      console.error('Failed to load metadata history:', error);
    }
  }, [tokenId, network]);

  // Update metadata
  const updateMetadata = useCallback(async (
    metadata: UnifiedMetadataUpdateParams['metadata'],
    signTransaction: (txn: any) => Promise<any>
  ): Promise<{ success: boolean; error?: string }> => {
    if (!walletAddress) {
      return { success: false, error: 'Wallet not connected' };
    }

    setState(prev => ({ ...prev, isUpdating: true, hasError: false, error: null }));

    try {
      // Validate metadata before update
      const validation = metadataService.validateMetadata(metadata, network);
      
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Show warnings if any
      if (validation.warnings.length > 0) {
        toast({
          title: "Validation Warnings",
          description: validation.warnings.join(', '),
          variant: "default"
        });
      }

      const params: UnifiedMetadataUpdateParams = {
        tokenId,
        network,
        metadata,
        walletAddress,
        signTransaction
      };

      const result = await metadataService.updateMetadata(params);

      setState(prev => ({ 
        ...prev, 
        isUpdating: false,
        lastUpdate: result.success ? new Date() : prev.lastUpdate
      }));

      if (!result.success) {
        throw new Error(result.error || 'Update failed');
      }

      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setState(prev => ({
        ...prev,
        isUpdating: false,
        hasError: true,
        error: errorMessage
      }));

      return { success: false, error: errorMessage };
    }
  }, [tokenId, network, walletAddress]);

  // Update authority
  const updateAuthority = useCallback(async (
    operation: string,
    params: { targetAddress?: string; permissions?: string[] },
    signTransaction: (txn: any) => Promise<any>
  ): Promise<{ success: boolean; error?: string }> => {
    if (!walletAddress) {
      return { success: false, error: 'Wallet not connected' };
    }

    setState(prev => ({ ...prev, isUpdating: true, hasError: false, error: null }));

    try {
      const authorityParams: UnifiedAuthorityOperation = {
        tokenId,
        network,
        operation,
        targetAddress: params.targetAddress,
        permissions: params.permissions,
        walletAddress,
        signTransaction
      };

      const result = await metadataService.updateAuthority(authorityParams);

      setState(prev => ({ 
        ...prev, 
        isUpdating: false,
        lastUpdate: result.success ? new Date() : prev.lastUpdate
      }));

      if (!result.success) {
        throw new Error(result.error || 'Authority update failed');
      }

      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setState(prev => ({
        ...prev,
        isUpdating: false,
        hasError: true,
        error: errorMessage
      }));

      return { success: false, error: errorMessage };
    }
  }, [tokenId, network, walletAddress]);

  // Estimate transaction cost
  const estimateCost = useCallback(async (
    operation: 'update_metadata' | 'transfer_authority' | 'revoke_authority'
  ): Promise<{ success: boolean; cost?: number; currency?: string; error?: string }> => {
    return await metadataService.estimateTransactionCost(operation, network);
  }, [network]);

  // Refresh all data
  const refresh = useCallback(async () => {
    await Promise.all([
      loadAuthorityInfo(),
      loadHistory()
    ]);
  }, [loadAuthorityInfo, loadHistory]);

  return {
    // State
    ...state,
    
    // Actions
    updateMetadata,
    updateAuthority,
    loadAuthorityInfo,
    loadHistory,
    refresh,
    estimateCost,
    
    // Utilities
    validateMetadata: useCallback((metadata: any) => 
      metadataService.validateMetadata(metadata, network), [network]
    ),
    
    // Real-time data
    realtimeUpdates: {
      metadata: metadataUpdates.filter((update: MetadataUpdateData) => update.tokenId === tokenId),
      authority: authorityUpdates.filter((update: AuthorityUpdateData) => update.tokenId === tokenId)
    }
  };
}

// Hook for managing multiple tokens
export function useMultiTokenMetadata(tokens: Array<{ tokenId: string; network: 'algorand' | 'solana' }>) {
  const [tokenStates, setTokenStates] = useState<Record<string, MetadataState>>({});
  
  // Initialize states for all tokens
  useEffect(() => {
    const initialStates: Record<string, MetadataState> = {};
    tokens.forEach(token => {
      const key = `${token.network}:${token.tokenId}`;
      if (!tokenStates[key]) {
        initialStates[key] = {
          isLoading: false,
          isUpdating: false,
          hasError: false,
          error: null,
          lastUpdate: null,
          authorityInfo: null,
          history: null
        };
      }
    });
    
    if (Object.keys(initialStates).length > 0) {
      setTokenStates(prev => ({ ...prev, ...initialStates }));
    }
  }, [tokens]);

  // Load authority info for all tokens
  const loadAllAuthorityInfo = useCallback(async () => {
    const promises = tokens.map(async token => {
      const key = `${token.network}:${token.tokenId}`;
      
      try {
        const result = await metadataService.getAuthorityInfo(token.tokenId, token.network);
        
        setTokenStates(prev => ({
          ...prev,
          [key]: {
            ...prev[key],
            authorityInfo: result.data,
            isLoading: false,
            hasError: !result.success,
            error: result.error || null
          }
        }));
      } catch (error) {
        setTokenStates(prev => ({
          ...prev,
          [key]: {
            ...prev[key],
            isLoading: false,
            hasError: true,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }));
      }
    });

    await Promise.all(promises);
  }, [tokens]);

  return {
    tokenStates,
    loadAllAuthorityInfo,
    getTokenState: (tokenId: string, network: 'algorand' | 'solana') => 
      tokenStates[`${network}:${tokenId}`] || null
  };
}
