import { 
  Connection, 
  PublicKey, 
  Keypair, 
  Transaction, 
  SystemProgram,
  LAMPORTS_PER_SOL,
  VersionedTransaction,
  TransactionMessage
} from '@solana/web3.js';
import { 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  getMinimumBalanceForRentExemptMint,
  getAssociatedTokenAddress,
  MINT_SIZE
} from '@solana/spl-token';

// Import existing connection
import { connection } from './solana';
import { handleMobileWalletError, showMobileWalletError } from './mobile-wallet-error-handler';

// Mobile-specific wallet interface
export interface MobileWalletInterface {
  publicKey: PublicKey;
  signTransaction: (txn: Transaction | VersionedTransaction) => Promise<Transaction | VersionedTransaction>;
  signAllTransactions?: (txns: (Transaction | VersionedTransaction)[]) => Promise<(Transaction | VersionedTransaction)[]>;
  isPhantom?: boolean;
  isOKX?: boolean;
  isMobile?: boolean;
}

// Mobile-specific error types
export class MobileWalletError extends Error {
  constructor(message: string, public code: string, public userAction?: string) {
    super(message);
    this.name = 'MobileWalletError';
  }
}

// Detect mobile environment and wallet type
function detectMobileWalletEnvironment(): {
  isMobile: boolean;
  isPhantom: boolean;
  isOKX: boolean;
  isInAppBrowser: boolean;
  walletApp: string | null;
} {
  if (typeof window === 'undefined') {
    return { isMobile: false, isPhantom: false, isOKX: false, isInAppBrowser: false, walletApp: null };
  }

  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  
  // Check for specific wallet apps
  const isPhantom = !!(window as any).phantom?.solana?.isPhantom;
  const isOKX = !!(window as any).okxwallet?.solana;
  
  // Check if we're in an in-app browser
  const isInAppBrowser = userAgent.includes('wv') || // Android WebView
                        userAgent.includes('fbav') || // Facebook
                        userAgent.includes('instagram') ||
                        userAgent.includes('twitter') ||
                        userAgent.includes('linkedin');

  let walletApp = null;
  if (isPhantom) walletApp = 'phantom';
  else if (isOKX) walletApp = 'okx';

  return { isMobile, isPhantom, isOKX, isInAppBrowser, walletApp };
}

// Mobile-optimized transaction building
export async function buildMobileOptimizedTransaction(
  wallet: MobileWalletInterface,
  tokenData: {
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: number;
    logoUrl: string;
    mintable: boolean;
  },
  onProgress?: (step: string, message: string, details?: any) => void
): Promise<{ transaction: Transaction; mintKeypair: Keypair; tokenAccount: PublicKey }> {
  
  onProgress?.('validation', 'Validating wallet connection...');
  
  // Enhanced wallet validation for mobile
  if (!wallet?.publicKey) {
    throw new MobileWalletError(
      'Wallet not connected', 
      'WALLET_NOT_CONNECTED',
      'Please connect your wallet and try again'
    );
  }

  // Check SOL balance with mobile-friendly error messages
  onProgress?.('balance-check', 'Checking SOL balance...');
  const balance = await connection.getBalance(wallet.publicKey);
  const solBalance = balance / LAMPORTS_PER_SOL;
  
  if (solBalance < 0.02) {
    throw new MobileWalletError(
      `Insufficient SOL balance (${solBalance.toFixed(4)} SOL). Need at least 0.02 SOL for transaction fees.`,
      'INSUFFICIENT_BALANCE',
      'Please add more SOL to your wallet and try again'
    );
  }

  onProgress?.('setup', 'Setting up token accounts...');
  
  // Generate new mint keypair
  const mintKeypair = Keypair.generate();
  
  // Calculate rent for mint account
  const mintRent = await getMinimumBalanceForRentExemptMint(connection);
  
  // Get associated token account
  const tokenAccount = await getAssociatedTokenAddress(
    mintKeypair.publicKey,
    wallet.publicKey
  );

  onProgress?.('transaction-build', 'Building transaction...');

  // Calculate initial supply (with decimals)
  const initialSupply = Number(tokenData.totalSupply) * Math.pow(10, tokenData.decimals);
  
  // Create transaction with mobile optimizations
  const transaction = new Transaction();

  // Add create mint account instruction
  transaction.add(
    SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      space: MINT_SIZE,
      lamports: mintRent,
      programId: TOKEN_PROGRAM_ID,
    })
  );

  // Add initialize mint instruction
  // Properly implement token features for Solana mobile:
  // - mintable: Initially set mint authority, will be revoked later if false
  // - pausable: Set freeze authority if true (allows freezing accounts)
  // - burnable: Always allowed in Solana
  transaction.add(
    createInitializeMintInstruction(
      mintKeypair.publicKey,
      tokenData.decimals,
      wallet.publicKey, // Initially set mint authority to create initial supply
      null, // Always set freeze authority to null for mobile (pausable feature not implemented in mobile version)
      TOKEN_PROGRAM_ID
    )
  );

  // Add create associated token account instruction
  transaction.add(
    createAssociatedTokenAccountInstruction(
      wallet.publicKey, // payer
      tokenAccount, // associated token account
      wallet.publicKey, // owner
      mintKeypair.publicKey, // mint
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    )
  );

  // Add mint to instruction for initial supply
  if (initialSupply > 0) {
    transaction.add(
      createMintToInstruction(
        mintKeypair.publicKey, // mint
        tokenAccount, // destination
        wallet.publicKey, // authority
        initialSupply, // amount
        [], // signers
        TOKEN_PROGRAM_ID
      )
    );
  }

  // Get recent blockhash with retry logic for mobile
  let blockhash;
  let attempt = 0;
  const maxAttempts = 3;
  
  while (attempt < maxAttempts) {
    try {
      const result = await connection.getLatestBlockhash('confirmed');
      blockhash = result.blockhash;
      break;
    } catch (error) {
      attempt++;
      if (attempt === maxAttempts) {
        throw new MobileWalletError(
          'Failed to get blockchain data after multiple attempts',
          'NETWORK_ERROR',
          'Please check your internet connection and try again'
        );
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }

  transaction.recentBlockhash = blockhash;
  transaction.feePayer = wallet.publicKey;

  // Sign with mint keypair
  transaction.partialSign(mintKeypair);

  onProgress?.('transaction-ready', 'Transaction prepared successfully');

  return { transaction, mintKeypair, tokenAccount };
}

// Mobile-optimized signing with enhanced error handling
export async function signTransactionMobile(
  wallet: MobileWalletInterface,
  transaction: Transaction,
  onProgress?: (step: string, message: string, details?: any) => void
): Promise<Transaction> {
  
  const environment = detectMobileWalletEnvironment();
  
  onProgress?.('signing', `Please approve the transaction in ${environment.walletApp || 'your wallet'} app...`);
  
  try {
    // Add mobile-specific timeout for signing
    const signingPromise = wallet.signTransaction(transaction);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new MobileWalletError(
          'Transaction signing timed out',
          'SIGNING_TIMEOUT',
          `Please make sure ${environment.walletApp || 'your wallet'} app is open and try again`
        ));
      }, 60000); // 60 second timeout for mobile
    });

    const signedTransaction = await Promise.race([signingPromise, timeoutPromise]) as Transaction;
    
    onProgress?.('signed', 'Transaction signed successfully');
    return signedTransaction;
    
  } catch (error: any) {
    // Enhanced error handling for mobile wallets
    if (error.code === 4001 || error.message?.includes('rejected')) {
      throw new MobileWalletError(
        'Transaction was rejected by user',
        'USER_REJECTED',
        'Please approve the transaction in your wallet to continue'
      );
    }
    
    if (error.message?.includes('timeout') || error.code === 'SIGNING_TIMEOUT') {
      throw new MobileWalletError(
        'Transaction signing timed out',
        'SIGNING_TIMEOUT',
        `Please make sure ${environment.walletApp || 'your wallet'} app is open and responsive`
      );
    }

    throw new MobileWalletError(
      error.message || 'Failed to sign transaction',
      'SIGNING_ERROR',
      'Please try again or restart your wallet app'
    );
  }
}

// Mobile-optimized transaction submission
export async function submitTransactionMobile(
  signedTransaction: Transaction,
  onProgress?: (step: string, message: string, details?: any) => void
): Promise<string> {
  
  onProgress?.('submitting', 'Submitting transaction to Solana blockchain...');
  
  try {
    // Send transaction with mobile-optimized settings
    const signature = await connection.sendRawTransaction(
      signedTransaction.serialize(),
      {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
        maxRetries: 3
      }
    );

    onProgress?.('submitted', 'Transaction submitted successfully');
    onProgress?.('confirming', 'Waiting for blockchain confirmation...');

    // Confirm transaction with mobile-friendly progress updates
    let confirmed = false;
    let attempts = 0;
    const maxConfirmationAttempts = 30; // 30 attempts = ~60 seconds

    while (!confirmed && attempts < maxConfirmationAttempts) {
      try {
        const confirmation = await connection.confirmTransaction(signature, 'confirmed');
        
        if (confirmation.value.err) {
          throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
        }
        
        confirmed = true;
        onProgress?.('confirmed', 'Transaction confirmed on blockchain!');
        
      } catch (error) {
        attempts++;
        if (attempts >= maxConfirmationAttempts) {
          throw new MobileWalletError(
            'Transaction confirmation timeout',
            'CONFIRMATION_TIMEOUT',
            'Your transaction may still be processing. Please check your wallet in a few minutes.'
          );
        }
        
        // Update progress during confirmation
        onProgress?.('confirming', `Confirming transaction... (${attempts}/${maxConfirmationAttempts})`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    return signature;
    
  } catch (error: any) {
    if (error.message?.includes('insufficient funds')) {
      throw new MobileWalletError(
        'Insufficient SOL for transaction fees',
        'INSUFFICIENT_FUNDS',
        'Please add more SOL to your wallet and try again'
      );
    }
    
    if (error.message?.includes('blockhash not found')) {
      throw new MobileWalletError(
        'Transaction expired, please try again',
        'TRANSACTION_EXPIRED',
        'The transaction took too long to process. Please try creating your token again.'
      );
    }

    throw new MobileWalletError(
      error.message || 'Failed to submit transaction',
      'SUBMISSION_ERROR',
      'Please check your internet connection and try again'
    );
  }
}

// Main mobile-optimized token creation function
export async function createSolanaTokenMobile(
  wallet: MobileWalletInterface,
  tokenData: {
    name: string;
    symbol: string;
    description: string;
    decimals: number;
    totalSupply: number;
    logoUrl: string;
    website?: string;
    mintable: boolean;
    burnable: boolean;
  },
  onProgress?: (step: string, message: string, details?: any) => void
): Promise<{
  success: boolean;
  signature?: string;
  mintAddress?: string;
  tokenAccount?: string;
  error?: string;
  userAction?: string;
}> {
  
  const environment = detectMobileWalletEnvironment();
  
  try {
    onProgress?.('start', `Starting token creation on ${environment.isMobile ? 'mobile' : 'desktop'}...`);
    
    // Mobile-specific validations
    if (environment.isMobile && !environment.walletApp) {
      throw new MobileWalletError(
        'No supported wallet detected',
        'WALLET_NOT_SUPPORTED',
        'Please install Phantom or OKX wallet app and connect it'
      );
    }

    // Build transaction
    const { transaction, mintKeypair, tokenAccount } = await buildMobileOptimizedTransaction(
      wallet,
      tokenData,
      onProgress
    );

    // Sign transaction
    const signedTransaction = await signTransactionMobile(
      wallet,
      transaction,
      onProgress
    );

    // Submit transaction
    const signature = await submitTransactionMobile(
      signedTransaction,
      onProgress
    );

    onProgress?.('success', 'Token created successfully!');

    return {
      success: true,
      signature,
      mintAddress: mintKeypair.publicKey.toString(),
      tokenAccount: tokenAccount.toString()
    };
    
  } catch (error) {
    console.error('Mobile token creation error:', error);
    
    // Use enhanced error handling
    const errorInfo = handleMobileWalletError(error);
    showMobileWalletError(error);
    
    return {
      success: false,
      error: errorInfo.message,
      userAction: errorInfo.userAction
    };
  }
}

// Utility function to validate mobile wallet readiness
export function validateMobileWalletForSolana(): {
  isReady: boolean;
  issues: string[];
  recommendations: string[];
} {
  const environment = detectMobileWalletEnvironment();
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  if (environment.isMobile) {
    if (!environment.walletApp) {
      issues.push('No supported wallet app detected');
      recommendations.push('Install Phantom or OKX wallet app');
    }
    
    if (environment.isInAppBrowser) {
      issues.push('Using in-app browser may cause wallet connectivity issues');
      recommendations.push('Open this page in your default browser for better compatibility');
    }
  }
  
  return {
    isReady: issues.length === 0,
    issues,
    recommendations
  };
}

// Export environment detection for external use
export { detectMobileWalletEnvironment };
