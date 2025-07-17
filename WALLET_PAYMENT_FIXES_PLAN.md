# 🔧 Wallet & Payment Issues - Comprehensive Fix Plan

## 🚨 **Issues Identified**

### 1. **Modal Positioning Issue**
- **Problem**: Wallet connection modal automatically scrolls to footer
- **Root Cause**: Modal not properly centered, lacks proper viewport positioning
- **Impact**: Poor UX, user loses context of current screen position

### 2. **Missing Disconnect Functionality** 
- **Problem**: After connecting Pera wallet, no visible disconnect button
- **Root Cause**: WalletConnectionManager may not be showing for all wallet types
- **Impact**: Users can't disconnect wallet, forced to refresh page

### 3. **Mobile Payment Selector Visibility**
- **Problem**: Payment method selection not working/visible on mobile
- **Root Cause**: PaymentSelectorNew component not mobile-optimized
- **Impact**: Users can't create tokens on mobile (critical blocker)

---

## 🔧 **DETAILED FIX IMPLEMENTATION**

### **Phase 1: Fix Modal Positioning & Centering**

#### 1.1 Update Global Modal Styles
**File:** `app/globals.css`

```css
/* Enhanced Modal Positioning */
.wallet-adapter-modal {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  z-index: 100000 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  background: rgba(0, 0, 0, 0.5) !important;
  backdrop-filter: blur(4px) !important;
  padding: 20px !important;
  box-sizing: border-box !important;
}

.wallet-adapter-modal-container {
  position: relative !important;
  max-width: 400px !important;
  width: 90% !important;
  max-height: 90vh !important;
  margin: 0 auto !important;
  background: hsl(var(--background)) !important;
  border: 1px solid hsl(var(--border)) !important;
  border-radius: 12px !important;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2) !important;
  overflow: hidden !important;
  transform: none !important;
}

/* Prevent body scroll when modal is open */
body.modal-open {
  overflow: hidden !important;
  position: fixed !important;
  width: 100% !important;
}

/* Enhanced Dialog Component Styles */
[data-radix-dialog-overlay] {
  position: fixed !important;
  inset: 0 !important;
  z-index: 50 !important;
  background-color: rgba(0, 0, 0, 0.8) !important;
  backdrop-filter: blur(4px) !important;
}

[data-radix-dialog-content] {
  position: fixed !important;
  left: 50% !important;
  top: 50% !important;
  z-index: 50 !important;
  transform: translate(-50%, -50%) !important;
  max-height: 85vh !important;
  overflow-y: auto !important;
}

/* Mobile-specific modal adjustments */
@media (max-width: 640px) {
  .wallet-adapter-modal-container {
    width: 95% !important;
    max-height: 80vh !important;
  }
  
  [data-radix-dialog-content] {
    width: 95% !important;
    max-height: 80vh !important;
    max-width: none !important;
  }
}
```

#### 1.2 Create Modal Position Hook
**File:** `hooks/useModalPosition.ts`

```tsx
import { useEffect } from 'react';

export function useModalPosition(isOpen: boolean) {
  useEffect(() => {
    if (isOpen) {
      // Store current scroll position
      const scrollY = window.scrollY;
      
      // Prevent background scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.classList.add('modal-open');
      
      return () => {
        // Restore scroll position
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.classList.remove('modal-open');
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);
}
```

#### 1.3 Update MobileWalletModal Component
**File:** `components/MobileWalletModal.tsx`

```tsx
import { useModalPosition } from '@/hooks/useModalPosition';

export function MobileWalletModal({ isOpen, onClose, onWalletConnect }: MobileWalletModalProps) {
  // Prevent background scroll and maintain position
  useModalPosition(isOpen);
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
        {/* Existing content */}
      </DialogContent>
    </Dialog>
  );
}
```

---

### **Phase 2: Fix Wallet Disconnect Functionality**

#### 2.1 Enhanced WalletConnectionManager
**File:** `components/WalletConnectionManager.tsx`

```tsx
export default function WalletConnectionManager({ 
  className = '',
  showBalance = true 
}: WalletConnectionManagerProps) {
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showDisconnectOptions, setShowDisconnectOptions] = useState(false);
  const { walletAddress, isAuthenticated, disconnectWallet: authDisconnectWallet } = useWalletAuth();
  const { peraWallet } = useAlgorandWallet();
  
  const handleDisconnect = async () => {
    if (isDisconnecting) return;
    
    setIsDisconnecting(true);
    
    try {
      // Disconnect from Pera wallet specifically
      if (peraWallet) {
        await peraWallet.disconnect();
      }
      
      // Use the auth provider's disconnect method
      await authDisconnectWallet();
      
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been disconnected successfully.",
      });
      
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      toast({
        title: "Disconnect Failed", 
        description: "Failed to disconnect wallet. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDisconnecting(false);
      setShowDisconnectOptions(false);
    }
  };

  if (!isAuthenticated || !walletAddress) {
    return null;
  }

  return (
    <div className={`wallet-connection-status mobile-optimized glass-card p-4 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Wallet className="w-5 h-5 text-primary flex-shrink-0" />
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm text-foreground font-medium truncate">
                {truncateAddress(walletAddress)}
              </span>
              <Badge variant="outline" className="text-green-400 border-green-400 flex-shrink-0">
                Connected
              </Badge>
            </div>
            
            {showBalance && walletBalance !== null && (
              <span className="text-xs text-muted-foreground">
                Balance: {walletBalance.toFixed(2)} ALGO
              </span>
            )}
          </div>
        </div>

        {/* Mobile-friendly disconnect button */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm" 
            onClick={openInExplorer}
            className="p-2 h-auto text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
          
          <Button
            onClick={handleDisconnect}
            disabled={isDisconnecting}
            variant="outline"
            size="sm"
            className="disconnect-btn touch-friendly border-primary text-primary hover:bg-primary/10 min-h-[44px] px-4"
          >
            {isDisconnecting ? (
              <>
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                Disconnecting...
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4 mr-2" />
                Disconnect
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

#### 2.2 Enhanced Algorand Wallet Provider
**File:** `components/providers/AlgorandWalletProvider.tsx`

```tsx
// Add disconnect method to context
const disconnect = async () => {
  try {
    if (peraWallet) {
      await peraWallet.disconnect();
    }
    
    setAccount(null);
    setIsConnected(false);
    setConnectionStatus('disconnected');
    
    // Clear localStorage
    localStorage.removeItem('peraWallet.wallet');
    localStorage.removeItem('algorand_wallet_address');
    
  } catch (error) {
    console.error('Error disconnecting wallet:', error);
    throw error;
  }
};

// Add to context value
const value = {
  // ... existing values
  disconnect,
  isConnected,
  connectionStatus
};
```

---

### **Phase 3: Fix Mobile Payment Selector**

#### 3.1 Mobile-Optimized PaymentSelectorNew
**File:** `components/PaymentSelectorNew.tsx`

```tsx
export default function PaymentSelectorNew({
  creditsRequired,
  algoRequired,
  network,
  className = ''
}: PaymentSelectorNewProps) {
  // ... existing code ...

  return (
    <div className={`payment-selector-mobile ${className}`}>
      {/* Payment Method Selection */}
      <div className="space-y-4">
        <div className="text-base font-semibold text-foreground mb-4">
          Choose Payment Method
        </div>
        
        <RadioGroup 
          value={selectedMethod} 
          onValueChange={handleMethodChange}
          className="grid grid-cols-1 gap-3"
        >
          {paymentMethods.map((method) => (
            <div key={method.id}>
              <Label
                htmlFor={method.id}
                className={`
                  payment-option-card cursor-pointer border-2 rounded-lg p-4 block transition-all
                  touch-friendly min-h-[88px] flex items-center
                  ${selectedMethod === method.id 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border bg-card hover:border-border/60'
                  }
                  ${method.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <RadioGroupItem
                  value={method.id}
                  id={method.id}
                  disabled={method.disabled}
                  className="sr-only"
                />
                
                <div className="flex items-center gap-4 w-full">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    selectedMethod === method.id ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    <method.icon className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-foreground">{method.name}</span>
                      <span className="text-lg font-bold text-foreground">{method.cost}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{method.description}</span>
                      <span className={`${method.available ? 'text-green-400' : 'text-muted-foreground'}`}>
                        {method.balance}
                      </span>
                    </div>
                    
                    {method.recommended && (
                      <Badge className="mt-2 bg-primary/10 text-primary border-primary/20">
                        Recommended
                      </Badge>
                    )}
                  </div>
                </div>
              </Label>
            </div>
          ))}
        </RadioGroup>
        
        {/* Payment Info & Warnings */}
        <div className="space-y-3 mt-4">
          {selectedMethod === 'credits' && (
            <Alert className="border-blue-500/20 bg-blue-500/10">
              <Info className="w-4 h-4 text-blue-400" />
              <AlertDescription className="text-blue-300">
                <strong>Credits:</strong> Fast and convenient. Credits are pre-paid tokens that make deployment instant.
              </AlertDescription>
            </Alert>
          )}
          
          {selectedMethod === 'algo_direct' && (
            <Alert className="border-orange-500/20 bg-orange-500/10">
              <Info className="w-4 h-4 text-orange-400" />
              <AlertDescription className="text-orange-300">
                <strong>Direct ALGO Payment:</strong> Pay directly from your wallet. Transaction requires wallet approval.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Insufficient Funds Warnings */}
        {selectedMethod === 'credits' && !hasEnoughCredits && (
          <Alert className="border-red-500/20 bg-red-500/10">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <AlertDescription className="text-red-300">
              <strong>Insufficient Credits:</strong> You need {creditsRequired} credits but only have {userCredits}.
              <div className="mt-2">
                <Button size="sm" variant="outline" className="text-red-300 border-red-500/30">
                  Buy More Credits
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {selectedMethod === 'algo_direct' && !hasEnoughAlgo && (
          <Alert className="border-red-500/20 bg-red-500/10">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <AlertDescription className="text-red-300">
              <strong>Insufficient ALGO:</strong> You need {algoRequired} ALGO but only have {walletBalance?.toFixed(2) || 0}.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
```

#### 3.2 Mobile Payment Selector Styles
**File:** `app/globals.css` (Add to existing styles)

```css
/* Mobile Payment Selector Styles */
.payment-selector-mobile {
  width: 100%;
}

.payment-option-card {
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  touch-action: manipulation;
  transition: all 0.2s ease;
}

.payment-option-card:active {
  transform: scale(0.98);
}

.touch-friendly {
  min-height: 44px;
  min-width: 44px;
}

/* Ensure payment selector is visible on mobile */
@media (max-width: 768px) {
  .payment-selector-mobile {
    font-size: 16px; /* Prevent zoom on iOS */
  }
  
  .payment-option-card {
    min-height: 88px;
    padding: 16px;
  }
  
  .payment-option-card .text-sm {
    font-size: 14px;
  }
  
  .payment-option-card .text-lg {
    font-size: 18px;
  }
}
```

#### 3.3 Update TokenFormNew Integration
**File:** `components/TokenFormNew.tsx`

```tsx
// In the payment section, ensure it's visible on mobile
{/* Payment Method Selection - Mobile Optimized */}
<Card className="glass-card">
  <CardHeader>
    <CardTitle className="text-lg md:text-xl font-semibold text-foreground">Payment Method</CardTitle>
    <CardDescription className="text-sm md:text-base text-muted-foreground">
      Choose how you want to pay for token creation
    </CardDescription>
  </CardHeader>
  <CardContent className="p-4 md:p-6">
    <PaymentSelectorNew
      creditsRequired={5}
      algoRequired={10}
      network={tokenData.network}
      className="mobile-payment-selector"
    />
  </CardContent>
</Card>
```

---

### **Phase 4: Integration & Testing**

#### 4.1 Update Create Token Page
**File:** `app/create/page.tsx`

```tsx
// Ensure payment selector is always visible
{/* Main Content - Mobile Optimized Layout */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
  {/* Main Form - Full width on mobile */}
  <div className="lg:col-span-2 order-2 lg:order-1">
    <TokenFormNew 
      tokenData={tokenData}
      setTokenData={setTokenData}
    />
  </div>
  
  {/* Sidebar content */}
</div>
```

#### 4.2 Mobile Testing Checklist

```markdown
### Pre-Deployment Testing Checklist

#### Modal Positioning:
- [ ] Wallet modal opens in center of screen
- [ ] Background doesn't scroll when modal is open
- [ ] Modal closes properly without affecting scroll position
- [ ] Works on iOS Safari and Android Chrome

#### Disconnect Functionality:
- [ ] Disconnect button is visible after wallet connection
- [ ] Disconnect button works for Pera wallet
- [ ] Disconnect button works for Phantom wallet
- [ ] User can reconnect after disconnecting

#### Payment Selector:
- [ ] Payment options are visible on mobile
- [ ] Touch targets are at least 44px
- [ ] Selected payment method is clearly indicated
- [ ] Insufficient balance warnings show correctly
- [ ] Payment method selection updates form state

#### Integration:
- [ ] Payment selector works in TokenFormNew
- [ ] Create token flow continues after payment selection
- [ ] Error handling works correctly
- [ ] Success flow works after token creation
```

---

## 🚀 **Implementation Priority**

1. **🔥 Critical (Immediate)**: Fix modal positioning - prevents wallet connection
2. **🔥 Critical (Immediate)**: Fix payment selector visibility - prevents token creation  
3. **⚡ High**: Add disconnect functionality - improves UX
4. **📱 High**: Mobile touch optimizations - ensures accessibility

---

## 🎯 **Expected Outcomes**

After implementation:
- ✅ Wallet modals open centered and don't disrupt user's scroll position
- ✅ Users can easily disconnect wallets with visible, accessible buttons
- ✅ Payment method selection works seamlessly on mobile devices
- ✅ Touch targets meet accessibility standards (44px minimum)
- ✅ Complete mobile token creation flow works end-to-end

---

## 📦 **Files to Create/Modify**

### New Files:
- `hooks/useModalPosition.ts`
- `WALLET_PAYMENT_FIXES_PLAN.md` (this file)

### Modified Files:
- `app/globals.css`
- `components/MobileWalletModal.tsx`
- `components/WalletConnectionManager.tsx`
- `components/providers/AlgorandWalletProvider.tsx`
- `components/PaymentSelectorNew.tsx`
- `components/TokenFormNew.tsx`
- `app/create/page.tsx`

This comprehensive plan addresses all three critical issues and ensures a smooth mobile experience for wallet connection and token creation! 🎉
