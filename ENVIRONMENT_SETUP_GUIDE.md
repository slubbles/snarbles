# Environment Variables Setup Guide

## Development Setup Complete ✅

The following environment variables have been configured for local development in `.env.local`:

- `ADMIN_SECRET_KEY` - Secure admin session key
- `ADMIN_SESSION_TIMEOUT` - Session timeout (1 hour)
- `NEXT_PUBLIC_ADMIN_SOLANA_WALLET` - Admin Solana wallet address
- `NEXT_PUBLIC_ADMIN_ALGORAND_WALLET` - Admin Algorand wallet address
- `NEXT_PUBLIC_SOLANA_NETWORK` - Network configuration (devnet)
- `NEXT_PUBLIC_RPC_ENDPOINT` - Solana RPC endpoint

## Production Deployment (Netlify)

### Required Environment Variables

For production deployment on Netlify, set these environment variables in your Netlify dashboard:

```bash
ADMIN_SECRET_KEY=<generate_secure_key_for_production>
ADMIN_SESSION_TIMEOUT=3600000
NEXT_PUBLIC_ADMIN_SOLANA_WALLET=352YpA1YVHmN9Jirf5cDZdELWvsrP3DJVL7svAHJtmUj
NEXT_PUBLIC_ADMIN_ALGORAND_WALLET=PJEIDDKUOONTJOIV3BLZS7SZSAHCVKNNHTLKMASI6RTYSOZNSDY7MWGZ3M
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com
```

### Security Notes

- ⚠️ **Never commit `.env.local`** - It's properly ignored in `.gitignore`
- 🔒 **Generate unique keys for production** - Don't reuse development keys
- 🌐 **Set all variables in Netlify** before deploying
- ✅ **Verify security health check** passes after deployment

### Steps for Netlify Deployment

1. Go to Netlify Dashboard → Your Site → Site Settings → Environment Variables
2. Add each variable listed above
3. Redeploy your site
4. Test admin panel - security warning should be resolved

## Security Status

- ✅ Admin security system implemented
- ✅ Rate limiting active (30/min, 200/hr)
- ✅ Session management enabled
- ✅ Admin action logging functional
- ✅ Environment-based configuration ready
- ✅ Security health monitoring active
