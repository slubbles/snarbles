/**
 * Runtime Configuration for Algorand USDT Integration
 * This file allows setting configuration values that can be changed without rebuilding
 */

// Default configuration
export const DEFAULT_ALGORAND_CONFIG = {
  MAINNET: {
    algodServer: 'https://mainnet-api.algonode.cloud',
    indexerServer: 'https://mainnet-idx.algonode.cloud',
    usdtAssetId: 312769, // USDt Asset ID on Algorand mainnet
    receiverAddress: 'PJEIDDKUOONTJOIV3BLZS7SZSAHCVKNNHTLKMASI6RTYSOZNSDY7MWGZ3M', // Your connected wallet for now
    explorerUrl: 'https://algoexplorer.io',
    networkId: 'mainnet-v1.0'
  },
  TESTNET: {
    algodServer: 'https://testnet-api.algonode.cloud',
    indexerServer: 'https://testnet-idx.algonode.cloud',
    usdtAssetId: 10458941, // USDt Asset ID on Algorand testnet
    receiverAddress: 'PJEIDDKUOONTJOIV3BLZS7SZSAHCVKNNHTLKMASI6RTYSOZNSDY7MWGZ3M', // Your connected wallet for now
    explorerUrl: 'https://testnet.explorer.perawallet.app',
    networkId: 'testnet-v1.0'
  }
};

/**
 * Get Algorand configuration with environment variable override support
 */
export function getAlgorandConfig() {
  const config = {
    MAINNET: {
      ...DEFAULT_ALGORAND_CONFIG.MAINNET,
      receiverAddress: process.env.NEXT_PUBLIC_ALGORAND_MAINNET_RECEIVER_ADDRESS || DEFAULT_ALGORAND_CONFIG.MAINNET.receiverAddress
    },
    TESTNET: {
      ...DEFAULT_ALGORAND_CONFIG.TESTNET,
      receiverAddress: process.env.NEXT_PUBLIC_ALGORAND_TESTNET_RECEIVER_ADDRESS || DEFAULT_ALGORAND_CONFIG.TESTNET.receiverAddress
    }
  };

  // Debug logging
  if (typeof window !== 'undefined') {
    console.log('🔧 Algorand Config Loaded:');
    console.log('Mainnet Receiver:', config.MAINNET.receiverAddress);
    console.log('Testnet Receiver:', config.TESTNET.receiverAddress);
  }

  return config;
}
