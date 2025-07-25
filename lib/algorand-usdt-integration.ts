/**
 * Algorand USDT Payment Integration for Pera Wallet
 * 
 * Handles USDt ASA token transfers on Algorand network
 * Compatible with Pera Wallet and other Algorand wallet adapters
 */

import algosdk from 'algosdk';

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
    const { indexerClient, config } = getAlgorandClients(isTestnet);
    
    // Check if address is valid
    if (!algosdk.isValidAddress(userAddress)) {
      throw new Error('Invalid Algorand address');
    }
    
    // Get account information
    const accountInfo = await indexerClient.lookupAccountByID(userAddress).do();
    
    if (!accountInfo.account) {
      throw new Error('Account not found');
    }
    
    // Find USDT asset in account assets
    const assets = accountInfo.account.assets || [];
    const usdtAsset = assets.find((asset: any) => asset['asset-id'] === config.usdtAssetId);
    
    if (!usdtAsset) {
      // Account exists but doesn't hold USDT (not opted in)
      return {
        success: true,
        balance: 0
      };
    }
    
    // USDT has 6 decimals
    const balance = Number(usdtAsset.amount) / Math.pow(10, 6);
    
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
  userAddress: string,
  isTestnet: boolean = true
): Promise<{ success: boolean; optedIn: boolean; error?: string }> {
  try {
    const { indexerClient, config } = getAlgorandClients(isTestnet);
    
    const accountInfo = await indexerClient.lookupAccountByID(userAddress).do();
    
    if (!accountInfo.account) {
      return {
        success: true,
        optedIn: false
      };
    }
    
    const assets = accountInfo.account.assets || [];
    const hasUSDT = assets.some((asset: any) => asset['asset-id'] === config.usdtAssetId);
    
    return {
      success: true,
      optedIn: hasUSDT
    };
    
  } catch (error) {
    console.error('Error checking USDT opt-in status:', error);
    return {
      success: false,
      optedIn: false,
      error: error instanceof Error ? error.message : 'Failed to check opt-in status'
    };
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
 * Execute USDT transfer on Algorand
 */
export async function executeAlgorandUSDTTransfer(
  walletInterface: AlgorandWalletInterface,
  usdtAmount: number,
  isTestnet: boolean = true
): Promise<AlgorandUSDTTransferResult> {
  try {
    const { algodClient, config } = getAlgorandClients(isTestnet);
    
    // Validate addresses
    if (!algosdk.isValidAddress(walletInterface.address)) {
      throw new Error('Invalid sender address');
    }
    
    if (!algosdk.isValidAddress(config.receiverAddress)) {
      throw new Error('Invalid receiver address');
    }
    
    // Check if sender is opted in to USDT
    const optInStatus = await isOptedInToUSDT(walletInterface.address, isTestnet);
    if (!optInStatus.success || !optInStatus.optedIn) {
      throw new Error('Sender account is not opted in to USDT. Please opt in first.');
    }
    
    // Check sender's USDT balance
    const balanceResult = await getAlgorandUSDTBalance(walletInterface.address, isTestnet);
    if (!balanceResult.success || balanceResult.balance < usdtAmount) {
      throw new Error(`Insufficient USDT balance. Available: ${balanceResult.balance}, Required: ${usdtAmount}`);
    }
    
    // Get suggested parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Calculate amount in smallest units (6 decimals for USDT)
    const amount = Math.floor(usdtAmount * Math.pow(10, 6));
    
    // Create asset transfer transaction
    const transferTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      sender: walletInterface.address,
      receiver: config.receiverAddress,
      amount,
      assetIndex: config.usdtAssetId,
      suggestedParams
    });
    
    console.log('Preparing transaction for signing...');
    
    // Sign transaction using wallet
    const signedTxn = await walletInterface.signTransaction(transferTxn);
    
    console.log('Transaction signed, submitting...');
    
    // Submit transaction
    const response = await algodClient.sendRawTransaction(signedTxn).do();
    const txId = response.txid;
    
    console.log('Transaction submitted:', txId);
    
    // Wait for confirmation
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 3);
    
    console.log('Transaction confirmed in round:', confirmedTxn.confirmedRound);
    
    return {
      success: true,
      transactionHash: txId
    };
    
  } catch (error) {
    console.error('Algorand USDT transfer error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Transfer failed'
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
