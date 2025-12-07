-- Add missing columns to runtime_scouts
ALTER TABLE runtime_scouts 
  ADD COLUMN IF NOT EXISTS tenant_rut TEXT,
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS target_domain TEXT,
  ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}'::jsonb;

-- Update scout_name to be nullable (since we have 'name' now)
ALTER TABLE runtime_scouts ALTER COLUMN scout_name DROP NOT NULL;
