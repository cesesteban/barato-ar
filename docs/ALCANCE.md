# Alcance del proyecto

Qué está adentro / afuera del scope para MVP + qué es hipótesis futura.

## In-scope MVP (todo lo que YA está construido)

### Verticales
- ✅ **Supermercados** — Carrefour, Coto, Día, Jumbo, Vea, Disco, La Anónima, ChangoMás (via SEPA + folletos)
- ✅ **Farmacia** — modelo listo (`vertical: pharmacy`), sin data ingested aún
- ✅ **Delivery apps** — solo como deep-links pasivos (no ingesta de precios)
- ✅ **Bebidas** — subset filtrable del catálogo super

### Cobertura geográfica
- ✅ **CABA**: 11 barrios (Palermo, Belgrano, Recoleta, Caballito, Flores, Almagro, Villa Crespo, Núñez, Boedo, Microcentro + "otras")
- ✅ **GBA Norte**: San Isidro, Vicente López, Tigre, San Fernando, San Martín + umbrella
- ✅ **GBA Oeste**: Morón, Ituzaingó, Merlo, Hurlingham, Tres de Febrero, La Matanza + umbrella
- ✅ **GBA Sur**: Avellaneda, Lomas de Zamora, Quilmes, Lanús, Florencio Varela, Berazategui, Almirante Brown + umbrella
- ❌ Provincias del interior — post-MVP

### Features usuario
- ✅ Búsqueda por nombre + fuzzy match + autocomplete
- ✅ Comparación de precios multi-cadena por producto
- ✅ Selección de zona con persistencia + geolocation
- ✅ Alertas de precio por email (sin cuenta, doble opt-in)
- ✅ Historial de precios (chart 90d)
- ✅ Reportar oferta (crowdsourced, moderación admin)
- ✅ Deep links a delivery apps (PY/Rappi/ML)
- ✅ SEO on-page (JSON-LD, sitemap dinámico, meta tags)

### Features admin
- ✅ Cola de moderación de reports
- ✅ Cola de normalizer (fuzzy match approve/reject)
- ✅ Auth.js magic link para `/admin/*`
- ✅ Ingesta manual dispatch via GH Actions

### Infra
- ✅ Deploy en Vercel + Neon
- ✅ CI (typecheck + tests + lint) en cada PR
- ✅ ISR + on-demand revalidate
- ✅ 8 GH Actions cron workflows
- ✅ Materialized view refresh automatizado
- ✅ Rate limit vía redis (stub OK, Upstash cuando escale)

## Fuera de scope MVP explícitos (deferred con razón)

### Datos
- ❌ **Precios de delivery apps** — no publicados vía API pública. Scraping en zona gris legal. Usamos deep-links en su lugar.
- ❌ **Precios en tiempo real** — SEPA se actualiza diario, folletos semanal. Suficiente para consumo semanal familiar.
- ❌ **Datos históricos > 90 días** — matview solo guarda 90d activos. Analytics más profundo requiere DW aparte.
- ❌ **Predicción de precios** — no hacemos forecasting. Solo mostramos historial.

### Features
- ❌ **Cuentas de usuario propias** — Constitución Ppio IV. Alerts van por email, admin por magic link, listo.
- ❌ **App mobile nativa** — la PWA cubre el 90% del uso. Empaquetar en iOS/Android es post-tracción.
- ❌ **Notificaciones push** — dependen de app o de Web Push (permisos, PWA installed). Backlog.
- ❌ **Comparar carritos completos** — lista de compra optimizada. Sí en roadmap freemium.
- ❌ **Cupones y códigos de descuento** — negociación B2B con marcas. Post-tracción.
- ❌ **Programas de fidelidad** — requiere API de cada cadena. Post-partnership.

### Verticales
- ❌ **Restaurantes / comidas prep** — mercado saturado (PY, Rappi). No fit con "comparador".
- ❌ **Combustibles** — hay data pública pero mercado distinto (no repite compra semanal por producto).
- ❌ **Electrónica** — MercadoLibre + Fravega dominan. Podríamos agregar via afiliados solo.
- ❌ **Servicios (internet, luz, gas)** — modelo distinto (recurrente sin comparación producto).

### Geografía
- ❌ **Interior del país** — cobertura SEPA es nacional pero el rating "cerca de mí" requiere lat/lng de las zonas y buenas centroides. Cada provincia agregar es 1-2 días.
- ❌ **Uruguay / Chile** — mismo modelo aplicaría pero fuera de MVP.

### Monetización
- ❌ **Ads propios (display)** — degrada UX + requiere volumen para monetizar en AR.
- ❌ **Suscripciones B2C** — freemium sin usuarios no funciona.
- ❌ **API pública B2B** — post-tracción, cuando la data agregada tenga valor comprobado.

## Roadmap sugerido post-MVP (no comprometido)

### Sprint post-launch (2-4 semanas)
- Re-ingesta completa 7 cadenas SEPA
- Photo scraping via Open Food Facts + fallback R2
- Filtro "solo ofertas reales" (delta >= 10% vs matview)
- Fix nombres feos (title case + expansión abreviaturas SEPA)
- Registro MLA Afiliados
- Content: 5-10 blog posts SEO
- Google Search Console + Bing

### Q siguiente (3 meses)
- Parsers de folleto Coto/Día/Jumbo (backup + fotos + promos 2x1)
- Sentry + Plausible en prod
- Pilot scraping PedidosYa 5 cadenas (cache 12h + rate limit)
- Lista de compra optimizada (freemium tier)
- Alertas premium ilimitadas (>5)

### Año 1
- Partnership B2B con al menos 1 cadena grande (feed oficial)
- API B2B para fintechs (Belo, Ualá) — datos de referencia de precios
- Expansión a Rosario + Córdoba
- PWA installable con notificaciones push

## Restricciones no negociables

De la [constitución](../.specify/memory/constitution.md):

1. **Nunca inventar datos** — precio sin fuente + timestamp no se publica.
2. **Nunca cuenta obligatoria** para consumir Barato.ar.
3. **Nunca tracking cross-site** (Plausible cookieless o nada).
4. **Nunca dark patterns** en la UI (compra "recomendada" pagada, urgencia falsa).
5. **Nunca comprometer performance** (LCP > 2.5s bloquea deploy).
6. **Nunca privilegiar cadenas por comisión** — el orden depende de precio y cercanía siempre.

## Métricas de éxito MVP (para evaluar en 3 meses)

- **Cobertura**: >= 50% del catálogo SEPA activo (todas las cadenas mapeadas ingested al menos 1×/semana)
- **Latencia**: LCP p75 mobile < 2.5s en producción
- **Adopción**: >= 5000 sesiones/mes sin ads pagos
- **Retención**: >= 20% de returning visitors semana 4
- **Alerts**: >= 100 alerts activas verificadas
- **Reports**: >= 10 reports/semana aprobados
- **Delivery clicks**: >= 500/mes → validación para pitch a partnerships
