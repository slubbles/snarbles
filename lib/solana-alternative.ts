import { 
  Connection, 
  PublicKey, 
  Keypair, 
  Transaction, 
  SystemProgram,
  LAMPORTS_PER_SOL,
  ParsedAccountData 
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
import { CURRENT_SOLANA_NETWORK } from './solana-data';

// Use the existing connection from solana.ts
import { connection } from './solana';

// Alternative token creation using standard Solana token program
export async function createSolanaTokenDirect(
  wallet: { publicKey: PublicKey; signTransaction: (txn: any) => Promise<any> },
  tokenData: {
    name: string;
    symbol: string;
    description: string;
    decimals: number;
    totalSupply: number;
    logoUrl: string;
    website?: string;
    github?: string;
    twitter?: string;
    mintable: boolean;
    burnable: boolean;
    pausable: boolean;
  },
  options?: {
    onStepUpdate?: (step: string, status: string, details?: any) => void;
  }
) {
  try {
    const { onStepUpdate } = options || {};
    
    if (onStepUpdate) {
      onStepUpdate('wallet-check', 'in-progress', { message: 'Validating wallet...' });
    }

    // Validate wallet
    if (!wallet || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    // Check SOL balance
    const balance = await connection.getBalance(wallet.publicKey);
    const solBalance = balance / LAMPORTS_PER_SOL;
    
    if (solBalance < 0.01) {
      throw new Error(`Insufficient SOL balance (${solBalance.toFixed(4)} SOL). Need at least 0.01 SOL for transaction fees.`);
    }

    if (onStepUpdate) {
      onStepUpdate('wallet-check', 'completed', { 
        message: `Wallet validated. Balance: ${solBalance.toFixed(4)} SOL` 
      });
      onStepUpdate('token-setup', 'in-progress', { message: 'Setting up token accounts...' });
    }

    // Generate new mint keypair
    const mintKeypair = Keypair.generate();
    
    // Calculate rent for mint account
    const mintRent = await getMinimumBalanceForRentExemptMint(connection);
    
    // Get associated token account
    const tokenAccount = await getAssociatedTokenAddress(
      mintKeypair.publicKey,
      wallet.publicKey
    );

    if (onStepUpdate) {
      onStepUpdate('token-setup', 'completed', { 
        message: `Mint address: ${mintKeypair.publicKey.toString()}` 
      });
      onStepUpdate('transaction-build', 'in-progress', { message: 'Building transaction...' });
    }

    // Calculate initial supply (with decimals)
    const initialSupply = Number(tokenData.totalSupply) * Math.pow(10, tokenData.decimals);
    
    // Create transaction
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
    transaction.add(
      createInitializeMintInstruction(
        mintKeypair.publicKey,
        tokenData.decimals,
        wallet.publicKey, // mint authority
        tokenData.mintable ? wallet.publicKey : null, // freeze authority (if mintable)
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
          [], // signers (empty for single signer)
          TOKEN_PROGRAM_ID
        )
      );
    }

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;

    // Sign with mint keypair
    transaction.partialSign(mintKeypair);

    if (onStepUpdate) {
      onStepUpdate('transaction-build', 'completed', { 
        message: 'Transaction built successfully' 
      });
      onStepUpdate('wallet-approval', 'in-progress', { message: 'Requesting wallet approval...' });
    }

    // Sign with wallet
    const signedTransaction = await wallet.signTransaction(transaction);

    if (onStepUpdate) {
      onStepUpdate('wallet-approval', 'completed', { message: 'Transaction signed' });
      onStepUpdate('blockchain-submit', 'in-progress', { message: 'Submitting to blockchain...' });
    }

    // Send transaction
    const signature = await connection.sendRawTransaction(signedTransaction.serialize());

    if (onStepUpdate) {
      onStepUpdate('blockchain-submit', 'in-progress', { 
        message: 'Transaction submitted. Awaiting confirmation...' 
      });
    }

    // Confirm transaction
    const confirmation = await connection.confirmTransaction(signature, 'confirmed');

    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${confirmation.value.err}`);
    }

    if (onStepUpdate) {
      onStepUpdate('blockchain-submit', 'completed', { 
        message: 'Transaction confirmed successfully' 
      });
      onStepUpdate('metadata-upload', 'in-progress', { message: 'Creating token metadata...' });
    }

    // Create metadata object (for off-chain storage)
    const metadata = {
      name: tokenData.name,
      symbol: tokenData.symbol,
      description: tokenData.description,
      image: tokenData.logoUrl,
      external_url: tokenData.website,
      properties: {
        files: tokenData.logoUrl ? [{ uri: tokenData.logoUrl, type: 'image' }] : [],
        category: 'image',
        creators: [{
          address: wallet.publicKey.toString(),
          share: 100
        }]
      },
      attributes: [
        { trait_type: 'Decimals', value: tokenData.decimals },
        { trait_type: 'Total Supply', value: tokenData.totalSupply },
        { trait_type: 'Mintable', value: tokenData.mintable },
        { trait_type: 'Burnable', value: tokenData.burnable },
        { trait_type: 'Pausable', value: tokenData.pausable },
        { trait_type: 'Network', value: CURRENT_SOLANA_NETWORK.name },
        { trait_type: 'Created By', value: 'Snarbles Token Platform' }
      ],
      collection: {
        name: 'Snarbles Tokens',
        family: 'Snarbles'
      }
    };

    if (onStepUpdate) {
      onStepUpdate('metadata-upload', 'completed', { message: 'Metadata created' });
    }

    // Generate explorer URL
    const explorerUrl = `${CURRENT_SOLANA_NETWORK.explorerUrl}/address/${mintKeypair.publicKey.toString()}`;

    return {
      success: true,
      signature,
      mintAddress: mintKeypair.publicKey.toString(),
      tokenAccount: tokenAccount.toString(),
      explorerUrl,
      metadata,
      network: CURRENT_SOLANA_NETWORK.name,
      decimals: tokenData.decimals,
      initialSupply: tokenData.totalSupply,
      features: {
        mintable: tokenData.mintable,
        burnable: tokenData.burnable,
        pausable: tokenData.pausable
      }
    };

  } catch (error) {
    console.error('Error creating Solana token:', error);
    
    if (options?.onStepUpdate) {
      options.onStepUpdate('error', 'failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
    
    let errorMessage = 'Failed to create token';
    
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      
      if (message.includes('insufficient')) {
        errorMessage = 'Insufficient SOL balance for transaction fees. Please add SOL to your wallet.';
      } else if (message.includes('rejected') || message.includes('cancelled')) {
        errorMessage = 'Transaction was cancelled in your wallet. Please approve the transaction to continue.';
      } else if (message.includes('network') || message.includes('timeout')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else {
        errorMessage = error.message;
      }
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// Check if the alternative method should be used
export function shouldUseAlternativeMethod(): boolean {
  // Always use alternative method until the main contract is fixed
  return true;
}

// Get token information using standard Solana methods
export async function getSolanaTokenInfo(mintAddress: string) {
  try {
    const mint = new PublicKey(mintAddress);
    
    // Get mint info
    const mintInfo = await connection.getParsedAccountInfo(mint);
    
    if (!mintInfo.value || !mintInfo.value.data) {
      throw new Error('Token not found');
    }

    const mintData = mintInfo.value.data as ParsedAccountData;
    const info = mintData.parsed.info;
    
    return {
      success: true,
      data: {
        mint: mintAddress,
        decimals: info.decimals,
        supply: info.supply,
        mintAuthority: info.mintAuthority,
        freezeAuthority: info.freezeAuthority,
        isInitialized: info.isInitialized
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get token info'
    };
  }
} 