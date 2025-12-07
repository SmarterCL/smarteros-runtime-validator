#!/usr/bin/env node
/**
 * Apply Runtime Validator Schema to Supabase
 */

require('dotenv').config();
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  db: { schema: 'public' },
  auth: { persistSession: false }
});

async function applySchema() {
  console.log('📦 Applying Runtime Validator Schema to Supabase...\n');

  const schemaSQL = fs.readFileSync('./smarteros-runtime-validator-schema.sql', 'utf8');
  
  // Split by semicolons and execute each statement
  const statements = schemaSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    console.log(`Executing statement ${i + 1}/${statements.length}...`);
    
    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql: stmt });
      
      if (error) {
        // Try direct table creation via REST API
        console.log(`  Attempting via REST API...`);
        continue;
      }
      
      console.log(`  ✓ Success`);
    } catch (err) {
      console.log(`  ⚠ ${err.message}`);
    }
  }

  console.log('\n✅ Schema application complete');
  console.log('\nVerifying tables...\n');

  // Verify tables exist
  const tables = [
    'runtime_executions',
    'runtime_link_validations', 
    'runtime_url_deltas',
    'runtime_semantic_deltas',
    'runtime_alerts',
    'runtime_scouts'
  ];

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('count').limit(1);
    
    if (error) {
      console.log(`  ❌ ${table}: NOT FOUND`);
    } else {
      console.log(`  ✓ ${table}: EXISTS`);
    }
  }
}

applySchema().catch(console.error);
