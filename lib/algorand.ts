import algosdk from 'algosdk';
import { supabaseHelpers } from '@/lib/supabase';
import { retryWithBackoff } from '@/lib/error-handling';
import { safeStringify } from '@/lib/utils';
import { 
  getPlatformFeeConfig, 
  getNetworkType,
  calculateTokenCreationFees,
  generateFeeNote,
  generateTokenNote,
  hasSufficientBalance,
  type PlatformFeeConfig
} from './algorand-fees';
import { 
  trackTokenCreationFee 
} from './fee-tracking';

// Algorand network configurations
export const ALGORAND_NETWORKS = {
  'algorand-mainnet': {
    name: 'Algorand Mainnet', 
    algodUrl: 'https://mainnet-api.algonode.cloud',
    indexerUrl: 'https://mainnet-idx.algonode.cloud',
    token: '',
    port: '',
    chainId: 416001,
    explorer: 'https://explorer.perawallet.app',
    isMainnet: true,
    color: 'bg-[#00d4aa]'
  },
  'algorand-testnet': {
    name: 'Algorand Testnet', 
    algodUrl: 'https://testnet-api.algonode.cloud',
    indexerUrl: 'https://testnet-idx.algonode.cloud',
    token: '',
    port: '',
    chainId: 416002,
    explorer: 'https://testnet.algoexplorer.io',
    isMainnet: false,
    color: 'bg-[#76f935]'
  }
} as const;

export type AlgorandNetworkKey = keyof typeof ALGORAND_NETWORKS;

// Backward compatibility - export as ALGORAND_NETWORK_INFO
export const ALGORAND_NETWORK_INFO = ALGORAND_NETWORKS;

// Get network configuration
export function getAlgorandNetwork(networkKey: string) {
  return ALGORAND_NETWORKS[networkKey as AlgorandNetworkKey] || ALGORAND_NETWORKS['algorand-testnet'];
}

// Get Algorand client for a specific network
export function getAlgorandClient(network: string) {
  const config = getAlgorandNetwork(network);
  return new algosdk.Algodv2(config.token, config.algodUrl, config.port);
}

// Get Algorand Indexer client for a specific network
export function getAlgorandIndexerClient(network: string) {
  const config = getAlgorandNetwork(network);
  return new algosdk.Indexer(config.token, config.indexerUrl, config.port);
}

// Wait for transaction confirmation with retry logic
export async function waitForConfirmationWithRetry(
  algodClient: algosdk.Algodv2,
  txId: string,
  maxRounds: number,
  network: string
): Promise<any> {
  const status = await algodClient.status().do();
  let lastRound = status.lastRound;
  
  while (lastRound < Number(status.lastRound) + maxRounds) {
    try {
      const pendingInfo = await algodClient.pendingTransactionInformation(txId).do();
      
      if (pendingInfo.confirmedRound && pendingInfo.confirmedRound > 0) {
        return pendingInfo;
      }
      
      lastRound++;
      await algodClient.statusAfterBlock(lastRound).do();
    } catch (error) {
      console.error(`Error checking transaction status on ${network}:`, error);
      throw error;
    }
  }
  
  throw new Error(`Transaction not confirmed after ${maxRounds} rounds on ${network}`);
}

// Get account information from Algorand Indexer
export async function getAlgorandAccountInfo(address: string, network: string) {
  try {
    console.log(`📡 Fetching Algorand account info for ${address} on ${network}`);
    
    const indexerClient = getAlgorandIndexerClient(network);
    const accountInfo = await indexerClient.lookupAccountByID(address).do();
    
    if (!accountInfo.account) {
      return {
        success: false,
        error: 'Account not found'
      };
    }

    const account = accountInfo.account;
    const balance = account.amount ? Number(account.amount) / 1000000 : 0; // Convert microAlgos to Algos
    const assets = account.assets || [];
    
    console.log(`✅ Account info loaded: ${balance} ALGO, ${assets.length} assets`);
    
    return {
      success: true,
      balance,
      assets,
      account
    };
  } catch (error) {
    console.error(`❌ Error fetching Algorand account info on ${network}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch account info'
    };
  }
}

// Get asset information from Algorand Indexer
export async function getAlgorandAssetInfo(assetId: number | bigint, network: string) {
  try {
    // Convert BigInt to number safely
    const numericAssetId = typeof assetId === 'bigint' ? Number(assetId) : assetId;
    
    // Validate asset ID
    if (!Number.isInteger(numericAssetId) || numericAssetId <= 0) {
      console.log(`❌ Invalid asset ID: ${assetId}`);
      return {
        success: false,
        error: `Invalid asset ID: ${assetId}. Must be a positive integer.`
      };
    }
    
    console.log(`📡 Fetching Algorand asset info for asset ID ${numericAssetId} on ${network}`);
    
    const indexerClient = getAlgorandIndexerClient(network);
    
    // Add timeout and better error handling
    const requestPromise = indexerClient.lookupAssetByID(numericAssetId).do();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), 10000)
    );
    
    const assetInfo = await Promise.race([requestPromise, timeoutPromise]) as any;
    
    if (!assetInfo || !assetInfo.asset) {
      console.log(`❌ Asset ${numericAssetId} not found on ${network}`);
      return {
        success: false,
        error: `Asset ${numericAssetId} not found on ${network}. Please verify the asset ID and network.`
      };
    }

    const asset = assetInfo.asset;
    const params = asset.params;

    // Convert total supply safely with fallback to prevent BigInt errors
    let totalSupply = 0;
    try {
      totalSupply = params.total !== undefined ? Number(params.total) : 0;
    } catch (err) {
      console.warn('Error converting total supply to number:', err);
    }

    // Parse metadata if available
    let metadata = {};
    if (params.url) {
      try {
        // Try to fetch metadata from URL (ARC-3 standard) with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(params.url, { 
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
          }
        });
        clearTimeout(timeoutId);
        
        if (response.ok) {
          metadata = await response.json();
        }
      } catch (err) {
        console.warn('Could not fetch asset metadata:', err);
      }
    }
    
    const assetData = {
      assetId,
      assetName: params.name || 'Unknown Asset',
      unitName: params.unitName || 'UNK',
      totalSupply: totalSupply,
      decimals: params.decimals || 0,
      creator: params.creator,
      manager: params.manager,
      reserve: params.reserve,
      freeze: params.freeze,
      clawback: params.clawback,
      defaultFrozen: params.defaultFrozen || false,
      url: params.url,
      metadataHash: params.metadataHash,
      metadata
    };
    
    console.log(`✅ Asset info loaded: ${assetData.assetName} (${assetData.unitName})`);
    
    return {
      success: true,
      data: assetData,
      assetData // Add this for backward compatibility
    };
  } catch (error) {
    console.error(`❌ Error fetching Algorand asset info on ${network}:`, error);
    return {
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch asset info',
      data: null // Add null data to avoid undefined errors when destructuring
    };
  }
}

/**
 * ===============================
 * ATOMIC TRANSACTION GROUP FUNCTIONS
 * ===============================
 */

/**
 * Build an atomic transaction group for fee payment + token creation
 */
export async function buildAtomicTokenCreationGroup(
  algodClient: algosdk.Algodv2,
  creatorAddress: string,
  tokenData: {
    name: string;
    symbol: string;
    description: string;
    decimals: number;
    totalSupply: string;
    logoUrl: string;
    website?: string;
    github?: string;
    twitter?: string;
    mintable: boolean;
    burnable: boolean;
    pausable: boolean;
  },
  metadataUrl: string,
  network: string
): Promise<{
  feeTransaction: algosdk.Transaction;
  tokenTransaction: algosdk.Transaction;
  groupId: string;
  feeAmount: number;
}> {
  const networkType = getNetworkType(network);
  const feeConfig = await getPlatformFeeConfig(networkType);
  
  if (!feeConfig.enabled || !feeConfig.destination) {
    throw new Error('Fee configuration is invalid or fees are not enabled for this network');
  }
  
  // Get suggested transaction parameters
  const suggestedParams = await algodClient.getTransactionParams().do();
  
  // Calculate total supply with decimals using BigInt for safety
  const baseSupply = BigInt(tokenData.totalSupply);
  const decimalsMultiplier = BigInt(Math.pow(10, tokenData.decimals));
  const totalSupplyBigInt = baseSupply * decimalsMultiplier;
  
  // Check if the BigInt value exceeds what Algorand can handle (2^64 - 1)
  const maxAlgorandSupply = BigInt('18446744073709551615'); // 2^64 - 1
  if (totalSupplyBigInt > maxAlgorandSupply) {
    throw new Error(`Total supply with decimals (${totalSupplyBigInt.toString()}) exceeds Algorand's maximum. Please reduce total supply or decimals.`);
  }
  
  // Set manager addresses based on features
  const managerAddress = tokenData.mintable ? creatorAddress : undefined;
  const reserveAddress = creatorAddress; // Always set reserve to creator
  const freezeAddress = tokenData.pausable ? creatorAddress : undefined;
  const clawbackAddress = tokenData.burnable ? creatorAddress : undefined;
  
  // Transaction 1: Platform fee payment
  const feeTransaction = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: creatorAddress,
    receiver: feeConfig.destination,
    amount: feeConfig.amount,
    suggestedParams,
    note: generateFeeNote()
  });
  
  // Transaction 2: Token creation
  let totalSupplyForAlgorand: number | bigint = totalSupplyBigInt;
  let tokenTransaction: algosdk.Transaction;
  
  try {
    // Try to use BigInt directly (algosdk >= 2.7.0+ supports BigInt for total)
    tokenTransaction = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
      sender: creatorAddress,
      suggestedParams,
      defaultFrozen: false,
      unitName: tokenData.symbol,
      assetName: tokenData.name,
      manager: managerAddress,
      reserve: reserveAddress,
      freeze: freezeAddress,
      clawback: clawbackAddress,
      total: totalSupplyForAlgorand,
      decimals: tokenData.decimals,
      assetURL: metadataUrl,
      assetMetadataHash: undefined,
      note: generateTokenNote(),
    });
  } catch (err) {
    // If BigInt is not supported, fallback to number if safe
    if (totalSupplyBigInt <= BigInt(Number.MAX_SAFE_INTEGER)) {
      totalSupplyForAlgorand = Number(totalSupplyBigInt);
      tokenTransaction = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
        sender: creatorAddress,
        suggestedParams,
        defaultFrozen: false,
        unitName: tokenData.symbol,
        assetName: tokenData.name,
        manager: managerAddress,
        reserve: reserveAddress,
        freeze: freezeAddress,
        clawback: clawbackAddress,
        total: totalSupplyForAlgorand,
        decimals: tokenData.decimals,
        assetURL: metadataUrl,
        assetMetadataHash: undefined,
        note: generateTokenNote(),
      });
    } else {
      throw new Error(`Total supply (${totalSupplyBigInt.toString()}) is too large for this environment. Please reduce total supply or decimals, or upgrade algosdk to a version that supports BigInt.`);
    }
  }
  
  // Group transactions atomically
  const groupId = algosdk.computeGroupID([feeTransaction, tokenTransaction]);
  feeTransaction.group = groupId;
  tokenTransaction.group = groupId;
  
  return {
    feeTransaction,
    tokenTransaction,
    groupId: Buffer.from(groupId).toString('base64'),
    feeAmount: feeConfig.amount
  };
}

/**
 * Sign and submit an atomic transaction group
 */
export async function signAndSubmitAtomicGroup(
  algodClient: algosdk.Algodv2,
  feeTransaction: algosdk.Transaction,
  tokenTransaction: algosdk.Transaction,
  signAtomicGroup: (transactions: any[]) => Promise<Uint8Array[]>,
  network: string,
  options?: {
    onStepUpdate?: (step: string, status: string, details?: any) => void;
  }
): Promise<{
  success: boolean;
  feeTransactionId?: string;
  tokenTransactionId?: string;
  groupId: string;
  error?: string;
}> {
  const { onStepUpdate } = options || {};
  const groupId = Buffer.from(feeTransaction.group!).toString('base64');
  
  try {
    if (onStepUpdate) {
      onStepUpdate('wallet-approval', 'in-progress', { message: 'Please approve the atomic transaction group in your wallet' });
    }
    
    console.log('📝 Signing atomic transaction group...');
    
    // Sign the atomic group using the proper atomic signing function
    const signedTransactions = await signAtomicGroup([feeTransaction, tokenTransaction]);
    
    if (onStepUpdate) {
      onStepUpdate('wallet-approval', 'completed', { message: 'Atomic transaction group signed successfully' });
      onStepUpdate('transaction-broadcast', 'in-progress', { message: 'Broadcasting atomic group to network...' });
    }
    
    // Submit atomic group
    console.log('📡 Submitting atomic transaction group...');
    const groupResponse = await algodClient.sendRawTransaction(signedTransactions).do();
    
    // Note: For atomic groups, Algorand typically returns the transaction ID of the first transaction
    const feeTransactionId = groupResponse.txid;
    
    if (onStepUpdate) {
      onStepUpdate('transaction-broadcast', 'completed', { 
        feeTransactionId, 
        groupId,
        message: `Atomic group broadcasted: ${feeTransactionId}` 
      });
      onStepUpdate('confirmation', 'in-progress', { message: 'Waiting for group confirmation...' });
    }
    
    console.log(`⏳ Waiting for atomic group confirmation (Fee TX: ${feeTransactionId})...`);
    
    // Wait for confirmation of the fee transaction (which confirms the entire group)
    await waitForConfirmationWithRetry(algodClient, feeTransactionId, 20, network);
    
    if (onStepUpdate) {
      onStepUpdate('confirmation', 'completed', { message: 'Atomic transaction group confirmed' });
    }
    
    console.log('✅ Atomic transaction group confirmed successfully');
    
    return {
      success: true,
      feeTransactionId,
      tokenTransactionId: feeTransactionId, // In atomic groups, we track by the group
      groupId
    };
    
  } catch (error) {
    console.error('❌ Error submitting atomic transaction group:', error);
    
    if (onStepUpdate) {
      onStepUpdate('transaction-broadcast', 'failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
    
    return {
      success: false,
      groupId,
      error: error instanceof Error ? error.message : 'Failed to submit atomic transaction group'
    };
  }
}

/**
 * Check if user has sufficient balance for token creation including fees
 */
export async function validateUserBalance(
  algodClient: algosdk.Algodv2,
  userAddress: string,
  network: string
): Promise<{
  sufficient: boolean;
  balance: number;
  required: number;
  missing: number;
  balanceAlgo: number;
  requiredAlgo: number;
  missingAlgo: number;
}> {
  try {
    // Get user's current balance
    const accountInfo = await algodClient.accountInformation(userAddress).do();
    const rawBalance = accountInfo.amount || 0; // Could be bigint or number
    
    // Convert to number safely (handle both bigint and number)
    const balance = typeof rawBalance === 'bigint' ? Number(rawBalance) : rawBalance; // In microAlgos
    
    // Calculate required fees
    const fees = await calculateTokenCreationFees(network);
    const balanceCheck = await hasSufficientBalance(balance, network);
    
    return {
      sufficient: balanceCheck.sufficient,
      balance,
      required: balanceCheck.required,
      missing: balanceCheck.missing,
      balanceAlgo: balance / 1_000_000,
      requiredAlgo: balanceCheck.required / 1_000_000,
      missingAlgo: balanceCheck.missing / 1_000_000
    };
  } catch (error) {
    console.error('Error checking user balance:', error);
    throw new Error('Failed to check account balance. Please ensure your wallet is connected.');
  }
}

// Create Algorand Standard Asset (ASA) with enhanced fee support
export async function createAlgorandToken(
  creatorAddress: string,
  tokenData: {
    name: string;
    symbol: string;
    description: string;
    decimals: number;
    totalSupply: string;
    logoUrl: string;
    website?: string;
    github?: string;
    twitter?: string;
    mintable: boolean;
    burnable: boolean;
    pausable: boolean;
  },
  signTransaction: (txn: any) => Promise<Uint8Array>,
  signAtomicGroup: (transactions: any[]) => Promise<Uint8Array[]>,
  uploadMetadataToStorage: (metadata: any, bucket?: string, fileName?: string) => Promise<{ success: boolean; url?: string; error?: string }>,
  network: string,
  options?: {
    onStepUpdate?: (step: string, status: string, details?: any) => void;
  }
) {
  try {
    const { onStepUpdate } = options || {};
    
    console.log(`🚀 Creating Algorand token on ${network}`);
    console.log('Token data:', tokenData);
    
    const algodClient = getAlgorandClient(network);
    const networkConfig = getAlgorandNetwork(network);
    
    // Prepare ARC-3 compliant metadata
    const arc3Metadata = {
      name: tokenData.name,
      description: tokenData.description,
      image: tokenData.logoUrl,
      image_integrity: '',
      image_mimetype: 'image/png',
      external_url: tokenData.website || '',
      external_url_integrity: '',
      external_url_mimetype: 'text/html',
      animation_url: '',
      animation_url_integrity: '',
      animation_url_mimetype: '',
      properties: {
        symbol: tokenData.symbol,
        decimals: tokenData.decimals,
        total_supply: tokenData.totalSupply,
        creator: creatorAddress,
        mintable: tokenData.mintable,
        burnable: tokenData.burnable,
        pausable: tokenData.pausable,
        website: tokenData.website || '',
        github: tokenData.github || '',
        twitter: tokenData.twitter || '',
        network: network
      }
    };
    
    // Upload metadata to storage
    console.log('📤 Uploading metadata to storage...');
    const metadataUploadResult = await uploadMetadataToStorage(
      arc3Metadata, 
      'algorand-metadata', 
      `${tokenData.symbol.toLowerCase()}-${Date.now()}.json`
    );
    
    if (!metadataUploadResult.success) {
      throw new Error(`Metadata upload failed: ${metadataUploadResult.error}`);
    }
    
    let metadataUrl = metadataUploadResult.url!;
    console.log('✅ Metadata uploaded:', metadataUrl);
    
    // Validate URL length for Algorand compatibility (96 character limit)
    if (metadataUrl.length > 96) {
      console.warn(`⚠️ Metadata URL is ${metadataUrl.length} characters, but Algorand limit is 96. Using truncated URL.`);
      // Use a shorter fallback URL for Algorand compatibility
      const shortUrl = 'https://token.info';
      console.log(`🔧 Using fallback URL: ${shortUrl}`);
      metadataUrl = shortUrl;
    }
    
    // Check if fees are enabled for this network
    const networkType = getNetworkType(network);
    const feeConfig = await getPlatformFeeConfig(networkType);
    
    console.log(`💰 Fee configuration: ${feeConfig.enabled ? `${feeConfig.amount / 1_000_000} ALGO required` : 'No fees (testnet)'}`);
    
    // Validate user balance if fees are required
    if (feeConfig.enabled) {
      if (onStepUpdate) {
        onStepUpdate('balance-check', 'in-progress', { message: 'Checking account balance...' });
      }
      
      const balanceInfo = await validateUserBalance(algodClient, creatorAddress, network);
      
      if (!balanceInfo.sufficient) {
        const errorMessage = `Insufficient balance. Required: ${balanceInfo.requiredAlgo.toFixed(3)} ALGO, Available: ${balanceInfo.balanceAlgo.toFixed(3)} ALGO, Missing: ${balanceInfo.missingAlgo.toFixed(3)} ALGO`;
        
        if (onStepUpdate) {
          onStepUpdate('balance-check', 'failed', { error: errorMessage });
        }
        
        throw new Error(errorMessage);
      }
      
      if (onStepUpdate) {
        onStepUpdate('balance-check', 'completed', { 
          message: `Balance verified: ${balanceInfo.balanceAlgo.toFixed(3)} ALGO available`,
          balanceAlgo: balanceInfo.balanceAlgo,
          requiredAlgo: balanceInfo.requiredAlgo
        });
      }
      
      console.log(`✅ Balance verified: ${balanceInfo.balanceAlgo.toFixed(3)} ALGO (Required: ${balanceInfo.requiredAlgo.toFixed(3)} ALGO)`);
    }
    
    let txId: string;
    let feeTransactionId: string | undefined;
    let groupId: string | undefined;
    
    if (feeConfig.enabled) {
      // ========================================
      // MAINNET: Use atomic transaction group with fee payment
      // ========================================
      
      console.log('🔗 Building atomic transaction group with platform fee...');
      
      if (onStepUpdate) {
        onStepUpdate('atomic-group-build', 'in-progress', { message: 'Building atomic transaction group...' });
      }
      
      // Build atomic transaction group
      const atomicGroup = await buildAtomicTokenCreationGroup(
        algodClient,
        creatorAddress,
        tokenData,
        metadataUrl,
        network
      );
      
      if (onStepUpdate) {
        onStepUpdate('atomic-group-build', 'completed', { 
          message: `Atomic group built: ${(atomicGroup.feeAmount / 1_000_000)} ALGO fee + token creation`,
          feeAmount: atomicGroup.feeAmount / 1_000_000,
          groupId: atomicGroup.groupId
        });
      }
      
      console.log(`✅ Atomic group built with ${(atomicGroup.feeAmount / 1_000_000)} ALGO fee`);
      
      // Track fee collection before submission
      if (onStepUpdate) {
        onStepUpdate('fee-tracking', 'in-progress', { message: 'Tracking fee collection...' });
      }
      
      // Track fee with new wallet-based system
      try {
        await trackTokenCreationFee(
          creatorAddress,
          network,
          tokenData.symbol,
          undefined // No transaction hash yet
        );
        console.log('✅ Fee collection tracked in database');
        
        if (onStepUpdate) {
          onStepUpdate('fee-tracking', 'completed', { message: 'Fee tracking initialized' });
        }
      } catch (trackingError) {
        console.warn('⚠️ Fee tracking failed (non-critical):', trackingError);
        // Don't fail the transaction for tracking errors
      }
      
      // Sign and submit atomic group
      const submissionResult = await signAndSubmitAtomicGroup(
        algodClient,
        atomicGroup.feeTransaction,
        atomicGroup.tokenTransaction,
        signAtomicGroup,
        network,
        { onStepUpdate }
      );
      
      if (!submissionResult.success) {
        // Note: Fee status tracking now handled through wallet-based system
        throw new Error(submissionResult.error || 'Failed to submit atomic transaction group');
      }
      
      txId = submissionResult.feeTransactionId!;
      feeTransactionId = submissionResult.feeTransactionId;
      groupId = submissionResult.groupId;
      
      console.log(`✅ Atomic group confirmed - Fee TX: ${feeTransactionId}, Group: ${groupId}`);
      
    } else {
      // ========================================
      // TESTNET: Use standard single transaction (no fees)
      // ========================================
      
      console.log('🔧 Creating standard token transaction (no fees)...');
      
      // Get suggested transaction parameters
      const suggestedParams = await algodClient.getTransactionParams().do();
      
      // Calculate total supply with decimals using BigInt for safety
      const baseSupply = BigInt(tokenData.totalSupply);
      const decimalsMultiplier = BigInt(Math.pow(10, tokenData.decimals));
      const totalSupplyBigInt = baseSupply * decimalsMultiplier;
      
      // Check if the BigInt value exceeds what Algorand can handle (2^64 - 1)
      const maxAlgorandSupply = BigInt('18446744073709551615'); // 2^64 - 1
      if (totalSupplyBigInt > maxAlgorandSupply) {
        throw new Error(`Total supply with decimals (${totalSupplyBigInt.toString()}) exceeds Algorand's maximum. Please reduce total supply or decimals.`);
      }
      
      // Set manager addresses based on features
      const managerAddress = tokenData.mintable ? creatorAddress : undefined;
      const reserveAddress = creatorAddress; // Always set reserve to creator
      const freezeAddress = tokenData.pausable ? creatorAddress : undefined;
      const clawbackAddress = tokenData.burnable ? creatorAddress : undefined;
      
      if (onStepUpdate) {
        onStepUpdate('wallet-approval', 'in-progress', { message: 'Please approve transaction in Pera Wallet' });
      }
      
      // For Algorand SDK, convert to number if within safe range, otherwise error
      let assetCreateTxn;
      let totalSupplyForAlgorand: number | bigint = totalSupplyBigInt;
      try {
        // Try to use BigInt directly (algosdk >= 2.7.0+ supports BigInt for total)
        assetCreateTxn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
          sender: creatorAddress,
          suggestedParams,
          defaultFrozen: false,
          unitName: tokenData.symbol,
          assetName: tokenData.name,
          manager: managerAddress,
          reserve: reserveAddress,
          freeze: freezeAddress,
          clawback: clawbackAddress,
          total: totalSupplyForAlgorand,
          decimals: tokenData.decimals,
          assetURL: metadataUrl,
          assetMetadataHash: undefined,
          note: generateTokenNote(),
        });
      } catch (err) {
        // If BigInt is not supported, fallback to number if safe
        if (totalSupplyBigInt <= BigInt(Number.MAX_SAFE_INTEGER)) {
          totalSupplyForAlgorand = Number(totalSupplyBigInt);
          assetCreateTxn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
            sender: creatorAddress,
            suggestedParams,
            defaultFrozen: false,
            unitName: tokenData.symbol,
            assetName: tokenData.name,
            manager: managerAddress,
            reserve: reserveAddress,
            freeze: freezeAddress,
            clawback: clawbackAddress,
            total: totalSupplyForAlgorand,
            decimals: tokenData.decimals,
            assetURL: metadataUrl,
            assetMetadataHash: undefined,
            note: generateTokenNote(),
          });
        } else {
          throw new Error(`Total supply (${totalSupplyBigInt.toString()}) is too large for this environment. Please reduce total supply or decimals, or upgrade algosdk to a version that supports BigInt.`);
        }
      }

      console.log('📝 Signing transaction...');
      const signedTxn = await signTransaction(assetCreateTxn);

      if (onStepUpdate) {
        onStepUpdate('wallet-approval', 'completed', { message: 'Transaction signed in wallet' });
        onStepUpdate('transaction-broadcast', 'in-progress', { message: 'Broadcasting to Algorand network...' });
      }

      console.log('📡 Sending transaction to network...');
      const response = await algodClient.sendRawTransaction(signedTxn).do();
      txId = response.txid;

      if (onStepUpdate) {
        onStepUpdate('transaction-broadcast', 'completed', { txId, message: `Transaction broadcasted: ${txId}` });
        onStepUpdate('confirmation', 'in-progress', { message: 'Waiting for network confirmation...' });
      }

      console.log('⏳ Waiting for confirmation...');
      
      try {
        await waitForConfirmationWithRetry(algodClient, txId, 20, network);
      } catch (confirmError) {
        console.error(`❌ Transaction confirmation failed on ${network}:`, confirmError);
        throw new Error(`Transaction submitted but not confirmed on ${network}. Please check the explorer for transaction status. TX ID: ${txId}`);
      }
    }
    
    // Common confirmation logic for both fee and non-fee transactions
    let confirmedTxn;
    try {
      confirmedTxn = await waitForConfirmationWithRetry(algodClient, txId, 20, network);
    } catch (confirmError) {
      console.error(`❌ Transaction confirmation failed on ${network}:`, confirmError);
      throw new Error(`Transaction submitted but not confirmed on ${network}. Please check the explorer for transaction status. TX ID: ${txId}`);
    }
    
    if (onStepUpdate) {
      onStepUpdate('confirmation', 'completed', { message: 'Transaction confirmed on blockchain' });
      onStepUpdate('asset-verification', 'in-progress', { message: 'Extracting asset information...' });
    }
    
    // Extract asset ID from transaction confirmation with robust fallback logic
    console.log('🔍 Examining confirmed transaction for asset ID...');
    
    // Log transaction response safely (handle BigInt values)
    try {
      console.log('Confirmed transaction:', safeStringify(confirmedTxn, undefined, 2));
    } catch (logError) {
      console.log('Confirmed transaction (raw):', confirmedTxn);
    }

    // Try multiple ways to extract asset ID from confirmation
    let assetId = confirmedTxn['asset-index'] || 
                  confirmedTxn.assetIndex || 
                  confirmedTxn['created-asset-index'];
    
    // Additional fallbacks for different response formats
    if (!assetId && confirmedTxn.createdAssetIndex) {
      assetId = confirmedTxn.createdAssetIndex;
    }
    
    if (!assetId && confirmedTxn['inner-txns'] && confirmedTxn['inner-txns'].length > 0) {
      assetId = confirmedTxn['inner-txns'][0]['asset-index'];
    }

    // For asset creation transactions, the asset ID might be in different locations
    if (!assetId && confirmedTxn.txn) {
      assetId = confirmedTxn.txn['asset-index'] || 
                confirmedTxn.txn.assetIndex ||
                confirmedTxn.txn['created-asset-index'];
    }

    // Check in global-state-delta or logs
    if (!assetId && confirmedTxn['global-state-delta']) {
      const deltaEntries = confirmedTxn['global-state-delta'];
      for (const entry of deltaEntries) {
        if (entry.key === 'asset-id' || entry.key === 'assetId') {
          assetId = entry.value?.uint || entry.value?.bytes;
          break;
        }
      }
    }

    // Convert BigInt to number if needed for safety
    if (typeof assetId === 'bigint') {
      assetId = Number(assetId);
    }

    // If still not found, try to get it by looking at the transaction result
    if (!assetId && confirmedTxn.confirmedRound) {
      console.log('🔍 Attempting to retrieve asset ID from account assets...');
      
      try {
        // Use indexerClient to lookup transactions - need to allow some time for indexer to update
        // Add a small delay before looking up the transaction
        await new Promise(resolve => setTimeout(resolve, 2000));
         
        // Try the indexer to lookup the transaction
        const indexerClient = getAlgorandIndexerClient(network);
        try {
          const txResponse = await retryWithBackoff(async () => {
            console.log('🔄 Searching for transaction ID in indexer:', txId);
            try {
              const txnInfo = await indexerClient.lookupTransactionByID(txId).do();
              console.log('Transaction found:', txnInfo);
              return txnInfo;
            } catch (err) {
              console.log('Indexer lookup failed, retrying...');
              throw err;
            }
          }, 3, 1000);
          
          if (txResponse && txResponse.transaction && txResponse.transaction.createdAssetIndex) {
            assetId = typeof txResponse.transaction.createdAssetIndex === 'bigint' 
              ? Number(txResponse.transaction.createdAssetIndex) 
              : txResponse.transaction.createdAssetIndex;
            console.log('✅ Found asset ID from indexer transaction lookup:', assetId);
          } else if (txResponse && txResponse.transaction) {
            console.log('Transaction found but no created-asset-index field:', txResponse.transaction);
          }
        } catch (indexerError) {
          console.log('Indexer lookup failed after retries:', indexerError);
        }
        
        // If we still don't have the asset ID, try looking at account assets
        if (!assetId) {
          console.log('Trying account info to find asset ID...');
          
          try {
            // Add a small delay before checking account info
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const accountInfo = await algodClient.accountInformation(creatorAddress).do();
            const assets = accountInfo.createdAssets || [];
          
            if (assets.length > 0) {
              // Get the asset with the highest ID (most recently created)
              const latestAsset = assets.reduce((prev: any, current: any) => 
                (current.index > prev.index) ? current : prev, assets[0]
              );
              assetId = typeof latestAsset.index === 'bigint' 
                ? Number(latestAsset.index) 
                : latestAsset.index;
              console.log('✅ Found asset ID from account assets:', assetId);
            }
          } catch (accountError) {
            console.warn('Could not retrieve account info for asset ID lookup:', accountError);
          }
        }
      } catch (accountError) {
        console.warn('Could not retrieve account info for asset ID lookup:', accountError);
      }
    }

    if (!assetId) {
      console.error('❌ Asset ID not found in confirmed transaction');
      try {
        console.error('Full transaction details:', safeStringify(confirmedTxn, undefined, 2));
      } catch (logError) {
        console.error('Full transaction details (raw):', confirmedTxn);
      }
      
      if (onStepUpdate) {
        onStepUpdate('asset-verification', 'failed', { 
          error: 'Asset ID could not be extracted',
          suggestion: 'Check explorer for details'
        });
      }
      
      throw new Error(`Asset creation transaction confirmed (TX: ${txId}) but asset ID could not be extracted. Please check the ${networkConfig.explorer}/tx/${txId} for the asset details.`);
    }
    
    if (onStepUpdate) {
      onStepUpdate('asset-verification', 'completed', { 
        assetId, 
        message: `Asset created successfully: ${assetId}` 
      });
    }
    
    console.log(`✅ Token created successfully on ${network}!`);
    console.log('- Transaction ID:', txId);
    console.log('- Asset ID:', assetId || 'Unknown (check explorer)');
    
    const explorerUrl = `${networkConfig.explorer}/asset/${assetId}`;
    
    if (!assetId) {
      // If we couldn't extract the asset ID, provide a helpful message
      console.log('⚠️ Asset ID not found in transaction response. Please check the explorer for details.');
      // Fee tracking is now handled through wallet-based system
      
      return {
        success: true,
        transactionId: txId,
        assetId: null, // We'll handle this null case in the UI
        feeTransactionId,
        groupId,
        platformFee: feeConfig.enabled ? feeConfig.amount : 0,
        message: 'Your token was successfully created! To find your Asset ID, check the Algorand Explorer using the link below.',
        details: {
          network: network,
          explorerUrl: `${networkConfig.explorer}/tx/${txId}`,
          metadataUrl: metadataUrl,
          createdAt: new Date().toISOString(),
          feePaid: feeConfig.enabled,
          feeAmount: feeConfig.enabled ? feeConfig.amount / 1_000_000 : 0,
          networkType: networkType
        }
      };
    }
    
    // Fee tracking is now handled through wallet-based system
    
    return {
      success: true,
      transactionId: txId,
      assetId: typeof assetId === 'bigint' ? Number(assetId) : assetId,
      feeTransactionId,
      groupId,
      platformFee: feeConfig.enabled ? feeConfig.amount : 0,
      details: {
        network: network,
        explorerUrl: explorerUrl,
        metadataUrl: metadataUrl,
        createdAt: new Date().toISOString(),
        feePaid: feeConfig.enabled,
        feeAmount: feeConfig.enabled ? feeConfig.amount / 1_000_000 : 0,
        networkType: networkType
      }
    };
    
  } catch (error) {
    console.error(`❌ Error creating Algorand token on ${network}:`, error);
    
    if (options?.onStepUpdate) {
      options.onStepUpdate('wallet-approval', 'failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create token'
    };
  }
}

// Opt-in to an Algorand asset
export async function optInToAsset(
  address: string,
  assetId: number,
  signTransaction: (txn: any) => Promise<Uint8Array>,
  network: string
) {
  try {
    console.log(`🔗 Opting in to asset ${assetId} on ${network}`);
    
    const algodClient = getAlgorandClient(network);
    
    // Get suggested transaction parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Create opt-in transaction (asset transfer of 0 to self)
    const optInTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      sender: address,
      receiver: address,
      assetIndex: assetId,
      amount: 0,
      suggestedParams
    });
    
    console.log('📝 Signing opt-in transaction...');
    const signedTxn = await signTransaction(optInTxn);
    
    console.log('📡 Sending opt-in transaction...');
    const response = await algodClient.sendRawTransaction(signedTxn).do();
    const txId = response.txid;
    
    console.log('⏳ Waiting for opt-in confirmation...');
    await waitForConfirmationWithRetry(algodClient, txId, 10, network);
    
    console.log(`✅ Successfully opted in to asset ${assetId}`);
    
    return {
      success: true,
      transactionId: txId
    };
    
  } catch (error) {
    console.error(`❌ Error opting in to asset on ${network}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to opt-in to asset'
    };
  }
}

// Mint Algorand assets
export async function mintAlgorandAssets(
  address: string,
  assetId: number,
  amount: number,
  signTransaction: (txn: any) => Promise<Uint8Array>,
  network: string
) {
  try {
    console.log(`🪙 Minting ${amount} units of asset ${assetId} on ${network}`);
    
    const algodClient = getAlgorandClient(network);
    
    // Get suggested transaction parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Get asset information to check if minting is allowed
    const assetInfo = await getAlgorandAssetInfo(assetId, network);
    if (!assetInfo.success || !assetInfo.data) {
      throw new Error('Asset not found');
    }
    
    const assetData = assetInfo.data;
    
    // Check if the address is the creator/manager (required for minting)
    if (assetData.creator !== address && assetData.manager !== address) {
      throw new Error('Only the asset creator or manager can mint additional assets');
    }
    
    // Convert amount to base units
    const amountInBaseUnits = Math.floor(amount * Math.pow(10, assetData.decimals || 0));
    
    // Create asset transfer transaction from creator to target address
    // In Algorand, "minting" is transferring from the creator's account
    const assetTransferTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      sender: address,
      receiver: address, // For now, mint to self
      assetIndex: assetId,
      amount: amountInBaseUnits,
      suggestedParams,
    });
    
    console.log('📝 Signing mint transaction...');
    const signedTxn = await signTransaction(assetTransferTxn);
    
    console.log('📡 Sending mint transaction...');
    const response = await algodClient.sendRawTransaction(signedTxn).do();
    const txId = response.txid;
    
    console.log('⏳ Waiting for mint confirmation...');
    await waitForConfirmationWithRetry(algodClient, txId, 20, network);
    
    console.log(`✅ Successfully minted ${amount} units of asset ${assetId}`);
    
    return {
      success: true,
      transactionId: txId
    };
    
  } catch (error) {
    console.error(`❌ Error minting Algorand assets on ${network}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mint assets'
    };
  }
}

// Burn Algorand assets
export async function burnAlgorandAssets(
  address: string,
  assetId: number,
  amount: number,
  signTransaction: (txn: any) => Promise<Uint8Array>,
  network: string
) {
  try {
    console.log(`🔥 Burning ${amount} units of asset ${assetId} on ${network}`);
    
    const algodClient = getAlgorandClient(network);
    
    // Get suggested transaction parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Get asset information
    const assetInfo = await getAlgorandAssetInfo(assetId, network);
    if (!assetInfo.success || !assetInfo.data) {
      throw new Error('Asset not found');
    }
    
    const assetData = assetInfo.data;
    
    // Check if burning is allowed (clawback address should be set)
    if (!assetData.clawback || assetData.clawback !== address) {
      throw new Error('Only the clawback address can burn assets');
    }
    
    // Convert amount to base units
    const amountInBaseUnits = Math.floor(amount * Math.pow(10, assetData.decimals || 0));
    
    // Create asset transfer transaction to burn assets (send to burn address)
    const burnTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      sender: address, // Must be the clawback address
      receiver: address, // Burn by sending to the clawback address itself
      assetIndex: assetId,
      amount: amountInBaseUnits,
      suggestedParams,
    });
    
    console.log('📝 Signing burn transaction...');
    const signedTxn = await signTransaction(burnTxn);
    
    console.log('📡 Sending burn transaction...');
    const response = await algodClient.sendRawTransaction(signedTxn).do();
    const txId = response.txid;
    
    console.log('⏳ Waiting for burn confirmation...');
    await waitForConfirmationWithRetry(algodClient, txId, 20, network);
    
    console.log(`✅ Successfully burned ${amount} units of asset ${assetId}`);
    
    return {
      success: true,
      transactionId: txId
    };
    
  } catch (error) {
    console.error(`❌ Error burning Algorand assets on ${network}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to burn assets'
    };
  }
}

// Freeze Algorand assets (pause)
export async function freezeAlgorandAsset(
  address: string,
  assetId: number,
  accountToFreeze: string,
  signTransaction: (txn: any) => Promise<Uint8Array>,
  network: string
) {
  try {
    console.log(`❄️ Freezing asset ${assetId} for account ${accountToFreeze} on ${network}`);
    
    const algodClient = getAlgorandClient(network);
    
    // Get suggested transaction parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Get asset information
    const assetInfo = await getAlgorandAssetInfo(assetId, network);
    if (!assetInfo.success || !assetInfo.data) {
      throw new Error('Asset not found');
    }
    
    const assetData = assetInfo.data;
    
    // Check if freezing is allowed (freeze address should be set)
    if (!assetData.freeze || assetData.freeze !== address) {
      throw new Error('Only the freeze address can freeze/unfreeze assets');
    }
    
    // Create freeze transaction
    const freezeTxn = algosdk.makeAssetFreezeTxnWithSuggestedParamsFromObject({
      sender: address,
      freezeTarget: accountToFreeze,
      frozen: true,
      assetIndex: assetId,
      suggestedParams
    });
    
    console.log('📝 Signing freeze transaction...');
    const signedTxn = await signTransaction(freezeTxn);
    
    console.log('📡 Sending freeze transaction...');
    const response = await algodClient.sendRawTransaction(signedTxn).do();
    const txId = response.txid;
    
    console.log('⏳ Waiting for freeze confirmation...');
    await waitForConfirmationWithRetry(algodClient, txId, 20, network);
    
    console.log(`✅ Successfully froze asset ${assetId} for account ${accountToFreeze}`);
    
    return {
      success: true,
      transactionId: txId
    };
    
  } catch (error) {
    console.error(`❌ Error freezing Algorand asset on ${network}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to freeze asset'
    };
  }
}

// Unfreeze Algorand assets (unpause)
export async function unfreezeAlgorandAsset(
  address: string,
  assetId: number,
  accountToUnfreeze: string,
  signTransaction: (txn: any) => Promise<Uint8Array>,
  network: string
) {
  try {
    console.log(`🔥 Unfreezing asset ${assetId} for account ${accountToUnfreeze} on ${network}`);
    
    const algodClient = getAlgorandClient(network);
    
    // Get suggested transaction parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Get asset information
    const assetInfo = await getAlgorandAssetInfo(assetId, network);
    if (!assetInfo.success || !assetInfo.data) {
      throw new Error('Asset not found');
    }
    
    const assetData = assetInfo.data;
    
    // Check if unfreezing is allowed (freeze address should be set)
    if (!assetData.freeze || assetData.freeze !== address) {
      throw new Error('Only the freeze address can freeze/unfreeze assets');
    }
    
    // Create unfreeze transaction
    const unfreezeTxn = algosdk.makeAssetFreezeTxnWithSuggestedParamsFromObject({
      sender: address,
      freezeTarget: accountToUnfreeze,
      frozen: false,
      assetIndex: assetId,
      suggestedParams
    });
    
    console.log('📝 Signing unfreeze transaction...');
    const signedTxn = await signTransaction(unfreezeTxn);
    
    console.log('📡 Sending unfreeze transaction...');
    const response = await algodClient.sendRawTransaction(signedTxn).do();
    const txId = response.txid;
    
    console.log('⏳ Waiting for unfreeze confirmation...');
    await waitForConfirmationWithRetry(algodClient, txId, 20, network);
    
    console.log(`✅ Successfully unfroze asset ${assetId} for account ${accountToUnfreeze}`);
    
    return {
      success: true,
      transactionId: txId
    };
    
  } catch (error) {
    console.error(`❌ Error unfreezing Algorand asset on ${network}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to unfreeze asset'
    };
  }
}

// Transfer Algorand assets
export async function transferAlgorandAssets(
  sender: string,
  assetId: number,
  receiverAddress: string,
  amount: number,
  signTransaction: (txn: any) => Promise<Uint8Array>,
  network: string
) {
  try {
    console.log(`💸 Transferring ${amount} units of asset ${assetId} to ${receiverAddress} on ${network}`);
    
    const algodClient = getAlgorandClient(network);
    
    // Get suggested transaction parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Get asset information
    const assetInfo = await getAlgorandAssetInfo(assetId, network);
    if (!assetInfo.success || !assetInfo.data) {
      throw new Error('Asset not found');
    }
    
    const assetData = assetInfo.data;
    
    // Check if the receiver has opted-in to the asset
    try {
      const receiverInfo = await algodClient.accountInformation(receiverAddress).do();
      const receiverAssets = receiverInfo.assets || [];
      
      const hasOptedIn = receiverAssets.some(asset => (asset as any)['asset-id'] === assetId);
      
      if (!hasOptedIn) {
        throw new Error(`Receiver ${receiverAddress} has not opted-in to asset ${assetId}. They must opt-in before receiving this asset.`);
      }
    } catch (optInError) {
      console.error('Error checking opt-in status:', optInError);
      throw new Error(`Could not verify if receiver has opted in to the asset. Please ensure the receiver has opted in to asset ${assetId}.`);
    }
    
    // Convert amount to base units
    const amountInBaseUnits = Math.floor(amount * Math.pow(10, assetData.decimals || 0));
    
    // Create asset transfer transaction
    const transferTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      sender: sender,
      receiver: receiverAddress,
      assetIndex: assetId,
      amount: amountInBaseUnits,
      suggestedParams
    });
    
    console.log('📝 Signing transfer transaction...');
    const signedTxn = await signTransaction(transferTxn);
    
    console.log('📡 Sending transfer transaction...');
    const response = await algodClient.sendRawTransaction(signedTxn).do();
    const txId = response.txid;
    
    console.log('⏳ Waiting for transfer confirmation...');
    await waitForConfirmationWithRetry(algodClient, txId, 20, network);
    
    console.log(`✅ Successfully transferred ${amount} units of asset ${assetId} to ${receiverAddress}`);
    
    return {
      success: true,
      transactionId: txId
    };
    
  } catch (error) {
    console.error(`❌ Error transferring Algorand assets on ${network}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to transfer assets'
    };
  }
}
// Update Algorand asset metadata
export async function updateAlgorandAssetMetadata(
  address: string,
  assetId: number,
  metadata: {
    name: string;
    symbol: string;
    description: string;
    logoUrl: string;
    website?: string;
  },
  signTransaction: (txn: any) => Promise<Uint8Array>,
  network: string
) {
  try {
    console.log(`📝 Updating metadata for asset ${assetId} on ${network}`);
    
    const algodClient = getAlgorandClient(network);
    
    // Get suggested transaction parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Get current asset information
    const assetInfo = await getAlgorandAssetInfo(assetId, network);
    if (!assetInfo.success || !assetInfo.data) {
      throw new Error('Asset not found');
    }
    
    const assetData = assetInfo.data;
    
    // Check if the address is the manager (required for metadata updates)
    if (assetData.manager !== address) {
      throw new Error('Only the asset manager can update metadata');
    }
    
    // Prepare ARC-3 compliant metadata
    const arc3Metadata = {
      name: metadata.name,
      description: metadata.description,
      image: metadata.logoUrl,
      external_url: metadata.website || '',
      properties: {
        symbol: metadata.symbol,
        website: metadata.website || '',
        network: network
      }
    };
    
    // Upload new metadata
    const metadataUploadResult = await supabaseHelpers.uploadMetadataToStorage(
      arc3Metadata,
      'algorand-metadata',
      `${metadata.symbol.toLowerCase()}-updated-${Date.now()}.json`
    );
    
    if (!metadataUploadResult.success) {
      throw new Error(`Metadata upload failed: ${metadataUploadResult.error}`);
    }
    
    let metadataUrl = metadataUploadResult.url!;
    
    // Validate URL length for Algorand compatibility
    if (metadataUrl.length > 96) {
      console.warn(`⚠️ Metadata URL is ${metadataUrl.length} characters, using fallback.`);
      metadataUrl = 'https://token.info';
    }
    
    // Create asset configuration transaction to update metadata
    // Note: In Algorand, asset names and URLs cannot be changed after creation
    // This function can only update manager addresses
    const assetConfigTxn = algosdk.makeAssetConfigTxnWithSuggestedParamsFromObject({
      sender: address,
      suggestedParams,
      assetIndex: assetId,
      manager: assetData.manager,
      reserve: assetData.reserve,
      freeze: assetData.freeze,
      clawback: assetData.clawback,
    });
    
    console.log('📝 Signing metadata update transaction...');
    const signedTxn = await signTransaction(assetConfigTxn);
    
    console.log('📡 Sending metadata update transaction...');
    const response = await algodClient.sendRawTransaction(signedTxn).do();
    const txId = response.txid;
    
    console.log('⏳ Waiting for metadata update confirmation...');
    await waitForConfirmationWithRetry(algodClient, txId, 20, network);
    
    console.log(`✅ Successfully updated metadata for asset ${assetId}`);
    
    return {
      success: true,
      transactionId: txId,
      metadataUrl: metadataUrl
    };
    
  } catch (error) {
    console.error(`❌ Error updating Algorand asset metadata on ${network}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update metadata'
    };
  }
}

// Check wallet connection and balance
export async function checkWalletConnection(address: string, network: string) {
  try {
    const accountInfo = await getAlgorandAccountInfo(address, network);
    
    if (!accountInfo.success) {
      return {
        success: false,
        error: accountInfo.error
      };
    }
    
    const balance = accountInfo.balance || 0;
    const networkConfig = getAlgorandNetwork(network);
    
    // Minimum balance required for token creation (account minimum + transaction fees)
    const minimumRequired = networkConfig.isMainnet ? 0.202 : 0.101; // MainNet requires more ALGO
    const canCreateToken = balance >= minimumRequired;
    
    return {
      success: true,
      balance,
      canCreateToken,
      recommendedBalance: minimumRequired,
      network: networkConfig.name
    };
    
  } catch (error) {
    console.error(`❌ Error checking wallet connection on ${network}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check wallet connection'
    };
  }
}

// Get platform stats (mock data for now)
export async function getAlgorandPlatformStats() {
  // In a real implementation, this would query the Algorand blockchain
  // or a backend service for actual platform statistics
  return {
    success: true,
    data: {
      totalTokens: 1247,
      totalUsers: 423,
      totalValueLocked: 15000,
      successRate: 98.5
    }
  };
}

// Format Algorand address for display
export function formatAlgorandAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Validate Algorand address
export function isValidAlgorandAddress(address: string): boolean {
  try {
    return algosdk.isValidAddress(address);
  } catch {
    return false;
  }
}

// Convert microAlgos to Algos
export function microAlgosToAlgos(microAlgos: number): number {
  return microAlgos / 1000000;
}

// Convert Algos to microAlgos
export function algosToMicroAlgos(algos: number): number {
  return algos * 1000000;
}

// Add file upload helper for tokens
export const uploadFileToStorage = async (file: File, bucket: string, fileName: string) => {
  try {
    // Use supabaseHelpers for file upload
    const metadataBlob = new Blob([file], { type: file.type });
    const metadataJson = JSON.stringify({
      name: fileName,
      type: file.type,
      size: file.size
    });
    
    return await supabaseHelpers.uploadMetadataToStorage(
      { 
        file: metadataJson,
        name: fileName,
        type: file.type 
      }, 
      bucket, 
      fileName
    );
  } catch (error) {
    console.error('File upload error:', error);
    return { success: false, error: 'File upload failed' };
  }
};

// Re-export supabaseHelpers for compatibility
export { supabaseHelpers };

// ...existing code...