# 🔧 Mock Replacement Implementation Guide

## 📋 Mock Functions to Replace

### Enhanced Payment System Mocks
Located in `/lib/enhanced-payment-system.ts`:

1. **processAlgoPayment()** - Line 149-198
   - Current: Mock transaction with fake txHash
   - Replace: Real Algorand transaction creation and signing

2. **purchaseCreditsWithAlgo()** - Line 72-138  
   - Current: Mock signing with fake transaction
   - Replace: Real ALGO payment processing

3. **getPaymentOptions()** - Line 26-69
   - Current: Mock balance checking
   - Replace: Real wallet balance queries

### CreditTopUpNew Component Mocks
Located in `/components/CreditTopUpNew.tsx`:

1. **Mock Transaction Signing** - Line 65-70
   - Current: `return new Uint8Array([1, 2, 3, 4, 5]);`
   - Replace: Real wallet signing hook

2. **Mock Balance Loading** - Line 25-30
   - Current: Static balance simulation
   - Replace: Real balance from wallet provider

### Enhanced Credit System Mocks
Located in `/lib/enhanced-credit-system.ts`:

1. **processAlgoPayment()** - Line 186-249
   - Current: Mock transaction creation
   - Replace: Real Algorand SDK integration

2. **getAlgorandBalance()** - Line 142-152
   - Current: Mock balance return
   - Replace: Real account information query

---

## 🛠️ Real Implementation Templates

### 1. Real processAlgoPayment Implementation

```typescript
// lib/enhanced-payment-system.ts
export async function processAlgoPayment(
  walletAddress: string,
  network: string,
  signTransaction: (txn: any) => Promise<Uint8Array>
): Promise<PaymentResult> {
  try {
    // Get Algorand client for network
    const algodClient = getAlgorandClient(network);
    
    // Get transaction parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Platform payment address (replace with actual)
    const platformAddress = process.env.NEXT_PUBLIC_PLATFORM_WALLET_ADDRESS || 
                           'YOUR_PLATFORM_WALLET_ADDRESS';
    
    // Create payment transaction
    const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: walletAddress,
      to: platformAddress,
      amount: PRICING.ALGO_REQUIRED * 1000000, // Convert to microALGOs
      suggestedParams,
      note: new TextEncoder().encode('Snarbles token creation payment')
    });
    
    // Sign transaction using real wallet
    const signedTxn = await signTransaction(paymentTxn);
    
    // Submit to network
    const txResponse = await algodClient.sendRawTransaction(signedTxn).do();
    
    // Wait for confirmation
    const confirmedTxn = await algosdk.waitForConfirmation(
      algodClient,
      txResponse.txId,
      4
    );
    
    // Record successful payment
    if (isSupabaseAvailable()) {
      await supabase.from('credit_transactions').insert({
        wallet_address: walletAddress,
        type: 'spend',
        amount: -PRICING.ALGO_REQUIRED,
        description: `Direct ALGO payment for token creation on ${network}`,
        transaction_hash: txResponse.txId,
        status: 'completed',
        payment_method: 'algo_direct'
      });
    }
    
    return {
      success: true,
      transactionHash: txResponse.txId,
      details: {
        algoSpent: PRICING.ALGO_REQUIRED,
        paymentMethod: 'algo_direct',
        network,
        blockNumber: confirmedTxn['confirmed-round']
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process ALGO payment'
    };
  }
}
```

### 2. Real getPaymentOptions Implementation

```typescript
// lib/enhanced-payment-system.ts
export async function getPaymentOptions(walletAddress: string, network: string) {
  try {
    // Get user's credit balance
    const creditsResult = await getCreditsBalance(walletAddress);
    const userCredits = creditsResult.success ? (creditsResult.balance || 0) : 0;
    
    // Get real ALGO balance for Algorand networks
    let algoBalance = 0;
    if (network.includes('algorand')) {
      const algodClient = getAlgorandClient(network);
      const accountInfo = await algodClient.accountInformation(walletAddress).do();
      algoBalance = accountInfo.amount / 1000000; // Convert from microALGOs
    }
    
    const isMainnet = network.includes('mainnet');
    const creditsRequired = isMainnet ? PRICING.CREDITS_REQUIRED : 0;
    const algoRequired = isMainnet ? PRICING.ALGO_REQUIRED : 0;
    
    return {
      success: true,
      options: {
        credits: {
          available: userCredits >= creditsRequired,
          required: creditsRequired,
          balance: userCredits,
          insufficient: userCredits < creditsRequired
        },
        algo_direct: {
          available: algoBalance >= algoRequired,
          required: algoRequired,
          balance: algoBalance,
          insufficient: algoBalance < algoRequired
        }
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get payment options'
    };
  }
}
```

### 3. Real CreditTopUpNew Implementation

```typescript
// components/CreditTopUpNew.tsx
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider';

export default function CreditTopUp() {
  const { signTransaction, address, connected } = useAlgorandWallet();
  
  const handlePurchaseCredits = async (algoAmount: number) => {
    if (!connected || !address) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your Algorand wallet first",
        variant: "destructive",
      });
      return;
    }

    setIsPurchasing(true);
    try {
      // Use real wallet signing instead of mock
      const result = await purchaseCreditsWithAlgo(
        address,
        algoAmount,
        signTransaction // Real signing function from provider
      );

      if (result.success) {
        toast({
          title: "Credits Purchased Successfully!",
          description: `You received ${result.details?.creditsReceived} credits for ${algoAmount} ALGO`,
        });
        
        // Reload balance
        await loadUserBalance();
      } else {
        throw new Error(result.error || 'Purchase failed');
      }
    } catch (error) {
      toast({
        title: "Purchase Failed",
        description: error instanceof Error ? error.message : 'Transaction failed',
        variant: "destructive",
      });
    } finally {
      setIsPurchasing(false);
    }
  };
  
  // ... rest of component
}
```

---

## 📝 Implementation Steps

### Step 1: Update Enhanced Payment System
1. Replace `processAlgoPayment` with real implementation
2. Replace `getPaymentOptions` with real balance checking
3. Update `purchaseCreditsWithAlgo` with real signing

### Step 2: Update CreditTopUpNew Component
1. Import `useAlgorandWallet` hook
2. Replace mock signing with real wallet signing
3. Add proper error handling

### Step 3: Update Enhanced Credit System
1. Replace `processAlgoPayment` duplicate
2. Update `getAlgorandBalance` with real account queries
3. Add proper network client initialization

### Step 4: Add Missing Algorand SDK Usage
1. Import `algosdk` properly
2. Add `getAlgorandClient` function
3. Configure network endpoints

---

## 🧪 Testing Each Implementation

### Test Real processAlgoPayment
```typescript
// Test with real wallet
const result = await processAlgoPayment(
  'YOUR_WALLET_ADDRESS',
  'algorand-testnet',
  realSigningFunction
);
console.log('Payment result:', result);
```

### Test Real getPaymentOptions
```typescript
// Test balance checking
const options = await getPaymentOptions(
  'YOUR_WALLET_ADDRESS',
  'algorand-testnet'
);
console.log('Payment options:', options);
```

### Test Real CreditTopUpNew
```typescript
// Test in browser with connected wallet
// Click purchase button and verify real transaction
```

---

## 🎯 Success Validation

### For Each Function:
- [ ] **No Mock Data**: All responses from real sources
- [ ] **Real Transactions**: Actual blockchain transactions
- [ ] **Error Handling**: Proper error cases handled
- [ ] **Performance**: Reasonable response times
- [ ] **Security**: No sensitive data exposed

### Integration Tests:
- [ ] **Payment Flow**: Complete payment processes
- [ ] **Wallet Integration**: Works with AlgorandWalletProvider
- [ ] **Network Handling**: Testnet and mainnet support
- [ ] **Error Recovery**: Graceful failure handling

**Ready to replace the mocks? Let's start with Phase 1! 🚀**
