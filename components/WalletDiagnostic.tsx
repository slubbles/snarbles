import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect } from 'react';

export default function WalletDiagnostic() {
  const { wallets, wallet, connected } = useWallet();

  useEffect(() => {
    console.log('🔍 WALLET DIAGNOSTIC:');
    console.log('- Available wallets:', wallets.length);
    console.log('- Wallet names:', wallets.map(w => w.adapter.name));
    console.log('- Current wallet:', wallet?.adapter.name || 'None');
    console.log('- Connected:', connected);
    
    // Check for duplicates
    const names = wallets.map(w => w.adapter.name);
    const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
    if (duplicates.length > 0) {
      console.warn('⚠️ Duplicate wallet names found:', duplicates);
    } else {
      console.log('✅ No duplicate wallet names');
    }
  }, [wallets, wallet, connected]);

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-xs">
      <h4 className="font-bold mb-2">Wallet Diagnostic</h4>
      <p>Wallets: {wallets.length}</p>
      <p>Connected: {connected ? 'Yes' : 'No'}</p>
      {wallet && <p>Active: {wallet.adapter.name}</p>}
      <div className="mt-2 max-h-20 overflow-y-auto">
        {wallets.map((w, i) => (
          <div key={i} className="text-xs opacity-75">
            {i + 1}. {w.adapter.name}
          </div>
        ))}
      </div>
    </div>
  );
}
