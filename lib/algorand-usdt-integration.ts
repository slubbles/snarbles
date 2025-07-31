/**
 * Algorand USDT Payment Integration for Pera Wallet
 * 
 * Handles USDt ASA token transfers on Algorand network
 * Compatible with Pera Wallet and other Algorand wallet adapters
 */

import * as algosdk from 'algosdk';

// Algorand USDT configuration
export const ALGORAND_USDT_CONFIG = {
  MAINNET: {
    algodServer: 'https://mainnet-api.algonode.cloud',
    indexerServer: 'https://mainnet-idx.algonode.cloud',
    usdtAssetId: 312769, // USDt Asset ID on Algorand mainnet
    receiverAddress: 'YOUR_ALGORAND_RECEIVING_ADDRESS_HERE', // Will be provided
    explorerUrl: 'https://algoexplorer.io',
    networkId: 'mainnet-v1.0'
  },
  TESTNET: {
    algodServer: 'https://testnet-api.algonode.cloud',
    indexerServer: 'https://testnet-idx.algonode.cloud',
    usdtAssetId: 10458941, // USDt Asset ID on Algorand testnet
    receiverAddress: 'YOUR_ALGORAND_TEST_RECEIVING_ADDRESS_HERE', // Will be provided
    explorerUrl: 'https://testnet.algoexplorer.io',
    networkId: 'testnet-v1.0'
  }
};

export interface AlgorandWalletInterface {
  address: string;
  signTransaction: (txn: algosdk.Transaction) => Promise<Uint8Array>;
  signTransactions?: (txns: algosdk.Transaction[]) => Promise<Uint8Array[]>;
}

export interface AlgorandUSDTTransferResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

/**
 * Get Algorand client instances
 */
function getAlgorandClients(isTestnet: boolean = true) {
  const config = isTestnet ? ALGORAND_USDT_CONFIG.TESTNET : ALGORAND_USDT_CONFIG.MAINNET;
  
  const algodClient = new algosdk.Algodv2('', config.algodServer, '');
  const indexerClient = new algosdk.Indexer('', config.indexerServer, '');
  
  return { algodClient, indexerClient, config };
}

/**
 * Check USDT balance for an Algorand address
 */
export async function getAlgorandUSDTBalance(
  userAddress: string,
  isTestnet: boolean = true
): Promise<{ success: boolean; balance: number; error?: string }> {
  try {
    console.log('🔍 [getAlgorandUSDTBalance] Starting for:', userAddress, 'isTestnet:', isTestnet);
    const { indexerClient, config } = getAlgorandClients(isTestnet);
    console.log('🔧 [getAlgorandUSDTBalance] Using config:', { 
      usdtAssetId: config.usdtAssetId, 
      network: isTestnet ? 'testnet' : 'mainnet' 
    });
    
    // Check if address is valid
    if (!algosdk.isValidAddress(userAddress)) {
      throw new Error('Invalid Algorand address');
    }
    
    // Get account information
    console.log('📡 [getAlgorandUSDTBalance] Fetching account info...');
    const accountInfo = await indexerClient.lookupAccountByID(userAddress).do();
    console.log('📊 [getAlgorandUSDTBalance] Account info received, assets count:', accountInfo.account?.assets?.length || 0);
    
    if (!accountInfo.account) {
      throw new Error('Account not found');
    }
    
    // Find USDT asset in account assets
    const assets = accountInfo.account.assets || [];
    console.log('🔍 [getAlgorandUSDTBalance] Looking for USDt asset ID:', config.usdtAssetId);
    console.log('📋 [getAlgorandUSDTBalance] Available asset IDs:', assets.map((a: any) => a.assetId.toString()));
    
    // Use the correct property name: assetId (camelCase) and convert to bigint for comparison
    const usdtAsset = assets.find((asset: any) => asset.assetId === BigInt(config.usdtAssetId));
    console.log('🎯 [getAlgorandUSDTBalance] Found USDt asset:', usdtAsset);
    
    if (!usdtAsset) {
      // Account exists but doesn't hold USDT (not opted in)
      console.log('❌ [getAlgorandUSDTBalance] USDt asset not found in account assets');
      return {
        success: true,
        balance: 0
      };
    }
    
    // USDT has 6 decimals - usdtAsset is guaranteed to exist here
    const balance = Number(usdtAsset.amount) / Math.pow(10, 6);
    console.log('✅ [getAlgorandUSDTBalance] USDt balance calculated:', balance);
    
    return {
      success: true,
      balance
    };
    
  } catch (error) {
    console.error('Error getting Algorand USDT balance:', error);
    return {
      success: false,
      balance: 0,
      error: error instanceof Error ? error.message : 'Failed to get balance'
    };
  }
}

/**
 * Check if account is opted in to USDT asset
 */
export async function isOptedInToUSDT(
  address: string,
  isTestnet: boolean = true
): Promise<{ success: boolean; optedIn: boolean }> {
  try {
    const { algodClient, config } = getAlgorandClients(isTestnet);
    
    const accountInfo = await algodClient.accountInformation(address).do();
    
    const optedIn = accountInfo.assets?.some(
      (asset: any) => asset['asset-id'] === config.usdtAssetId
    ) || false;
    
    return { success: true, optedIn };
  } catch (error) {
    console.error('Error checking USDT opt-in status:', error);
    return { success: false, optedIn: false };
  }
}

/**
 * Estimate transaction fee for USDT transfer
 */
export async function estimateAlgorandUSDTFee(
  isTestnet: boolean = true
): Promise<{ success: boolean; fee: number; error?: string }> {
  try {
    const { algodClient } = getAlgorandClients(isTestnet);
    
    // Get suggested transaction parameters
    const params = await algodClient.getTransactionParams().do();
    
    // Asset transfer fee is typically the minimum fee
    const fee = Number(params.minFee) / 1e6; // Convert microAlgos to Algos
    
    return {
      success: true,
      fee
    };
    
  } catch (error) {
    console.error('Error estimating Algorand fee:', error);
    return {
      success: false,
      fee: 0.001, // Default estimate (1000 microAlgos)
      error: error instanceof Error ? error.message : 'Failed to estimate fee'
    };
  }
}

/**
 * Create opt-in transaction for USDT asset
 */
export async function createUSDTOptInTransaction(
  userAddress: string,
  isTestnet: boolean = true
): Promise<{
  success: boolean;
  transaction?: algosdk.Transaction;
  error?: string;
}> {
  try {
    const { algodClient, config } = getAlgorandClients(isTestnet);
    
    // Get suggested parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Create asset opt-in transaction (amount = 0)
    const optInTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      sender: userAddress,
      receiver: userAddress, // Send to self for opt-in
      amount: 0,
      assetIndex: config.usdtAssetId,
      suggestedParams
    });
    
    return {
      success: true,
      transaction: optInTxn
    };
    
  } catch (error) {
    console.error('Error creating opt-in transaction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create opt-in transaction'
    };
  }
}

/**
 * Execute USDT transfer on Algorand (simplified - no auto opt-in)
 */
export async function executeAlgorandUSDTTransfer(
  walletInterface: AlgorandWalletInterface,
  usdtAmount: number,
  isTestnet: boolean = true
): Promise<AlgorandUSDTTransferResult> {
  try {
    const { algodClient, config } = getAlgorandClients(isTestnet);
    
    // Check if user is opted in first
    const optInCheck = await isOptedInToUSDT(walletInterface.address, isTestnet);
    if (!optInCheck.success || !optInCheck.optedIn) {
      return {
        success: false,
        error: 'Please opt-in to USDT first using your wallet\'s asset management feature.'
      };
    }
    
    // Get suggested parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Convert USDT amount to micro-units (6 decimals for USDT)
    const usdtAmountMicroUnits = Math.round(usdtAmount * 1_000_000);
    
    // Create asset transfer transaction
    const paymentTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      sender: walletInterface.address,
      receiver: config.receiverAddress,
      amount: usdtAmountMicroUnits,
      assetIndex: config.usdtAssetId,
      suggestedParams
    });
    
    // Sign transaction
    console.log('📱 Requesting transaction signature from Pera Wallet...');
    const signedTxn = await walletInterface.signTransaction(paymentTxn);
    
    // Add small delay to allow Pera wallet app to process the signing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Submit transaction
    console.log('📤 Submitting signed transaction to Algorand network...');
    const response = await algodClient.sendRawTransaction(signedTxn).do();
    const txId = response.txid;
    
    if (!txId) {
      throw new Error('Transaction ID not found in response');
    }
    
    console.log(`⏳ Waiting for transaction confirmation: ${txId}`);
    
    // Wait for confirmation
    await algosdk.waitForConfirmation(algodClient, txId, 4);
    
    console.log('✅ USDT transaction confirmed successfully');
    
    // Ensure Pera wallet popup closes properly on mobile
    await ensurePeraWalletPopupCloses();
    
    return {
      success: true,
      transactionHash: txId
    };
    
  } catch (error) {
    console.error('Error in USDT transfer:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'USDT transfer failed'
    };
  }
}

/**
 * Prepare USDT transfer transaction (for manual signing)
 */
export async function prepareAlgorandUSDTTransaction(
  fromAddress: string,
  usdtAmount: number,
  isTestnet: boolean = true
): Promise<{
  success: boolean;
  transaction?: algosdk.Transaction;
  fee?: number;
  error?: string;
}> {
  try {
    const { algodClient, config } = getAlgorandClients(isTestnet);
    
    // Get suggested parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Calculate amount in smallest units
    const amount = Math.floor(usdtAmount * Math.pow(10, 6));
    
    // Create asset transfer transaction
    const transferTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      sender: fromAddress,
      receiver: config.receiverAddress,
      amount,
      assetIndex: config.usdtAssetId,
      suggestedParams
    });
    
    // Calculate fee
    const fee = Number(suggestedParams.minFee) / 1e6; // Convert to Algos
    
    return {
      success: true,
      transaction: transferTxn,
      fee
    };
    
  } catch (error) {
    console.error('Error preparing Algorand transaction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to prepare transaction'
    };
  }
}

/**
 * Get transaction status and details
 */
export async function getAlgorandTransactionStatus(
  txId: string,
  isTestnet: boolean = true
): Promise<{
  success: boolean;
  status: 'pending' | 'confirmed' | 'failed';
  round?: number;
  error?: string;
}> {
  try {
    const { algodClient } = getAlgorandClients(isTestnet);
    
    try {
      const pendingInfo = await algodClient.pendingTransactionInformation(txId).do();
      
      if (pendingInfo.confirmedRound) {
        return {
          success: true,
          status: 'confirmed',
          round: Number(pendingInfo.confirmedRound)
        };
      }
      
      return {
        success: true,
        status: 'pending'
      };
      
    } catch (error: any) {
      if (error.status === 404) {
        // Transaction not found in pending pool, might be confirmed or failed
        try {
          const statusResponse = await algodClient.status().do();
          // If we can't find it and it's been a while, consider it failed
          return {
            success: true,
            status: 'failed',
            error: 'Transaction not found'
          };
        } catch {
          return {
            success: true,
            status: 'pending'
          };
        }
      }
      throw error;
    }
    
  } catch (error) {
    console.error('Error getting Algorand transaction status:', error);
    return {
      success: false,
      status: 'pending',
      error: error instanceof Error ? error.message : 'Failed to get status'
    };
  }
}



/**
 * Get transaction details from explorer
 */
export function getAlgorandExplorerUrl(txId: string, isTestnet: boolean = true): string {
  const config = isTestnet ? ALGORAND_USDT_CONFIG.TESTNET : ALGORAND_USDT_CONFIG.MAINNET;
  return `${config.explorerUrl}/tx/${txId}`;
}

/**
 * Validate Algorand address format
 */
export function isValidAlgorandAddress(address: string): boolean {
  return algosdk.isValidAddress(address);
}

/**
 * Helper function to ensure Pera wallet popup closes after transaction
 * Useful for mobile Pera wallet app integration
 */
export async function ensurePeraWalletPopupCloses(): Promise<void> {
  try {
    // Add delay to allow wallet app to process transaction completion
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Trigger a focus event to help mobile apps return to the dApp
    if (typeof window !== 'undefined') {
      window.focus();
      
      // Dispatch a custom event that components can listen to
      const event = new CustomEvent('pera-wallet-transaction-complete', {
        detail: { timestamp: Date.now() }
      });
      window.dispatchEvent(event);
      
      // For mobile apps, try to trigger a visibility change
      if (document.hidden) {
        document.dispatchEvent(new Event('visibilitychange'));
      }
    }
    
    console.log('✅ Pera wallet popup close helper executed');
  } catch (error) {
    console.warn('⚠️ Error in Pera wallet popup close helper:', error);
  }
}

/**
 * Get USDT asset information
 */
export async function getUSDTAssetInfo(isTestnet: boolean = true): Promise<{
  success: boolean;
  assetInfo?: any;
  error?: string;
}> {
  try {
    const { indexerClient, config } = getAlgorandClients(isTestnet);
    
    const assetInfo = await indexerClient.lookupAssetByID(config.usdtAssetId).do();
    
    return {
      success: true,
      assetInfo: assetInfo.asset
    };
    
  } catch (error) {
    console.error('Error getting USDT asset info:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get asset info'
    };
  }
}
