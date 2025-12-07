# ⚠️  ACCIÓN MANUAL REQUERIDA - FIX SCHEMA SUPABASE

## Problema Detectado
La tabla `runtime_scouts` no tiene las columnas necesarias para el sistema de validación runtime.

## Solución (2 minutos)

### Paso 1: Abrir SQL Editor en Supabase
🔗 https://supabase.com/dashboard/project/rjfcmmzjlguiititkmyh/sql/new

### Paso 2: Copiar y ejecutar este SQL

```sql
-- Fix Schema: Add missing columns to runtime_scouts
ALTER TABLE runtime_scouts 
  ADD COLUMN IF NOT EXISTS tenant_rut TEXT,
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS target_domain TEXT,
  ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}'::jsonb;

-- Make scout_name optional (we use 'name' now)
ALTER TABLE runtime_scouts 
  ALTER COLUMN scout_name DROP NOT NULL;

-- Verify columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'runtime_scouts'
ORDER BY ordinal_position;
```

### Paso 3: Verificar resultado esperado

Deberías ver estas columnas:
- id
- scout_name
- domain
- critical_urls
- expected_keywords
- sensitive_keywords
- frequency
- enabled
- last_execution_id
- created_at
- updated_at
- **tenant_rut** ← NUEVA
- **name** ← NUEVA
- **target_domain** ← NUEVA
- **config** ← NUEVA

### Paso 4: Después de ejecutar

Vuelve a ejecutar:
```bash
cd /root/smarteros-runtime-validator
./scripts/setup-phase2.sh
```

## ¿Por qué es necesario?

El sistema de Open-Scouts original no incluye multi-tenancy ni configuración flexible.
Estas columnas permiten:
- **tenant_rut**: Aislamiento por cliente
- **name**: Nombre descriptivo del scout
- **target_domain**: Dominio objetivo separado del scout_name
- **config**: Configuración JSON flexible (keywords, checks, alerts)

## Estado Actual
- ✅ Firecrawl API configurada
- ✅ OpenRouter API configurada
- ✅ Supabase conectado
- ⏳ **Schema pendiente de ajuste manual** ← ESTÁS AQUÍ

Una vez completado este fix, el sistema queda 100% operativo en Fase 2.
