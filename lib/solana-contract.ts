import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Keypair,
  sendAndConfirmTransaction
} from '@solana/web3.js';
import { 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  getMinimumBalanceForRentExemptMint,
  MINT_SIZE
} from '@solana/spl-token';
import { Program, AnchorProvider, web3, BN } from '@coral-xyz/anchor';

import {
  PROGRAM_ID as SNARBLES_PROGRAM_ID,
  CURRENT_SOLANA_NETWORK,
  getPlatformStatePDA,
  getTokenDataPDA,
  getUserStatePDA,
  PLATFORM_CONFIG,
  validateTokenName,
  validateTokenSymbol,
  validateTokenDescription,
  validateTokenUrl,
  validateDecimals,
  getTransactionUrl
} from './solana-data';

import {
  SNARBLES_TOKEN_IDL,
  TokenCreationParams,
  TokenCreationResult,
  ContractResult,
  getErrorMessage,
  PlatformState,
  TokenData,
  UserState
} from './solana-contract-types';

// Metaplex Token Metadata Program ID
const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

// Helper function to get metadata PDA
function getMetadataPDA(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );
}

// Helper function to get master edition PDA
function getMasterEditionPDA(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
      Buffer.from('edition'),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );
}

export class SolanaContractClient {
  private connection: Connection;
  private program: Program | null = null;

  constructor(connection?: Connection) {
    this.connection = connection || new Connection(CURRENT_SOLANA_NETWORK.rpcUrl, 'confirmed');
  }

  // Initialize the Anchor program
  private async initializeProgram(wallet: any): Promise<Program> {
    if (!this.program) {
      const provider = new AnchorProvider(
        this.connection,
        wallet,
        { preflightCommitment: 'confirmed' }
      );
      this.program = new Program(SNARBLES_TOKEN_IDL, SNARBLES_PROGRAM_ID, provider);
    }
    return this.program;
  }

  // 1. Initialize Platform (Admin only)
  async initializePlatform(
    wallet: any,
    creationFeeInSol: number = 0.01
  ): Promise<ContractResult<string>> {
    try {
      const program = await this.initializeProgram(wallet);
      const [platformStatePDA] = getPlatformStatePDA();
      
      const creationFee = new BN(creationFeeInSol * web3.LAMPORTS_PER_SOL);

      const tx = await program.methods
        .initialize(creationFee)
        .accounts({
          platformState: platformStatePDA,
          authority: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return {
        success: true,
        signature: tx,
        data: tx
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to initialize platform',
        errorCode: error.code
      };
    }
  }

  // 2. Create Token (Main function)
  async createToken(
    wallet: any,
    params: TokenCreationParams
  ): Promise<TokenCreationResult> {
    try {
      // Validate input parameters
      if (!validateTokenName(params.name)) {
        return {
          success: false,
          error: `Token name must be 1-${PLATFORM_CONFIG.MAX_NAME_LENGTH} characters`
        };
      }

      if (!validateTokenSymbol(params.symbol)) {
        return {
          success: false,
          error: `Token symbol must be 1-${PLATFORM_CONFIG.MAX_SYMBOL_LENGTH} characters`
        };
      }

      if (!validateTokenDescription(params.description)) {
        return {
          success: false,
          error: `Token description must be max ${PLATFORM_CONFIG.MAX_DESCRIPTION_LENGTH} characters`
        };
      }

      if (!validateTokenUrl(params.imageUri)) {
        return {
          success: false,
          error: `Image URI must be max ${PLATFORM_CONFIG.MAX_URL_LENGTH} characters`
        };
      }

      if (!validateDecimals(params.decimals)) {
        return {
          success: false,
          error: `Decimals must be 0-${PLATFORM_CONFIG.MAX_DECIMALS}`
        };
      }

      const program = await this.initializeProgram(wallet);
      
      // Generate new mint keypair
      const mintKeypair = Keypair.generate();
      const mint = mintKeypair.publicKey;

      // Derive PDAs
      const [platformStatePDA] = getPlatformStatePDA();
      const [tokenDataPDA] = getTokenDataPDA(mint);
      const [userStatePDA] = getUserStatePDA(wallet.publicKey);
      const [metadataPDA] = getMetadataPDA(mint);
      const [masterEditionPDA] = getMasterEditionPDA(mint);

      // Get associated token account
      const tokenAccount = await getAssociatedTokenAddress(
        mint,
        wallet.publicKey
      );

      // Convert supply values to BN
      const initialSupply = new BN(params.initialSupply * Math.pow(10, params.decimals));
      const maxSupply = new BN(params.maxSupply * Math.pow(10, params.decimals));

      // Get platform authority (upgrade authority for now)
      const PLATFORM_AUTHORITY = new PublicKey('352YpA1YVHmN9Jirf5cDZdELWvsrP3DJVL7svAHJtmUj');

      const tx = await program.methods
        .createToken(
          params.name,
          params.symbol,
          params.description,
          params.imageUri,
          params.externalUri,
          params.decimals,
          initialSupply,
          maxSupply,
          params.isMintable,
          params.isBurnable,
          params.isPausable
        )
        .accounts({
          platformState: platformStatePDA,
          tokenData: tokenDataPDA,
          userState: userStatePDA,
          mint: mint,
          metadata: metadataPDA,
          masterEdition: masterEditionPDA,
          tokenAccount: tokenAccount,
          creator: wallet.publicKey,
          authority: PLATFORM_AUTHORITY,
          tokenProgram: TOKEN_PROGRAM_ID,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .signers([mintKeypair])
        .rpc();

      const explorerUrl = getTransactionUrl(tx, CURRENT_SOLANA_NETWORK);

      return {
        success: true,
        signature: tx,
        mintAddress: mint.toString(),
        tokenDataPDA: tokenDataPDA.toString(),
        userStatePDA: userStatePDA.toString(),
        explorerUrl
      };

    } catch (error: any) {
      console.error('Token creation error:', error);
      
      let errorMessage = 'Failed to create token';
      if (error.code && typeof error.code === 'number') {
        errorMessage = getErrorMessage(error.code);
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // 3. Transfer Token
  async transferToken(
    wallet: any,
    mintAddress: string,
    toAddress: string,
    amount: number,
    decimals: number = 9
  ): Promise<ContractResult<string>> {
    try {
      const program = await this.initializeProgram(wallet);
      const mint = new PublicKey(mintAddress);
      const toPublicKey = new PublicKey(toAddress);
      
      const [tokenDataPDA] = getTokenDataPDA(mint);
      
      const fromTokenAccount = await getAssociatedTokenAddress(mint, wallet.publicKey);
      const toTokenAccount = await getAssociatedTokenAddress(mint, toPublicKey);
      
      const transferAmount = new BN(amount * Math.pow(10, decimals));

      const tx = await program.methods
        .transfer(transferAmount)
        .accounts({
          tokenData: tokenDataPDA,
          fromTokenAccount,
          toTokenAccount,
          authority: wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      return {
        success: true,
        signature: tx,
        data: tx
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to transfer token',
        errorCode: error.code
      };
    }
  }

  // 4. Mint Additional Tokens
  async mintToken(
    wallet: any,
    mintAddress: string,
    amount: number,
    decimals: number = 9
  ): Promise<ContractResult<string>> {
    try {
      const program = await this.initializeProgram(wallet);
      const mint = new PublicKey(mintAddress);
      
      const [tokenDataPDA] = getTokenDataPDA(mint);
      const tokenAccount = await getAssociatedTokenAddress(mint, wallet.publicKey);
      
      const mintAmount = new BN(amount * Math.pow(10, decimals));

      const tx = await program.methods
        .mint(mintAmount)
        .accounts({
          tokenData: tokenDataPDA,
          mint,
          tokenAccount,
          authority: wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      return {
        success: true,
        signature: tx,
        data: tx
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to mint token',
        errorCode: error.code
      };
    }
  }

  // 5. Burn Tokens
  async burnToken(
    wallet: any,
    mintAddress: string,
    amount: number,
    decimals: number = 9
  ): Promise<ContractResult<string>> {
    try {
      const program = await this.initializeProgram(wallet);
      const mint = new PublicKey(mintAddress);
      
      const [tokenDataPDA] = getTokenDataPDA(mint);
      const tokenAccount = await getAssociatedTokenAddress(mint, wallet.publicKey);
      
      const burnAmount = new BN(amount * Math.pow(10, decimals));

      const tx = await program.methods
        .burn(burnAmount)
        .accounts({
          tokenData: tokenDataPDA,
          mint,
          tokenAccount,
          authority: wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      return {
        success: true,
        signature: tx,
        data: tx
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to burn token',
        errorCode: error.code
      };
    }
  }

  // 6. Pause Token
  async pauseToken(
    wallet: any,
    mintAddress: string
  ): Promise<ContractResult<string>> {
    try {
      const program = await this.initializeProgram(wallet);
      const mint = new PublicKey(mintAddress);
      
      const [tokenDataPDA] = getTokenDataPDA(mint);

      const tx = await program.methods
        .pause()
        .accounts({
          tokenData: tokenDataPDA,
          authority: wallet.publicKey,
        })
        .rpc();

      return {
        success: true,
        signature: tx,
        data: tx
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to pause token',
        errorCode: error.code
      };
    }
  }

  // 7. Unpause Token
  async unpauseToken(
    wallet: any,
    mintAddress: string
  ): Promise<ContractResult<string>> {
    try {
      const program = await this.initializeProgram(wallet);
      const mint = new PublicKey(mintAddress);
      
      const [tokenDataPDA] = getTokenDataPDA(mint);

      const tx = await program.methods
        .unpause()
        .accounts({
          tokenData: tokenDataPDA,
          authority: wallet.publicKey,
        })
        .rpc();

      return {
        success: true,
        signature: tx,
        data: tx
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to unpause token',
        errorCode: error.code
      };
    }
  }

  // Utility: Get Platform State
  async getPlatformState(): Promise<ContractResult<PlatformState>> {
    try {
      const [platformStatePDA] = getPlatformStatePDA();
      const accountInfo = await this.connection.getAccountInfo(platformStatePDA);
      
      if (!accountInfo) {
        return {
          success: false,
          error: 'Platform not initialized'
        };
      }

      // For now, return basic info (would need to deserialize properly with Anchor)
      return {
        success: true,
        data: {
          authority: new PublicKey('352YpA1YVHmN9Jirf5cDZdELWvsrP3DJVL7svAHJtmUj'),
          creationFee: new BN(0.01 * web3.LAMPORTS_PER_SOL),
          totalTokensCreated: new BN(0),
          totalFeesCollected: new BN(0),
          isPaused: false,
          bump: 254
        } as PlatformState
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get platform state'
      };
    }
  }

  // Utility: Get Token Data
  async getTokenData(mintAddress: string): Promise<ContractResult<TokenData | null>> {
    try {
      const mint = new PublicKey(mintAddress);
      const [tokenDataPDA] = getTokenDataPDA(mint);
      
      const accountInfo = await this.connection.getAccountInfo(tokenDataPDA);
      
      if (!accountInfo) {
        return {
          success: true,
          data: null
        };
      }

      // Would need proper deserialization with Anchor
      return {
        success: true,
        data: null // Placeholder - would return actual TokenData
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get token data'
      };
    }
  }

  // Utility: Get User State
  async getUserState(userAddress: string): Promise<ContractResult<UserState | null>> {
    try {
      const user = new PublicKey(userAddress);
      const [userStatePDA] = getUserStatePDA(user);
      
      const accountInfo = await this.connection.getAccountInfo(userStatePDA);
      
      if (!accountInfo) {
        return {
          success: true,
          data: null
        };
      }

      // Would need proper deserialization with Anchor
      return {
        success: true,
        data: null // Placeholder - would return actual UserState
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get user state'
      };
    }
  }
}

// Create singleton instance
export const solanaContract = new SolanaContractClient(); 