#!/usr/bin/env node

/**
 * SmarterOS Runtime Validator - Test Execution
 * 
 * Ejecuta una validación de prueba usando Firecrawl + OpenRouter
 * y almacena resultados en Supabase siguiendo el spec openspec.runtime.validation.v1
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FIRECRAWL_KEY = process.env.FIRECRAWL_API_KEY;
const OPENROUTER_KEY = process.env.OPENAI_API_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function crawlWithFirecrawl(url) {
  console.log(`📡 Crawling ${url} with Firecrawl...`);
  
  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${FIRECRAWL_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url: url,
      formats: ['markdown', 'html', 'links']
    })
  });

  if (!response.ok) {
    throw new Error(`Firecrawl error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.data;
}

async function analyzeWithOpenRouter(content, previousContent = null) {
  console.log('🤖 Analyzing with OpenRouter...');
  
  const prompt = previousContent 
    ? `Compara estos dos contenidos y detecta cambios relevantes:\n\nAnterior:\n${previousContent}\n\nActual:\n${content}\n\nRespuesta en JSON: {"changes": [], "impact": "minor|relevant|critical"}`
    : `Analiza este contenido y extrae información estructurada:\n\n${content}\n\nRespuesta en JSON: {"headings": [], "buttons": [], "prices": [], "payment_methods": []}`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://smarterbot.cl',
      'X-Title': 'SmarterOS Runtime Validator'
    },
    body: JSON.stringify({
      model: 'qwen/qwen-2.5-72b-instruct',
      messages: [
        { role: 'system', content: 'Eres un experto en análisis de sitios web comerciales.' },
        { role: 'user', content: prompt }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`OpenRouter error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const result = data.choices[0].message.content;
  
  try {
    return JSON.parse(result);
  } catch (e) {
    console.warn('⚠️  OpenRouter response not JSON, returning raw text');
    return { raw: result };
  }
}

async function storeExecution(scoutId, domain, crawlData, analysis) {
  console.log('💾 Storing execution in Supabase...');
  
  // 1. Create execution record
  const { data: execution, error: execError } = await supabase
    .from('runtime_executions')
    .insert({
      scout_id: scoutId,
      status: 'completed',
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      metadata: {
        domain: domain,
        urls_checked: 1,
        links_found: crawlData.links?.length || 0
      }
    })
    .select()
    .single();

  if (execError) {
    console.error('❌ Error storing execution:', execError);
    throw execError;
  }

  console.log(`✅ Execution created: ${execution.id}`);

  // 2. Store URL snapshot
  const { error: snapshotError } = await supabase
    .from('runtime_url_snapshots')
    .insert({
      execution_id: execution.id,
      url: domain,
      status_code: 200,
      content: crawlData.markdown,
      links: crawlData.links || [],
      metadata: analysis
    });

  if (snapshotError) {
    console.error('❌ Error storing snapshot:', snapshotError);
  } else {
    console.log('✅ URL snapshot stored');
  }

  // 3. Detect new URLs (simple implementation)
  const newUrls = (crawlData.links || [])
    .filter(link => link.startsWith(domain))
    .slice(0, 10); // Limit for testing

  if (newUrls.length > 0) {
    const { error: deltaError } = await supabase
      .from('runtime_url_deltas')
      .insert(
        newUrls.map(url => ({
          execution_id: execution.id,
          url: url,
          delta_type: 'new',
          detected_at: new Date().toISOString()
        }))
      );

    if (!deltaError) {
      console.log(`✅ Detected ${newUrls.length} new URLs`);
    }
  }

  return execution;
}

async function runTest() {
  console.log('🚀 SmarterOS Runtime Validator - Test Execution');
  console.log('================================================\n');

  const testDomain = 'https://smarterbot.cl';
  
  try {
    // 1. Get or create test scout
    let { data: scout, error: scoutError } = await supabase
      .from('runtime_scouts')
      .select()
      .eq('domain', testDomain)
      .single();

    if (scoutError || !scout) {
      console.log('Creating test scout...');
      const { data: newScout, error: createError } = await supabase
        .from('runtime_scouts')
        .insert({
          name: 'SmarterBot CL - Test Scout',
          domain: testDomain,
          frequency: 'daily',
          config: {
            critical_urls: ['/'],
            expected_keywords: ['smarteros', 'automatización'],
            sensitive_keywords: ['precio', 'pago']
          },
          is_active: true
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }
      scout = newScout;
    }

    console.log(`✅ Scout ID: ${scout.id}\n`);

    // 2. Crawl with Firecrawl
    const crawlData = await crawlWithFirecrawl(testDomain);
    console.log(`✅ Crawled successfully`);
    console.log(`   - ${crawlData.links?.length || 0} links found`);
    console.log(`   - ${(crawlData.markdown?.length || 0)} chars of content\n`);

    // 3. Analyze with OpenRouter
    const analysis = await analyzeWithOpenRouter(
      crawlData.markdown?.substring(0, 2000) || ''
    );
    console.log(`✅ Analysis completed`);
    console.log(`   - Result:`, JSON.stringify(analysis, null, 2), '\n');

    // 4. Store in Supabase
    const execution = await storeExecution(scout.id, testDomain, crawlData, analysis);
    
    console.log('\n================================================');
    console.log('✅ TEST COMPLETED SUCCESSFULLY');
    console.log(`   Execution ID: ${execution.id}`);
    console.log('================================================\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED');
    console.error('Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run test
runTest();
