import * as algosdk from 'algosdk';
import { supabaseHelpers } from '@/lib/supabase';
import { getAlgorandClient, getAlgorandNetwork, waitForConfirmationWithRetry, getAlgorandAssetInfo } from './algorand';
import { getDashboardWebSocket } from './websocket-client';

export interface AlgorandMetadataUpdateParams {
  assetId: number;
  metadata: {
    name?: string;
    description?: string;
    image?: string;
    external_url?: string;
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
    };
  };
  network: string;
  walletAddress: string;
  signTransaction: (txn: any) => Promise<Uint8Array>;
}

export interface AlgorandAuthorityOperation {
  assetId: number;
  operation: 'transfer' | 'freeze' | 'clawback' | 'revoke';
  targetAddress?: string;
  network: string;
  walletAddress: string;
  signTransaction: (txn: any) => Promise<Uint8Array>;
}

export interface MetadataHistory {
  version: number;
  timestamp: Date;
  updatedBy: string;
  transactionHash: string;
  blockNumber?: number;
  changes: Array<{
    field: string;
    oldValue: any;
    newValue: any;
    changeType: 'added' | 'modified' | 'removed';
  }>;
  metadataSnapshot: any;
  status: 'confirmed' | 'pending' | 'failed';
}

/**
 * Enhanced Algorand metadata update with real blockchain integration
 */
export async function updateAlgorandMetadataReal(params: AlgorandMetadataUpdateParams): Promise<{
  success: boolean;
  transactionHash?: string;
  metadataUrl?: string;
  error?: string;
}> {
  const { assetId, metadata, network, walletAddress, signTransaction } = params;
  
  try {
    console.log(`🔧 Starting real metadata update for asset ${assetId} on ${network}`);
    
    const algodClient = getAlgorandClient(network);
    const wsClient = getDashboardWebSocket();
    
    // Get current asset information and validate permissions
    const assetInfo = await getAlgorandAssetInfo(assetId, network);
    if (!assetInfo.success || !assetInfo.data) {
      throw new Error('Asset not found or inaccessible');
    }
    
    const currentAsset = assetInfo.data;
    
    // Validate manager authority
    if (currentAsset.manager !== walletAddress) {
      throw new Error('Only the asset manager can update metadata');
    }
    
    // Get current metadata to calculate changes
    let currentMetadata = {};
    if (currentAsset.url) {
      try {
        const response = await fetch(currentAsset.url);
        if (response.ok) {
          currentMetadata = await response.json();
        }
      } catch (error) {
        console.warn('Could not fetch current metadata for comparison');
      }
    }
    
    // Calculate changes for history tracking
    const changes = calculateMetadataChanges(currentMetadata, metadata);
    
    // Prepare ARC-3 compliant metadata
    const arc3Metadata = {
      name: metadata.name || currentAsset.assetName || '',
      description: metadata.description || '',
      image: metadata.image || '',
      external_url: metadata.external_url || '',
      background_color: metadata.background_color || '',
      attributes: metadata.attributes || [],
      properties: {
        ...metadata.properties,
        symbol: currentAsset.unitName || '',
        decimals: currentAsset.decimals,
        total_supply: currentAsset.totalSupply,
        network: network,
        updated_at: new Date().toISOString()
      }
    };
    
    // Upload new metadata to IPFS/storage
    const timestamp = Date.now();
    const metadataUploadResult = await supabaseHelpers.uploadMetadataToStorage(
      arc3Metadata,
      'algorand-metadata',
      `asset-${assetId}-v${timestamp}.json`
    );
    
    if (!metadataUploadResult.success) {
      throw new Error(`Metadata upload failed: ${metadataUploadResult.error}`);
    }
    
    const metadataUrl = metadataUploadResult.url!;
    
    // Emit pending update via WebSocket
    if (wsClient.connected) {
      wsClient.emit('update', {
        type: 'metadata_update',
        network: 'algorand',
        data: {
          tokenId: assetId.toString(),
          status: 'pending',
          changes,
          updatedBy: walletAddress,
          transactionHash: 'pending'
        },
        timestamp: Date.now()
      });
    }
    
    // Get suggested transaction parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Note: Algorand doesn't allow changing asset name/URL after creation
    // But we can update the manager authorities and store new metadata URL in note field
    const note = new TextEncoder().encode(JSON.stringify({
      type: 'metadata_update',
      version: timestamp,
      metadataUrl: metadataUrl,
      changes: changes.length
    }));
    
    // Create asset configuration transaction with note containing metadata URL
    const assetConfigTxn = algosdk.makeAssetConfigTxnWithSuggestedParamsFromObject({
      sender: walletAddress,
      suggestedParams,
      assetIndex: assetId,
      manager: currentAsset.manager,
      reserve: currentAsset.reserve,
      freeze: currentAsset.freeze,
      clawback: currentAsset.clawback,
      note: note
    });
    
    console.log('🔐 Signing transaction...');
    const signedTxn = await signTransaction(assetConfigTxn);
    
    console.log('📡 Broadcasting transaction...');
    const response = await algodClient.sendRawTransaction(signedTxn).do();
    const txId = response.txid;
    
    console.log(`⏳ Waiting for confirmation: ${txId}`);
    const confirmedTxn = await waitForConfirmationWithRetry(algodClient, txId, 20, network);
    
    // Store metadata history
    await storeMetadataHistory({
      assetId: assetId.toString(),
      network: 'algorand',
      version: timestamp,
      transactionHash: txId,
      blockNumber: confirmedTxn['confirmed-round'],
      changes,
      metadataSnapshot: arc3Metadata,
      updatedBy: walletAddress,
      status: 'confirmed'
    });
    
    // Emit confirmed update via WebSocket
    if (wsClient.connected) {
      wsClient.emit('update', {
        type: 'metadata_update',
        network: 'algorand',
        data: {
          tokenId: assetId.toString(),
          status: 'confirmed',
          changes,
          updatedBy: walletAddress,
          transactionHash: txId,
          version: timestamp
        },
        timestamp: Date.now()
      });
    }
    
    console.log(`✅ Metadata update confirmed for asset ${assetId}`);
    
    return {
      success: true,
      transactionHash: txId,
      metadataUrl: metadataUrl
    };
    
  } catch (error) {
    console.error(`❌ Metadata update failed for asset ${assetId}:`, error);
    
    // Emit failed update via WebSocket
    const wsClient = getDashboardWebSocket();
    if (wsClient.connected) {
      wsClient.emit('update', {
        type: 'metadata_update',
        network: 'algorand',
        data: {
          tokenId: assetId.toString(),
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          updatedBy: walletAddress
        },
        timestamp: Date.now()
      });
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update metadata'
    };
  }
}

/**
 * Real authority management operations for Algorand assets
 */
export async function updateAlgorandAuthority(params: AlgorandAuthorityOperation): Promise<{
  success: boolean;
  transactionHash?: string;
  error?: string;
}> {
  const { assetId, operation, targetAddress, network, walletAddress, signTransaction } = params;
  
  try {
    console.log(`🔧 Starting authority ${operation} for asset ${assetId}`);
    
    const algodClient = getAlgorandClient(network);
    const wsClient = getDashboardWebSocket();
    
    // Get current asset information
    const assetInfo = await getAlgorandAssetInfo(assetId, network);
    if (!assetInfo.success || !assetInfo.data) {
      throw new Error('Asset not found or inaccessible');
    }
    
    const currentAsset = assetInfo.data;
    
    // Validate current user has authority
    const hasManagerAuth = currentAsset.manager === walletAddress;
    const hasFreezeAuth = currentAsset.freeze === walletAddress;
    const hasClawbackAuth = currentAsset.clawback === walletAddress;
    
    if (!hasManagerAuth && !hasFreezeAuth && !hasClawbackAuth) {
      throw new Error('You do not have authority to perform this operation');
    }
    
    // Prepare new authority addresses based on operation
    let newManager = currentAsset.manager;
    let newReserve = currentAsset.reserve;
    let newFreeze = currentAsset.freeze;
    let newClawback = currentAsset.clawback;
    
    switch (operation) {
      case 'transfer':
        if (!hasManagerAuth) {
          throw new Error('Only the manager can transfer authority');
        }
        if (!targetAddress) {
          throw new Error('Target address required for transfer');
        }
        newManager = targetAddress;
        break;
        
      case 'freeze':
        if (!hasManagerAuth) {
          throw new Error('Only the manager can update freeze authority');
        }
        newFreeze = targetAddress || '';
        break;
        
      case 'clawback':
        if (!hasManagerAuth) {
          throw new Error('Only the manager can update clawback authority');
        }
        newClawback = targetAddress || '';
        break;
        
      case 'revoke':
        if (!hasManagerAuth) {
          throw new Error('Only the manager can revoke authorities');
        }
        // Revoke all authorities (set to empty string)
        newManager = '';
        newFreeze = '';
        newClawback = '';
        break;
        
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }
    
    // Emit pending authority update
    if (wsClient.connected) {
      wsClient.emit('update', {
        type: 'authority_update',
        network: 'algorand',
        data: {
          tokenId: assetId.toString(),
          operation,
          from: walletAddress,
          to: targetAddress || 'revoked',
          status: 'pending',
          permissions: [operation]
        },
        timestamp: Date.now()
      });
    }
    
    // Get suggested transaction parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Create asset configuration transaction
    const assetConfigTxn = algosdk.makeAssetConfigTxnWithSuggestedParamsFromObject({
      sender: walletAddress,
      suggestedParams,
      assetIndex: assetId,
      manager: newManager || undefined,
      reserve: newReserve || undefined,
      freeze: newFreeze || undefined,
      clawback: newClawback || undefined,
    });
    
    console.log('🔐 Signing authority transaction...');
    const signedTxn = await signTransaction(assetConfigTxn);
    
    console.log('📡 Broadcasting authority transaction...');
    const response = await algodClient.sendRawTransaction(signedTxn).do();
    const txId = response.txid;
    
    console.log(`⏳ Waiting for authority confirmation: ${txId}`);
    await waitForConfirmationWithRetry(algodClient, txId, 20, network);
    
    // Store authority change history
    await storeAuthorityHistory({
      assetId: assetId.toString(),
      network: 'algorand',
      operation,
      from: walletAddress,
      to: targetAddress || 'revoked',
      transactionHash: txId,
      permissions: [operation],
      status: 'confirmed'
    });
    
    // Emit confirmed authority update
    if (wsClient.connected) {
      wsClient.emit('update', {
        type: 'authority_update',
        network: 'algorand',
        data: {
          tokenId: assetId.toString(),
          operation,
          from: walletAddress,
          to: targetAddress || 'revoked',
          status: 'confirmed',
          transactionHash: txId,
          permissions: [operation]
        },
        timestamp: Date.now()
      });
    }
    
    console.log(`✅ Authority ${operation} confirmed for asset ${assetId}`);
    
    return {
      success: true,
      transactionHash: txId
    };
    
  } catch (error) {
    console.error(`❌ Authority ${operation} failed for asset ${assetId}:`, error);
    
    // Emit failed authority update
    const wsClient = getDashboardWebSocket();
    if (wsClient.connected) {
      wsClient.emit('update', {
        type: 'authority_update',
        network: 'algorand',
        data: {
          tokenId: assetId.toString(),
          operation,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          from: walletAddress
        },
        timestamp: Date.now()
      });
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to ${operation} authority`
    };
  }
}

/**
 * Get comprehensive authority information for an Algorand asset
 */
export async function getAlgorandAuthorityInfo(assetId: number, network: string): Promise<{
  success: boolean;
  data?: {
    hasUpdatePermission: boolean;
    updateAuthority?: string;
    managerAuthority?: string;
    freezeAuthority?: string;
    clawbackAuthority?: string;
    reserveAuthority?: string;
    isOwner: boolean;
    canDelegate: boolean;
    canRevoke: boolean;
    restrictions: string[];
    delegatedPermissions: any[];
  };
  error?: string;
}> {
  try {
    const assetInfo = await getAlgorandAssetInfo(assetId, network);
    if (!assetInfo.success || !assetInfo.data) {
      return {
        success: false,
        error: 'Asset not found'
      };
    }
    
    const asset = assetInfo.data;
    
    return {
      success: true,
      data: {
        hasUpdatePermission: !!asset.manager,
        updateAuthority: asset.manager,
        managerAuthority: asset.manager,
        freezeAuthority: asset.freeze,
        clawbackAuthority: asset.clawback,
        reserveAuthority: asset.reserve,
        isOwner: !!asset.manager,
        canDelegate: false, // Algorand doesn't support delegation natively
        canRevoke: !!asset.manager,
        restrictions: asset.manager ? [] : ['Asset manager has been revoked'],
        delegatedPermissions: [] // Not supported in Algorand
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get authority info'
    };
  }
}

/**
 * Get metadata history for an Algorand asset
 */
export async function getAlgorandMetadataHistory(assetId: number, network: string): Promise<{
  success: boolean;
  data?: MetadataHistory[];
  error?: string;
}> {
  try {
    // In a real implementation, this would query a database or indexer
    // For now, return simulated history
    const history: MetadataHistory[] = [
      {
        version: Date.now(),
        timestamp: new Date(),
        updatedBy: 'current_user_address',
        transactionHash: 'sample_tx_hash',
        changes: [],
        metadataSnapshot: {},
        status: 'confirmed'
      }
    ];
    
    return {
      success: true,
      data: history
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get metadata history'
    };
  }
}

// Helper function to calculate metadata changes
function calculateMetadataChanges(oldMetadata: any, newMetadata: any): Array<{
  field: string;
  oldValue: any;
  newValue: any;
  changeType: 'added' | 'modified' | 'removed';
}> {
  const changes: Array<{
    field: string;
    oldValue: any;
    newValue: any;
    changeType: 'added' | 'modified' | 'removed';
  }> = [];
  
  // Check for additions and modifications
  Object.keys(newMetadata).forEach(key => {
    if (!(key in oldMetadata)) {
      changes.push({
        field: key,
        oldValue: null,
        newValue: newMetadata[key],
        changeType: 'added'
      });
    } else if (JSON.stringify(oldMetadata[key]) !== JSON.stringify(newMetadata[key])) {
      changes.push({
        field: key,
        oldValue: oldMetadata[key],
        newValue: newMetadata[key],
        changeType: 'modified'
      });
    }
  });
  
  // Check for removals
  Object.keys(oldMetadata).forEach(key => {
    if (!(key in newMetadata)) {
      changes.push({
        field: key,
        oldValue: oldMetadata[key],
        newValue: null,
        changeType: 'removed'
      });
    }
  });
  
  return changes;
}

// Helper function to store metadata history (would integrate with database)
async function storeMetadataHistory(data: any): Promise<void> {
  try {
    // In a real implementation, this would store to a database
    console.log('📝 Storing metadata history:', data);
  } catch (error) {
    console.error('Failed to store metadata history:', error);
  }
}

// Helper function to store authority history (would integrate with database)
async function storeAuthorityHistory(data: any): Promise<void> {
  try {
    // In a real implementation, this would store to a database
    console.log('📝 Storing authority history:', data);
  } catch (error) {
    console.error('Failed to store authority history:', error);
  }
}
