/**
 * Solana USDT Payment Integration for Phantom Wallet
 * 
 * Handles SPL-USDT token transfers on Solana network
 * Compatible with Phantom, Solflare, and other Solana wallet adapters
 */

import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { 
  TOKEN_PROGRAM_ID, 
  createTransferInstruction, 
  getAssociatedTokenAddress,
  getAccount,
  TokenAccountNotFoundError,
  TokenInvalidAccountOwnerError
} from '@solana/spl-token';

// Solana USDT configuration
export const SOLANA_USDT_CONFIG = {
  MAINNET: {
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    usdtMint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // SPL-USDT
    receiverAddress: 'YOUR_SOLANA_RECEIVING_ADDRESS_HERE', // Convert from 0x9ca8362c35db2649614cd4029ab0067d285660ef
    explorerUrl: 'https://explorer.solana.com'
  },
  DEVNET: {
    rpcUrl: 'https://api.devnet.solana.com',
    usdtMint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // Same mint for testing
    receiverAddress: 'YOUR_SOLANA_RECEIVING_ADDRESS_HERE',
    explorerUrl: 'https://explorer.solana.com'
  }
};

export interface SolanaWalletInterface {
  publicKey: PublicKey;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
}

export interface SolanaUSDTTransferResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

/**
 * Check USDT balance for a Solana address
 */
export async function getSolanaUSDTBalance(
  userAddress: string,
  isTestnet: boolean = true
): Promise<{ success: boolean; balance: number; error?: string }> {
  try {
    const config = isTestnet ? SOLANA_USDT_CONFIG.DEVNET : SOLANA_USDT_CONFIG.MAINNET;
    const connection = new Connection(config.rpcUrl);
    
    const userPubkey = new PublicKey(userAddress);
    const mintPubkey = new PublicKey(config.usdtMint);
    
    // Get associated token account
    const tokenAccount = await getAssociatedTokenAddress(mintPubkey, userPubkey);
    
    try {
      const accountInfo = await getAccount(connection, tokenAccount);
      const balance = Number(accountInfo.amount) / Math.pow(10, 6); // USDT has 6 decimals
      
      return {
        success: true,
        balance
      };
    } catch (error) {
      if (error instanceof TokenAccountNotFoundError) {
        // Account doesn't exist = 0 balance
        return {
          success: true,
          balance: 0
        };
      }
      throw error;
    }
  } catch (error) {
    console.error('Error getting Solana USDT balance:', error);
    return {
      success: false,
      balance: 0,
      error: error instanceof Error ? error.message : 'Failed to get balance'
    };
  }
}

/**
 * Estimate transaction fee for USDT transfer
 */
export async function estimateSolanaUSDTFee(
  isTestnet: boolean = true
): Promise<{ success: boolean; fee: number; error?: string }> {
  try {
    const config = isTestnet ? SOLANA_USDT_CONFIG.DEVNET : SOLANA_USDT_CONFIG.MAINNET;
    const connection = new Connection(config.rpcUrl);
    
    // Get recent fee information
    const { feeCalculator } = await connection.getRecentBlockhash();
    const fee = feeCalculator.lamportsPerSignature / 1e9; // Convert to SOL
    
    return {
      success: true,
      fee
    };
  } catch (error) {
    console.error('Error estimating Solana fee:', error);
    return {
      success: false,
      fee: 0.00025, // Default estimate
      error: error instanceof Error ? error.message : 'Failed to estimate fee'
    };
  }
}

/**
 * Execute USDT transfer on Solana
 */
export async function executeSolanaUSDTTransfer(
  walletInterface: SolanaWalletInterface,
  usdtAmount: number,
  isTestnet: boolean = true
): Promise<SolanaUSDTTransferResult> {
  try {
    const config = isTestnet ? SOLANA_USDT_CONFIG.DEVNET : SOLANA_USDT_CONFIG.MAINNET;
    const connection = new Connection(config.rpcUrl);
    
    const fromPubkey = walletInterface.publicKey;
    const toPubkey = new PublicKey(config.receiverAddress);
    const mintPubkey = new PublicKey(config.usdtMint);
    
    // Validate addresses
    if (!PublicKey.isOnCurve(fromPubkey.toBytes())) {
      throw new Error('Invalid sender address');
    }
    
    if (!PublicKey.isOnCurve(toPubkey.toBytes())) {
      throw new Error('Invalid receiver address');
    }
    
    // Get associated token accounts
    const fromTokenAccount = await getAssociatedTokenAddress(mintPubkey, fromPubkey);
    const toTokenAccount = await getAssociatedTokenAddress(mintPubkey, toPubkey);
    
    // Check sender's USDT balance
    const balanceResult = await getSolanaUSDTBalance(fromPubkey.toString(), isTestnet);
    if (!balanceResult.success || balanceResult.balance < usdtAmount) {
      throw new Error(`Insufficient USDT balance. Available: ${balanceResult.balance}, Required: ${usdtAmount}`);
    }
    
    // Calculate amount in smallest units (6 decimals for USDT)
    const amount = BigInt(Math.floor(usdtAmount * Math.pow(10, 6)));
    
    // Create transfer instruction
    const transferInstruction = createTransferInstruction(
      fromTokenAccount, // Source token account
      toTokenAccount,   // Destination token account
      fromPubkey,       // Owner of source account
      amount,           // Amount to transfer
      [],               // Multi-signers (none)
      TOKEN_PROGRAM_ID  // Token program ID
    );
    
    // Create transaction
    const transaction = new Transaction().add(transferInstruction);
    transaction.feePayer = fromPubkey;
    
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    
    // Sign transaction using wallet
    const signedTransaction = await walletInterface.signTransaction(transaction);
    
    // Send transaction
    const signature = await connection.sendRawTransaction(
      signedTransaction.serialize(),
      {
        skipPreflight: false,
        preflightCommitment: 'confirmed'
      }
    );
    
    console.log('Transaction sent:', signature);
    
    // Confirm transaction
    const confirmation = await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight: (await connection.getLatestBlockhash()).lastValidBlockHeight
    }, 'confirmed');
    
    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${confirmation.value.err}`);
    }
    
    console.log('Transaction confirmed:', signature);
    
    return {
      success: true,
      transactionHash: signature
    };
    
  } catch (error) {
    console.error('Solana USDT transfer error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Transfer failed'
    };
  }
}

/**
 * Create and prepare USDT transfer transaction (for manual signing)
 */
export async function prepareSolanaUSDTTransaction(
  fromAddress: string,
  usdtAmount: number,
  isTestnet: boolean = true
): Promise<{
  success: boolean;
  transaction?: Transaction;
  fee?: number;
  error?: string;
}> {
  try {
    const config = isTestnet ? SOLANA_USDT_CONFIG.DEVNET : SOLANA_USDT_CONFIG.MAINNET;
    const connection = new Connection(config.rpcUrl);
    
    const fromPubkey = new PublicKey(fromAddress);
    const toPubkey = new PublicKey(config.receiverAddress);
    const mintPubkey = new PublicKey(config.usdtMint);
    
    // Get associated token accounts
    const fromTokenAccount = await getAssociatedTokenAddress(mintPubkey, fromPubkey);
    const toTokenAccount = await getAssociatedTokenAddress(mintPubkey, toPubkey);
    
    // Calculate amount in smallest units
    const amount = BigInt(Math.floor(usdtAmount * Math.pow(10, 6)));
    
    // Create transfer instruction
    const transferInstruction = createTransferInstruction(
      fromTokenAccount,
      toTokenAccount,
      fromPubkey,
      amount,
      [],
      TOKEN_PROGRAM_ID
    );
    
    // Create transaction
    const transaction = new Transaction().add(transferInstruction);
    transaction.feePayer = fromPubkey;
    
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    
    // Estimate fee
    const feeResult = await estimateSolanaUSDTFee(isTestnet);
    
    return {
      success: true,
      transaction,
      fee: feeResult.fee
    };
    
  } catch (error) {
    console.error('Error preparing Solana transaction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to prepare transaction'
    };
  }
}

/**
 * Validate Solana address format
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    const pubkey = new PublicKey(address);
    return PublicKey.isOnCurve(pubkey.toBytes());
  } catch {
    return false;
  }
}

/**
 * Get transaction status and details
 */
export async function getSolanaTransactionStatus(
  signature: string,
  isTestnet: boolean = true
): Promise<{
  success: boolean;
  status: 'pending' | 'confirmed' | 'failed';
  confirmations?: number;
  error?: string;
}> {
  try {
    const config = isTestnet ? SOLANA_USDT_CONFIG.DEVNET : SOLANA_USDT_CONFIG.MAINNET;
    const connection = new Connection(config.rpcUrl);
    
    const status = await connection.getSignatureStatus(signature);
    
    if (!status.value) {
      return {
        success: true,
        status: 'pending'
      };
    }
    
    if (status.value.err) {
      return {
        success: true,
        status: 'failed',
        error: `Transaction failed: ${status.value.err}`
      };
    }
    
    return {
      success: true,
      status: 'confirmed',
      confirmations: status.value.confirmations || 0
    };
    
  } catch (error) {
    console.error('Error getting transaction status:', error);
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
export function getSolanaExplorerUrl(signature: string, isTestnet: boolean = true): string {
  const cluster = isTestnet ? '?cluster=devnet' : '';
  return `${SOLANA_USDT_CONFIG.DEVNET.explorerUrl}/tx/${signature}${cluster}`;
}

// Configuration is already exported above
