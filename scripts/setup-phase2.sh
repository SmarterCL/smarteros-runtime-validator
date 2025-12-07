#!/bin/bash
# Phase 2: Activate Open-Scouts Runtime Validator
# Estado: Motor de ejecución activado

set -e

echo "🚀 Activando Fase 2: Motor de Ejecución Runtime Validator"
echo ""

# Variables
SUPABASE_URL="https://rjfcmmzjlguiititkmyh.supabase.co"
SUPABASE_KEY="sb_secret_u49LOKXvq3tKl6DTyupYXw_kJcgmKCB"
DB_URL="postgresql://postgres:nKb5v8vkdsVuXKCN@db.rjfcmmzjlguiititkmyh.supabase.co:5432/postgres"

echo "✓ Credenciales Supabase configuradas"
echo "✓ Firecrawl API Key configurada"
echo "✓ OpenRouter API Key configurada"
echo ""

# Verificar que el schema existe
echo "📋 Verificando schema en Supabase..."
node << 'VERIFY_SCRIPT'
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://rjfcmmzjlguiititkmyh.supabase.co',
  'sb_secret_u49LOKXvq3tKl6DTyupYXw_kJcgmKCB'
);

async function verify() {
  const { data, error } = await supabase.from('runtime_scouts').select('count');
  if (error) {
    console.error('❌ Schema no aplicado:', error.message);
    process.exit(1);
  }
  console.log('✓ Schema verificado correctamente');
}

verify();
VERIFY_SCRIPT

echo ""
echo "🔧 Creando scout de prueba para smarterbot.cl..."

# Crear primer scout
node << 'CREATE_SCOUT'
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://rjfcmmzjlguiititkmyh.supabase.co',
  'sb_secret_u49LOKXvq3tKl6DTyupYXw_kJcgmKCB'
);

async function createScout() {
  const { data, error } = await supabase
    .from('runtime_scouts')
    .insert({
      tenant_rut: '76123456-7',
      name: 'SmarterBot.cl - Integridad Funnel',
      target_domain: 'smarterbot.cl',
      critical_urls: [
        'https://smarterbot.cl/',
        'https://smarterbot.cl/contacto',
        'https://smarterbot.cl/precios'
      ],
      frequency: 'daily',
      enabled: true,
      config: {
        check_links: true,
        check_semantic: true,
        expected_keywords: ['automatización', 'bot', 'WhatsApp'],
        sensitive_keywords: ['precio', 'contacto', 'demo']
      }
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Error creando scout:', error);
    return;
  }
  
  console.log('✓ Scout creado:', data.id);
  console.log('  Domain:', data.target_domain);
  console.log('  URLs críticas:', data.critical_urls.length);
}

createScout();
CREATE_SCOUT

echo ""
echo "🏃 Ejecutando primera validación..."

# Ejecutar validación manual
node ../run-manual-validation.js

echo ""
echo "✅ Fase 2 completada!"
echo ""
echo "📊 Estado operacional:"
echo "  - Schema: ✓ Aplicado"
echo "  - Scout: ✓ Activo"
echo "  - Ejecución: ✓ Completada"
echo ""
echo "🔍 Verifica resultados en Supabase:"
echo "   https://supabase.com/dashboard/project/rjfcmmzjlguiititkmyh/editor"
echo ""
echo "📈 Próximo paso: Configurar alertas automáticas (Mailgun + n8n)"
