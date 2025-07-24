# Multi-Network USDT Credit Top-Up System

## Overview

The Snarbles platform now supports credit top-ups using USDT from multiple blockchain networks alongside the existing ALGO payment system. Users can purchase credits using USDT from 6 different networks, providing flexibility and lower transaction costs.

## Key Features

### 🔹 **Dual Payment System**
- **ALGO Payments**: Direct Algorand payments (existing system)
- **USDT Payments**: Multi-network USDT support (new feature)

### 🔹 **Supported Networks**
1. **Ethereum** (ETH) - Gas: ~$15-50
2. **Polygon** (MATIC) - Gas: ~$0.01-0.10 ⭐ Popular
3. **BNB Smart Chain** (BSC) - Gas: ~$0.20-1.00 ⭐ Popular
4. **Arbitrum** (ARB) - Gas: ~$0.50-2.00
5. **Optimism** (OP) - Gas: ~$0.50-2.00
6. **Avalanche** (AVAX) - Gas: ~$0.50-2.00

### 🔹 **Receiving Address**
All USDT payments from all networks go to:
```
0x9ca8362c35db2649614cd4029ab0067d285660ef
```

## Pricing Structure

### USDT Pricing
- **Exchange Rate**: 1 USDT = 1 Credit
- **Minimum Purchase**: 5 USDT
- **Maximum Purchase**: 1,000 USDT
- **No Processing Fees**: Full amount converts to credits

### ALGO Pricing (Existing)
- **Exchange Rate**: 1 ALGO = 2 Credits
- **Bonus Credits**: Available on larger purchases

## Technical Implementation

### 🔧 **Components Created**

1. **`/lib/usdt-payment-system.ts`**
   - Core USDT payment logic
   - Network configurations
   - Transaction management
   - Payment confirmation system

2. **`/components/USDTTopUp.tsx`**
   - Complete USDT payment interface
   - Network selection
   - Amount input and validation
   - Payment instructions modal
   - Transaction history

3. **Updated `/components/CreditTopUpNew.tsx`**
   - Tabbed interface for both payment methods
   - Integration with USDT top-up component

4. **`/database/usdt_payments_table.sql`**
   - Database schema for USDT payments
   - Indexes for performance
   - Admin monitoring views

### 🔧 **Database Schema**

```sql
usdt_payments (
    id VARCHAR(255) PRIMARY KEY,
    wallet_address VARCHAR(255) NOT NULL,
    usdt_amount DECIMAL(18, 6) NOT NULL,
    credits_received INTEGER NOT NULL,
    network VARCHAR(50) NOT NULL,
    contract_address VARCHAR(255) NOT NULL,
    transaction_hash VARCHAR(255),
    from_address VARCHAR(255),
    to_address VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP,
    confirmed_at TIMESTAMP,
    block_number BIGINT,
    gas_used BIGINT,
    gas_price VARCHAR(50)
)
```

## User Flow

### 🔄 **USDT Payment Process**

1. **User Selects USDT Tab**
   - Choose from 6 supported networks
   - See gas fee estimates
   - Popular networks highlighted

2. **Amount Selection**
   - Quick preset amounts (10, 25, 50, 100, 250 USDT)
   - Custom amount input
   - Real-time credit calculation

3. **Payment Initiation**
   - System generates payment ID
   - Creates pending database record
   - Shows payment instructions modal

4. **User Sends Payment**
   - Copy receiver address
   - Send exact USDT amount
   - From same connected wallet

5. **Payment Confirmation**
   - System detects transaction
   - Updates database record
   - Credits added to user balance
   - Confirmation notification

### 🔄 **ALGO Payment Process** (Existing)

1. **User Selects ALGO Tab**
2. **Choose Purchase Package**
3. **Connect Algorand Wallet**
4. **Sign Transaction**
5. **Credits Added Instantly**

## Network Details

### USDT Contract Addresses

```javascript
{
  ethereum: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  polygon: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
  bsc: '0x55d398326f99059fF775485246999027B3197955',
  arbitrum: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
  optimism: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
  avalanche: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7'
}
```

### Network Characteristics

| Network | Chain ID | Decimals | Gas Cost | Confirmation Time |
|---------|----------|----------|----------|-------------------|
| Ethereum | 1 | 6 | High | 1-3 min |
| Polygon | 137 | 6 | Very Low | 30 sec |
| BSC | 56 | 18 | Low | 30 sec |
| Arbitrum | 42161 | 6 | Low | 1 min |
| Optimism | 10 | 6 | Low | 1 min |
| Avalanche | 43114 | 6 | Low | 30 sec |

## Admin Features

### 📊 **Payment Monitoring**

```sql
-- View pending payments
SELECT * FROM usdt_payments 
WHERE status = 'pending' 
AND created_at < NOW() - INTERVAL '1 hour';

-- Network summary
SELECT * FROM usdt_payment_summary;

-- User payment history
SELECT * FROM usdt_payments 
WHERE wallet_address = '0x...' 
ORDER BY created_at DESC;
```

### 📊 **Manual Confirmation**

```javascript
// Confirm payment when transaction is detected
await confirmUSDTPayment(
  paymentId,
  transactionHash,
  blockNumber,
  gasUsed,
  gasPrice
);
```

## Security Considerations

### 🔒 **Payment Validation**
- Amount limits (5-1000 USDT)
- Network validation
- Contract address verification
- Duplicate payment prevention

### 🔒 **Transaction Monitoring**
- Pending payment timeout alerts
- Failed payment tracking
- Blockchain confirmation requirements

## Integration Points

### 🔗 **Frontend Integration**

```tsx
// Add to credits page
import CreditTopUpNew from '@/components/CreditTopUpNew';

<CreditTopUpNew />
```

### 🔗 **Backend Integration**

```typescript
// Payment system functions
import {
  getUSDTPaymentOptions,
  initiateUSDTPayment,
  confirmUSDTPayment,
  getUSDTPaymentHistory
} from '@/lib/usdt-payment-system';
```

## Benefits for Users

### 💰 **Cost Advantages**
- Choose lowest-fee network
- Polygon/BSC: ~$0.01-1.00 vs Ethereum ~$15-50
- No platform processing fees

### 💰 **Flexibility**
- Multiple payment options
- Stable USDT pricing
- Global accessibility

### 💰 **User Experience**
- Clear payment instructions
- Real-time status updates
- Complete payment history

## Future Enhancements

### 🚀 **Planned Features**
- Automatic payment detection via webhooks
- Additional stablecoin support (USDC, DAI)
- Bulk payment discounts
- Mobile wallet integration

### 🚀 **Analytics Dashboard**
- Payment volume by network
- Popular payment amounts
- User conversion metrics
- Revenue tracking

## Support

### 📞 **User Support**
- Payment stuck? Check transaction hash on explorer
- Credits not received? Contact support with payment ID
- Network fees too high? Try Polygon or BSC

### 📞 **Admin Support**
- Monitor pending payments regularly
- Set up alerts for stuck payments
- Manual confirmation process documented

---

## Quick Start Guide

1. **Setup Database**: Run `/database/usdt_payments_table.sql`
2. **Update Imports**: Add `USDTTopUp` component
3. **Test Networks**: Start with Polygon testnet
4. **Monitor Payments**: Check pending payments hourly
5. **User Education**: Guide users to low-fee networks

The multi-network USDT system provides users with flexible, cost-effective credit purchasing options while maintaining the existing ALGO payment system for Algorand users.
