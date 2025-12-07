[dotenv@17.2.3] injecting env (15) from .env -- tip: 🔐 prevent committing .env to code: https://dotenvx.com/precommit
📦 Creating Runtime Validator Tables in Supabase...

⚠️  Manual Step Required:

1. Go to: https://supabase.com/dashboard/project/rjfcmmzjlguiititkmyh/editor
2. Copy and execute this SQL:

-- ===================================
-- SMARTEROS RUNTIME VALIDATOR SCHEMA
-- ===================================


-- 1. Runtime Executions (main log)
CREATE TABLE IF NOT EXISTS runtime_executions (
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
);

-- 2. Link Validations
CREATE TABLE IF NOT EXISTS runtime_link_validations (
  id BIGSERIAL PRIMARY KEY,
  execution_id TEXT NOT NULL REFERENCES runtime_executions(execution_id),
  url TEXT NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER,
  is_broken BOOLEAN DEFAULT false,
  redirect_target TEXT,
  error_message TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. URL Deltas (new/removed/modified URLs)
CREATE TABLE IF NOT EXISTS runtime_url_deltas (
  id BIGSERIAL PRIMARY KEY,
  execution_id TEXT NOT NULL REFERENCES runtime_executions(execution_id),
  url TEXT NOT NULL,
  delta_type TEXT NOT NULL, -- 'new', 'removed', 'modified'
  previous_state JSONB,
  current_state JSONB,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Semantic Deltas (content/keyword changes)
CREATE TABLE IF NOT EXISTS runtime_semantic_deltas (
  id BIGSERIAL PRIMARY KEY,
  execution_id TEXT NOT NULL REFERENCES runtime_executions(execution_id),
  url TEXT NOT NULL,
  detected_keywords TEXT[],
  previous_keywords TEXT[],
  llm_analysis TEXT,
  impact_level TEXT NOT NULL, -- 'minor', 'relevant', 'critical'
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Alerts
CREATE TABLE IF NOT EXISTS runtime_alerts (
  id BIGSERIAL PRIMARY KEY,
  execution_id TEXT NOT NULL REFERENCES runtime_executions(execution_id),
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL, -- 'minor', 'relevant', 'critical'
  url TEXT,
  message TEXT NOT NULL,
  notified BOOLEAN DEFAULT false,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Scout Configurations
CREATE TABLE IF NOT EXISTS runtime_scouts (
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
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_runtime_exec_domain ON runtime_executions(domain);
CREATE INDEX IF NOT EXISTS idx_runtime_exec_status ON runtime_executions(status);
CREATE INDEX IF NOT EXISTS idx_runtime_links_exec ON runtime_link_validations(execution_id);
CREATE INDEX IF NOT EXISTS idx_runtime_links_broken ON runtime_link_validations(is_broken);
CREATE INDEX IF NOT EXISTS idx_runtime_deltas_exec ON runtime_url_deltas(execution_id);
CREATE INDEX IF NOT EXISTS idx_runtime_semantic_exec ON runtime_semantic_deltas(execution_id);
CREATE INDEX IF NOT EXISTS idx_runtime_alerts_exec ON runtime_alerts(execution_id);
CREATE INDEX IF NOT EXISTS idx_runtime_alerts_notified ON runtime_alerts(notified);
CREATE INDEX IF NOT EXISTS idx_runtime_scouts_enabled ON runtime_scouts(enabled);

-- Grant access
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;


-- ===================================

3. After execution, run: node run-manual-execution.js smarterbot.cl

