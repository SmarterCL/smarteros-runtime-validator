require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applySchema() {
  console.log('📦 Applying schema via Supabase client...\n');
  
  const sql = fs.readFileSync('./smarteros-runtime-validator-schema.sql', 'utf8');
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });
    
    if (error) {
      console.error('❌ Error:', error.message);
      
      // Try manual table creation
      console.log('\n⚙️  Attempting manual table creation...\n');
      
      const tables = [
        `CREATE TABLE IF NOT EXISTS runtime_executions (
          id BIGSERIAL PRIMARY KEY,
          execution_id TEXT UNIQUE NOT NULL,
          domain TEXT NOT NULL,
          spec_version TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'running',
          started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          completed_at TIMESTAMPTZ,
          total_urls_checked INTEGER DEFAULT 0,
          total_links_found INTEGER DEFAULT 0,
          broken_links_found INTEGER DEFAULT 0,
          new_urls_detected INTEGER DEFAULT 0,
          alerts_generated INTEGER DEFAULT 0,
          metadata JSONB
        )`,
        `CREATE TABLE IF NOT EXISTS runtime_link_validations (
          id BIGSERIAL PRIMARY KEY,
          execution_id TEXT NOT NULL,
          url TEXT NOT NULL,
          status_code INTEGER,
          response_time_ms INTEGER,
          is_broken BOOLEAN DEFAULT false,
          redirect_target TEXT,
          error_message TEXT,
          checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`,
        `CREATE TABLE IF NOT EXISTS runtime_url_deltas (
          id BIGSERIAL PRIMARY KEY,
          execution_id TEXT NOT NULL,
          url TEXT NOT NULL,
          delta_type TEXT NOT NULL,
          previous_state JSONB,
          current_state JSONB,
          detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`,
        `CREATE TABLE IF NOT EXISTS runtime_semantic_deltas (
          id BIGSERIAL PRIMARY KEY,
          execution_id TEXT NOT NULL,
          url TEXT NOT NULL,
          detected_keywords TEXT[],
          previous_keywords TEXT[],
          llm_analysis TEXT,
          impact_level TEXT NOT NULL,
          detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`,
        `CREATE TABLE IF NOT EXISTS runtime_alerts (
          id BIGSERIAL PRIMARY KEY,
          execution_id TEXT NOT NULL,
          alert_type TEXT NOT NULL,
          severity TEXT NOT NULL,
          url TEXT,
          message TEXT NOT NULL,
          notified BOOLEAN DEFAULT false,
          notified_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`,
        `CREATE TABLE IF NOT EXISTS runtime_scouts (
          id BIGSERIAL PRIMARY KEY,
          scout_name TEXT UNIQUE NOT NULL,
          domain TEXT NOT NULL,
          critical_urls TEXT[] NOT NULL,
          expected_keywords TEXT[],
          sensitive_keywords TEXT[],
          frequency TEXT NOT NULL DEFAULT 'daily',
          enabled BOOLEAN DEFAULT true,
          last_execution_id TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`
      ];
      
      for (let i = 0; i < tables.length; i++) {
        const { error: tblError } = await supabase.rpc('exec_sql', { query: tables[i] });
        if (tblError) {
          console.log(`  ❌ Table ${i+1}: ${tblError.message}`);
        } else {
          console.log(`  ✅ Table ${i+1} created`);
        }
      }
    } else {
      console.log('✅ Schema applied successfully');
    }
    
    // Verify tables
    console.log('\n🔍 Verifying tables...\n');
    const tableNames = [
      'runtime_executions',
      'runtime_link_validations', 
      'runtime_url_deltas',
      'runtime_semantic_deltas',
      'runtime_alerts',
      'runtime_scouts'
    ];
    
    for (const table of tableNames) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
        
      if (error) {
        console.log(`  ❌ ${table}: ${error.message}`);
      } else {
        console.log(`  ✅ ${table}: EXISTS (${count} rows)`);
      }
    }
    
  } catch (err) {
    console.error('Fatal error:', err.message);
  }
}

applySchema();
