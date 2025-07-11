import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { Idl } from '@coral-xyz/anchor';

// Use Anchor's IDL type directly
export interface SnarbleTokenProgram extends Idl {
  version: string;
  name: string;
}

// Contract Account Structures
export interface PlatformState {
  authority: PublicKey;
  creationFee: BN;
  totalTokensCreated: BN;
  totalFeesCollected: BN;
  isPaused: boolean;
  bump: number;
}

export interface TokenData {
  mint: PublicKey;
  creator: PublicKey;
  name: string;
  symbol: string;
  description: string;
  imageUri: string;
  externalUri: string;
  decimals: number;
  totalSupply: BN;
  maxSupply: BN;
  isMintable: boolean;
  isBurnable: boolean;
  isPausable: boolean;
  isPaused: boolean;
  createdAt: BN;
  bump: number;
}

export interface UserState {
  user: PublicKey;
  tokensCreated: BN;
  totalFeesPaid: BN;
  lastCreatedAt: BN;
  bump: number;
}

// Instruction Arguments
export interface InitializeArgs {
  creationFee: BN;
}

export interface CreateTokenArgs {
  name: string;
  symbol: string;
  description: string;
  imageUri: string;
  externalUri: string;
  decimals: number;
  initialSupply: BN;
  maxSupply: BN;
  isMintable: boolean;
  isBurnable: boolean;
  isPausable: boolean;
}

export interface TransferArgs {
  amount: BN;
}

export interface MintArgs {
  amount: BN;
}

export interface BurnArgs {
  amount: BN;
}

// Contract IDL
export const SNARBLES_TOKEN_IDL: SnarbleTokenProgram = {
  version: "0.1.0",
  name: "snarbles_token",
  instructions: [
    {
      name: "initialize",
      accounts: [
        { name: "platformState", isMut: true, isSigner: false },
        { name: "authority", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false }
      ],
      args: [
        { name: "creationFee", type: "u64" }
      ]
    },
    {
      name: "createToken",
      accounts: [
        { name: "platformState", isMut: true, isSigner: false },
        { name: "tokenData", isMut: true, isSigner: false },
        { name: "userState", isMut: true, isSigner: false },
        { name: "mint", isMut: true, isSigner: true },
        { name: "metadata", isMut: true, isSigner: false },
        { name: "masterEdition", isMut: true, isSigner: false },
        { name: "tokenAccount", isMut: true, isSigner: false },
        { name: "creator", isMut: true, isSigner: true },
        { name: "authority", isMut: true, isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false },
        { name: "tokenMetadataProgram", isMut: false, isSigner: false },
        { name: "associatedTokenProgram", isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
        { name: "rent", isMut: false, isSigner: false }
      ],
      args: [
        { name: "name", type: "string" },
        { name: "symbol", type: "string" },
        { name: "description", type: "string" },
        { name: "imageUri", type: "string" },
        { name: "externalUri", type: "string" },
        { name: "decimals", type: "u8" },
        { name: "initialSupply", type: "u64" },
        { name: "maxSupply", type: "u64" },
        { name: "isMintable", type: "bool" },
        { name: "isBurnable", type: "bool" },
        { name: "isPausable", type: "bool" }
      ]
    },
    {
      name: "transfer",
      accounts: [
        { name: "tokenData", isMut: false, isSigner: false },
        { name: "fromTokenAccount", isMut: true, isSigner: false },
        { name: "toTokenAccount", isMut: true, isSigner: false },
        { name: "authority", isMut: false, isSigner: true },
        { name: "tokenProgram", isMut: false, isSigner: false }
      ],
      args: [
        { name: "amount", type: "u64" }
      ]
    },
    {
      name: "mint",
      accounts: [
        { name: "tokenData", isMut: true, isSigner: false },
        { name: "mint", isMut: true, isSigner: false },
        { name: "tokenAccount", isMut: true, isSigner: false },
        { name: "authority", isMut: false, isSigner: true },
        { name: "tokenProgram", isMut: false, isSigner: false }
      ],
      args: [
        { name: "amount", type: "u64" }
      ]
    },
    {
      name: "burn",
      accounts: [
        { name: "tokenData", isMut: true, isSigner: false },
        { name: "mint", isMut: true, isSigner: false },
        { name: "tokenAccount", isMut: true, isSigner: false },
        { name: "authority", isMut: false, isSigner: true },
        { name: "tokenProgram", isMut: false, isSigner: false }
      ],
      args: [
        { name: "amount", type: "u64" }
      ]
    },
    {
      name: "pause",
      accounts: [
        { name: "tokenData", isMut: true, isSigner: false },
        { name: "authority", isMut: false, isSigner: true }
      ],
      args: []
    },
    {
      name: "unpause",
      accounts: [
        { name: "tokenData", isMut: true, isSigner: false },
        { name: "authority", isMut: false, isSigner: true }
      ],
      args: []
    }
  ],
  accounts: [
    {
      name: "PlatformState",
      type: {
        kind: "struct",
        fields: [
          { name: "authority", type: "publicKey" },
          { name: "creationFee", type: "u64" },
          { name: "totalTokensCreated", type: "u64" },
          { name: "totalFeesCollected", type: "u64" },
          { name: "isPaused", type: "bool" },
          { name: "bump", type: "u8" }
        ]
      }
    },
    {
      name: "TokenData",
      type: {
        kind: "struct",
        fields: [
          { name: "mint", type: "publicKey" },
          { name: "creator", type: "publicKey" },
          { name: "name", type: "string" },
          { name: "symbol", type: "string" },
          { name: "description", type: "string" },
          { name: "imageUri", type: "string" },
          { name: "externalUri", type: "string" },
          { name: "decimals", type: "u8" },
          { name: "totalSupply", type: "u64" },
          { name: "maxSupply", type: "u64" },
          { name: "isMintable", type: "bool" },
          { name: "isBurnable", type: "bool" },
          { name: "isPausable", type: "bool" },
          { name: "isPaused", type: "bool" },
          { name: "createdAt", type: "i64" },
          { name: "bump", type: "u8" }
        ]
      }
    },
    {
      name: "UserState",
      type: {
        kind: "struct",
        fields: [
          { name: "user", type: "publicKey" },
          { name: "tokensCreated", type: "u64" },
          { name: "totalFeesPaid", type: "u64" },
          { name: "lastCreatedAt", type: "i64" },
          { name: "bump", type: "u8" }
        ]
      }
    }
  ],
  types: [],
  errors: [
    { code: 6000, name: "TokenPaused", msg: "Token transfers are currently paused" },
    { code: 6001, name: "TokenNotPaused", msg: "Token is not paused" },
    { code: 6002, name: "Unauthorized", msg: "Unauthorized access" },
    { code: 6003, name: "InvalidTokenData", msg: "Invalid token data provided" },
    { code: 6004, name: "TokenAlreadyInitialized", msg: "Token has already been initialized" },
    { code: 6005, name: "InvalidCreationFee", msg: "Invalid creation fee amount" },
    { code: 6006, name: "InsufficientFunds", msg: "Insufficient funds for operation" },
    { code: 6007, name: "TokenTransferDisabled", msg: "Token transfers are disabled" },
    { code: 6008, name: "InvalidAmount", msg: "Invalid amount specified" },
    { code: 6009, name: "MintDisabled", msg: "Minting is disabled for this token" },
    { code: 6010, name: "BurnDisabled", msg: "Burning is disabled for this token" },
    { code: 6011, name: "InvalidOwner", msg: "Invalid token owner" },
    { code: 6012, name: "AccountAlreadyInitialized", msg: "Account has already been initialized" },
    { code: 6013, name: "InvalidInstruction", msg: "Invalid instruction provided" },
    { code: 6014, name: "ProgramPaused", msg: "Program is currently paused" },
    { code: 6015, name: "InvalidProgramState", msg: "Invalid program state" },
    { code: 6016, name: "TokenNameTooLong", msg: "Token name exceeds maximum length" }
  ]
};

// Helper function to convert error code to message
export function getErrorMessage(errorCode: number): string {
  const error = SNARBLES_TOKEN_IDL.errors?.find(e => e.code === errorCode);
  return error?.msg || `Unknown error code: ${errorCode}`;
}

// Transaction result interface
export interface TokenCreationResult {
  success: boolean;
  signature?: string;
  mintAddress?: string;
  tokenDataPDA?: string;
  userStatePDA?: string;
  error?: string;
  explorerUrl?: string;
}

// Contract interaction result interface
export interface ContractResult<T = any> {
  success: boolean;
  data?: T;
  signature?: string;
  error?: string;
  errorCode?: number;
}

// Token creation parameters for the contract
export interface TokenCreationParams {
  name: string;
  symbol: string;
  description: string;
  imageUri: string;
  externalUri: string;
  decimals: number;
  initialSupply: number;
  maxSupply: number;
  isMintable: boolean;
  isBurnable: boolean;
  isPausable: boolean;
} 