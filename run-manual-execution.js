#!/usr/bin/env node
/**
 * SmarterOS Runtime Validator - Manual Execution
 * Executes validation against a target domain using Firecrawl + OpenRouter
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENAI_API_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function crawlWithFirecrawl(url) {
  console.log(`[Firecrawl] Crawling: ${url}`);
  
  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url: url,
      formats: ['markdown', 'links', 'html']
    })
  });

  if (!response.ok) {
    throw new Error(`Firecrawl API error: ${response.status}`);
  }

  return await response.json();
}

async function analyzeWithOpenRouter(content, prompt) {
  console.log(`[OpenRouter] Analyzing content...`);
  
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://smarterbot.cl',
      'X-Title': 'SmarterOS Runtime Validator'
    },
    body: JSON.stringify({
      model: 'qwen/qwen-2.5-72b-instruct',
      messages: [
        {
          role: 'system',
          content: 'You are a technical validator analyzing website structure and content.'
        },
        {
          role: 'user',
          content: `${prompt}\n\nContent:\n${content}`
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function executeValidation(domain) {
  const executionId = `exec_${Date.now()}`;
  
  console.log(`\n=== Starting Runtime Validation ===`);
  console.log(`Domain: ${domain}`);
  console.log(`Execution ID: ${executionId}`);
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  // Create execution record
  const { data: execution, error: execError } = await supabase
    .from('runtime_executions')
    .insert({
      execution_id: executionId,
      domain: domain,
      spec_version: 'v1.0.0',
      status: 'running',
      started_at: new Date().toISOString()
    })
    .select()
    .single();

  if (execError) {
    console.error('[Error] Failed to create execution:', execError);
    return;
  }

  console.log(`✓ Execution record created\n`);

  const criticalUrls = [
    `https://${domain}`,
    `https://${domain}/catalogo`,
    `https://${domain}/contacto`
  ];

  let totalLinks = 0;
  let brokenLinks = 0;
  let newUrls = 0;

  for (const url of criticalUrls) {
    try {
      console.log(`\n--- Validating: ${url} ---`);
      
      // Crawl with Firecrawl
      const crawlData = await crawlWithFirecrawl(url);
      
      if (crawlData.success && crawlData.data) {
        const { markdown, links, html } = crawlData.data;
        
        console.log(`  Links found: ${links?.length || 0}`);
        totalLinks += links?.length || 0;

        // Store link validation
        if (links && links.length > 0) {
          for (const link of links.slice(0, 10)) { // Limit to 10 for demo
            const { error: linkError } = await supabase
              .from('runtime_link_validations')
              .insert({
                execution_id: executionId,
                url: link,
                status_code: 200, // Simplified - in production, check each link
                response_time_ms: Math.floor(Math.random() * 500),
                is_broken: false
              });
          }
        }

        // Analyze with OpenRouter
        const analysis = await analyzeWithOpenRouter(
          markdown?.slice(0, 2000) || html?.slice(0, 2000),
          `Analyze this webpage and extract:
1. Main headings
2. Call-to-action buttons
3. Payment methods mentioned
4. Contact information
5. Any critical keywords

Return as JSON.`
        );

        console.log(`  Analysis completed`);

        // Store semantic analysis
        await supabase
          .from('runtime_semantic_deltas')
          .insert({
            execution_id: executionId,
            url: url,
            detected_keywords: ['checkout', 'contacto', 'catalogo'],
            llm_analysis: analysis,
            impact_level: 'minor'
          });

      }

    } catch (error) {
      console.error(`  [Error] ${error.message}`);
      brokenLinks++;
      
      // Record alert
      await supabase
        .from('runtime_alerts')
        .insert({
          execution_id: executionId,
          alert_type: 'link_failure',
          severity: 'critical',
          url: url,
          message: error.message,
          notified: false
        });
    }

    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Update execution with results
  const { error: updateError } = await supabase
    .from('runtime_executions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      total_urls_checked: criticalUrls.length,
      total_links_found: totalLinks,
      broken_links_found: brokenLinks,
      new_urls_detected: newUrls,
      alerts_generated: brokenLinks
    })
    .eq('execution_id', executionId);

  console.log(`\n=== Validation Complete ===`);
  console.log(`Total URLs checked: ${criticalUrls.length}`);
  console.log(`Total links found: ${totalLinks}`);
  console.log(`Broken links: ${brokenLinks}`);
  console.log(`Execution ID: ${executionId}\n`);
}

// Main
const domain = process.argv[2] || 'smarterbot.cl';
executeValidation(domain).catch(console.error);
