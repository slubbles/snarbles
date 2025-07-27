import { supabase, isSupabaseAvailable } from './supabase-client';
import { getCreditsBalance, spendCreditsForTokenCreation, addCreditTransaction } from './credit-system';
import { getAlgorandClient } from './algorand';
import { getAdminConfig } from './admin-config';
import * as algosdk from 'algosdk';

export type PaymentMethod = 'credits' | 'algo_direct';

// Re-export functions from credit-system for convenience
export { getCreditsBalance } from './credit-system';

// ALGO payment configuration
const ALGO_PAYMENT_CONFIG = {
  MAINNET: {
    receiverAddress: 'PJEIDDKUOONTJOIV3BLZS7SZSAHCVKNNHTLKMASI6RTYSOZNSDY7MWGZ3M', // Your wallet address
    algodServer: 'https://mainnet-api.algonode.cloud',
    explorerUrl: 'https://algoexplorer.io'
  },
  TESTNET: {
    receiverAddress: 'PJEIDDKUOONTJOIV3BLZS7SZSAHCVKNNHTLKMASI6RTYSOZNSDY7MWGZ3M', // Your wallet address
    algodServer: 'https://testnet-api.algonode.cloud',
    explorerUrl: 'https://testnet.algoexplorer.io'
  }
};

export interface PaymentResult {
  success: boolean;
  error?: string;
  message?: string;
  transactionHash?: string;
  creditsReceived?: number;
  newBalance?: number;
  details?: any;
}

/**
 * Enhanced credit system with dual payment methods
 */

// Current pricing structure
export const PRICING = {
  CREDITS_REQUIRED: 10,
  ALGO_REQUIRED: 10,
  CREDIT_TO_ALGO_RATE: 0.5, // 1 credit = 0.5 ALGO
  ALGO_TO_CREDIT_RATE: 2,    // 1 ALGO = 2 credits
  packages: [
    {
      credits: 20,
      priceALGO: 10,
      priceUSD: 10,
      bonus: 0,
      popular: false
    },
    {
      credits: 45,
      priceALGO: 20,
      priceUSD: 20,
      bonus: 5,
      popular: true
    },
    {
      credits: 110,
      priceALGO: 50,
      priceUSD: 50,
      bonus: 10,
      popular: false
    }
  ]
};

/**
 * Calculate credits from custom ALGO amount with bonus
 */
export function calculateCreditsFromAlgo(algoAmount: number): { credits: number; bonus: number; total: number } {
  // Base rate: 1 ALGO = 2 credits
  const baseCredits = Math.floor(algoAmount * PRICING.ALGO_TO_CREDIT_RATE);
  
  // Bonus calculation based on amount tiers
  let bonus = 0;
  if (algoAmount >= 50) {
    // 50+ ALGO gets 20% bonus
    bonus = Math.floor(baseCredits * 0.2);
  } else if (algoAmount >= 20) {
    // 20+ ALGO gets 10% bonus
    bonus = Math.floor(baseCredits * 0.1);
  } else if (algoAmount >= 10) {
    // 10+ ALGO gets 5% bonus
    bonus = Math.floor(baseCredits * 0.05);
  }
  
  return {
    credits: baseCredits,
    bonus,
    total: baseCredits + bonus
  };
}

/**
 * Get real ALGO balance for a wallet
 */
async function getAlgoBalance(walletAddress: string, network: string): Promise<number> {
  try {
    if (!network.includes('algorand')) {
      return 0;
    }
    
    const algodClient = getAlgorandClient(network);
    const accountInfo = await algodClient.accountInformation(walletAddress).do();
    
    // Convert from microALGOs to ALGOs
    return Number(accountInfo.amount) / 1000000;
  } catch (error) {
    console.error('Error getting ALGO balance:', error);
    return 0;
  }
}

/**
 * Get payment options available for a user
 */
export async function getPaymentOptions(walletAddress: string, network: string) {
  try {
    const creditsResult = await getCreditsBalance(walletAddress);
    const userCredits = creditsResult.success ? (creditsResult.balance || 0) : 0;
    
    const isMainnet = network.includes('mainnet');
    const isAlgorand = network.includes('algorand');
    
    // Get real ALGO balance if on Algorand
    let userAlgoBalance = 0;
    if (isAlgorand) {
      userAlgoBalance = await getAlgoBalance(walletAddress, network);
    }
    
    return {
      success: true,
      options: {
        credits: {
          available: userCredits >= PRICING.CREDITS_REQUIRED,
          required: PRICING.CREDITS_REQUIRED,
          balance: userCredits,
          enabled: isMainnet
        },
        algo_direct: {
          available: userAlgoBalance >= PRICING.ALGO_REQUIRED,
          required: PRICING.ALGO_REQUIRED,
          balance: userAlgoBalance,
          enabled: isMainnet && isAlgorand
        },
        testnet_free: {
          available: true,
          enabled: !isMainnet
        }
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get payment options'
    };
  }
}

/**
 * Purchase credits with ALGO (supports both packages and custom amounts)
 * NOW WITH REAL ALGO TRANSACTIONS
 */
export async function purchaseCreditsWithAlgo(
  walletAddress: string,
  algoAmount: number,
  signTransaction: (txn: algosdk.Transaction) => Promise<Uint8Array>,
  isCustomAmount: boolean = false
): Promise<PaymentResult> {
  if (!isSupabaseAvailable()) {
    return {
      success: false,
      error: 'Database not available for credit tracking'
    };
  }

  try {
    // Calculate credits to receive
    let creditsToReceive: number;
    let bonusCredits: number = 0;
    
    if (isCustomAmount) {
      const calculation = calculateCreditsFromAlgo(algoAmount);
      creditsToReceive = calculation.total;
      bonusCredits = calculation.bonus;
    } else {
      // Find matching package
      const pkg = PRICING.packages.find(p => p.priceALGO === algoAmount);
      if (!pkg) {
        throw new Error('Invalid package selected');
      }
      creditsToReceive = pkg.credits + pkg.bonus;
      bonusCredits = pkg.bonus;
    }

    console.log(`Processing REAL ALGO payment: ${algoAmount} ALGO -> ${creditsToReceive} credits (${bonusCredits} bonus)`);

    // Get Algorand client for mainnet (real transactions)
    const config = ALGO_PAYMENT_CONFIG.MAINNET;
    const algodClient = new algosdk.Algodv2('', config.algodServer, '');
    
    // Validate addresses
    if (!algosdk.isValidAddress(walletAddress)) {
      throw new Error('Invalid wallet address');
    }
    if (!algosdk.isValidAddress(config.receiverAddress)) {
      throw new Error('Invalid receiver address');
    }

    // Get account info to check balance
    const accountInfo = await algodClient.accountInformation(walletAddress).do();
    const currentBalance = Number(accountInfo.amount) / 1_000_000; // Convert microALGOs to ALGOs
    
    if (currentBalance < algoAmount + 0.001) { // Add small buffer for fees
      throw new Error(`Insufficient ALGO balance. Available: ${currentBalance.toFixed(3)} ALGO, Required: ${algoAmount + 0.001} ALGO`);
    }

    // Get suggested transaction parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Calculate amount in microALGOs
    const amountMicroAlgos = Math.floor(algoAmount * 1_000_000);
    
    // Create payment transaction - makePaymentTxnWithSuggestedParamsFromObject already returns a Transaction instance
    const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      sender: walletAddress,
      receiver: config.receiverAddress,
      amount: amountMicroAlgos,
      suggestedParams,
      note: new Uint8Array(Buffer.from(`Snarbles Credits Purchase: ${creditsToReceive} credits`))
    });

    // Debug transaction object to ensure it's the right type
    console.log('🔍 Transaction object debug:', {
      type: typeof paymentTxn,
      constructor: paymentTxn?.constructor?.name,
      isTransaction: paymentTxn instanceof algosdk.Transaction,
      hasToStringMethod: typeof paymentTxn.toString === 'function',
      hasGetTxIDMethod: typeof paymentTxn.txID === 'function'
    });

    // Ensure the transaction object is properly typed
    if (!(paymentTxn instanceof algosdk.Transaction)) {
      console.error('❌ Transaction object validation failed');
      console.error('paymentTxn:', paymentTxn);
      console.error('algosdk.Transaction:', algosdk.Transaction);
      console.error('Transaction prototype:', algosdk.Transaction.prototype);
      throw new Error('Transaction object creation failed - invalid type');
    }

    console.log('🔐 Requesting wallet signature for REAL ALGO transaction...');
    
    // Sign transaction with real wallet
    const signedTxn = await signTransaction(paymentTxn);
    
    console.log('📡 Submitting transaction to Algorand blockchain...');
    
    // Submit transaction to blockchain
    const response = await algodClient.sendRawTransaction(signedTxn).do();
    const txId = response.txid;
    
    if (!txId) {
      throw new Error('Transaction submission failed - no transaction ID returned');
    }
    
    console.log('⏳ Waiting for blockchain confirmation...', txId);
    
    // Wait for confirmation (this is the real blockchain confirmation)
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);
    
    console.log('✅ REAL ALGO transaction confirmed in round:', confirmedTxn.confirmedRound);
    
    // NOW record the REAL transaction in database
    const { success: transactionSuccess, error } = await addCreditTransaction(
      walletAddress,
      'purchase',
      creditsToReceive,
      `Purchased ${creditsToReceive} credits with ${algoAmount} ALGO${bonusCredits > 0 ? ` (${bonusCredits} bonus)` : ''}`,
      {
        transactionHash: txId,
        referenceId: txId,
        metadata: {
          algoAmount,
          baseCredits: creditsToReceive - bonusCredits,
          bonusCredits,
          isCustomAmount,
          blockRound: confirmedTxn.confirmedRound,
          realTransaction: true
        }
      }
    );
    
    if (!transactionSuccess) {
      // Transaction succeeded on blockchain but failed to record in DB
      console.error('⚠️ ALGO payment succeeded but database recording failed:', error);
      return {
        success: false,
        error: `Payment successful (TX: ${txId}) but failed to record credits. Please contact support.`,
        transactionHash: txId
      };
    }
    
    // Get current balance and update
    const balanceResult = await getCreditsBalance(walletAddress);
    const currentCreditsBalance = balanceResult.success ? (balanceResult.balance || 0) : 0;
    const newBalance = currentCreditsBalance + creditsToReceive;
    
    // Update user balance
    const { error: balanceError } = await supabase
      .from('user_profiles')
      .update({ 
        credits_balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('wallet_address', walletAddress);
    
    if (balanceError) {
      console.error('⚠️ Credits recorded but balance update failed:', balanceError);
      // Don't fail here - the transaction succeeded and was recorded
    }

    return {
      success: true,
      message: `Successfully purchased ${creditsToReceive} credits${bonusCredits > 0 ? ` (including ${bonusCredits} bonus credits)` : ''} with REAL ALGO payment!`,
      transactionHash: txId,
      creditsReceived: creditsToReceive,
      newBalance
    };

  } catch (error) {
    console.error('❌ Error in REAL ALGO credit purchase:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'ALGO payment failed'
    };
  }
}

/**
 * Process direct ALGO payment for token creation
 */
export async function processAlgoPayment(
  walletAddress: string,
  network: string,
  signTransaction: (txn: any) => Promise<Uint8Array>
): Promise<PaymentResult> {
  try {
    if (!network.includes('algorand')) {
      throw new Error('Direct ALGO payment only available on Algorand networks');
    }
    
    // Get Algorand client
    const algodClient = getAlgorandClient(network);
    
    // Get suggested transaction parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Get platform payment address from admin config
    const adminConfig = getAdminConfig();
    const platformAddress = adminConfig.feeRecipients.algorand;
    
    // Create payment transaction
    const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      sender: walletAddress,
      receiver: platformAddress,
      amount: PRICING.ALGO_REQUIRED * 1000000, // Convert to microALGOs
      note: new TextEncoder().encode(`Direct payment for token creation on ${network}`),
      suggestedParams
    });
    
    // Sign transaction
    const signedTxn = await signTransaction(paymentTxn);
    
    // Broadcast transaction
    const txnResponse = await algodClient.sendRawTransaction(signedTxn).do();
    const txHash = txnResponse.txid;
    
    // Wait for confirmation
    await algosdk.waitForConfirmation(algodClient, txHash, 4);
    
    // Record payment
    if (isSupabaseAvailable()) {
      const { error } = await supabase
        .from('credit_transactions')
        .insert({
          wallet_address: walletAddress,
          type: 'spend',
          amount: -PRICING.ALGO_REQUIRED, // Negative for payment
          description: `Direct ALGO payment for token creation on ${network}`,
          transaction_hash: txHash,
          status: 'completed',
          payment_method: 'algo_direct',
          payment_address: walletAddress
        });
      
      if (error) {
        console.error('Failed to record payment:', error);
      }
    }
    
    return {
      success: true,
      transactionHash: txHash,
      details: {
        algoSpent: PRICING.ALGO_REQUIRED,
        paymentMethod: 'algo_direct',
        network
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process ALGO payment'
    };
  }
}

/**
 * Validate payment method for token creation
 */
export async function validatePaymentForTokenCreation(
  walletAddress: string,
  network: string,
  paymentMethod: PaymentMethod
): Promise<{ success: boolean; error?: string }> {
  try {
    const isMainnet = network.includes('mainnet');
    
    // Free on testnet
    if (!isMainnet) {
      return { success: true };
    }
    
    if (paymentMethod === 'credits') {
      const creditsResult = await getCreditsBalance(walletAddress);
      if (!creditsResult.success) {
        return { success: false, error: 'Failed to check credits balance' };
      }
      
      if (creditsResult.balance && creditsResult.balance < PRICING.CREDITS_REQUIRED) {
        return { 
          success: false, 
          error: `Insufficient credits. Need ${PRICING.CREDITS_REQUIRED}, have ${creditsResult.balance}` 
        };
      }
    } else if (paymentMethod === 'algo_direct') {
      if (!network.includes('algorand')) {
        return { 
          success: false, 
          error: 'Direct ALGO payment only available on Algorand networks' 
        };
      }
      
      // For direct ALGO payment, we'll validate during the actual payment
      // This is just a preliminary check
    }
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment validation failed'
    };
  }
}

/**
 * Execute payment for token creation
 */
export async function executeTokenCreationPayment(
  walletAddress: string,
  network: string,
  paymentMethod: PaymentMethod,
  signTransaction?: (txn: any) => Promise<Uint8Array>
): Promise<PaymentResult> {
  try {
    const isMainnet = network.includes('mainnet');
    
    // Free on testnet
    if (!isMainnet) {
      return { success: true, details: { paymentMethod: 'testnet_free' } };
    }
    
    if (paymentMethod === 'credits') {
      // Use existing credit system
      const result = await spendCreditsForTokenCreation(
        walletAddress,
        PRICING.CREDITS_REQUIRED,
        `Token creation on ${network}`
      );
      
      return {
        success: result.success,
        error: result.error,
        details: {
          paymentMethod: 'credits',
          creditsSpent: PRICING.CREDITS_REQUIRED
        }
      };
    } else if (paymentMethod === 'algo_direct') {
      if (!signTransaction) {
        return { success: false, error: 'Transaction signing function required for ALGO payment' };
      }
      
      return await processAlgoPayment(walletAddress, network, signTransaction);
    }
    
    return { success: false, error: 'Invalid payment method' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment execution failed'
    };
  }
}
