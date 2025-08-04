console.log('🔧 Environment Variable Test:');
console.log('NEXT_PUBLIC_ALGORAND_MAINNET_RECEIVER_ADDRESS:', process.env.NEXT_PUBLIC_ALGORAND_MAINNET_RECEIVER_ADDRESS);
console.log('NEXT_PUBLIC_ALGORAND_TESTNET_RECEIVER_ADDRESS:', process.env.NEXT_PUBLIC_ALGORAND_TESTNET_RECEIVER_ADDRESS);

// Test the configuration object
import { ALGORAND_USDT_CONFIG } from './lib/algorand-usdt-integration.js';
console.log('🌐 Mainnet receiver from config:', ALGORAND_USDT_CONFIG.MAINNET.receiverAddress);
console.log('🧪 Testnet receiver from config:', ALGORAND_USDT_CONFIG.TESTNET.receiverAddress);
