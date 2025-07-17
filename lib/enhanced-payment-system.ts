import { supabase, isSupabaseAvailable } from './supabase-client';
import { getCreditsBalance, spendCreditsForTokenCreation } from './credit-system';
import { getAlgorandClient } from './algorand';
import algosdk from 'algosdk';

export type PaymentMethod = 'credits' | 'algo_direct';

// Re-export functions from credit-system for convenience
export { getCreditsBalance } from './credit-system';

export interface PaymentResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
  details?: any;
}

/**
 * Enhanced credit system with dual payment methods
 */

// Current pricing structure
export const PRICING = {
  CREDITS_REQUIRED: 5,
  ALGO_REQUIRED: 10,
  CREDIT_TO_ALGO_RATE: 0.5, // 1 credit = 0.5 ALGO
  ALGO_TO_CREDIT_RATE: 2    // 1 ALGO = 2 credits
};

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
 * Purchase credits with ALGO
 */
export async function purchaseCreditsWithAlgo(
  walletAddress: string,
  algoAmount: number,
  signTransaction: (txn: any) => Promise<Uint8Array>
): Promise<PaymentResult> {
  try {
    // Calculate credits to receive
    const creditsToReceive = Math.floor(algoAmount * PRICING.ALGO_TO_CREDIT_RATE);
    
    // Get Algorand client
    const algodClient = getAlgorandClient('algorand-testnet'); // Default to testnet for now
    
    // Get suggested transaction parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Platform payment address - replace with actual address
    const SNARBLES_PAYMENT_ADDRESS = 'SNARBLES_PAYMENT_ADDRESS_HERE';
    
    // Create payment transaction
    const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      sender: walletAddress,
      receiver: SNARBLES_PAYMENT_ADDRESS,
      amount: algoAmount * 1000000, // Convert to microALGOs
      note: new TextEncoder().encode(`Purchase ${creditsToReceive} credits`),
      suggestedParams
    });
    
    // Sign transaction
    const signedTxn = await signTransaction(paymentTxn);
    
    // Broadcast transaction
    const txnResponse = await algodClient.sendRawTransaction(signedTxn).do();
    const txHash = txnResponse.txid;
    
    // Wait for confirmation
    await algosdk.waitForConfirmation(algodClient, txHash, 4);
    
    // Add credits to user account
    if (isSupabaseAvailable()) {
      const { error } = await supabase
        .from('credit_transactions')
        .insert({
          wallet_address: walletAddress,
          type: 'purchase',
          amount: creditsToReceive,
          description: `Purchased ${creditsToReceive} credits with ${algoAmount} ALGO`,
          transaction_hash: txHash,
          status: 'completed',
          payment_method: 'algo',
          payment_address: walletAddress
        });
      
      if (error) {
        throw new Error(`Failed to record credit purchase: ${error.message}`);
      }
      
      // Get current balance and update
      const balanceResult = await getCreditsBalance(walletAddress);
      const currentBalance = balanceResult.success ? (balanceResult.balance || 0) : 0;
      const newBalance = currentBalance + creditsToReceive;
      
      // Update user balance
      const { error: balanceError } = await supabase
        .from('user_profiles')
        .upsert({
          wallet_address: walletAddress,
          credits_balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('wallet_address', walletAddress);
      
      if (balanceError) {
        throw new Error(`Failed to update balance: ${balanceError.message}`);
      }
    }
    
    return {
      success: true,
      transactionHash: txHash,
      details: {
        algoSpent: algoAmount,
        creditsReceived: creditsToReceive,
        newBalance: creditsToReceive // This would be calculated properly
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to purchase credits'
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
    
    // Platform payment address - replace with actual address
    const SNARBLES_PAYMENT_ADDRESS = 'SNARBLES_PAYMENT_ADDRESS_HERE';
    
    // Create payment transaction
    const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      sender: walletAddress,
      receiver: SNARBLES_PAYMENT_ADDRESS,
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
