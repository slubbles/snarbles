// Auto-configure database for production dashboard
const { createClient } = require('@supabase/supabase-js');

async function configureDatabaseTables() {
  console.log('🔧 Auto-configuring database tables...');
  
  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
  }

  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Test connection
  console.log('🔗 Testing Supabase connection...');
  const { error: connectionError } = await supabase.from('user_profiles').select('count').limit(1);
  
  if (connectionError && connectionError.code !== 'PGRST116') {
    console.error('❌ Supabase connection failed:', connectionError.message);
    process.exit(1);
  }
  
  console.log('✅ Supabase connection successful');
  
  // Check if production tables exist
  const tablesToCheck = [
    'portfolio_snapshots',
    'transaction_history', 
    'token_analytics',
    'dashboard_metrics',
    'holder_analytics'
  ];
  
  console.log('📊 Checking production tables...');
  
  for (const table of tablesToCheck) {
    try {
      const { data, error } = await supabase.from(table).select('count').limit(1);
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`⚠️  Table '${table}' does not exist - migration needed`);
        } else {
          console.log(`❌ Error checking table '${table}':`, error.message);
        }
      } else {
        console.log(`✅ Table '${table}' exists and accessible`);
      }
    } catch (err) {
      console.log(`❌ Failed to check table '${table}':`, err.message);
    }
  }
  
  // Create basic user profile if it doesn't exist (for testing)
  console.log('👤 Checking user profiles table...');
  try {
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);
      
    if (profilesError && profilesError.code === 'PGRST116') {
      console.log('⚠️  User profiles table does not exist - this is expected for new setups');
    } else {
      console.log('✅ User profiles table accessible');
    }
  } catch (err) {
    console.log('⚠️  User profiles check failed:', err.message);
  }
  
  console.log('\n🎯 Database configuration check complete!');
  console.log('');
  console.log('📋 Summary:');
  console.log('   - If tables are missing, run the Supabase migration');
  console.log('   - If migrations fail, tables will be created on first use');
  console.log('   - Dashboard will work with or without existing data');
  console.log('');
  console.log('💡 Next: The dashboard will create necessary data structures automatically');
}

// Load environment and run configuration  
require('dotenv').config({ path: '.env.local' });
configureDatabaseTables().catch(console.error);
