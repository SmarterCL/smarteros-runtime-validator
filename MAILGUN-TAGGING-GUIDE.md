# Mailgun Tagging System - SmarterOS Runtime Validator

## ✅ Estado Actual

**Mailgun Adapter implementado** con sistema de tagging completo según [documentación oficial de Mailgun](https://mailgun-docs.redoc.ly/docs/mailgun/user-manual/tracking-messages/#tagging).

## 📋 Tags Implementados

### Sistema de Convención
Todos los mensajes siguen la estructura: `system:component:category`

### Tags Base (aplicados a todos los mensajes)
- `smarteros` - Sistema origen
- `runtime-validator` - Componente
- `alert` - Tipo de mensaje

### Tags Específicos por Tipo

#### Scout Alerts
```
smarteros, runtime-validator, alert, severity:{level}, scout-alert, tenant:{rut}
```
**Severidades**: `info`, `warning`, `critical`

**Ejemplo**:
```
smarteros, runtime-validator, alert, severity:critical, scout-alert, tenant:76123456-7
```

#### Validation Alerts
```
smarteros, runtime-validator, alert, validation-failure, failure:{type}, tenant:{rut}
```
**Tipos de falla**: `link`, `checkout`, `semantic`

**Ejemplo**:
```
smarteros, runtime-validator, alert, validation-failure, failure:link, tenant:76123456-7
```

## 📊 Variables Personalizadas

Cada mensaje incluye variables para tracking avanzado:

### Scout Alerts
- `scout_title` - Título del scout
- `scout_id` - ID único del scout
- `severity` - Nivel de severidad

### Validation Alerts
- `domain` - Dominio validado
- `failure_type` - Tipo de falla detectada

## 🔧 Uso del Adapter

### Configuración

```bash
export MAILGUN_API_KEY="key-XXXXXXXXXXXXXXX"  # API privada, NO pubkey
export MAILGUN_DOMAIN="smarterbot.store"
export MAILGUN_FROM="SmarterOS Runtime <alertas@smarterbot.store>"
export MAILGUN_TO="destino@ejemplo.com"
```

### Enviar Scout Alert

```typescript
import { createMailgunAdapter } from './lib/mailgun-adapter';

const mailer = createMailgunAdapter();

await mailer.sendScoutAlert({
  to: 'admin@smarterbot.cl',
  scoutTitle: 'API Health Monitor',
  scoutGoal: 'Monitor api.smarterbot.cl uptime',
  content: '<p>API is responding correctly.</p>',
  severity: 'info',
  tenantRut: '76123456-7',
  scoutId: 'scout_001'
});
```

### Enviar Validation Alert

```typescript
await mailer.sendValidationAlert({
  to: 'admin@smarterbot.cl',
  domain: 'smarterbot.cl',
  failureType: 'link',
  details: 'Detected 2 broken links in checkout',
  tenantRut: '76123456-7'
});
```

## 📈 Dashboard de Mailgun

Visualiza mensajes etiquetados en:
```
https://app.mailgun.com/mg/sending/domains/smarterbot.store
```

### Filtros Disponibles

**Por severidad:**
- `severity:info`
- `severity:warning`
- `severity:critical`

**Por tipo de falla:**
- `failure:link`
- `failure:checkout`
- `failure:semantic`

**Por tenant:**
- `tenant:76123456-7`

**Por categoría:**
- `scout-alert`
- `validation-failure`

## 🔐 Tracking Habilitado

Cada email incluye:
- ✅ `o:tracking` - Tracking general
- ✅ `o:tracking-clicks` - Tracking de clicks
- ✅ `o:tracking-opens` - Tracking de aperturas

## 📝 Siguiente Paso

**Requerido**: Obtener la API key privada de Mailgun (NO la public key).

1. Ir a: https://app.mailgun.com/mg/dashboard
2. Settings → API Keys
3. Copiar "Private API key" (empieza con `key-`)
4. Configurar en el entorno:
   ```bash
   export MAILGUN_API_KEY="key-XXXXXXXXXXXXXXX"
   ```

## ✅ Test de Verificación

```bash
cd /root/smarteros-runtime-validator
export MAILGUN_API_KEY="key-XXXXXXXXXXXXXXX"
export MAILGUN_DOMAIN="smarterbot.store"
export MAILGUN_FROM="SmarterOS <alertas@smarterbot.store>"
export MAILGUN_TO="smarterbotcl@gmail.com"
npx tsx test-mailgun-tagging.ts
```

**Resultado esperado:**
```
✅ Scout alert sent: <20XXXXX@smarterbot.store>
   Tags: smarteros, runtime-validator, alert, severity:info, scout-alert, tenant:76123456-7

✅ Validation alert sent: <20XXXXX@smarterbot.store>
   Tags: smarteros, runtime-validator, alert, validation-failure, failure:link, tenant:76123456-7
```

## 🎯 Beneficios del Sistema

1. **Trazabilidad completa** - Cada mensaje etiquetado por sistema, componente y categoría
2. **Filtrado inteligente** - Búsqueda por severidad, tenant, tipo de falla
3. **Métricas automáticas** - Mailgun genera estadísticas por tag
4. **Debugging facilitado** - Variables personalizadas para análisis
5. **Cumplimiento audit** - Registro permanente en Mailgun con metadata

## 📚 Referencias

- [Mailgun Tagging Docs](https://mailgun-docs.redoc.ly/docs/mailgun/user-manual/tracking-messages/#tagging)
- [Mailgun API Reference](https://documentation.mailgun.com/docs/mailgun/api-reference/openapi-final/tag/Messages/)
