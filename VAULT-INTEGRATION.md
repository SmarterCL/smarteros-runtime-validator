# Integración con Supabase Vault

## ✅ Estado Actual

Todas las API keys están almacenadas de forma segura en Supabase Vault:

- `MAILGUN_API_KEY` - Para envío de alertas
- `MAILGUN_DOMAIN` - Dominio configurado (smarterbot.store)
- `MAILGUN_TO` - Destinatario de alertas
- `MAILGUN_FROM` - Remitente de alertas
- `FIRECRAWL_API_KEY` - Para crawling de sitios
- `OPENROUTER_API_KEY` - Para análisis semántico con LLM
- `QWEN_API_KEY` - Para agentes con Alibaba Qwen

## 🔐 Seguridad

✅ **Sin API keys en código**
✅ **Sin API keys en .env** (solo configuración de Supabase)
✅ **Cifrado en reposo** (Vault de Supabase)
✅ **Acceso controlado** vía función RPC segura

## 📚 Cómo Usar

### Desde Node.js

```javascript
import { getVaultSecrets, getVaultSecret } from './lib/vault.js'

// Leer múltiples secrets
const secrets = await getVaultSecrets([
  'MAILGUN_API_KEY',
  'FIRECRAWL_API_KEY'
])

// Leer un solo secret
const apiKey = await getVaultSecret('MAILGUN_API_KEY')
```

### Enviar Alerta por Email

```javascript
import { sendRuntimeAlert } from './lib/mailgun.js'

await sendRuntimeAlert({
  type: 'link_failure',
  severity: 'critical',
  scout_id: 1,
  execution_id: 123,
  payload: { url: 'https://example.com', status: 404 }
})
```

### Test Manual

```bash
cd /root/smarteros-runtime-validator
export $(cat .env | xargs)
node test-mailgun-vault.js
```

## 🏗️ Arquitectura

```
Aplicación Node.js
      ↓
lib/vault.js (RPC call)
      ↓
Supabase Function: get_vault_secret()
      ↓
vault.decrypted_secrets (tabla segura)
      ↓
Retorna valor cifrado
```

## 🔧 Función RPC en Supabase

```sql
-- Ya creada y activa
public.get_vault_secret(secret_name TEXT) RETURNS TEXT

-- Uso desde SQL
SELECT public.get_vault_secret('MAILGUN_API_KEY');
```

## 📊 Mailgun Tagging

Todos los emails incluyen tags automáticos para tracking:

- `runtime-validator` - Identifica el sistema
- `severity:critical` - Nivel de severidad
- `type:link_failure` - Tipo de alerta

Esto permite:
- Filtrado en dashboard de Mailgun
- Estadísticas por tipo de alerta
- Routing automático de emails

## ✅ Test Exitoso

```
✅ Mail enviado correctamente: <20251207212344.c9eb7ec5d3c0894d@smarterbot.store>
📧 Revisa el correo en smarterbotcl@gmail.com
```

## 🚀 Próximos Pasos

1. Integrar con Open-Scouts para ejecuciones reales
2. Configurar triggers en `runtime_alerts` para notificaciones automáticas
3. Crear dashboard de Mailgun para monitoreo de alertas
