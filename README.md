# SmarterOS Runtime Validator

**Motor de validación continua de integridad funcional y semántica para sitios productivos**

---

## 🎯 ¿Qué es?

Un sistema **gobernado por OpenSpec** que valida automáticamente:
- ✅ Enlaces críticos (detección de 404/500)
- ✅ Estructura de URLs (descubrimiento de nuevas páginas)
- ✅ Cambios semánticos (keywords, copys, botones)
- ✅ Compliance contractual (SLA, availability, funnel integrity)

**No es solo monitoreo**: es **control normativo de operación digital** con validez contractual.

---

## 🚀 Estado Actual

**Fase 2**: Motor de ejecución activado al 90%

### ✅ Completado
- Infraestructura base
- Credenciales configuradas (Supabase, Firecrawl, OpenRouter)
- Schema SQL (6 tablas)
- OpenSpec contract definido
- Scripts de activación listos

### ⏳ Pendiente (2 minutos)
- Fix schema manual en Supabase
- Ver: [`FIX-SCHEMA-MANUAL.md`](./FIX-SCHEMA-MANUAL.md)

---

## 📁 Componentes Clave

```
smarteros-runtime-validator/
├── openspec.runtime.validation.v1.yaml   # Contrato OpenSpec
├── scripts/
│   ├── fix-schema.sql                    # SQL para Supabase
│   └── setup-phase2.sh                   # Activación automática
├── FIX-SCHEMA-MANUAL.md                  # Instrucciones críticas
├── STATUS-FASE-2.md                      # Estado detallado
└── .env.local                            # Credenciales (no commiteado)
```

---

## 🔧 Stack Tecnológico

| Componente | Tecnología |
|------------|-----------|
| **Crawler** | Firecrawl API |
| **LLM** | OpenRouter (semantic analysis) |
| **Database** | Supabase (PostgreSQL + pgvector) |
| **Frontend** | Next.js 16 (Turbopack) |
| **Governance** | OpenSpec v1 |
| **Alerts** | Mailgun (pendiente) |

---

## 🏃 Activación (Post-Fix)

```bash
cd /root/smarteros-runtime-validator
./scripts/setup-phase2.sh
```

Esto ejecuta:
1. Verificación de schema
2. Creación de scout de prueba
3. Primera ejecución real
4. Validación de resultados

---

## 📊 Capacidades Enterprise

### Multi-tenant
- Aislamiento por RUT
- Configuraciones independientes por cliente
- Histórico segregado

### Auditoría Continua
- Snapshots: 90 días
- Diffs: 180 días
- Alertas: 365 días

### Validación Contractual
- Compliance con OpenSpec
- Detección de drift (contract vs runtime)
- Base objetiva para SLA

---

## 🔗 Enlaces Útiles

- **Supabase Dashboard**: https://supabase.com/dashboard/project/rjfcmmzjlguiititkmyh
- **OpenSpec Repo**: https://github.com/SmarterCL/smarteros-specs
- **SmarterOS Main**: https://github.com/SmarterCL/smarteros

---

## 📈 Roadmap

- [x] Fase 1: OpenSpec + Schema base (100%)
- [ ] Fase 2: Motor de ejecución (90% - **pendiente fix schema**)
- [ ] Fase 3: Alertas automáticas (0%)
- [ ] Fase 4: Dashboard visual (0%)
- [ ] Fase 5: API pública (0%)

---

## 🎓 Casos de Uso

### 1. Validación Post-Venta
Detecta roturas de funnel antes que el cliente reclame.

### 2. Soporte Proactivo
Alertas automáticas ante cambios críticos.

### 3. Upgrade Comercial
Argumentos objetivos para upsell basados en datos reales.

### 4. Control de Cumplimiento
Auditoría viva para contratos B2B con SLA.

### 5. Detección de Oportunidades
Identifica nuevas URLs/funcionalidades para proponer automatización.

---

## 💡 Valor Estratégico

Este sistema convierte **SmarterOS** en:
- Plataforma con validación contractual automática
- Sistema de detección temprana de fallas
- Base para facturación por SLA objetivo
- Diferencial competitivo enterprise-grade

**No es "uptime monitoring"**: es **governance operacional continua**.

---

## 📄 Licencia

MIT License - Ver [LICENSE](./LICENSE)

---

## 🤝 Contribuir

Este repositorio es parte del ecosistema **SmarterOS**.  
Para contribuir, revisa las [guías de desarrollo](https://github.com/SmarterCL/smarteros-specs).

---

## 📞 Soporte

- **Issues**: https://github.com/SmarterCL/smarteros-runtime-validator/issues
- **Documentación**: Ver `/STATUS-FASE-2.md`
- **OpenSpec**: https://github.com/SmarterCL/smarteros-specs

---

**Construido con OpenSpec · Powered by Firecrawl · Hosted on Supabase**
