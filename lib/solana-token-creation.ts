import { 
  Connection, 
  Keypair, 
  Transaction, 
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import {
  createInitializeMintInstruction,
  createMintToInstruction,
  createSetAuthorityInstruction,
  AuthorityType,
  getMintLen,
  TOKEN_PROGRAM_ID,
  getAccountLen,
  AccountLayout,
  MINT_SIZE,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress
} from '@solana/spl-token';

interface TokenData {
  name: string;
  symbol: string;
  description: string;
  decimals: number;
  totalSupply: string;
  logoUrl?: string;
  website?: string;
  github?: string;
  twitter?: string;
  mintable: boolean;
  burnable: boolean;
  pausable: boolean;
  network: string;
}

interface StatusCallback {
  (status: { 
    status: 'preparing' | 'signing' | 'broadcasting' | 'confirming' | 'success' | 'error';
    message?: string;
  }): void;
}

/**
 * Create a real Solana token
 */
export async function createSolanaToken(
  tokenData: TokenData,
  network: string,
  onStatusUpdate?: StatusCallback
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    onStatusUpdate?.({ status: 'preparing', message: 'Preparing Solana token creation...' });

    // Get connection based on network
    const connection = getSolanaConnection(network);
    
    // Get wallet adapter from window object (injected by wallet)
    const wallet = await getSolanaWallet();
    if (!wallet) {
      throw new Error('No Solana wallet connected');
    }

    onStatusUpdate?.({ status: 'signing', message: 'Preparing transaction for signing...' });

    // Generate mint keypair
    const mintKeypair = Keypair.generate();
    
    // Calculate rent exemption for mint account
    const mintRent = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);
    
    // Create mint account instruction
    const createMintAccountInstruction = SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      lamports: mintRent,
      space: MINT_SIZE,
      programId: TOKEN_PROGRAM_ID,
    });

    // Initialize mint instruction
    const initializeMintInstruction = createInitializeMintInstruction(
      mintKeypair.publicKey, // mint
      tokenData.decimals, // decimals
      wallet.publicKey, // mint authority
      wallet.publicKey, // freeze authority (can be null if not pausable)
      TOKEN_PROGRAM_ID
    );

    // Calculate supply in base units
    const totalSupplyBN = BigInt(Math.floor(parseFloat(tokenData.totalSupply) * Math.pow(10, tokenData.decimals)));

    // Create transaction
    const transaction = new Transaction();
    transaction.add(createMintAccountInstruction);
    transaction.add(initializeMintInstruction);

    // If we need to mint initial supply
    if (totalSupplyBN > BigInt(0)) {
      // Create associated token account for the creator
      const associatedTokenAccount = await getAssociatedTokenAddress(
        mintKeypair.publicKey,
        wallet.publicKey
      );

      // Add instruction to create associated token account
      const createATAInstruction = createAssociatedTokenAccountInstruction(
        wallet.publicKey, // payer
        associatedTokenAccount, // ata
        wallet.publicKey, // owner
        mintKeypair.publicKey // mint
      );

      // Add instruction to mint tokens to the creator
      const mintToInstruction = createMintToInstruction(
        mintKeypair.publicKey, // mint
        associatedTokenAccount, // destination
        wallet.publicKey, // authority
        totalSupplyBN // amount
      );

      transaction.add(createATAInstruction);
      transaction.add(mintToInstruction);
    }

    // Add basic metadata as transaction memo (simplified approach)
    if (tokenData.name && tokenData.symbol) {
      const memoData = JSON.stringify({
        name: tokenData.name,
        symbol: tokenData.symbol,
        description: tokenData.description,
        image: tokenData.logoUrl || '',
        website: tokenData.website || '',
        twitter: tokenData.twitter || '',
        github: tokenData.github || ''
      });
      
      // Add memo instruction for metadata (simplified approach)
      const memoInstruction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: wallet.publicKey,
          lamports: 0
        })
      );
      
      // Note: In production, you'd want to use proper Metaplex metadata
      console.log('Token metadata:', memoData);
    }

    // If not mintable, remove mint authority
    if (!tokenData.mintable && totalSupplyBN > BigInt(0)) {
      const removeAuthorityInstruction = createSetAuthorityInstruction(
        mintKeypair.publicKey, // mint
        wallet.publicKey, // current authority
        AuthorityType.MintTokens, // authority type
        null // new authority (null to remove)
      );
      transaction.add(removeAuthorityInstruction);
    }

    // If not pausable, remove freeze authority
    if (!tokenData.pausable) {
      const removeFreezeInstruction = createSetAuthorityInstruction(
        mintKeypair.publicKey, // mint
        wallet.publicKey, // current authority
        AuthorityType.FreezeAccount, // authority type
        null // new authority (null to remove)
      );
      transaction.add(removeFreezeInstruction);
    }

    onStatusUpdate?.({ status: 'signing', message: 'Please sign the transaction in your wallet...' });

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;

    // Partially sign with mint keypair
    transaction.partialSign(mintKeypair);

    // Sign with wallet
    const signedTransaction = await wallet.signTransaction(transaction);

    onStatusUpdate?.({ status: 'broadcasting', message: 'Broadcasting transaction to Solana network...' });

    // Send transaction
    const signature = await connection.sendRawTransaction(signedTransaction.serialize());

    onStatusUpdate?.({ status: 'confirming', message: 'Confirming transaction...' });

    // Confirm transaction
    const confirmation = await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight: (await connection.getLatestBlockhash()).lastValidBlockHeight
    });

    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${confirmation.value.err}`);
    }

    const explorerUrl = network === 'solana-mainnet'
      ? `https://explorer.solana.com/address/${mintKeypair.publicKey.toString()}`
      : `https://explorer.solana.com/address/${mintKeypair.publicKey.toString()}?cluster=devnet`;

    onStatusUpdate?.({ status: 'success', message: 'Token created successfully!' });

    return {
      success: true,
      data: {
        mintAddress: mintKeypair.publicKey.toString(),
        transactionId: signature,
        explorerUrl,
        network,
        tokenName: tokenData.name,
        tokenSymbol: tokenData.symbol,
        decimals: tokenData.decimals,
        totalSupply: tokenData.totalSupply
      }
    };

  } catch (error) {
    console.error('Solana token creation error:', error);
    onStatusUpdate?.({ status: 'error', message: error instanceof Error ? error.message : 'Unknown error' });
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Get Solana connection based on network
 */
function getSolanaConnection(network: string): Connection {
  const endpoint = network === 'solana-mainnet'
    ? 'https://api.mainnet-beta.solana.com'
    : 'https://api.devnet.solana.com';
    
  return new Connection(endpoint, 'confirmed');
}

/**
 * Get connected Solana wallet
 */
async function getSolanaWallet(): Promise<any> {
  if (typeof window === 'undefined') {
    throw new Error('Wallet only available in browser environment');
  }

  // Check for Phantom wallet
  if ((window as any).solana?.isPhantom) {
    const wallet = (window as any).solana;
    
    if (!wallet.isConnected) {
      await wallet.connect();
    }
    
    return wallet;
  }

  // Check for other Solana wallets
  if ((window as any).solflare) {
    const wallet = (window as any).solflare;
    
    if (!wallet.isConnected) {
      await wallet.connect();
    }
    
    return wallet;
  }

  throw new Error('No compatible Solana wallet found. Please install Phantom or Solflare wallet.');
}

/**
 * Validate Solana wallet connection
 */
export function validateSolanaWalletConnection(wallet: any): { isValid: boolean; message?: string } {
  if (!wallet) {
    return { isValid: false, message: 'No wallet connected' };
  }

  if (!wallet.publicKey) {
    return { isValid: false, message: 'Wallet not properly connected' };
  }

  if (!wallet.isConnected) {
    return { isValid: false, message: 'Wallet disconnected. Please reconnect.' };
  }

  return { isValid: true };
}
