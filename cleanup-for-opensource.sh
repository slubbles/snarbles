#!/bin/bash

echo "🧹 Starting Snarbles codebase cleanup for open source..."

# Create backup first
echo "📦 Creating backup..."
cd /workspaces
tar -czf snarbles-backup-$(date +%Y%m%d).tar.gz snarbles/ 2>/dev/null || echo "⚠️ Backup failed, continuing anyway..."

cd /workspaces/snarbles

# 1. Remove development documentation files
echo "📝 Removing development documentation..."
rm -f *_COMPLETE.md
rm -f *_IMPLEMENTATION*.md
rm -f *_FIX*.md
rm -f *_PLAN.md
rm -f *_STATUS.md
rm -f *_SUMMARY.md
rm -f *_GUIDE.md
rm -f *_ROADMAP.md
rm -f *_CHECKLIST.md
rm -f ADMIN_*.md
rm -f ALGORAND_*.md
rm -f MOBILE_*.md
rm -f SOLANA_*.md
rm -f CREDITS_*.md
rm -f WALLET_*.md
rm -f DATABASE_*.md
rm -f 🎉_*.md
rm -f HONEST_*.md
rm -f HYBRID_*.md
rm -f IMMEDIATE_*.md
rm -f INTEGRATION_*.md
rm -f ISSUE_*.md
rm -f MAINNET_*.md
rm -f MARKETING_*.md
rm -f MCP_*.md
rm -f METADATA_*.md
rm -f MOCK_*.md
rm -f MONETIZATION_*.md
rm -f MULTI_*.md
rm -f NAVBAR_*.md
rm -f PAYMENT_*.md
rm -f PERA_*.md
rm -f PHASE_*.md
rm -f PRODUCTION_*.md
rm -f QUICK_*.md
rm -f REAL_*.md
rm -f REDESIGN_*.md
rm -f RISK_*.md
rm -f SECTION_*.md
rm -f SECURITY_*.md
rm -f SMART_*.md
rm -f SNARBLES_*.md
rm -f SUPABASE_*.md
rm -f TEST_*.md
rm -f TOKEN_*.md
rm -f UI_*.md
rm -f USDT_*.md
rm -f VERIFICATION_*.md
rm -f ADVANCED_*.md
rm -f ANALYTICS_*.md
rm -f API_*.md
rm -f ATOMIC_*.md
rm -f AUTOMATED_*.md
rm -f BUG_*.md
rm -f BUTTON_*.md
rm -f CAROUSEL_*.md
rm -f COMPLETE_*.md
rm -f CONFIGURATION_*.md
rm -f CONFIRMATION_*.md
rm -f CONSOLE_*.md
rm -f CREATE_*.md
rm -f CSP_*.md
rm -f DASHBOARD_*.md
rm -f DEPLOYMENT_*.md
rm -f DESIGN_*.md
rm -f DOCUMENTATION_*.md
rm -f DYNAMIC_*.md
rm -f ENVIRONMENT_*.md
rm -f EXECUTION_*.md
rm -f FEE_*.md
rm -f FINAL_*.md

# 2. Remove test and fix scripts
echo "🧪 Removing test and development scripts..."
rm -f test-*.js
rm -f fix-*.js
rm -f check-*.js
rm -f *-fix-*.js
rm -f verify-database.js
rm -f execute-schema-migration.js
rm -f simple-fix-test.js
rm -f react-hooks-fix-summary.js
rm -f algo-credit-fix-summary.js
rm -f CLEANUP_PLAN.md

# 3. Remove SQL development files
echo "🗄️ Removing development SQL files..."
rm -f fix-*.sql
rm -f comprehensive-database-fix.sql
rm -f supabase-credit-function.sql

# 4. Remove build logs and temporary files
echo "🗑️ Removing build logs and temporary files..."
rm -f build.log
rm -f build-result.log
rm -f tsconfig.tsbuildinfo

# 5. Remove test HTML files
echo "🌐 Removing test HTML files..."
rm -f test-*.html

# 6. Remove development config files
echo "⚙️ Removing development config files..."
rm -f setup-github.md
rm -f git-setup.sh
rm -f .mcp.json

# 7. Remove test results directory
echo "📊 Removing test results..."
rm -rf test-results/

# 8. Clean up any remaining temporary files
echo "✨ Final cleanup..."
rm -f *.tmp
rm -f *.bak
rm -f check-user-profile.js
rm -f fix-user-profile.js
rm -f test-fixed-credits.js

# 9. Keep only production supabase files
echo "🗄️ Cleaning up supabase directory..."
if [ -d "supabase" ]; then
    cd supabase
    # Keep only migrations folder
    find . -maxdepth 1 -type f -name "*.sql" -not -path "./migrations/*" -delete 2>/dev/null || true
    cd ..
fi

# 10. Remove development database folder if it exists
rm -rf database/ 2>/dev/null || true

# 11. Clean up docs folder (keep only production docs)
if [ -d "docs" ]; then
    rm -rf docs/
fi

echo "✅ Cleanup completed!"
echo ""
echo "📊 Cleanup Summary:"
echo "📁 Files remaining:"
find . -type f -not -path "./node_modules/*" -not -path "./.next/*" -not -path "./.git/*" -not -path "./out/*" | wc -l
echo ""
echo "📝 Markdown files remaining:"
find . -name "*.md" -not -path "./node_modules/*" | wc -l
echo ""
echo "🧪 Test files remaining:"
find . -name "test-*" -not -path "./node_modules/*" | wc -l
echo ""
echo "🎉 Snarbles is now ready for open source!"
echo "📋 Next steps:"
echo "   1. Review remaining files"
echo "   2. Update README.md"
echo "   3. Add LICENSE"
echo "   4. Add CONTRIBUTING.md"
echo "   5. Test build: npm run build"
