#!/bin/bash

# Mobile Wallet Connection Test Script
echo "🧪 Testing Mobile Wallet Connection Implementation"

# Check if mobile wallet utilities exist
if [ -f "/workspaces/snarbles/lib/mobile-wallet-utils.ts" ]; then
    echo "✅ Mobile wallet utilities found"
else
    echo "❌ Mobile wallet utilities missing"
    exit 1
fi

# Check if mobile wallet components exist
COMPONENTS=(
    "MobileWalletButton.tsx"
    "PhantomMobileConnector.tsx"
    "PeraMobileConnector.tsx"
    "MobileWalletManager.tsx"
    "MobileWalletModal.tsx"
)

for component in "${COMPONENTS[@]}"; do
    if [ -f "/workspaces/snarbles/components/$component" ]; then
        echo "✅ $component found"
    else
        echo "❌ $component missing"
        exit 1
    fi
done

# Check if main integration points are updated
if grep -q "MobileWalletModal" /workspaces/snarbles/components/layout/Navbar.tsx; then
    echo "✅ Navbar integration found"
else
    echo "❌ Navbar integration missing"
    exit 1
fi

if grep -q "MobileWalletModal" /workspaces/snarbles/app/create/page.tsx; then
    echo "✅ Create page integration found"
else
    echo "❌ Create page integration missing"
    exit 1
fi

# Check for mobile detection imports
if grep -q "isMobile" /workspaces/snarbles/components/layout/Navbar.tsx; then
    echo "✅ Mobile detection in Navbar found"
else
    echo "❌ Mobile detection in Navbar missing"
    exit 1
fi

echo ""
echo "🎉 All mobile wallet connection components are in place!"
echo ""
echo "📱 Mobile Wallet Features Implemented:"
echo "• Mobile device detection"
echo "• Deep linking for Phantom and Pera apps"
echo "• Fallback to app store installation"
echo "• QR code support for Pera wallet"
echo "• Mobile-optimized UI components"
echo "• Integration with existing wallet system"
echo ""
echo "🚀 Next Steps:"
echo "1. Test on mobile devices"
echo "2. Verify deep linking works"
echo "3. Test wallet connection flow"
echo "4. Deploy to production"
