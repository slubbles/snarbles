#!/bin/bash

# 🚀 Pre-Launch Validation Script for Snarbles Token Platform
# Run this script before deploying to production

echo "🔥 Snarbles Pre-Launch Validation"
echo "================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track validation status
VALIDATION_PASSED=true

# Function to check status
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1${NC}"
        VALIDATION_PASSED=false
    fi
}

echo -e "${BLUE}1. Checking Node.js and Dependencies...${NC}"
node --version > /dev/null 2>&1
check_status "Node.js installed"

npm --version > /dev/null 2>&1
check_status "npm available"

if [ -f "package.json" ]; then
    echo -e "${GREEN}✅ package.json found${NC}"
else
    echo -e "${RED}❌ package.json not found${NC}"
    VALIDATION_PASSED=false
fi

echo ""
echo -e "${BLUE}2. Installing Dependencies...${NC}"
npm install --silent > /dev/null 2>&1
check_status "Dependencies installed"

echo ""
echo -e "${BLUE}3. TypeScript Compilation Check...${NC}"
npx tsc --noEmit > /dev/null 2>&1
check_status "TypeScript compilation"

echo ""
echo -e "${BLUE}4. Production Build Test...${NC}"
npm run build > /dev/null 2>&1
check_status "Production build successful"

echo ""
echo -e "${BLUE}5. Testing Mobile Wallet Integration...${NC}"
node scripts/test-mobile-wallet-signing.js > /dev/null 2>&1
check_status "Mobile wallet integration"

echo ""
echo -e "${BLUE}6. Checking Environment Configuration...${NC}"

# Check for essential files
FILES_TO_CHECK=(
    "next.config.js"
    "tailwind.config.ts"
    "tsconfig.json"
    "components.json"
    "netlify.toml"
)

for file in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file exists${NC}"
    else
        echo -e "${RED}❌ $file missing${NC}"
        VALIDATION_PASSED=false
    fi
done

echo ""
echo -e "${BLUE}7. Checking Critical Components...${NC}"

COMPONENTS_TO_CHECK=(
    "components/PaymentSelectorNew.tsx"
    "components/TokenFormNew.tsx"
    "hooks/usePaymentState.ts"
    "hooks/useWalletConnectionResilience.ts"
    "hooks/useTransactionRecovery.ts"
    "lib/enhanced-payment-system.ts"
)

for component in "${COMPONENTS_TO_CHECK[@]}"; do
    if [ -f "$component" ]; then
        echo -e "${GREEN}✅ $component exists${NC}"
    else
        echo -e "${RED}❌ $component missing${NC}"
        VALIDATION_PASSED=false
    fi
done

echo ""
echo -e "${BLUE}8. Bundle Size Analysis...${NC}"
BUILD_SIZE=$(du -sh .next 2>/dev/null | cut -f1)
if [ -n "$BUILD_SIZE" ]; then
    echo -e "${GREEN}✅ Build size: $BUILD_SIZE${NC}"
else
    echo -e "${YELLOW}⚠️ Could not determine build size${NC}"
fi

echo ""
echo -e "${BLUE}9. Security Check...${NC}"

# Check for sensitive data exposure
if grep -r "private.*key\|secret.*key\|password" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . > /dev/null 2>&1; then
    echo -e "${RED}❌ Potential sensitive data found in code${NC}"
    VALIDATION_PASSED=false
else
    echo -e "${GREEN}✅ No sensitive data exposed${NC}"
fi

# Check for console.log in production code
LOG_COUNT=$(grep -r "console\.log" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" components/ app/ lib/ 2>/dev/null | wc -l)
if [ "$LOG_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}⚠️ Found $LOG_COUNT console.log statements (consider removing for production)${NC}"
else
    echo -e "${GREEN}✅ No console.log statements found${NC}"
fi

echo ""
echo -e "${BLUE}10. Final Validation Summary...${NC}"
echo "================================="

if [ "$VALIDATION_PASSED" = true ]; then
    echo -e "${GREEN}🎉 ALL VALIDATIONS PASSED!${NC}"
    echo -e "${GREEN}🚀 Platform is ready for production deployment!${NC}"
    echo ""
    echo -e "${BLUE}Next Steps:${NC}"
    echo "1. Configure production environment variables"
    echo "2. Deploy to Netlify"
    echo "3. Run post-deployment tests"
    echo "4. Monitor for 24 hours"
    echo ""
    echo -e "${GREEN}Happy launching! 🚀${NC}"
    exit 0
else
    echo -e "${RED}❌ VALIDATION FAILED!${NC}"
    echo -e "${RED}Please fix the issues above before deploying.${NC}"
    echo ""
    echo -e "${BLUE}Common fixes:${NC}"
    echo "- Run 'npm install' to install dependencies"
    echo "- Fix TypeScript errors shown above"
    echo "- Ensure all required files are present"
    echo "- Remove sensitive data from code"
    echo ""
    exit 1
fi
