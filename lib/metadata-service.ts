import { 
  updateAlgorandMetadataReal, 
  updateAlgorandAuthority, 
  getAlgorandAuthorityInfo,
  getAlgorandMetadataHistory,
  type AlgorandMetadataUpdateParams,
  type AlgorandAuthorityOperation 
} from './algorand-metadata';

import { 
  updateSolanaMetadata as updateSolanaMetadataReal, 
  updateSolanaAuthority, 
  fetchSolanaMetadata as getSolanaAuthorityInfo,
  getMetadataHistory as getSolanaMetadataHistory,
} from './solana-metadata-simplified';

// Define simplified types for compatibility
type SolanaMetadataUpdateParams = {
  mintAddress: string;
  metadata: any;
  walletAddress: string;
  signTransaction: (txn: any) => Promise<any>;
};

type SolanaAuthorityOperation = {
  mintAddress: string;
  newAuthority: string;
  authorityType: string;
  walletAddress: string;
  signTransaction: (txn: any) => Promise<any>;
};

import { getDashboardWebSocket } from './websocket-client';

export interface MetadataUpdateRequest {
  tokenId: string;
  network: 'algorand' | 'solana';
  metadata: any;
  walletAddress: string;
  signTransaction: (txn: any) => Promise<any>;
}

export interface AuthorityUpdateRequest {
  tokenId: string;
  network: 'algorand' | 'solana';
  operation: 'transfer' | 'delegate' | 'revoke';
  targetAddress: string;
  walletAddress: string;
  signTransaction: (txn: any) => Promise<any>;
}

export interface MetadataValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface MetadataHistoryEntry {
  timestamp: string;
  operation: string;
  metadata: any;
  transactionHash: string;
  updatedBy: string;
}

export interface UnifiedMetadataUpdateParams {
  tokenId: string;
  network: 'algorand' | 'solana';
  metadata: {
    name?: string;
    symbol?: string;
    description?: string;
    image?: string;
    external_url?: string;
    animation_url?: string;
    background_color?: string;
    attributes?: Array<{
      trait_type: string;
      value: string | number;
      display_type?: string;
    }>;
    properties?: {
      category?: string;
      tags?: string[];
      website?: string;
      social?: {
        twitter?: string;
        discord?: string;
        telegram?: string;
      };
      files?: Array<{
        uri: string;
        type: string;
      }>;
    };
    seller_fee_basis_points?: number;
    creators?: Array<{
      address: string;
      verified: boolean;
      share: number;
    }>;
  };
  walletAddress: string;
  signTransaction: (txn: any) => Promise<any>;
}

export interface UnifiedAuthorityOperation {
  tokenId: string;
  network: 'algorand' | 'solana';
  operation: string;
  targetAddress?: string;
  permissions?: string[];
  walletAddress: string;
  signTransaction: (txn: any) => Promise<any>;
}

/**
 * Unified metadata service that handles both Algorand and Solana networks
 */
export class MetadataService {
  private static instance: MetadataService;
  private wsClient = getDashboardWebSocket();

  static getInstance(): MetadataService {
    if (!MetadataService.instance) {
      MetadataService.instance = new MetadataService();
    }
    return MetadataService.instance;
  }

  /**
   * Update token metadata across networks
   */
  async updateMetadata(params: UnifiedMetadataUpdateParams): Promise<{
    success: boolean;
    transactionHash?: string;
    metadataUrl?: string;
    error?: string;
  }> {
    const { network, tokenId } = params;
    
    try {
      console.log(`🚀 Starting unified metadata update for ${tokenId} on ${network}`);
      
      if (network === 'algorand') {
        const algorandParams: AlgorandMetadataUpdateParams = {
          assetId: parseInt(tokenId),
          metadata: params.metadata,
          network: 'algorand-testnet', // Default to testnet, should be configurable
          walletAddress: params.walletAddress,
          signTransaction: params.signTransaction
        };
        
        return await updateAlgorandMetadataReal(algorandParams);
        
      } else if (network === 'solana') {
        const solanaParams = {
          mintAddress: tokenId,
          metadata: params.metadata,
          walletAddress: params.walletAddress,
          signTransaction: params.signTransaction
        };
        
        return await updateSolanaMetadataReal(solanaParams);
        
      } else {
        throw new Error(`Unsupported network: ${network}`);
      }
      
    } catch (error) {
      console.error(`❌ Unified metadata update failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Update token authorities across networks
   */
  async updateAuthority(params: UnifiedAuthorityOperation): Promise<{
    success: boolean;
    transactionHash?: string;
    error?: string;
  }> {
    const { network, tokenId, operation } = params;
    
    try {
      console.log(`🔐 Starting unified authority ${operation} for ${tokenId} on ${network}`);
      
      if (network === 'algorand') {
        const algorandParams: AlgorandAuthorityOperation = {
          assetId: parseInt(tokenId),
          operation: operation as any,
          targetAddress: params.targetAddress,
          network: 'algorand-testnet',
          walletAddress: params.walletAddress,
          signTransaction: params.signTransaction
        };
        
        return await updateAlgorandAuthority(algorandParams);
        
      } else if (network === 'solana') {
        const solanaParams = {
          mintAddress: tokenId,
          newAuthority: params.targetAddress || '',
          authorityType: operation as 'mint' | 'freeze' | 'metadata',
          walletAddress: params.walletAddress,
          signTransaction: params.signTransaction
        };
        
        return await updateSolanaAuthority(solanaParams);
        
      } else {
        throw new Error(`Unsupported network: ${network}`);
      }
      
    } catch (error) {
      console.error(`❌ Unified authority update failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get authority information across networks
   */
  async getAuthorityInfo(tokenId: string, network: 'algorand' | 'solana'): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      if (network === 'algorand') {
        return await getAlgorandAuthorityInfo(parseInt(tokenId), 'algorand-testnet');
      } else if (network === 'solana') {
        const authorityResult = await getSolanaAuthorityInfo(tokenId);
        return authorityResult;
      } else {
        throw new Error(`Unsupported network: ${network}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get authority info'
      };
    }
  }

  /**
   * Get metadata history across networks
   */
  async getMetadataHistory(tokenId: string, network: 'algorand' | 'solana'): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> {
    try {
      if (network === 'algorand') {
        return await getAlgorandMetadataHistory(parseInt(tokenId), 'algorand-testnet');
      } else if (network === 'solana') {
        const historyResult = await getSolanaMetadataHistory(tokenId);
        return {
          success: true,
          data: historyResult
        };
      } else {
        throw new Error(`Unsupported network: ${network}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get metadata history'
      };
    }
  }

  /**
   * Subscribe to metadata updates for a token
   */
  subscribeToUpdates(tokenId: string, network: 'algorand' | 'solana'): void {
    if (this.wsClient.connected) {
      this.wsClient.subscribeToMetadataUpdates(`${network}:${tokenId}`);
      this.wsClient.subscribeToAuthorityUpdates(`${network}:${tokenId}`);
    }
  }

  /**
   * Unsubscribe from metadata updates for a token
   */
  unsubscribeFromUpdates(tokenId: string, network: 'algorand' | 'solana'): void {
    if (this.wsClient.connected) {
      this.wsClient.unsubscribeFromMetadataUpdates(`${network}:${tokenId}`);
      this.wsClient.unsubscribeFromAuthorityUpdates(`${network}:${tokenId}`);
    }
  }

  /**
   * Validate metadata before update
   */
  validateMetadata(metadata: any, network: 'algorand' | 'solana'): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Common validations
    if (!metadata.name || metadata.name.trim().length === 0) {
      errors.push('Name is required');
    }

    if (metadata.name && metadata.name.length > 32) {
      if (network === 'algorand') {
        errors.push('Name must be 32 characters or less for Algorand');
      } else {
        warnings.push('Long names may be truncated in some wallets');
      }
    }

    if (metadata.symbol && metadata.symbol.length > 8) {
      warnings.push('Symbol should be 8 characters or less');
    }

    if (metadata.description && metadata.description.length > 1000) {
      warnings.push('Description is very long and may not display properly');
    }

    if (metadata.image && !isValidUrl(metadata.image)) {
      errors.push('Image must be a valid URL');
    }

    if (metadata.external_url && !isValidUrl(metadata.external_url)) {
      errors.push('External URL must be a valid URL');
    }

    // Network-specific validations
    if (network === 'algorand') {
      if (metadata.attributes && metadata.attributes.length > 16) {
        warnings.push('Too many attributes may cause display issues');
      }
    }

    if (network === 'solana') {
      if (metadata.seller_fee_basis_points !== undefined) {
        if (metadata.seller_fee_basis_points < 0 || metadata.seller_fee_basis_points > 10000) {
          errors.push('Seller fee must be between 0 and 10000 basis points (0-100%)');
        }
      }

      if (metadata.creators) {
        const totalShare = metadata.creators.reduce((sum: number, creator: any) => sum + creator.share, 0);
        if (totalShare !== 100) {
          errors.push('Creator shares must total 100%');
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Estimate transaction costs for metadata operations
   */
  async estimateTransactionCost(
    operation: 'update_metadata' | 'transfer_authority' | 'revoke_authority',
    network: 'algorand' | 'solana'
  ): Promise<{
    success: boolean;
    cost?: number;
    currency?: string;
    error?: string;
  }> {
    try {
      // Estimated costs (would be calculated from real network data)
      const costs = {
        algorand: {
          update_metadata: 0.001, // ALGO
          transfer_authority: 0.001,
          revoke_authority: 0.001
        },
        solana: {
          update_metadata: 0.0015, // SOL
          transfer_authority: 0.001,
          revoke_authority: 0.001
        }
      };

      const cost = costs[network][operation];
      const currency = network === 'algorand' ? 'ALGO' : 'SOL';

      return {
        success: true,
        cost,
        currency
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to estimate cost'
      };
    }
  }
}

// Helper functions
function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// Export singleton instance
export const metadataService = MetadataService.getInstance();
