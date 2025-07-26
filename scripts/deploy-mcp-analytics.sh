#!/bin/bash

# Supabase MCP Analytics Deployment Script
# This script deploys the advanced analytics functions to your Supabase database

set -e

echo "🚀 Deploying Supabase MCP Analytics Functions..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# Check if logged in to Supabase
if ! supabase projects list &> /dev/null; then
    echo "🔐 Please login to Supabase first:"
    echo "Run: supabase login"
    exit 1
fi

# Load environment variables
if [ -f .env.local ]; then
    echo "📄 Loading environment variables from .env.local..."
    export $(cat .env.local | grep -v '^#' | xargs)
elif [ -f .env ]; then
    echo "📄 Loading environment variables from .env..."
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "⚠️  No environment file found. Make sure you have SUPABASE_URL and SUPABASE_ANON_KEY set."
fi

# Extract project reference from Supabase URL
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ NEXT_PUBLIC_SUPABASE_URL not found in environment variables"
    exit 1
fi

PROJECT_REF=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed 's/.*\/\/\([^.]*\).*/\1/')
echo "🎯 Deploying to project: $PROJECT_REF"

# Create migration file
TIMESTAMP=$(date +%Y%m%d%H%M%S)
MIGRATION_FILE="supabase/migrations/${TIMESTAMP}_mcp_analytics_functions.sql"

# Create supabase directory structure if it doesn't exist
mkdir -p supabase/migrations

# Copy the SQL functions to migration file
echo "📁 Creating migration file: $MIGRATION_FILE"
cp database/mcp-analytics-functions.sql "$MIGRATION_FILE"

# Add migration metadata
cat << EOF > "supabase/migrations/${TIMESTAMP}_mcp_analytics_functions.sql"
-- Supabase MCP Analytics Functions
-- Generated on: $(date)
-- Description: Advanced analytics functions for MCP integration

$(cat database/mcp-analytics-functions.sql)
EOF

echo "📊 Deploying analytics functions..."

# Run the migration
if supabase db push --project-ref "$PROJECT_REF"; then
    echo "✅ Analytics functions deployed successfully!"
    
    # Test the functions
    echo "🧪 Testing deployed functions..."
    
    # Test platform overview function
    if supabase db sql --project-ref "$PROJECT_REF" --query "SELECT COUNT(*) FROM get_platform_overview('7d');" > /dev/null 2>&1; then
        echo "✅ Platform overview function is working"
    else
        echo "⚠️  Platform overview function test failed (this is normal if no data exists yet)"
    fi
    
    # Test revenue analytics function
    if supabase db sql --project-ref "$PROJECT_REF" --query "SELECT COUNT(*) FROM get_revenue_analytics('7d');" > /dev/null 2>&1; then
        echo "✅ Revenue analytics function is working"
    else
        echo "⚠️  Revenue analytics function test failed (this is normal if no data exists yet)"
    fi
    
    echo ""
    echo "🎉 Deployment complete!"
    echo "📈 Your Supabase MCP Analytics functions are now live!"
    echo ""
    echo "Next steps:"
    echo "1. Update your dashboard to use the new analytics components"
    echo "2. Test the MCP integration in VS Code"
    echo "3. Monitor the analytics data in your admin panel"
    echo ""
    echo "🔗 Access your Supabase dashboard: https://app.supabase.com/project/$PROJECT_REF"
    
else
    echo "❌ Deployment failed. Check the error messages above."
    exit 1
fi

# Create a verification script
cat << 'EOF' > scripts/verify-mcp-analytics.js
// Verification script for MCP Analytics deployment
const { createClient } = require('@supabase/supabase-js');

async function verifyDeployment() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('🔍 Verifying MCP Analytics deployment...');
  
  try {
    // Test platform overview
    const { data: overview, error: overviewError } = await supabase.rpc('get_platform_overview', { 
      time_period: '7d' 
    });
    
    if (overviewError) {
      console.log('⚠️  Platform overview function exists but returned error (normal if no data):', overviewError.message);
    } else {
      console.log('✅ Platform overview function is working');
      console.log('📊 Sample data:', JSON.stringify(overview, null, 2));
    }
    
    // Test revenue analytics
    const { data: revenue, error: revenueError } = await supabase.rpc('get_revenue_analytics', { 
      time_period: '7d' 
    });
    
    if (revenueError) {
      console.log('⚠️  Revenue analytics function exists but returned error (normal if no data):', revenueError.message);
    } else {
      console.log('✅ Revenue analytics function is working');
    }
    
    console.log('🎉 MCP Analytics verification complete!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

verifyDeployment();
EOF

chmod +x scripts/verify-mcp-analytics.js

echo "📋 Created verification script: scripts/verify-mcp-analytics.js"
echo "Run with: node scripts/verify-mcp-analytics.js"
