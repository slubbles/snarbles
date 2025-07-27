/**
 * Enhanced Credit System with ALGO Payment Support
 * 
 * Supports two payment methods:
 * 1. Direct ALGO payment (10 ALGO)
 * 2. Credits system (10 credits)
 */

import { supabase, isSupabaseAvailable } from './supabase-client';
import { getAlgorandClient } from './algorand';
import { getCreditsBalance, updateCreditsBalance, addCreditTransaction } from './credit-system';
import { getAdminConfig } from './admin-config';
import * as algosdk from 'algosdk';

// Enhanced pricing configuration
export const PRICING_CONFIG = {
  // Mainnet token creation costs
  mainnet: {
    direct_algo: 10,      // 10 ALGO for direct payment
    credits: 10,          // 10 credits for credit system
    credits_to_algo: 2    // 1 credit = 2 ALGO value
  },
  // Testnet remains free
  testnet: {
    direct_algo: 0,
    credits: 0,
    credits_to_algo: 0
  }
};

// Payment method types
export type PaymentMethod = 'direct_algo' | 'credits';

// Enhanced payment interface
export interface PaymentInfo {
  method: PaymentMethod;
  amount: number;
  currency: 'ALGO' | 'credits';
  network: string;
  estimated_cost_usd?: number;
}

// ALGO payment transaction interface
export interface AlgoPaymentTransaction {
  id: string;
  wallet_address: string;
  amount_algo: number;
  recipient_address: string;
  transaction_hash: string;
  network: string;
  purpose: string;
  status: 'pending' | 'confirmed' | 'failed';
  created_at: string;
  confirmed_at?: string;
  block_number?: number;
}

/**
 * Get payment options for token creation
 */
export async function getPaymentOptions(
  network: string,
  walletAddress: string
): Promise<{
  success: boolean;
  options?: {
    direct_algo: PaymentInfo;
    credits: PaymentInfo;
    user_credits_balance: number;
    user_algo_balance?: number;
    recommended_method: PaymentMethod;
  };
  error?: string;
}> {
  try {
    const isMainnet = network.includes('mainnet');
    const pricing = isMainnet ? PRICING_CONFIG.mainnet : PRICING_CONFIG.testnet;
    
    // Get user's current credits balance
    const creditsResult = await getCreditsBalance(walletAddress);
    const userCreditsBalance = creditsResult.success ? (creditsResult.balance || 0) : 0;
    
    // Get user's ALGO balance if on Algorand network
    let userAlgoBalance: number | undefined;
    if (network.includes('algorand')) {
      try {
        const algoBalance = await getAlgorandBalance(walletAddress, network);
        userAlgoBalance = algoBalance;
      } catch (error) {
        console.warn('Could not fetch ALGO balance:', error);
      }
    }
    
    // Payment options
    const directAlgoOption: PaymentInfo = {
      method: 'direct_algo',
      amount: pricing.direct_algo,
      currency: 'ALGO',
      network,
      estimated_cost_usd: pricing.direct_algo * 0.15 // Rough ALGO price estimate
    };
    
    const creditsOption: PaymentInfo = {
      method: 'credits',
      amount: pricing.credits,
      currency: 'credits',
      network,
      estimated_cost_usd: pricing.credits * pricing.credits_to_algo * 0.15
    };
    
    // Recommend payment method based on user's balances
    let recommendedMethod: PaymentMethod = 'credits';
    
    if (isMainnet) {
      if (userCreditsBalance >= pricing.credits) {
        recommendedMethod = 'credits';
      } else if (userAlgoBalance && userAlgoBalance >= pricing.direct_algo) {
        recommendedMethod = 'direct_algo';
      } else {
        recommendedMethod = 'credits'; // Default to credits, user will need to top up
      }
    }
    
    return {
      success: true,
      options: {
        direct_algo: directAlgoOption,
        credits: creditsOption,
        user_credits_balance: userCreditsBalance,
        user_algo_balance: userAlgoBalance,
        recommended_method: recommendedMethod
      }
    };
    
  } catch (error) {
    console.error('Error getting payment options:', error);
    return {
      success: false,
      error: 'Failed to get payment options'
    };
  }
}

/**
 * Get user's ALGO balance
 */
async function getAlgorandBalance(walletAddress: string, network: string): Promise<number> {
  const algodClient = getAlgorandClient(network);
  
  try {
    const accountInfo = await algodClient.accountInformation(walletAddress).do();
    return Number(accountInfo.amount) / 1000000; // Convert microALGOs to ALGOs
  } catch (error) {
    console.error('Error fetching ALGO balance:', error);
    throw error;
  }
}

/**
 * Process direct ALGO payment for token creation
 */
export async function processAlgoPayment(
  walletAddress: string,
  amount: number,
  network: string,
  signTransaction: (txn: any) => Promise<Uint8Array>,
  purpose: string = 'Token Creation'
): Promise<{
  success: boolean;
  transaction_hash?: string;
  payment_record?: AlgoPaymentTransaction;
  error?: string;
}> {
  try {
    const algodClient = getAlgorandClient(network);
    
    // Get platform wallet address from admin config
    const adminConfig = getAdminConfig();
    const PLATFORM_WALLET = adminConfig.feeRecipients.algorand;
    
    // Get suggested transaction parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Create payment transaction
    const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      sender: walletAddress,
      receiver: PLATFORM_WALLET,
      amount: amount * 1000000, // Convert ALGO to microALGOs
      suggestedParams,
      note: new TextEncoder().encode(`Snarbles: ${purpose}`)
    });
    
    // Sign transaction
    const signedTxn = await signTransaction(paymentTxn);
    
    // Submit to network
    const txnResponse = await algodClient.sendRawTransaction(signedTxn).do();
    const transactionHash = txnResponse.txid;
    
    // Wait for confirmation
    const confirmedTxn = await algosdk.waitForConfirmation(
      algodClient,
      transactionHash,
      4
    );
    
    // Record the payment
    const paymentRecord: Omit<AlgoPaymentTransaction, 'id' | 'created_at'> = {
      wallet_address: walletAddress,
      amount_algo: amount,
      recipient_address: PLATFORM_WALLET,
      transaction_hash: transactionHash,
      network,
      purpose,
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
      block_number: confirmedTxn.confirmedRound ? Number(confirmedTxn.confirmedRound) : undefined
    };
    
    // Save payment record to database
    if (isSupabaseAvailable()) {
      await supabase
        .from('algo_payment_transactions')
        .insert([{
          ...paymentRecord,
          created_at: new Date().toISOString()
        }]);
    }
    
    return {
      success: true,
      transaction_hash: transactionHash,
      payment_record: paymentRecord as AlgoPaymentTransaction
    };
    
  } catch (error) {
    console.error('Error processing ALGO payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment failed'
    };
  }
}

/**
 * Purchase credits with ALGO
 */
export async function purchaseCreditsWithAlgo(
  walletAddress: string,
  algoAmount: number,
  network: string,
  signTransaction: (txn: any) => Promise<Uint8Array>
): Promise<{
  success: boolean;
  credits_purchased?: number;
  transaction_hash?: string;
  new_balance?: number;
  error?: string;
}> {
  try {
    // Calculate credits based on conversion rate
    const creditsPerAlgo = 1 / PRICING_CONFIG.mainnet.credits_to_algo; // 0.5 credits per ALGO
    const creditsToPurchase = Math.floor(algoAmount * creditsPerAlgo);
    
    // Process ALGO payment
    const paymentResult = await processAlgoPayment(
      walletAddress,
      algoAmount,
      network,
      signTransaction,
      'Credits Purchase'
    );
    
    if (!paymentResult.success) {
      return {
        success: false,
        error: paymentResult.error
      };
    }
    
    // Add credits to user's balance
    const currentBalance = await getCreditsBalance(walletAddress);
    const newBalance = (currentBalance.balance || 0) + creditsToPurchase;
    
    const updateResult = await updateCreditsBalance(walletAddress, newBalance);
    if (!updateResult.success) {
      return {
        success: false,
        error: 'Payment successful but failed to update credits balance'
      };
    }
    
    // Record the credit purchase transaction
    await addCreditTransaction(
      walletAddress,
      'purchase',
      creditsToPurchase,
      `Purchased ${creditsToPurchase} credits with ${algoAmount} ALGO`,
      {
        transactionHash: paymentResult.transaction_hash,
        paymentMethod: 'ALGO',
        status: 'completed'
      }
    );
    
    return {
      success: true,
      credits_purchased: creditsToPurchase,
      transaction_hash: paymentResult.transaction_hash,
      new_balance: newBalance
    };
    
  } catch (error) {
    console.error('Error purchasing credits with ALGO:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to purchase credits'
    };
  }
}

/**
 * Validate payment before token creation
 */
export async function validatePaymentForTokenCreation(
  walletAddress: string,
  paymentMethod: PaymentMethod,
  network: string
): Promise<{
  success: boolean;
  can_proceed: boolean;
  payment_info?: PaymentInfo;
  error?: string;
}> {
  try {
    const paymentOptions = await getPaymentOptions(network, walletAddress);
    
    if (!paymentOptions.success || !paymentOptions.options) {
      return {
        success: false,
        can_proceed: false,
        error: 'Failed to get payment options'
      };
    }
    
    const { options } = paymentOptions;
    
    if (paymentMethod === 'credits') {
      const requiredCredits = options.credits.amount;
      const hasEnoughCredits = options.user_credits_balance >= requiredCredits;
      
      return {
        success: true,
        can_proceed: hasEnoughCredits,
        payment_info: options.credits,
        error: hasEnoughCredits ? undefined : 
               `Insufficient credits. Need ${requiredCredits}, have ${options.user_credits_balance}`
      };
    } else {
      const requiredAlgo = options.direct_algo.amount;
      const hasEnoughAlgo = (options.user_algo_balance || 0) >= requiredAlgo;
      
      return {
        success: true,
        can_proceed: hasEnoughAlgo,
        payment_info: options.direct_algo,
        error: hasEnoughAlgo ? undefined : 
               `Insufficient ALGO. Need ${requiredAlgo}, have ${options.user_algo_balance || 0}`
      };
    }
    
  } catch (error) {
    console.error('Error validating payment:', error);
    return {
      success: false,
      can_proceed: false,
      error: error instanceof Error ? error.message : 'Payment validation failed'
    };
  }
}

// Re-export existing functions for backward compatibility
export {
  getUserProfile,
  createUserProfile,
  updateUserProfile,
  getCreditsBalance,
  updateCreditsBalance,
  hasEnoughCredits,
  spendCreditsForTokenCreation,
  addCreditTransaction,
  addTokenCreationRecord
} from './credit-system';
