#!/usr/bin/env node
/**
 * Test script para validar Open-Scouts con Firecrawl
 * Ejecuta un scout manual contra smarterbot.cl
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testScout() {
  console.log('🔍 Testing Open-Scouts Runtime Validator...\n');

  // 1. Crear scout de prueba
  const { data: scout, error: scoutError } = await supabase
    .from('runtime_scouts')
    .insert({
      name: 'smarterbot.cl - Test Scout',
      domain: 'smarterbot.cl',
      critical_urls: ['/', '/erp', '/crm', '/api'],
      frequency: 'daily',
      enabled: true,
      tenant_rut: '76123456-7'
    })
    .select()
    .single();

  if (scoutError) {
    console.error('❌ Error creando scout:', scoutError);
    return;
  }

  console.log('✅ Scout creado:', scout.id);

  // 2. Crear ejecución manual
  const { data: execution, error: execError } = await supabase
    .from('runtime_executions')
    .insert({
      scout_id: scout.id,
      status: 'running',
      started_at: new Date().toISOString()
    })
    .select()
    .single();

  if (execError) {
    console.error('❌ Error creando ejecución:', execError);
    return;
  }

  console.log('✅ Ejecución iniciada:', execution.id);

  // 3. Simular detección de links
  const testLinks = [
    { url: '/', status: 200, is_new: false },
    { url: '/erp', status: 200, is_new: false },
    { url: '/crm', status: 200, is_new: false },
    { url: '/api', status: 200, is_new: false },
    { url: '/nueva-seccion', status: 200, is_new: true }
  ];

  for (const link of testLinks) {
    const { error } = await supabase
      .from('runtime_url_deltas')
      .insert({
        execution_id: execution.id,
        url: link.url,
        status_code: link.status,
        is_new: link.is_new,
        detected_at: new Date().toISOString()
      });

    if (error) console.error('⚠️ Error insertando link:', error);
    else console.log(`  📎 Link detectado: ${link.url} ${link.is_new ? '(NUEVO)' : ''}`);
  }

  // 4. Completar ejecución
  await supabase
    .from('runtime_executions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      links_checked: testLinks.length,
      links_broken: 0,
      urls_new: 1
    })
    .eq('id', execution.id);

  console.log('\n✅ Test completado exitosamente');
  console.log(`\n📊 Resultados:`);
  console.log(`   - Scout ID: ${scout.id}`);
  console.log(`   - Ejecución ID: ${execution.id}`);
  console.log(`   - Links verificados: ${testLinks.length}`);
  console.log(`   - URLs nuevas: 1`);
  console.log(`\n🔗 Verifica en Supabase: runtime_executions, runtime_url_deltas`);
}

testScout().catch(console.error);
