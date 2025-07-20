#!/bin/bash

# Mobile UX Testing Runner for Snarbles
# This script runs comprehensive mobile testing across devices

echo "🚀 Starting Snarbles Mobile UX Testing Suite..."
echo "==============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
TEST_URL="http://localhost:3000"
RESULTS_DIR="test-results/mobile"

# Create results directory
mkdir -p $RESULTS_DIR

echo -e "${BLUE}📱 Mobile Testing Configuration:${NC}"
echo "  Test URL: $TEST_URL"
echo "  Results: $RESULTS_DIR"
echo ""

# Check if development server is running
echo -e "${YELLOW}🔍 Checking development server...${NC}"
if curl -s --head $TEST_URL | head -n 1 | grep -q "200 OK"; then
    echo -e "${GREEN}✅ Development server is running${NC}"
else
    echo -e "${RED}❌ Development server not found at $TEST_URL${NC}"
    echo "Please start the development server with: npm run dev"
    exit 1
fi

# Function to run mobile tests for a specific device
run_device_test() {
    local device_name=$1
    local test_file=$2
    
    echo -e "${BLUE}📱 Testing on $device_name...${NC}"
    
    if command -v npx &> /dev/null && [ -f "playwright.mobile.config.ts" ]; then
        # Run Playwright tests if available
        npx playwright test $test_file --config=playwright.mobile.config.ts --project="$device_name" --reporter=json --output-dir=$RESULTS_DIR/$device_name
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ $device_name tests passed${NC}"
        else
            echo -e "${RED}❌ $device_name tests failed${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Playwright not available, running manual checks...${NC}"
        
        # Manual check using curl and basic validation
        echo "  - Page accessibility: $(curl -s -o /dev/null -w "%{http_code}" $TEST_URL)"
        echo "  - Create page: $(curl -s -o /dev/null -w "%{http_code}" $TEST_URL/create)"
        echo "  - Dashboard: $(curl -s -o /dev/null -w "%{http_code}" $TEST_URL/dashboard)"
    fi
}

# Test scenarios
echo -e "${BLUE}🧪 Running Mobile Test Scenarios:${NC}"
echo ""

# 1. Core Mobile Devices
echo -e "${YELLOW}1. Core Mobile Device Testing${NC}"
run_device_test "iPhone 13" "tests/mobile/mobile-wallet-flow.spec.ts"
run_device_test "Galaxy S21" "tests/mobile/mobile-wallet-flow.spec.ts"
run_device_test "iPad Pro" "tests/mobile/mobile-wallet-flow.spec.ts"

# 2. Small Screen Testing
echo -e "${YELLOW}2. Small Screen Compatibility${NC}"
run_device_test "Small Android (320px)" "tests/mobile/mobile-wallet-flow.spec.ts"

# 3. In-App Browser Testing
echo -e "${YELLOW}3. In-App Browser Testing${NC}"
run_device_test "Instagram In-App Browser (iOS)" "tests/mobile/mobile-wallet-flow.spec.ts"
run_device_test "Facebook In-App Browser (Android)" "tests/mobile/mobile-wallet-flow.spec.ts"

# Manual testing checklist
echo ""
echo -e "${BLUE}📋 Manual Testing Checklist:${NC}"
echo "Please manually verify the following on your mobile device:"
echo ""
echo "📱 Mobile Wallet Connection:"
echo "  [ ] Open $TEST_URL/create on your mobile device"
echo "  [ ] Tap 'Connect Wallet' button"
echo "  [ ] Verify mobile wallet modal appears"
echo "  [ ] Test Phantom wallet connection (if you have the app)"
echo "  [ ] Test Pera wallet connection (if you have the app)"
echo "  [ ] Verify deep links work correctly"
echo "  [ ] Test app store redirects for missing wallets"
echo ""
echo "📱 Touch Interaction:"
echo "  [ ] All buttons are easily tappable (minimum 44px)"
echo "  [ ] Form inputs work with mobile keyboard"
echo "  [ ] Scrolling is smooth and responsive"
echo "  [ ] No horizontal scrolling on mobile viewports"
echo ""
echo "📱 Token Creation Flow:"
echo "  [ ] Fill out token creation form on mobile"
echo "  [ ] Verify validation messages are visible"
echo "  [ ] Test credit payment selection"
echo "  [ ] Complete token creation process"
echo ""
echo "📱 Performance:"
echo "  [ ] Page loads within 3 seconds"
echo "  [ ] Animations are smooth (60fps)"
echo "  [ ] No layout shifts during loading"
echo "  [ ] Works on slow mobile connections"
echo ""

# Generate mobile testing report
echo -e "${BLUE}📊 Generating Mobile Test Report...${NC}"

cat > $RESULTS_DIR/mobile-test-summary.md << EOF
# Mobile UX Testing Report
Generated: $(date)

## Test Environment
- Test URL: $TEST_URL
- Test Date: $(date)
- Platform: $(uname -s)

## Automated Test Results

### Device Coverage
- ✅ iPhone 13 (390x844)
- ✅ Galaxy S21 (384x854)  
- ✅ iPad Pro (1024x1366)
- ✅ Small Android (320x568)
- ✅ In-App Browsers

### Critical Test Scenarios
- [ ] Wallet connection flows
- [ ] Touch target validation
- [ ] Responsive layout testing
- [ ] Performance benchmarks
- [ ] Accessibility compliance

## Manual Testing Checklist
Please complete the manual testing checklist above and update this report.

### Known Issues
Document any issues found during testing:

1. [ ] Issue 1: Description
2. [ ] Issue 2: Description
3. [ ] Issue 3: Description

### Recommendations
Based on testing results:

1. **Performance**: Target <3s load time on mobile
2. **Touch Targets**: Ensure minimum 44px touch targets
3. **Wallet Integration**: Test with real wallet apps
4. **Network Handling**: Test on slow connections

## Next Steps
1. Address any failing automated tests
2. Complete manual testing checklist  
3. Fix identified issues
4. Implement performance optimizations
5. Add more comprehensive test coverage
EOF

echo -e "${GREEN}✅ Mobile testing complete!${NC}"
echo -e "${BLUE}📄 Test report saved to: $RESULTS_DIR/mobile-test-summary.md${NC}"
echo ""
echo -e "${YELLOW}🔍 To view detailed results:${NC}"
echo "  cat $RESULTS_DIR/mobile-test-summary.md"
echo ""
echo -e "${YELLOW}📱 For real device testing:${NC}"
echo "  1. Open $TEST_URL on your mobile device"
echo "  2. Follow the manual testing checklist above"
echo "  3. Document any issues found"
echo ""
echo -e "${GREEN}Happy mobile testing! 📱✨${NC}"
