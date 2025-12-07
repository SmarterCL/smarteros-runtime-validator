#!/usr/bin/env node
/**
 * SmarterOS Runtime Validator Adapter
 * Connects Open-Scouts execution engine with SmarterOS Runtime Validation Schema
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Firecrawl SDK
const FirecrawlApp = require('@mendable/firecrawl-js').default;
const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

/**
 * Execute a runtime validation scout for a specific domain
 */
async function executeValidation(scoutConfig) {
  console.log(`[SmarterOS] Starting validation for: ${scoutConfig.domain}`);
  
  const executionId = crypto.randomUUID();
  
  // Create execution record
  const { error: execError } = await supabase
    .from('runtime_executions')
    .insert({
      id: executionId,
      scout_id: scoutConfig.scout_id,
      tenant_rut: scoutConfig.tenant_rut,
      domain: scoutConfig.domain,
      status: 'running',
      started_at: new Date().toISOString()
    });

  if (execError) {
    console.error('[SmarterOS] Failed to create execution:', execError);
    return;
  }

  try {
    // Get critical URLs from spec or config
    const criticalUrls = scoutConfig.critical_urls || [
      '/',
      '/catalogo',
      '/checkout',
      '/contacto',
      '/terminos'
    ];

    const results = {
      links_checked: 0,
      links_failed: [],
      urls_discovered: [],
      semantic_changes: []
    };

    // Validate each critical URL
    for (const urlPath of criticalUrls) {
      const fullUrl = `${scoutConfig.domain}${urlPath}`;
      console.log(`[SmarterOS] Checking: ${fullUrl}`);

      try {
        // Scrape with Firecrawl
        const scrapeResult = await firecrawl.scrapeUrl(fullUrl, {
          formats: ['markdown', 'links', 'html']
        });

        results.links_checked++;

        if (!scrapeResult.success) {
          results.links_failed.push({
            url: fullUrl,
            status: 'failed',
            error: 'Scrape failed'
          });
          
          // Record failed link
          await supabase.from('runtime_link_failures').insert({
            execution_id: executionId,
            url: fullUrl,
            status_code: 500,
            error_message: 'Firecrawl scrape failed',
            severity: urlPath === '/checkout' ? 'critical' : 'relevant'
          });
          
          continue;
        }

        // Extract links from the page
        const pageLinks = scrapeResult.links || [];
        
        // Check for new URLs not in previous execution
        const { data: previousUrls } = await supabase
          .from('runtime_url_snapshots')
          .select('url')
          .eq('domain', scoutConfig.domain)
          .order('created_at', { ascending: false })
          .limit(100);

        const previousUrlSet = new Set(previousUrls?.map(r => r.url) || []);
        
        for (const link of pageLinks) {
          if (!previousUrlSet.has(link) && link.startsWith(scoutConfig.domain)) {
            results.urls_discovered.push(link);
            
            // Record new URL
            await supabase.from('runtime_url_deltas').insert({
              execution_id: executionId,
              url: link,
              delta_type: 'new',
              detected_at: new Date().toISOString()
            });
          }
        }

        // Store snapshot of current page
        await supabase.from('runtime_url_snapshots').insert({
          execution_id: executionId,
          domain: scoutConfig.domain,
          url: fullUrl,
          content_hash: hashContent(scrapeResult.markdown || ''),
          links_found: pageLinks,
          snapshot_data: {
            title: scrapeResult.metadata?.title,
            description: scrapeResult.metadata?.description,
            markdown: scrapeResult.markdown?.substring(0, 5000) // Limit size
          }
        });

        // TODO: Semantic comparison with OpenRouter/Qwen
        // Compare with previous snapshot and detect keyword changes

      } catch (error) {
        console.error(`[SmarterOS] Error checking ${fullUrl}:`, error.message);
        results.links_failed.push({
          url: fullUrl,
          error: error.message
        });
      }
    }

    // Update execution as completed
    await supabase
      .from('runtime_executions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        results_summary: results,
        links_checked: results.links_checked,
        links_failed: results.links_failed.length,
        urls_discovered: results.urls_discovered.length
      })
      .eq('id', executionId);

    console.log('[SmarterOS] Validation completed:', results);

    // Send alerts if critical issues found
    if (results.links_failed.some(f => f.url.includes('/checkout'))) {
      await sendAlert(scoutConfig, {
        severity: 'critical',
        message: 'Checkout URL is unreachable',
        execution_id: executionId
      });
    }

    return results;

  } catch (error) {
    console.error('[SmarterOS] Validation failed:', error);
    
    await supabase
      .from('runtime_executions')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: error.message
      })
      .eq('id', executionId);
  }
}

/**
 * Send alert via Mailgun or webhook
 */
async function sendAlert(scoutConfig, alert) {
  console.log('[SmarterOS] ALERT:', alert);
  
  await supabase.from('runtime_alerts').insert({
    tenant_rut: scoutConfig.tenant_rut,
    domain: scoutConfig.domain,
    severity: alert.severity,
    alert_type: 'link_failure',
    message: alert.message,
    metadata: alert
  });

  // TODO: Send via Mailgun or N8N webhook
}

/**
 * Simple hash function for content comparison
 */
function hashContent(content) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(content).digest('hex');
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node smarteros-adapter.js <domain> [tenant_rut]');
    console.log('Example: node smarteros-adapter.js https://smarterbot.cl 76123456-7');
    process.exit(1);
  }

  const domain = args[0];
  const tenant_rut = args[1] || 'test';

  executeValidation({
    scout_id: crypto.randomUUID(),
    domain,
    tenant_rut,
    critical_urls: ['/', '/catalogo', '/checkout', '/contacto']
  }).then(() => {
    console.log('[SmarterOS] Done');
    process.exit(0);
  }).catch(error => {
    console.error('[SmarterOS] Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { executeValidation };
