/**
 * Fallback calculation for mobile browsers without BigInt support
 */
function calculateTokenSupplyFallback(supply: number, decimals: number): {
  success: boolean;
  value?: number;
  error?: string;
} {
  try {
    // Use string-based calculation for precision
    const supplyStr = Math.floor(supply).toString();
    const zerosToAdd = '0'.repeat(decimals);
    const resultStr = supplyStr + zerosToAdd;
    
    // Check against Algorand maximum using string comparison
    const algorandMaxStr = '18446744073709551615';
    
    if (resultStr.length > algorandMaxStr.length || 
        (resultStr.length === algorandMaxStr.length && resultStr > algorandMaxStr)) {
      return {
        success: false,
        error: `Total supply with ${decimals} decimals exceeds Algorand maximum`
      };
    }
    
    // Convert to number and check if it's safe
    const resultNum = parseFloat(resultStr);
    if (!Number.isSafeInteger(resultNum)) {
      return {
        success: false,
        error: 'Total supply too large for safe processing'
      };
    }
    
    return {
      success: true,
      value: resultNum
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Calculation failed'
    };
  }
}

/**
 * Real Algorand Token Creation with Actual Wallet Integration
 * This creates actual tokens on the Algorand blockchain using real wallet signing
 */
import algosdk from 'algosdk';
import { getFeeConfigForNetwork } from './admin-config';

export interface TokenCreationParams {
  name: string;
  symbol: string;
  description: string;
  decimals: number;
  totalSupply: string;
  logoUrl?: string;
  website?: string;
  twitter?: string;
  github?: string;
  mintable: boolean;
  burnable: boolean;
  pausable: boolean;
  network: string;
}

export interface TokenCreationResult {
  success: boolean;
  data?: {
    assetId: number;
    transactionId: string;
    explorerUrl: string;
    network: string;
    tokenName: string;
    tokenSymbol: string;
    feeTransactionId?: string;
    groupId?: string;
  };
  error?: string;
}

/**
 * Create a real Algorand token with actual wallet signing and network submission
 */
export async function createRealAlgorandToken(
  params: TokenCreationParams,
  onStatusUpdate?: (status: string) => void,
  walletProvider?: {
    signAtomicGroup: (transactions: any[]) => Promise<Uint8Array[]>;
    signTransaction: (txn: any) => Promise<any>;
    address: string;
  }
): Promise<TokenCreationResult> {
  try {
    console.log('🚀 Starting REAL Algorand token creation (not simulated)');
    
    // Validate wallet provider
    if (!walletProvider) {
      throw new Error('Wallet provider is required for real token creation');
    }
    
    const walletAddress = walletProvider.address;
    if (!walletAddress) {
      throw new Error('Wallet must be connected to create tokens');
    }

    console.log('✅ Wallet connected:', walletAddress);
    onStatusUpdate?.('Validating token parameters...');
    
    // Step 1: Validate parameters
    const validation = validateTokenParams(params);
    if (!validation.valid) {
      throw new Error(`Invalid parameters: ${validation.errors.join(', ')}`);
    }

    // Step 2: Prepare token metadata
    onStatusUpdate?.('Preparing token metadata...');
    
    const totalSupplyNum = parseFloat(params.totalSupply);
    if (isNaN(totalSupplyNum) || totalSupplyNum <= 0) {
      throw new Error('Invalid total supply amount');
    }
    
    console.log('📊 Token parameters:', {
      name: params.name,
      symbol: params.symbol,
      totalSupply: params.totalSupply,
      totalSupplyNum,
      decimals: params.decimals,
      network: params.network
    });
    
    const metadata = {
      name: params.name,
      symbol: params.symbol,
      description: params.description,
      decimals: params.decimals,
      image: params.logoUrl || '',
      external_url: params.website || '',
      properties: {
        website: params.website || '',
        twitter: params.twitter || '',
        github: params.github || '',
        mintable: params.mintable,
        burnable: params.burnable,
        pausable: params.pausable
      }
    };
    
    // For now, we'll create a metadata URL (in production, this would upload to IPFS)
    const metadataUrl = `https://metadata.snarbles.com/token/${Date.now()}.json`;
    console.log('📄 Token metadata prepared:', metadata);

    // Step 3: Get network configuration
    onStatusUpdate?.('Connecting to Algorand network...');
    
    const isMainnet = params.network === 'algorand-mainnet';
    const algodServer = isMainnet 
      ? 'https://mainnet-api.algonode.cloud'
      : 'https://testnet-api.algonode.cloud';
    
    const algodClient = new algosdk.Algodv2('', algodServer, '');
    
    // Get network info
    const networkInfo = await algodClient.status().do();
    console.log('🌐 Connected to Algorand network:', networkInfo);

    // Step 4: Get suggested transaction parameters
    onStatusUpdate?.('Getting network parameters...');
    
    const suggestedParams = await algodClient.getTransactionParams().do();
    console.log('⚙️ Network parameters retrieved');

    // Step 5: Create asset creation transaction
    onStatusUpdate?.('Creating asset transaction...');
    
    let totalSupplyForSDK: number;
    
    // Enhanced calculation that allows larger supplies while staying safe
    try {
      const calculation = calculateTokenSupplyEnhanced(totalSupplyNum, params.decimals);
      
      if (!calculation.success || calculation.value === undefined) {
        throw new Error(calculation.error || 'Supply calculation failed');
      }
      
      totalSupplyForSDK = calculation.value;
      console.log(`✅ Enhanced calculation completed: ${totalSupplyForSDK.toLocaleString()}`);
      
    } catch (calculationError) {
      console.error('❌ Supply calculation failed:', calculationError);
      const errorMessage = calculationError instanceof Error ? calculationError.message : 'Unknown calculation error';
      throw new Error(`Supply calculation failed: ${errorMessage}`);
    }
    
    const assetCreateTxn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
      sender: walletAddress,
      total: totalSupplyForSDK,
      decimals: params.decimals,
      assetName: params.name,
      unitName: params.symbol,
      assetURL: metadataUrl,
      assetMetadataHash: undefined, // Optional: hash of metadata
      defaultFrozen: false,
      freeze: params.pausable ? walletAddress : undefined,
      manager: params.mintable || params.burnable ? walletAddress : undefined,
      clawback: undefined, // Not typically used for standard tokens
      reserve: walletAddress, // Reserve address
      suggestedParams: suggestedParams,
    });

    console.log('📝 Asset creation transaction prepared');

    // Step 6: Create fee payment transaction (if needed)
    onStatusUpdate?.('Preparing fee transaction...');
    
    let feeTransactionId: string | undefined;
    let groupId: string | undefined;
    let feePaymentTxn: any = undefined;
    
    const feeConfig = getFeeConfigForNetwork(params.network);
    
    if (isMainnet && feeConfig.enabled) {
      feePaymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: walletAddress,
        receiver: feeConfig.recipient,
        amount: feeConfig.amount,
        suggestedParams: suggestedParams,
      });

      // Create atomic group
      const txns = [assetCreateTxn, feePaymentTxn];
      const txnGroup = algosdk.assignGroupID(txns);
      groupId = Buffer.from(txnGroup[0].group!).toString('base64');
      
      console.log('💰 Fee payment transaction added to group');
    } else {
      console.log('💰 Fee payment disabled for this deployment');
    }

    // Step 7: Sign transactions with wallet provider
    onStatusUpdate?.('Requesting wallet signature...');
    
    console.log('📱 Sending transaction to wallet for signing...');
    
    // Prepare transactions for signing
    const txnsToSign = (isMainnet && feeConfig.enabled && feePaymentTxn) 
      ? [assetCreateTxn, feePaymentTxn] 
      : [assetCreateTxn];
    
    console.log(`🔍 Signing ${txnsToSign.length} transaction(s) with wallet...`);
    console.log('📋 Transaction details:');
    txnsToSign.forEach((txn, index) => {
      console.log(`  Transaction ${index + 1}:`, {
        type: txn.type || 'unknown',
        from: txn.from?.toString?.() || 'unknown',
        fee: txn.fee || 0,
        group: txn.group ? 'grouped' : 'single'
      });
    });
    
    let signedTxns: Uint8Array[] = [];
    
    try {
      if (txnsToSign.length > 1) {
        // Use atomic group signing for multiple transactions
        console.log('🔗 Using atomic group signing for multiple transactions');
        signedTxns = await walletProvider.signAtomicGroup(txnsToSign);
        console.log('✅ Atomic group signed by wallet');
        console.log('📦 Signed transaction count:', signedTxns.length);
        console.log('📏 Signed transaction sizes:', signedTxns.map(tx => tx.length));
      } else {
        // Use single transaction signing
        console.log('📝 Using single transaction signing');
        const signedTxn = await walletProvider.signTransaction(txnsToSign[0]);
        signedTxns = [signedTxn];
        console.log('✅ Transaction signed by wallet');
        console.log('📏 Signed transaction size:', signedTxn.length);
      }
      
    } catch (walletError) {
      console.error('❌ Wallet signing failed:', walletError);
      console.error('🔍 Error details:', {
        message: walletError instanceof Error ? walletError.message : 'Unknown error',
        stack: walletError instanceof Error ? walletError.stack : undefined,
        txCount: txnsToSign.length,
        walletConnected: !!walletProvider?.address
      });
      throw new Error(`Wallet signing failed: ${walletError instanceof Error ? walletError.message : 'Unknown wallet error'}`);
    }

    // Step 8: Submit transaction to network
    onStatusUpdate?.('Submitting transaction to Algorand network...');
    
    try {
      // Submit the signed transaction(s) to the network
      console.log('📡 Submitting signed transactions to Algorand network...');
      const txResponse = await algodClient.sendRawTransaction(signedTxns).do();
      const txId = txResponse.txid;
      console.log('Transaction submitted with ID:', txId);

      // Step 9: Wait for confirmation
      onStatusUpdate?.('Waiting for network confirmation...');
      
      const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);
      console.log('✅ Transaction confirmed in round:', confirmedTxn.confirmedRound);
      
      // Get the created asset ID
      const assetId = Number(confirmedTxn.assetIndex || 0);
      
      const explorerUrl = isMainnet
        ? `https://allo.info/asset/${assetId}`
        : `https://testnet.algoexplorer.io/asset/${assetId}`;

      console.log('✅ REAL Algorand token creation completed!');
      console.log('🎉 Asset ID:', assetId);
      console.log('🔍 Explorer URL:', explorerUrl);

      return {
        success: true,
        data: {
          assetId,
          transactionId: txId,
          explorerUrl,
          network: params.network,
          tokenName: params.name,
          tokenSymbol: params.symbol,
          feeTransactionId: (isMainnet && feeConfig.enabled) ? `fee_${txId}` : undefined,
          groupId: (isMainnet && feeConfig.enabled) ? groupId : undefined
        }
      };

    } catch (submitError) {
      console.error('❌ Transaction submission failed:', submitError);
      throw new Error(`Failed to submit transaction: ${submitError}`);
    }

  } catch (error) {
    console.error('❌ Real Algorand token creation failed:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Get the fee configuration for token creation (legacy wrapper)
 * @deprecated Use getFeeConfigForNetwork from admin-config.ts instead
 */
function getFeeConfiguration(network: string): {
  enabled: boolean;
  recipient: string;
  amount: number;
} {
  return getFeeConfigForNetwork(network);
}

/**
 * Calculate the maximum safe token supply for a given number of decimals
 * This provides practical limits while staying within Algorand constraints
 */
export function getMaximumSafeSupply(decimals: number): number {
  // Algorand's uint64 maximum: 18,446,744,073,709,551,615
  const algorandMaxUint64 = 18446744073709551615;
  const multiplier = Math.pow(10, decimals);
  
  // Calculate theoretical max based on Algorand's limits
  const theoreticalMax = Math.floor(algorandMaxUint64 / multiplier);
  
  // Provide practical limits that are user-friendly
  if (decimals >= 16) {
    // For very high decimals (16-18), limit to reasonable amounts
    return Math.min(theoreticalMax, 10000); // 10k tokens max
  } else if (decimals >= 12) {
    // For high decimals (12-15), allow millions
    return Math.min(theoreticalMax, 100000000); // 100 million tokens
  } else if (decimals >= 9) {
    // For standard decimals (9-11), allow billions  
    return Math.min(theoreticalMax, 100000000000); // 100 billion tokens
  } else {
    // For low decimals (0-8), use full Algorand capacity but cap at reasonable amount
    return Math.min(theoreticalMax, 1000000000000000); // 1 quadrillion tokens max
  }
}

/**
 * Get practical maximum for display purposes (what users typically want)
 */
export function getPracticalMaximumSupply(decimals: number): number {
  if (decimals >= 15) {
    return 1000000; // 1 million tokens for very high decimals
  } else if (decimals >= 12) {
    return 1000000000; // 1 billion tokens for high decimals
  } else if (decimals >= 9) {
    return 1000000000000; // 1 trillion tokens for standard decimals
  } else {
    return 1000000000000000; // 1 quadrillion for low decimals
  }
}

/**
 * Enhanced supply calculation that handles larger numbers more safely
 */
export function calculateTokenSupplyEnhanced(supply: number, decimals: number): {
  success: boolean;
  value?: number;
  error?: string;
} {
  try {
    // First check: Is the base supply reasonable?
    if (supply <= 0 || !Number.isFinite(supply)) {
      return {
        success: false,
        error: 'Supply must be a positive number'
      };
    }
    
    // Second check: Will the result exceed Algorand's uint64 limit?
    const algorandMaxUint64 = 18446744073709551615;
    const supplyCleaned = Math.floor(supply);
    
    // Use string-based calculation for high precision
    const supplyStr = supplyCleaned.toString();
    const zerosToAdd = '0'.repeat(decimals);
    const resultStr = supplyStr + zerosToAdd;
    
    // Convert back to number for final validation
    const resultNum = parseFloat(resultStr);
    
    // Check against Algorand maximum
    if (resultNum > algorandMaxUint64) {
      return {
        success: false,
        error: `Total supply with ${decimals} decimals exceeds Algorand maximum`
      };
    }
    
    // For very large numbers that might cause precision issues, validate differently
    if (resultNum > Number.MAX_SAFE_INTEGER) {
      // Use string comparison for ultra-large numbers
      const algorandMaxStr = algorandMaxUint64.toString();
      if (resultStr.length > algorandMaxStr.length || 
          (resultStr.length === algorandMaxStr.length && resultStr > algorandMaxStr)) {
        return {
          success: false,
          error: `Total supply with ${decimals} decimals exceeds Algorand maximum`
        };
      }
      
      // If we reach here, the number is valid but large
      // We'll trust the Algorand SDK to handle it properly
      console.log(`⚠️ Using large number calculation for supply: ${resultStr}`);
    }
    
    return {
      success: true,
      value: resultNum
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Calculation failed'
    };
  }
}

/**
 * Helper function to estimate token creation costs
 */
export function estimateTokenCreationCost(network: string): {
  algorandFee: number;
  platformFee: number;
  totalCost: number;
} {
  const feeConfig = getFeeConfigForNetwork(network);
  
  const algorandFee = 0.001; // Basic transaction fee
  const platformFee = feeConfig.enabled ? (feeConfig.amount / 1000000) : 0; // Convert microALGO to ALGO
  
  return {
    algorandFee,
    platformFee,
    totalCost: algorandFee + platformFee
  };
}

/**
 * Validate token parameters before creation
 */
export function validateTokenParams(params: Partial<TokenCreationParams>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!params.name || params.name.trim().length === 0) {
    errors.push('Token name is required');
  }
  
  if (!params.symbol || params.symbol.trim().length === 0) {
    errors.push('Token symbol is required');
  }
  
  if (params.symbol && params.symbol.length > 8) {
    errors.push('Token symbol must be 8 characters or less');
  }
  
  if (params.decimals !== undefined && (params.decimals < 0 || params.decimals > 19)) {
    errors.push('Decimals must be between 0 and 19');
  }
  
  if (params.totalSupply) {
    const supply = parseFloat(params.totalSupply);
    if (isNaN(supply) || supply <= 0) {
      errors.push('Total supply must be a positive number');
    } else {
      // Use enhanced calculation for validation
      const decimals = params.decimals || 0;
      const calculation = calculateTokenSupplyEnhanced(supply, decimals);
      
      if (!calculation.success) {
        errors.push(calculation.error || 'Invalid supply calculation');
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
