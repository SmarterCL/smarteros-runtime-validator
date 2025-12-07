require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createScout() {
  console.log('🕵️  Creating first scout for smarterbot.cl...\n');
  
  const scout = {
    scout_name: 'smarterbot-cl-main',
    domain: 'smarterbot.cl',
    critical_urls: [
      'https://smarterbot.cl',
      'https://smarterbot.cl/contacto',
      'https://smarterbot.cl/servicios'
    ],
    expected_keywords: ['smarterbot', 'automatización', 'inteligencia artificial'],
    sensitive_keywords: ['precio', 'contacto', 'demo', 'whatsapp'],
    frequency: 'daily',
    enabled: true
  };
  
  const { data, error } = await supabase
    .from('runtime_scouts')
    .insert(scout)
    .select()
    .single();
    
  if (error) {
    console.error('❌ Error creating scout:', error.message);
  } else {
    console.log('✅ Scout created successfully:');
    console.log(JSON.stringify(data, null, 2));
  }
}

createScout();
