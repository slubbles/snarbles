/**
 * Multi-Network USDT Payment System for Credit Top-Up
 * 
 * Supports USDT payments from multiple blockchain networks
 * Funds go to: 0x9ca8362c35db2649614cd4029ab0067d285660ef
 */

import { supabase, isSupabaseAvailable } from './supabase-client';
import { getCreditsBalance, addCreditTransaction, updateCreditsBalance } from './credit-system';

// Receiving wallet address for all USDT payments
export const USDT_RECEIVER_ADDRESS = '0x9ca8362c35db2649614cd4029ab0067d285660ef';

// USDT pricing configuration
export const USDT_PRICING = {
  // 1 USDT = 1 credit (simple 1:1 ratio)
  USDT_TO_CREDITS_RATE: 1,
  
  // Minimum purchase amounts
  MIN_USDT_AMOUNT: 5,
  MAX_USDT_AMOUNT: 1000,
  
  // Network-specific USDT contract addresses
  USDT_CONTRACTS: {
    ethereum: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    polygon: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    bsc: '0x55d398326f99059fF775485246999027B3197955',
    arbitrum: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    optimism: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
    avalanche: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7'
  }
};

// Supported networks for USDT payments
export interface USDTNetwork {
  id: string;
  name: string;
  displayName: string;
  chainId: number;
  contractAddress: string;
  decimals: number;
  icon: string;
  explorerUrl: string;
  rpcUrl: string;
  gasEstimate: string;
  popular: boolean;
}

export const SUPPORTED_USDT_NETWORKS: USDTNetwork[] = [
  {
    id: 'ethereum',
    name: 'Ethereum',
    displayName: 'USDT (Ethereum)',
    chainId: 1,
    contractAddress: USDT_PRICING.USDT_CONTRACTS.ethereum,
    decimals: 6,
    icon: '🔷',
    explorerUrl: 'https://etherscan.io',
    rpcUrl: 'https://mainnet.infura.io/v3/',
    gasEstimate: '~$15-50',
    popular: true
  },
  {
    id: 'polygon',
    name: 'Polygon',
    displayName: 'USDT (Polygon)',
    chainId: 137,
    contractAddress: USDT_PRICING.USDT_CONTRACTS.polygon,
    decimals: 6,
    icon: '🟣',
    explorerUrl: 'https://polygonscan.com',
    rpcUrl: 'https://polygon-rpc.com',
    gasEstimate: '~$0.01-0.10',
    popular: true
  },
  {
    id: 'bsc',
    name: 'BSC',
    displayName: 'USDT (BNB Smart Chain)',
    chainId: 56,
    contractAddress: USDT_PRICING.USDT_CONTRACTS.bsc,
    decimals: 18,
    icon: '🟡',
    explorerUrl: 'https://bscscan.com',
    rpcUrl: 'https://bsc-dataseed1.binance.org',
    gasEstimate: '~$0.20-1.00',
    popular: true
  },
  {
    id: 'arbitrum',
    name: 'Arbitrum',
    displayName: 'USDT (Arbitrum)',
    chainId: 42161,
    contractAddress: USDT_PRICING.USDT_CONTRACTS.arbitrum,
    decimals: 6,
    icon: '🔵',
    explorerUrl: 'https://arbiscan.io',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    gasEstimate: '~$0.50-2.00',
    popular: false
  },
  {
    id: 'optimism',
    name: 'Optimism',
    displayName: 'USDT (Optimism)',
    chainId: 10,
    contractAddress: USDT_PRICING.USDT_CONTRACTS.optimism,
    decimals: 6,
    icon: '🔴',
    explorerUrl: 'https://optimistic.etherscan.io',
    rpcUrl: 'https://mainnet.optimism.io',
    gasEstimate: '~$0.50-2.00',
    popular: false
  },
  {
    id: 'avalanche',
    name: 'Avalanche',
    displayName: 'USDT (Avalanche C-Chain)',
    chainId: 43114,
    contractAddress: USDT_PRICING.USDT_CONTRACTS.avalanche,
    decimals: 6,
    icon: '❄️',
    explorerUrl: 'https://snowtrace.io',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    gasEstimate: '~$0.50-2.00',
    popular: false
  }
];

// USDT payment transaction interface
export interface USDTPaymentTransaction {
  id: string;
  wallet_address: string;
  usdt_amount: number;
  credits_received: number;
  network: string;
  contract_address: string;
  transaction_hash: string;
  from_address: string;
  to_address: string;
  status: 'pending' | 'confirmed' | 'failed';
  created_at: string;
  confirmed_at?: string;
  block_number?: number;
  gas_used?: number;
  gas_price?: string;
}

/**
 * Get USDT payment options and pricing
 */
export async function getUSDTPaymentOptions(): Promise<{
  success: boolean;
  options?: {
    networks: USDTNetwork[];
    pricing: {
      usdtToCreditsRate: number;
      minAmount: number;
      maxAmount: number;
    };
    receiverAddress: string;
  };
  error?: string;
}> {
  try {
    return {
      success: true,
      options: {
        networks: SUPPORTED_USDT_NETWORKS,
        pricing: {
          usdtToCreditsRate: USDT_PRICING.USDT_TO_CREDITS_RATE,
          minAmount: USDT_PRICING.MIN_USDT_AMOUNT,
          maxAmount: USDT_PRICING.MAX_USDT_AMOUNT
        },
        receiverAddress: USDT_RECEIVER_ADDRESS
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
 * Calculate credits from USDT amount
 */
export function calculateCreditsFromUSDT(usdtAmount: number): number {
  return Math.floor(usdtAmount * USDT_PRICING.USDT_TO_CREDITS_RATE);
}

/**
 * Calculate USDT amount from desired credits
 */
export function calculateUSDTFromCredits(credits: number): number {
  return credits / USDT_PRICING.USDT_TO_CREDITS_RATE;
}

/**
 * Initiate USDT payment (creates pending transaction record)
 */
export async function initiateUSDTPayment(
  walletAddress: string,
  usdtAmount: number,
  network: string,
  fromAddress: string
): Promise<{
  success: boolean;
  paymentId?: string;
  paymentDetails?: {
    id: string;
    receiverAddress: string;
    contractAddress: string;
    network: USDTNetwork;
    usdtAmount: number;
    creditsToReceive: number;
    instructions: string[];
  };
  error?: string;
}> {
  try {
    // Validate amount
    if (usdtAmount < USDT_PRICING.MIN_USDT_AMOUNT || usdtAmount > USDT_PRICING.MAX_USDT_AMOUNT) {
      throw new Error(`Amount must be between ${USDT_PRICING.MIN_USDT_AMOUNT} and ${USDT_PRICING.MAX_USDT_AMOUNT} USDT`);
    }

    // Find network
    const selectedNetwork = SUPPORTED_USDT_NETWORKS.find(n => n.id === network);
    if (!selectedNetwork) {
      throw new Error('Unsupported network');
    }

    const creditsToReceive = calculateCreditsFromUSDT(usdtAmount);
    const paymentId = `usdt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store pending payment record
    if (isSupabaseAvailable()) {
      const { error } = await supabase.from('usdt_payments').insert({
        id: paymentId,
        wallet_address: walletAddress,
        usdt_amount: usdtAmount,
        credits_received: creditsToReceive,
        network: network,
        contract_address: selectedNetwork.contractAddress,
        from_address: fromAddress,
        to_address: USDT_RECEIVER_ADDRESS,
        status: 'pending',
        created_at: new Date().toISOString()
      });

      if (error) {
        console.error('Error storing payment record:', error);
        // Continue anyway - payment can still be processed manually
      }
    }

    return {
      success: true,
      paymentId,
      paymentDetails: {
        id: paymentId,
        receiverAddress: USDT_RECEIVER_ADDRESS,
        contractAddress: selectedNetwork.contractAddress,
        network: selectedNetwork,
        usdtAmount,
        creditsToReceive,
        instructions: [
          `Send exactly ${usdtAmount} USDT to the address below`,
          `Network: ${selectedNetwork.displayName}`,
          `Contract: ${selectedNetwork.contractAddress}`,
          `Receiver: ${USDT_RECEIVER_ADDRESS}`,
          `You will receive ${creditsToReceive} credits after confirmation`
        ]
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initiate payment'
    };
  }
}

/**
 * Confirm USDT payment (called when transaction is detected)
 */
export async function confirmUSDTPayment(
  paymentId: string,
  transactionHash: string,
  blockNumber?: number,
  gasUsed?: number,
  gasPrice?: string
): Promise<{
  success: boolean;
  creditsAdded?: number;
  error?: string;
}> {
  try {
    if (!isSupabaseAvailable()) {
      throw new Error('Database not available');
    }

    // Get payment record
    const { data: payment, error: fetchError } = await supabase
      .from('usdt_payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (fetchError || !payment) {
      throw new Error('Payment record not found');
    }

    if (payment.status === 'confirmed') {
      throw new Error('Payment already confirmed');
    }

    // Update payment status
    const { error: updateError } = await supabase
      .from('usdt_payments')
      .update({
        status: 'confirmed',
        transaction_hash: transactionHash,
        confirmed_at: new Date().toISOString(),
        block_number: blockNumber,
        gas_used: gasUsed,
        gas_price: gasPrice
      })
      .eq('id', paymentId);

    if (updateError) {
      throw new Error(`Failed to update payment: ${updateError.message}`);
    }

    // Add credits to user's balance
    const currentBalanceResult = await getCreditsBalance(payment.wallet_address);
    const currentBalance = currentBalanceResult.success ? (currentBalanceResult.balance || 0) : 0;
    const newBalance = currentBalance + payment.credits_received;
    
    const creditsResult = await updateCreditsBalance(
      payment.wallet_address,
      newBalance
    );

    if (!creditsResult.success) {
      throw new Error(`Failed to add credits: ${creditsResult.error}`);
    }

    // Record credit transaction
    await addCreditTransaction(
      payment.wallet_address,
      'purchase',
      payment.credits_received,
      `USDT payment on ${payment.network}`,
      {
        transactionHash: transactionHash,
        paymentMethod: 'usdt',
        referenceId: paymentId,
        status: 'completed'
      }
    );

    return {
      success: true,
      creditsAdded: payment.credits_received
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to confirm payment'
    };
  }
}

/**
 * Get USDT payment history for a wallet
 */
export async function getUSDTPaymentHistory(
  walletAddress: string
): Promise<{
  success: boolean;
  payments?: USDTPaymentTransaction[];
  error?: string;
}> {
  try {
    if (!isSupabaseAvailable()) {
      return {
        success: true,
        payments: [] // Return empty array if no database
      };
    }

    const { data, error } = await supabase
      .from('usdt_payments')
      .select('*')
      .eq('wallet_address', walletAddress)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return {
      success: true,
      payments: data || []
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch payment history'
    };
  }
}

/**
 * Get pending USDT payments (admin function)
 */
export async function getPendingUSDTPayments(): Promise<{
  success: boolean;
  payments?: USDTPaymentTransaction[];
  error?: string;
}> {
  try {
    if (!isSupabaseAvailable()) {
      throw new Error('Database not available');
    }

    const { data, error } = await supabase
      .from('usdt_payments')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return {
      success: true,
      payments: data || []
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch pending payments'
    };
  }
}

/**
 * Generate payment instructions for manual payment
 */
export function generatePaymentInstructions(
  network: USDTNetwork,
  amount: number,
  receiverAddress: string
): string[] {
  return [
    `🔹 Send exactly ${amount} USDT`,
    `🔹 Network: ${network.displayName}`,
    `🔹 To address: ${receiverAddress}`,
    `🔹 Contract: ${network.contractAddress}`,
    `🔹 Gas estimate: ${network.gasEstimate}`,
    `🔹 Credits received: ${calculateCreditsFromUSDT(amount)}`,
    '',
    '⚠️ Important:',
    '• Send from the same wallet you connected',
    '• Double-check the receiver address',
    '• Credits will be added after 1-3 confirmations',
    '• Contact support if payment not processed within 1 hour'
  ];
}
