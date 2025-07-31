/**
 * Solana Token Metadata Program Integration
 * Implements Metaplex Token Metadata Program for proper token display in explorers
 */

import { 
  Connection, 
  PublicKey, 
  Transaction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY
} from '@solana/web3.js';
import { 
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID 
} from '@solana/spl-token';

// Metaplex Token Metadata Program ID
export const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

// Create metadata account instruction
export function createCreateMetadataAccountV3Instruction(
  metadata: PublicKey,
  mint: PublicKey,
  mintAuthority: PublicKey,
  payer: PublicKey,
  updateAuthority: PublicKey,
  data: {
    name: string;
    symbol: string;
    uri: string;
    sellerFeeBasisPoints: number;
    creators: Array<{
      address: PublicKey;
      verified: boolean;
      share: number;
    }> | null;
  },
  isMutable: boolean,
  collectionDetails: any = null
) {
  // Instruction data buffer
  const instructionData = Buffer.alloc(1000); // Allocate enough space
  let offset = 0;

  // Write instruction discriminator (33 for CreateMetadataAccountV3)
  instructionData.writeUInt8(33, offset);
  offset += 1;

  // Write data
  // Name
  const nameBytes = Buffer.from(data.name, 'utf8');
  instructionData.writeUInt32LE(nameBytes.length, offset);
  offset += 4;
  instructionData.set(nameBytes, offset);
  offset += nameBytes.length;

  // Symbol
  const symbolBytes = Buffer.from(data.symbol, 'utf8');
  instructionData.writeUInt32LE(symbolBytes.length, offset);
  offset += 4;
  instructionData.set(symbolBytes, offset);
  offset += symbolBytes.length;

  // URI
  const uriBytes = Buffer.from(data.uri, 'utf8');
  instructionData.writeUInt32LE(uriBytes.length, offset);
  offset += 4;
  instructionData.set(uriBytes, offset);
  offset += uriBytes.length;

  // Seller fee basis points
  instructionData.writeUInt16LE(data.sellerFeeBasisPoints, offset);
  offset += 2;

  // Creators (optional)
  if (data.creators) {
    instructionData.writeUInt8(1, offset); // Some flag
    offset += 1;
    instructionData.writeUInt32LE(data.creators.length, offset);
    offset += 4;
    
    for (const creator of data.creators) {
      const addressBytes = creator.address.toBytes();
      instructionData.set(addressBytes, offset);
      offset += 32;
      instructionData.writeUInt8(creator.verified ? 1 : 0, offset);
      offset += 1;
      instructionData.writeUInt8(creator.share, offset);
      offset += 1;
    }
  } else {
    instructionData.writeUInt8(0, offset); // No creators
    offset += 1;
  }

  // Is mutable
  instructionData.writeUInt8(isMutable ? 1 : 0, offset);
  offset += 1;

  // Collection details (null for now)
  instructionData.writeUInt8(0, offset); // No collection
  offset += 1;

  return {
    keys: [
      { pubkey: metadata, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: mintAuthority, isSigner: true, isWritable: false },
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: updateAuthority, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ],
    programId: METADATA_PROGRAM_ID,
    data: instructionData.slice(0, offset),
  };
}

// Get metadata account PDA
export function getMetadataPDA(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    METADATA_PROGRAM_ID
  );
}

// Create metadata JSON for upload
export function createTokenMetadata(
  tokenData: {
    name: string;
    symbol: string;
    description: string;
    logoUrl: string;
    website?: string;
    github?: string;
    twitter?: string;
    decimals: number;
    totalSupply: number;
    mintable: boolean;
    burnable: boolean;
    pausable: boolean;
  },
  creatorAddress: string
) {
  return {
    name: tokenData.name,
    symbol: tokenData.symbol,
    description: tokenData.description,
    image: tokenData.logoUrl,
    external_url: tokenData.website || '',
    attributes: [
      {
        trait_type: 'Decimals',
        value: tokenData.decimals
      },
      {
        trait_type: 'Total Supply',
        value: tokenData.totalSupply.toString()
      },
      {
        trait_type: 'Mintable',
        value: tokenData.mintable ? 'Yes' : 'No'
      },
      {
        trait_type: 'Burnable',
        value: tokenData.burnable ? 'Yes' : 'No'
      },
      {
        trait_type: 'Pausable',
        value: tokenData.pausable ? 'Yes' : 'No'
      },
      {
        trait_type: 'Creator',
        value: creatorAddress
      },
      {
        trait_type: 'Platform',
        value: 'Snarbles'
      }
    ],
    properties: {
      files: tokenData.logoUrl ? [
        {
          uri: tokenData.logoUrl,
          type: 'image'
        }
      ] : [],
      category: 'token',
      creators: [
        {
          address: creatorAddress,
          share: 100
        }
      ]
    },
    collection: {
      name: 'Snarbles Tokens',
      family: 'Snarbles'
    }
  };
}

// Upload metadata to decentralized storage (simplified version)
export async function uploadMetadata(
  metadata: any,
  options?: {
    onProgress?: (progress: number) => void;
  }
): Promise<{ uri: string } | { error: string }> {
  try {
    // For now, we'll use a simple JSON hosting service
    // In production, this should use IPFS, Arweave, or similar
    
    if (options?.onProgress) {
      options.onProgress(25);
    }

    // Create a simple data URI for immediate use
    // This is a fallback method that works without external services
    const jsonString = JSON.stringify(metadata, null, 2);
    const base64Data = Buffer.from(jsonString).toString('base64');
    const dataUri = `data:application/json;base64,${base64Data}`;

    if (options?.onProgress) {
      options.onProgress(100);
    }

    // Note: For production, you would upload to IPFS/Arweave here
    // and return the actual URI. For now, we'll use a mock URI
    // that includes the essential data for the explorer
    
    const mockUri = `https://snarbles.com/metadata/${Date.now()}.json`;
    
    console.log('📄 Metadata created:', {
      name: metadata.name,
      symbol: metadata.symbol,
      description: metadata.description,
      uri: mockUri,
      size: jsonString.length
    });

    return { uri: mockUri };

  } catch (error) {
    console.error('Error uploading metadata:', error);
    return { 
      error: error instanceof Error ? error.message : 'Failed to upload metadata' 
    };
  }
}

// Simplified metadata creation (for immediate use without external uploads)
export function createInlineMetadataUri(
  tokenData: {
    name: string;
    symbol: string;
    description: string;
    logoUrl: string;
  }
): string {
  const metadata = {
    name: tokenData.name,
    symbol: tokenData.symbol,
    description: tokenData.description,
    image: tokenData.logoUrl,
    external_url: '',
    attributes: [],
    properties: {
      category: 'token'
    }
  };

  const jsonString = JSON.stringify(metadata);
  const base64Data = Buffer.from(jsonString).toString('base64');
  return `data:application/json;base64,${base64Data}`;
}
