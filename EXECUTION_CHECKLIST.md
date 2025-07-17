# 🔧 Technical Execution Checklist

## Phase 1: Fix Critical Build Issues ⚡

### 1.1 TokenFormNew Missing Imports
- [ ] **File**: `/components/TokenFormNew.tsx`
- [ ] **Line**: After line 17 (existing PaymentSelectorNew import)
- [ ] **Add**: `import { validatePaymentForTokenCreation, executeTokenCreationPayment } from '@/lib/enhanced-payment-system';`
- [ ] **Verify**: Check if functions exist in enhanced-payment-system.ts
- [ ] **Test**: Import should not cause TypeScript errors

### 1.2 PaymentSelectorNew Integration
- [ ] **File**: `/components/TokenFormNew.tsx`
- [ ] **Location**: Around line 600+ in form render section
- [ ] **Add**: PaymentSelectorNew component after Basic Information card
- [ ] **Props**: Connect to selectedPaymentMethod state
- [ ] **State**: Ensure userCredits, creditsRequired, algoRequired are available

### 1.3 Build Verification
- [ ] **Command**: `npm run build`
- [ ] **Check**: No TypeScript errors
- [ ] **Check**: No missing module errors
- [ ] **Check**: All imports resolve correctly

**🎯 Success Criteria**: Clean build with PaymentSelectorNew visible in TokenFormNew

---

## Phase 2: Real Wallet Integration 🔌

### 2.1 Enhanced Payment System - Real Implementation

#### processAlgoPayment Function
- [ ] **File**: `/lib/enhanced-payment-system.ts`
- [ ] **Current**: Mock implementation with fake transactions
- [ ] **Replace**: Real Algorand transaction creation and signing
- [ ] **Integration**: Use existing AlgorandWalletProvider.signTransaction
- [ ] **Error Handling**: Wallet connection failures, insufficient balance

#### purchaseCreditsWithAlgo Function
- [ ] **File**: `/lib/enhanced-payment-system.ts`
- [ ] **Current**: Mock credit purchase
- [ ] **Replace**: Real ALGO → credits conversion
- [ ] **Integration**: Connect to Supabase credit system
- [ ] **Validation**: Check ALGO balance before purchase

#### getPaymentOptions Function
- [ ] **File**: `/lib/enhanced-payment-system.ts`
- [ ] **Current**: Mock balance checking
- [ ] **Replace**: Real wallet balance queries
- [ ] **Integration**: Use AlgorandWalletProvider balance
- [ ] **Caching**: Cache balance for performance

### 2.2 CreditTopUpNew Component Updates
- [ ] **File**: `/components/CreditTopUpNew.tsx`
- [ ] **Current**: Mock transaction signing (line 65)
- [ ] **Replace**: Real wallet signing using useAlgorandWallet hook
- [ ] **Integration**: Connect to AlgorandWalletProvider context
- [ ] **Error Handling**: Transaction rejection, network errors

### 2.3 Payment Validation Updates
- [ ] **File**: `/lib/enhanced-payment-system.ts`
- [ ] **Function**: validatePaymentForTokenCreation
- [ ] **Current**: Basic validation
- [ ] **Add**: Real balance checking
- [ ] **Add**: Network fee estimation
- [ ] **Add**: Transaction simulation

**🎯 Success Criteria**: All payment functions use real wallet integration

---

## Phase 3: Mobile Wallet Testing 📱

### 3.1 Mobile Testing Setup
- [ ] **Create**: `/app/test-mobile/page.tsx`
- [ ] **Purpose**: Real mobile wallet testing environment
- [ ] **Include**: Connection testing, transaction signing
- [ ] **Test**: Both Phantom and Pera mobile apps

### 3.2 Mobile Wallet Flow Testing
- [ ] **Phantom Mobile**:
  - [ ] Deep link generation works
  - [ ] App opens correctly
  - [ ] Connection establishes
  - [ ] Transaction signing works
- [ ] **Pera Mobile**:
  - [ ] Deep link generation works
  - [ ] App opens correctly
  - [ ] Connection establishes
  - [ ] Transaction signing works

### 3.3 Error Scenario Testing
- [ ] **Connection Failures**: App not installed, connection rejected
- [ ] **Transaction Failures**: User rejection, insufficient balance
- [ ] **Network Issues**: Offline mode, poor connectivity
- [ ] **Recovery**: Graceful fallback to web wallets

**🎯 Success Criteria**: Mobile wallet signing works on real devices

---

## Phase 4: Integration & Polish ✨

### 4.1 Complete TokenFormNew Integration
- [ ] **File**: `/components/TokenFormNew.tsx`
- [ ] **Integration**: Full payment flow with real wallet calls
- [ ] **State Management**: Connect payment method to deployment
- [ ] **Error Handling**: Payment failures, wallet disconnection

### 4.2 UX Improvements
- [ ] **Loading States**: During payment processing
- [ ] **Error Messages**: User-friendly error descriptions
- [ ] **Confirmation**: Payment success/failure feedback
- [ ] **Progress**: Step-by-step deployment progress

### 4.3 End-to-End Testing
- [ ] **Credits Payment**: Full token creation with credits
- [ ] **ALGO Payment**: Full token creation with direct ALGO
- [ ] **Mobile Testing**: Complete flow on mobile devices
- [ ] **Error Recovery**: Handle all failure scenarios

**🎯 Success Criteria**: Complete token creation flow works flawlessly

---

## 🧪 Testing Strategy

### Unit Tests
```bash
# Test payment functions
npm run test -- --testNamePattern="payment"

# Test wallet integration
npm run test -- --testNamePattern="wallet"

# Test mobile utilities
npm run test -- --testNamePattern="mobile"
```

### Integration Tests
```bash
# Test complete payment flow
npm run test:integration -- --testNamePattern="payment-flow"

# Test mobile wallet connection
npm run test:integration -- --testNamePattern="mobile-wallet"
```

### Manual Testing Checklist
- [ ] **Desktop Chrome**: Token creation with both payment methods
- [ ] **Desktop Firefox**: Cross-browser compatibility
- [ ] **Mobile iOS Safari**: Phantom and Pera wallet integration
- [ ] **Mobile Android Chrome**: Deep linking and signing
- [ ] **Mobile In-App**: Instagram, Twitter in-app browsers

---

## 🐛 Common Issues & Solutions

### Build Issues
- **Missing Imports**: Add to package.json dependencies
- **TypeScript Errors**: Update interface definitions
- **Module Resolution**: Check tsconfig.json paths

### Wallet Integration Issues
- **Connection Failures**: Check wallet provider initialization
- **Signing Errors**: Verify transaction format
- **Balance Issues**: Check network connection and RPC endpoints

### Mobile Issues
- **Deep Link Failures**: Verify URL encoding
- **App Not Opening**: Check app installation detection
- **Connection Timeouts**: Implement retry logic

---

## 📋 Pre-Execution Checklist

### Environment Setup
- [ ] **Node Version**: 18+ installed
- [ ] **Dependencies**: `npm install` completed
- [ ] **Environment**: `.env.local` configured
- [ ] **Supabase**: Database connection working

### Code Review
- [ ] **Backup**: Current code committed to git
- [ ] **Branch**: Working on feature branch
- [ ] **Clean State**: No uncommitted changes
- [ ] **Build**: Current code builds without errors

### Tools Ready
- [ ] **IDE**: VS Code with TypeScript support
- [ ] **Browser**: Chrome DevTools ready
- [ ] **Mobile**: iOS/Android devices for testing
- [ ] **Wallets**: Phantom and Pera apps installed

---

## 🎯 Execution Order

1. **Start Phase 1**: Fix build issues first
2. **Validate Phase 1**: Ensure clean build before proceeding
3. **Execute Phase 2**: Real wallet integration
4. **Test Phase 2**: Verify payments work
5. **Execute Phase 3**: Mobile testing
6. **Validate Phase 3**: Confirm mobile signing works
7. **Execute Phase 4**: Final integration
8. **Complete Testing**: End-to-end validation

**Ready to execute? Let's begin with Phase 1! 🚀**
