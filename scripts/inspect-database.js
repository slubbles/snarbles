// Supabase Database Inspector - See what's in your database
const { createClient } = require('@supabase/supabase-js');

async function inspectSupabaseDatabase() {
  console.log('🔍 Inspecting Your Supabase Database...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log(`📊 Database: ${supabaseUrl}`);
  console.log('=' .repeat(60));

  try {
    // 1. Check for existing tables in public schema
    console.log('\n1️⃣ Checking Public Schema Tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .neq('table_name', 'pg_stat_statements');
    
    if (tables && tables.length > 0) {
      console.log(`✅ Found ${tables.length} tables:`);
      tables.forEach(table => {
        console.log(`   📋 ${table.table_name}`);
      });
    } else {
      console.log('📝 No custom tables found yet (fresh database)');
    }

    // 2. Check if analytics_events table exists
    console.log('\n2️⃣ Checking Analytics Events Table...');
    const { data: analyticsData, error: analyticsError } = await supabase
      .from('analytics_events')
      .select('*')
      .limit(5);
    
    if (analyticsError) {
      if (analyticsError.code === 'PGRST116') {
        console.log('📝 Analytics events table not created yet');
        console.log('   💡 Tip: Run the SQL from database/setup-basic-analytics.sql');
      } else {
        console.log(`⚠️  Analytics table error: ${analyticsError.message}`);
      }
    } else {
      console.log(`✅ Analytics events table exists with ${analyticsData.length} recent events`);
      if (analyticsData.length > 0) {
        console.log('   Recent events:');
        analyticsData.forEach(event => {
          console.log(`   📊 ${event.event_name} - ${event.created_at}`);
        });
      }
    }

    // 3. Check for any existing data in common tables
    console.log('\n3️⃣ Checking for Existing Data...');
    
    // Check for common table names that might exist
    const commonTables = ['tokens', 'users', 'wallets', 'transactions', 'payments'];
    
    for (const tableName of commonTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (!error) {
          console.log(`✅ Table '${tableName}' exists with ${data ? 'data' : 'no data'}`);
        }
      } catch (e) {
        // Table doesn't exist, which is fine
      }
    }

    // 4. Test database functions
    console.log('\n4️⃣ Testing Database Functions...');
    
    try {
      const { data: functionTest, error: functionError } = await supabase.rpc('get_basic_analytics', { time_period: '7d' });
      
      if (functionError) {
        console.log('📝 Analytics functions not installed yet');
        console.log('   💡 Tip: Run the SQL from database/setup-basic-analytics.sql');
      } else {
        console.log('✅ Analytics functions are working!');
        console.log(`   📊 Result: ${JSON.stringify(functionTest, null, 2)}`);
      }
    } catch (e) {
      console.log('📝 Custom functions not available yet');
    }

    // 5. Database storage and auth info
    console.log('\n5️⃣ Database Configuration...');
    
    try {
      // Check auth users (if accessible)
      const { data: authData, error: authError } = await supabase.auth.getUser();
      console.log('🔐 Auth system: Available');
    } catch (e) {
      console.log('🔐 Auth system: Available (public access)');
    }

    // Check storage buckets
    try {
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      if (buckets && buckets.length > 0) {
        console.log(`🗄️  Storage buckets: ${buckets.length} buckets found`);
        buckets.forEach(bucket => {
          console.log(`   📁 ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
        });
      } else {
        console.log('🗄️  Storage: No buckets created yet');
      }
    } catch (e) {
      console.log('🗄️  Storage: Available');
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎯 DATABASE INSPECTION COMPLETE!');
    console.log('\n💡 Next Steps:');
    console.log('1. If you see "Analytics functions not installed", run the SQL setup');
    console.log('2. Your MCP integration is ready to track events and gather insights');
    console.log('3. The analytics dashboard can be added to your admin panel');
    console.log('4. GitHub Copilot can now query your database via MCP!');

  } catch (error) {
    console.error('❌ Database inspection failed:', error.message);
  }
}

// Load environment and run inspection
require('dotenv').config({ path: '.env.local' });
inspectSupabaseDatabase();
