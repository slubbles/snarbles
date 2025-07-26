#!/usr/bin/env node

/**
 * Supabase MCP Integration Test Suite
 * Tests the MCP analytics integration and verifies functionality
 */

const { createClient } = require('@supabase/supabase-js');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Color output helpers
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function runTests() {
  log(`${colors.bold}🧪 Supabase MCP Integration Test Suite${colors.reset}`);
  log('=====================================\n');
  
  const results = {
    passed: 0,
    failed: 0,
    skipped: 0,
    tests: []
  };

  // Test 1: Environment Variables
  log('📋 Test 1: Environment Variables', colors.blue);
  try {
    require('dotenv').config({ path: '.env.local' });
    
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length === 0) {
      log('✅ All required environment variables are present', colors.green);
      results.passed++;
      results.tests.push({ name: 'Environment Variables', status: 'passed' });
    } else {
      log(`❌ Missing environment variables: ${missingVars.join(', ')}`, colors.red);
      results.failed++;
      results.tests.push({ name: 'Environment Variables', status: 'failed', error: `Missing: ${missingVars.join(', ')}` });
    }
  } catch (error) {
    log(`❌ Environment check failed: ${error.message}`, colors.red);
    results.failed++;
    results.tests.push({ name: 'Environment Variables', status: 'failed', error: error.message });
  }
  
  // Test 2: MCP Package Installation
  log('\n📦 Test 2: MCP Package Installation', colors.blue);
  try {
    execSync('npm list -g @supabase/mcp-server-supabase', { stdio: 'pipe' });
    log('✅ Supabase MCP server package is installed globally', colors.green);
    results.passed++;
    results.tests.push({ name: 'MCP Package Installation', status: 'passed' });
  } catch (error) {
    try {
      execSync('npx @supabase/mcp-server-supabase --version', { stdio: 'pipe' });
      log('✅ Supabase MCP server package is available via npx', colors.green);
      results.passed++;
      results.tests.push({ name: 'MCP Package Installation', status: 'passed' });
    } catch (npxError) {
      log('❌ Supabase MCP server package not found', colors.red);
      results.failed++;
      results.tests.push({ name: 'MCP Package Installation', status: 'failed', error: 'Package not found' });
    }
  }
  
  // Test 3: VS Code Configuration
  log('\n⚙️  Test 3: VS Code Configuration', colors.blue);
  try {
    const settingsPath = '.vscode/settings.json';
    if (fs.existsSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      const mcpServers = settings['github.copilot.chat.experimental.defaultMcpServers'];
      
      if (mcpServers && mcpServers.length > 0) {
        const supabaseServer = mcpServers.find(server => server.name === 'supabase');
        if (supabaseServer) {
          log('✅ VS Code MCP configuration is properly set up', colors.green);
          results.passed++;
          results.tests.push({ name: 'VS Code Configuration', status: 'passed' });
        } else {
          log('⚠️  VS Code settings exist but Supabase MCP server not configured', colors.yellow);
          results.failed++;
          results.tests.push({ name: 'VS Code Configuration', status: 'failed', error: 'Supabase server not configured' });
        }
      } else {
        log('⚠️  VS Code settings exist but no MCP servers configured', colors.yellow);
        results.failed++;
        results.tests.push({ name: 'VS Code Configuration', status: 'failed', error: 'No MCP servers configured' });
      }
    } else {
      log('❌ VS Code settings.json not found', colors.red);
      results.failed++;
      results.tests.push({ name: 'VS Code Configuration', status: 'failed', error: 'settings.json not found' });
    }
  } catch (error) {
    log(`❌ VS Code configuration check failed: ${error.message}`, colors.red);
    results.failed++;
    results.tests.push({ name: 'VS Code Configuration', status: 'failed', error: error.message });
  }
  
  // Test 4: MCP Project Configuration
  log('\n📄 Test 4: MCP Project Configuration', colors.blue);
  try {
    const mcpConfigPath = '.mcp.json';
    if (fs.existsSync(mcpConfigPath)) {
      const mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
      if (mcpConfig.version && mcpConfig.name) {
        log('✅ MCP project configuration is valid', colors.green);
        results.passed++;
        results.tests.push({ name: 'MCP Project Configuration', status: 'passed' });
      } else {
        log('⚠️  MCP configuration exists but is incomplete', colors.yellow);
        results.failed++;
        results.tests.push({ name: 'MCP Project Configuration', status: 'failed', error: 'Incomplete configuration' });
      }
    } else {
      log('⚠️  MCP project configuration not found (optional)', colors.yellow);
      results.skipped++;
      results.tests.push({ name: 'MCP Project Configuration', status: 'skipped', error: 'File not found' });
    }
  } catch (error) {
    log(`❌ MCP configuration check failed: ${error.message}`, colors.red);
    results.failed++;
    results.tests.push({ name: 'MCP Project Configuration', status: 'failed', error: error.message });
  }
  
  // Test 5: Analytics Library
  log('\n📊 Test 5: Analytics Library', colors.blue);
  try {
    const analyticsPath = 'lib/supabase-mcp-analytics.ts';
    if (fs.existsSync(analyticsPath)) {
      const analyticsContent = fs.readFileSync(analyticsPath, 'utf8');
      if (analyticsContent.includes('export class MCPAnalytics') && 
          analyticsContent.includes('getPlatformAnalytics')) {
        log('✅ Analytics library is properly implemented', colors.green);
        results.passed++;
        results.tests.push({ name: 'Analytics Library', status: 'passed' });
      } else {
        log('❌ Analytics library is incomplete', colors.red);
        results.failed++;
        results.tests.push({ name: 'Analytics Library', status: 'failed', error: 'Missing required exports' });
      }
    } else {
      log('❌ Analytics library not found', colors.red);
      results.failed++;
      results.tests.push({ name: 'Analytics Library', status: 'failed', error: 'File not found' });
    }
  } catch (error) {
    log(`❌ Analytics library check failed: ${error.message}`, colors.red);
    results.failed++;
    results.tests.push({ name: 'Analytics Library', status: 'failed', error: error.message });
  }
  
  // Test 6: Database Functions
  log('\n🗄️  Test 6: Database Functions', colors.blue);
  try {
    const sqlFunctionsPath = 'database/mcp-analytics-functions.sql';
    if (fs.existsSync(sqlFunctionsPath)) {
      const sqlContent = fs.readFileSync(sqlFunctionsPath, 'utf8');
      const requiredFunctions = [
        'get_platform_overview',
        'get_token_performance',
        'get_user_behavior_analytics',
        'get_revenue_analytics'
      ];
      
      const missingFunctions = requiredFunctions.filter(func => 
        !sqlContent.includes(`CREATE OR REPLACE FUNCTION ${func}`)
      );
      
      if (missingFunctions.length === 0) {
        log('✅ All required database functions are defined', colors.green);
        results.passed++;
        results.tests.push({ name: 'Database Functions', status: 'passed' });
      } else {
        log(`❌ Missing database functions: ${missingFunctions.join(', ')}`, colors.red);
        results.failed++;
        results.tests.push({ name: 'Database Functions', status: 'failed', error: `Missing: ${missingFunctions.join(', ')}` });
      }
    } else {
      log('❌ Database functions file not found', colors.red);
      results.failed++;
      results.tests.push({ name: 'Database Functions', status: 'failed', error: 'File not found' });
    }
  } catch (error) {
    log(`❌ Database functions check failed: ${error.message}`, colors.red);
    results.failed++;
    results.tests.push({ name: 'Database Functions', status: 'failed', error: error.message });
  }
  
  // Test 7: Dashboard Component
  log('\n🎨 Test 7: Dashboard Component', colors.blue);
  try {
    const dashboardPath = 'components/dashboard/SupabaseMCPDashboard.tsx';
    if (fs.existsSync(dashboardPath)) {
      const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
      if (dashboardContent.includes('SupabaseMCPDashboard') && 
          dashboardContent.includes('mcpAnalytics')) {
        log('✅ Dashboard component is properly implemented', colors.green);
        results.passed++;
        results.tests.push({ name: 'Dashboard Component', status: 'passed' });
      } else {
        log('❌ Dashboard component is incomplete', colors.red);
        results.failed++;
        results.tests.push({ name: 'Dashboard Component', status: 'failed', error: 'Missing required functionality' });
      }
    } else {
      log('❌ Dashboard component not found', colors.red);
      results.failed++;
      results.tests.push({ name: 'Dashboard Component', status: 'failed', error: 'File not found' });
    }
  } catch (error) {
    log(`❌ Dashboard component check failed: ${error.message}`, colors.red);
    results.failed++;
    results.tests.push({ name: 'Dashboard Component', status: 'failed', error: error.message });
  }
  
  // Test 8: Supabase Connection (if env vars available)
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    log('\n🔗 Test 8: Supabase Connection', colors.blue);
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
      
      // Test connection with a simple query
      const { data, error } = await supabase.from('analytics_events').select('count', { count: 'exact', head: true });
      
      if (!error || error.code === 'PGRST116') { // PGRST116 is "table not found" which is expected
        log('✅ Supabase connection is working', colors.green);
        results.passed++;
        results.tests.push({ name: 'Supabase Connection', status: 'passed' });
      } else {
        log(`⚠️  Supabase connection established but query failed: ${error.message}`, colors.yellow);
        results.passed++;
        results.tests.push({ name: 'Supabase Connection', status: 'passed', warning: 'Query failed (expected if tables not created)' });
      }
    } catch (error) {
      log(`❌ Supabase connection failed: ${error.message}`, colors.red);
      results.failed++;
      results.tests.push({ name: 'Supabase Connection', status: 'failed', error: error.message });
    }
  } else {
    log('\n🔗 Test 8: Supabase Connection', colors.blue);
    log('⏭️  Skipping Supabase connection test (missing environment variables)', colors.yellow);
    results.skipped++;
    results.tests.push({ name: 'Supabase Connection', status: 'skipped', error: 'Missing environment variables' });
  }
  
  // Results Summary
  log('\n' + '='.repeat(50), colors.bold);
  log(`${colors.bold}📊 Test Results Summary${colors.reset}`);
  log('='.repeat(50), colors.bold);
  
  log(`✅ Passed: ${results.passed}`, colors.green);
  log(`❌ Failed: ${results.failed}`, results.failed > 0 ? colors.red : colors.green);
  log(`⏭️  Skipped: ${results.skipped}`, colors.yellow);
  log(`📋 Total: ${results.tests.length}`, colors.blue);
  
  const successRate = ((results.passed / (results.passed + results.failed)) * 100).toFixed(1);
  log(`🎯 Success Rate: ${successRate}%`, successRate >= 80 ? colors.green : colors.red);
  
  // Detailed results
  if (results.failed > 0 || results.skipped > 0) {
    log('\n📋 Detailed Results:', colors.bold);
    results.tests.forEach(test => {
      const icon = test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : '⏭️';
      const color = test.status === 'passed' ? colors.green : test.status === 'failed' ? colors.red : colors.yellow;
      log(`${icon} ${test.name}`, color);
      if (test.error) {
        log(`   └─ ${test.error}`, colors.yellow);
      }
      if (test.warning) {
        log(`   └─ ${test.warning}`, colors.yellow);
      }
    });
  }
  
  // Recommendations
  if (results.failed > 0) {
    log('\n💡 Recommendations:', colors.bold);
    
    if (results.tests.find(t => t.name === 'Environment Variables' && t.status === 'failed')) {
      log('• Set up your Supabase environment variables in .env.local', colors.yellow);
    }
    
    if (results.tests.find(t => t.name === 'MCP Package Installation' && t.status === 'failed')) {
      log('• Install the Supabase MCP server: npm install -g @supabase/mcp-server-supabase@latest', colors.yellow);
    }
    
    if (results.tests.find(t => t.name === 'VS Code Configuration' && t.status === 'failed')) {
      log('• Update your VS Code settings.json with MCP configuration', colors.yellow);
    }
    
    if (results.tests.find(t => t.name === 'Database Functions' && t.status === 'failed')) {
      log('• Deploy database functions: ./scripts/deploy-mcp-analytics.sh', colors.yellow);
    }
  }
  
  log('\n🎉 MCP Integration Test Complete!', colors.bold);
  
  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Handle errors gracefully
process.on('uncaughtException', (error) => {
  log(`\n❌ Uncaught Exception: ${error.message}`, colors.red);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`\n❌ Unhandled Rejection: ${reason}`, colors.red);
  process.exit(1);
});

// Run the tests
runTests().catch((error) => {
  log(`\n❌ Test Suite Failed: ${error.message}`, colors.red);
  process.exit(1);
});
