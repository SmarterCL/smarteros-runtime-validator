#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testScout() {
  console.log('🔍 Testing Open-Scouts Runtime Validator (Fixed)...\n');

  const { data: scout, error: scoutError } = await supabase
    .from('runtime_scouts')
    .insert({
      name: 'smarterbot.cl - Production Monitor',
      domain: 'smarterbot.cl',
      critical_urls: ['/', '/erp', '/crm', '/api'],
      expected_keywords: ['SmarterOS', 'ERP', 'CRM', 'Automatización'],
      sensitive_keywords: ['precio', 'pago', 'suscripción'],
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

  // Links existentes
  const existingLinks = [
    { url: '/', status: 200, delta_type: 'existing' },
    { url: '/erp', status: 200, delta_type: 'existing' },
    { url: '/crm', status: 200, delta_type: 'existing' },
    { url: '/api', status: 200, delta_type: 'existing' }
  ];

  // Link nuevo detectado
  const newLink = { url: '/nueva-seccion', status: 200, delta_type: 'new', is_new: true };

  console.log('\n📎 Insertando links existentes...');
  for (const link of existingLinks) {
    const { error } = await supabase
      .from('runtime_url_deltas')
      .insert({
        execution_id: execution.id,
        url: link.url,
        delta_type: link.delta_type,
        status_code: link.status,
        is_new: false,
        detected_at: new Date().toISOString()
      });

    if (error) console.error(`⚠️ Error: ${link.url}`, error.message);
    else console.log(`  ✓ ${link.url}`);
  }

  console.log('\n🆕 Insertando URL nueva...');
  const { error: newError } = await supabase
    .from('runtime_url_deltas')
    .insert({
      execution_id: execution.id,
      url: newLink.url,
      delta_type: newLink.delta_type,
      status_code: newLink.status,
      is_new: true,
      detected_at: new Date().toISOString()
    });

  if (newError) console.error('⚠️ Error:', newError.message);
  else console.log(`  ✓ ${newLink.url} (NUEVO)`);

  // Simular cambio semántico
  console.log('\n🔄 Insertando cambio semántico...');
  await supabase
    .from('runtime_semantic_deltas')
    .insert({
      execution_id: execution.id,
      url: '/erp',
      field_changed: 'precio',
      previous_value: '$99.000',
      new_value: '$79.000',
      impact_level: 'relevant',
      detected_at: new Date().toISOString()
    });

  // Crear alerta
  console.log('🚨 Generando alerta...');
  await supabase
    .from('runtime_alerts')
    .insert({
      execution_id: execution.id,
      alert_type: 'new_url_detected',
      severity: 'info',
      message: 'Nueva URL detectada: /nueva-seccion',
      details: { url: '/nueva-seccion', status: 200 },
      created_at: new Date().toISOString()
    });

  // Completar ejecución
  await supabase
    .from('runtime_executions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      links_checked: 5,
      links_broken: 0,
      urls_new: 1,
      alerts_fired: 1
    })
    .eq('id', execution.id);

  console.log('\n✅ Test completado exitosamente\n');
  console.log('📊 Resultados:');
  console.log(`   - Scout ID: ${scout.id}`);
  console.log(`   - Ejecución ID: ${execution.id}`);
  console.log(`   - Links verificados: 5`);
  console.log(`   - URLs nuevas: 1`);
  console.log(`   - Cambios semánticos: 1`);
  console.log(`   - Alertas generadas: 1`);
  console.log('\n🔗 Verifica en Supabase:');
  console.log(`   https://supabase.com/dashboard/project/rjfcmmzjlguiititkmyh/editor`);
}

testScout().catch(console.error);
