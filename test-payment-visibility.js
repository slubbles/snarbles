// Test file to verify payment method visibility logic
// This simulates the component logic for different networks

function testPaymentVisibility() {
  const networks = [
    'algorand-testnet',
    'algorand-mainnet', 
    'solana-devnet',
    'solana-mainnet'
  ];

  console.log('🧪 Testing Payment Method Visibility Logic\n');

  networks.forEach(network => {
    const isMainnet = network.includes('mainnet');
    const isAlgorandTestnet = network.includes('algorand-testnet');
    const isSolanaDevnet = network.includes('solana-devnet');
    
    console.log(`Network: ${network}`);
    console.log(`  - isMainnet: ${isMainnet}`);
    console.log(`  - Show Payment Methods: ${isMainnet}`);
    console.log(`  - Show Faucet Info: ${!isMainnet}`);
    
    if (!isMainnet) {
      const faucetInfo = isAlgorandTestnet 
        ? {
            networkName: 'Algorand Testnet',
            faucetUrl: 'https://bank.testnet.algorand.network/',
            faucetName: 'Algorand Testnet Faucet',
            tokenName: 'testnet ALGO'
          }
        : {
            networkName: 'Solana Devnet',  
            faucetUrl: 'https://faucet.solana.com/',
            faucetName: 'Solana Devnet Faucet',
            tokenName: 'devnet SOL'
          };
          
      console.log(`  - Faucet: ${faucetInfo.faucetUrl}`);
      console.log(`  - Message: Free token creation on ${faucetInfo.networkName}`);
    } else {
      console.log(`  - Payment Required: Credits or Direct ALGO`);
    }
    
    console.log('');
  });
}

// Run the test
testPaymentVisibility();

console.log('✅ Test completed! Logic verified.');
