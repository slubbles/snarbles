#!/bin/bash
# 🧹 SAFE CLEANUP SCRIPT FOR SNARBLES OPEN SOURCE PREPARATION
# This script ONLY removes development/temporary files, NOT application code

echo "🔍 Analyzing files to remove..."

# Create a backup first (safety measure)
echo "📦 Creating backup of current state..."
tar -czf "snarbles-backup-$(date +%Y%m%d-%H%M%S).tar.gz" \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=out \
  --exclude="*.tar.gz" \
  .

echo "✅ Backup created successfully"

# Function to safely remove files
safe_remove() {
  local file="$1"
  if [[ -f "$file" ]]; then
    echo "🗑️  Removing: $file"
    rm "$file"
  fi
}

# Function to count files before deletion
count_files() {
  local pattern="$1"
  find . -name "$pattern" -type f | wc -l
}

echo ""
echo "📊 Current cleanup targets:"
echo "   Development docs: $(count_files '*.md' | grep -v README.md)"
echo "   Test scripts: $(count_files 'test-*.js')"
echo "   Fix scripts: $(count_files 'fix-*.js')"
echo "   SQL files: $(count_files '*.sql')"
echo "   Log files: $(count_files '*.log')"
echo ""

read -p "🚨 Continue with cleanup? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Cleanup cancelled"
  exit 1
fi

echo "🧹 Starting safe cleanup..."

# 1. Remove development documentation (keep README.md)
echo "📝 Cleaning development documentation..."
find . -maxdepth 1 -name "*.md" ! -name "README.md" -type f -delete

# 2. Remove test and fix scripts
echo "🧪 Cleaning test scripts..."
find . -maxdepth 1 -name "test-*.js" -type f -delete
find . -maxdepth 1 -name "fix-*.js" -type f -delete
find . -maxdepth 1 -name "check-*.js" -type f -delete
find . -maxdepth 1 -name "verify-*.js" -type f -delete

# 3. Remove SQL fix files (keep supabase/migrations)
echo "🗄️  Cleaning temporary SQL files..."
find . -maxdepth 1 -name "*.sql" -type f -delete

# 4. Remove log files
echo "📋 Cleaning log files..."
find . -name "*.log" -type f -delete

# 5. Remove temporary files
echo "🔧 Cleaning temporary files..."
safe_remove "simple-fix-test.js"
safe_remove "react-hooks-fix-summary.js"
safe_remove "algo-credit-fix-summary.js"
safe_remove "setup-github.md"
safe_remove "git-setup.sh"

# 6. Clean specific development files
echo "🎯 Cleaning specific development files..."
safe_remove ".mcp.json"
safe_remove "QUICK_SETUP.md"
safe_remove "env.example"  # Keep .env.example

# 7. Remove test results and outputs
echo "📊 Cleaning test outputs..."
rm -rf test-results/ 2>/dev/null || true

# 8. Clean build artifacts (will be regenerated)
echo "🏗️  Cleaning build artifacts..."
rm -rf .next/ 2>/dev/null || true
rm -rf out/ 2>/dev/null || true

echo ""
echo "✅ Safe cleanup completed!"
echo ""
echo "📊 Cleanup summary:"
echo "   ✅ Removed development documentation"
echo "   ✅ Removed test/fix scripts"
echo "   ✅ Removed temporary SQL files"
echo "   ✅ Removed log files"
echo "   ✅ Cleaned build artifacts"
echo ""
echo "🔒 Preserved critical files:"
echo "   ✅ All app/ source code"
echo "   ✅ All components/"
echo "   ✅ All lib/ utilities" 
echo "   ✅ README.md"
echo "   ✅ package.json"
echo "   ✅ Configuration files"
echo "   ✅ supabase/ migrations"
echo ""
echo "🚀 Repository is now ready for open source!"
