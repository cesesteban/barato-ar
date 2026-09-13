# Plan de negocio · Barato.ar

Enfoque: MVP funcional lo antes posible → validar tracción con métricas reales →
recién ahí decidir escala/monetización dura. Este doc es una **hipótesis
estructurada**, no un plan comprometido.

## Contexto del mercado

- **Consumo argentino en super**: ~USD 40B/año (2025). Volumen alto, baja
  concentración digital.
- **Inflación estructural**: los consumidores comparan precios más que en
  otros países. Sensibilidad a $50-100 de diferencia es real.
- **SEPA (Precios Claros)**: dataset del gobierno disponible desde 2022, poco
  aprovechado — la UI oficial es difícil de usar, sin ranking, sin alertas.
- **Delivery apps** (PY, Rappi): domina la conversión pero sin transparencia
  de precios.
- **Ex competidores** (Delivering, Mostruos, Preciomax): cerraron o pivotaron.
  Espacio libre para ejecución simple + honesta.

## Propuesta de valor

Ver [PRODUCTO.md](PRODUCTO.md). Resumen:

> "Precio más bajo cerca tuyo, mismo producto, sin cuenta, sin abrir 5 apps."

## Nichos objetivo (derivados del producto)

Los siguientes 4 segmentos surgen naturalmente del diseño actual (CABA+GBA,
sin cuenta, comparador de super). Ordenados por prioridad de captura.

### Nicho 1 — Familias con presupuesto ajustado en GBA (prioridad ALTA)

**Demografía**: 30-55 años, hijos, ingresos $500k-1.2M ARS/mes, viven en
Quilmes/Lomas/Morón/San Isidro. Hacen la compra semanal grande + reponen chico.

**Pain points**:
- Precio de la canasta puede variar >30% entre Coto/Día/Carrefour la misma semana
- No tienen tiempo de abrir 4 apps antes de decidir a dónde ir
- Cargan combustible extra si no eligen bien la sucursal

**Cómo captamos**:
- Blog SEO: "Comparativa canasta básica AMBA agosto 2026"
- Facebook groups locales ("Vecinos de Quilmes")
- WhatsApp forwards (share nativo)
- Cobertura granular por localidad (F016 ya cubre las 18 principales GBA)

**Valor para ellos**: ahorrar $500-2000/semana concretos + tiempo.

**Estimación**: 500k+ hogares en GBA target. Captura 1% en Y1 = 5000 usuarios activos.

### Nicho 2 — Jóvenes profesionales CABA sin auto (prioridad MEDIA-ALTA)

**Demografía**: 25-40 años, viven solos o en pareja, ingresos $800k-2M,
barrios Palermo/Villa Crespo/Caballito/Almagro. Combinan super físico (Coto/Día)
+ delivery (PY, Rappi) según conveniencia.

**Pain points**:
- Al no tener auto, sucursal más cercana importa mucho
- Delivery a veces sale más caro pero más cómodo — quieren decidir informados
- Compran productos "premium" (importados, orgánicos, sin TACC) que varían mucho de precio

**Cómo captamos**:
- Instagram / TikTok con reels de "productos que en tu barrio están 40% más caros"
- SEO longtail: "kombucha más barata Palermo", "cerveza artesanal Belgrano"
- Deep links a PY/Rappi (donde ellos ya compran) → monetización directa

**Valor para ellos**: tiempo + validar que no están pagando el "impuesto delivery" para todo.

**Estimación**: ~300k profesionales CABA activos digitalmente. Captura 2% Y1 = 6000 usuarios.

### Nicho 3 — Jubilados y personas 60+ en AMBA (prioridad MEDIA)

**Demografía**: 60+ años, ingresos fijos (jubilación), muy sensibles al precio,
concentrados en Recoleta/Belgrano/Barrio Norte/Vicente López. Compran diario o
2-3× por semana en tienda cercana.

**Pain points**:
- Presupuesto ajustado literal — $500/semana pesa
- No usan apps de delivery en general (barrera tecnológica o desconfianza)
- Van al super de a pie/en colectivo — la sucursal cercana es CRÍTICA

**Cómo captamos**:
- Word of mouth (hijos les recomiendan)
- Notas en portales masivos (Clarín, Infobae) — press release
- Cobertura destacada de "sucursales cercanas" (F007 ya lo hace)
- UI sin login, sin cookies, sin fricción — apropiada para este demo

**Valor para ellos**: ahorrar $300-800/semana + confianza en la fuente pública (SEPA).

**Estimación**: ~500k jubilados en AMBA. Captura 0.5% Y1 = 2500 usuarios. Alto uso por sesión.

### Nicho 4 — Small business / comerciantes que revenden (prioridad BAJA-EXPLORATORIA)

**Demografía**: kioscos, almacenes barriales, catering pequeño, que compran al
por mayor en super/mayoristas.

**Pain points**:
- Comparar precios entre Makro/Diarco/Vital vs super retail
- Ver histórico para negociar con proveedores
- Necesitan lista de compra optimizada (freemium feature)

**Cómo captamos**:
- Directamente vía cámara de comercio local
- Producto B2B lite: API con datos agregados por SKU

**Valor para ellos**: Business intelligence a precio bajo.

**Estimación**: Nicho chico (~20k target en AMBA) pero alto lifetime value.
Explorar solo después de validar B2C con nichos 1-3.

## Modelo de monetización (por fase)

Ver [PRODUCTO.md](PRODUCTO.md) y [AFFILIATE_SETUP.md](AFFILIATE_SETUP.md).

### Fase 0 — MVP funcional (mes 0-1) — actual

- **Cero revenue**. Objetivo: validar que la propuesta funciona.
- Deep links con UTM tracking (para evidenciar tráfico calificado a partnerships).

### Fase 1 — Primeros ingresos (mes 2-4)

- **MercadoLibre Afiliados** (auto-registro, único disponible en AR).
  Comisión típica 3-8% por venta. Producto lookup vía deep-link.
- **Google AdSense** cuando tengamos >100 sesiones/día (contexto natural).
  Ingresos ~$0.5-2 USD/1k pageviews en AR — bajo pero pasivo.
- **Estimación 4to mes**: USD 100-300/mes (modesto pero valida modelo).

### Fase 2 — Afiliados directos (mes 4-9)

- **Pitch a PedidosYa / Rappi** con métricas de tráfico Plausible.
  Comisión típica 5-10% first order, luego 2-3% recurrent.
- **Awin AR / Impact**: Farmacity, Fravega, Musimundo — verticals específicas.
- **Cupones (Cuponstar, Cuponatic)**: CPA $50-200 ARS por canje.
- **Estimación 9no mes**: USD 800-2500/mes.

### Fase 3 — Freemium + B2B (mes 9-18)

- **Freemium consumidor**:
  - Free: 5 alerts, lista de compra manual, comparación básica.
  - Premium $500-800 ARS/mes: alerts ilimitadas, dashboard familiar,
    lista de compra optimizada, export a Excel/PDF.
  - Target conversión 2-3% de usuarios activos.
- **B2B API**:
  - Fintechs (Belo, Ualá): datos de referencia de precios para su UX.
  - Apps de finanzas personales: catálogo agregado por SKU.
  - Empresas de research (Kantar, Nielsen): dataset AR con historia.
- **Estimación 18mo mes**: USD 3000-8000/mes si tracción crece.

### Fase 4 — Partnership + expansión (mes 18+)

- Deal directo con al menos 1 cadena grande (feed oficial + branded content).
- Expansión geográfica (Rosario, Córdoba).
- PWA installable con push notifications.

## Costos operativos estimados (mes actual)

| Item | Fase 0-1 | Fase 2 | Fase 3 |
|---|---|---|---|
| Vercel | $0 (Hobby) | $20 (Pro) | $50 (Pro + bandwidth extra) |
| Neon Postgres | $0 (Free) | $19 (Launch) | $69 (Scale) |
| Resend | $0 (100 emails/día) | $20 (50k/mes) | $85 (250k/mes) |
| R2 | $0 (10GB free) | $5 | $15 |
| Upstash Redis | $0 (10k req/día) | $0 o $10 pay-as-you-go | $50 |
| Sentry | $0 (Developer) | $26 (Team) | $80 (Business) |
| Plausible | $0 self-hosted o $9 (10k pageviews) | $19 (100k) | $69 (1M) |
| Dominio | ~$0.5/mes (nic.ar) | igual | igual |
| **TOTAL** | ~$1 | ~$100 | ~$400 |

## Métricas de tracción a validar

Ver [OBJETIVO.md](OBJETIVO.md) sección "Criterio de éxito MVP".

**North Star Metric candidata**: **búsquedas convertidas** — sesión que buscó
un producto, abrió el detalle, y tocó "Ir a la tienda" o "Comprar por delivery".
Es proxy de utilidad real (vs. bounce).

## Go-to-market (GTM) tentativo

Prioridad: SEO orgánico + word of mouth. Cero ads pagos en Fase 0-1.

### Semana 1-2 post-launch

- Setup Google Search Console + Bing Webmaster + sitemap submitted
- Post en LinkedIn/X con "hicimos un comparador de precios de super, feedback bienvenido"
- Publicar 3 blog posts iniciales:
  - "Cómo funciona SEPA (Precios Claros) y por qué es incompleta"
  - "Comparativa canasta básica AMBA — semana X"
  - "Los 10 productos con mayor variación de precio entre super AMBA"

### Mes 1-3

- 1 blog post/semana con keywords longtail geográficas
- Publicar en Facebook groups de "consumidores AR" (con moderación cuidadosa)
- Contactar a periodistas de consumo (Clarín, Infobae, La Nación) para nota
- Product Hunt launch (day 1 rank goal top 10 Latam)

### Mes 3-6

- Rappi Ads / PY Ads pequeño ($50/mes) sólo si CAC < LTV proyectado
- Colaboración con al menos 1 influencer de finanzas personales AR
- YouTube: video mensual "compra semanal comparada"

## Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| SEPA deja de publicar | Alto | Diversificar fuentes: parsers de folleto + community reports |
| PY / Rappi mandan C&D | Medio | Ya usamos deep-link + Google search (mínima huella técnica) |
| Cadena grande nos denuncia por scraping | Bajo | Sólo scraping polite de páginas públicas + robots.txt respetuoso |
| Costo cloud > revenue | Alto | Free tiers cubren hasta ~5000 users/mes; escalar cuando sostenga |
| Similar startup lanza primero | Medio | Ejecutar rápido + diferenciarse por honestidad y UX |
| Regulación de precios cambia | Bajo | La data SEPA es pública y auditable, seguimos publicándola |

## Assumptions clave (revisar cada mes)

1. Consumidor argentino sigue sensible al precio (inflación >20% anual persiste)
2. SEPA sigue siendo dataset abierto
3. Google no despriorice comparadores de precios en su ranking
4. PY / Rappi no lanzan comparador propio (poco probable, conflicto con partners)
5. Vercel free tier cubre nuestros 100k pageviews/mes iniciales

## Decisión de "sí lanzo o no lanzo"

Criterios para GO/NO-GO a launch público (después del MVP con data completa):

- ✅ Sitio carga en <2.5s LCP en mobile 4G real
- ✅ >= 5000 productos únicos con precio en la última semana
- ✅ >= 4 cadenas mapeadas con >= 50 sucursales cada una
- ✅ Alerts funcionan end-to-end con dominio real (fuera de sandbox Resend)
- ✅ Analytics registra sesiones (Plausible activo)
- ✅ Al menos 1 canal de afiliado activo (MLA mínimo)

Cuando 5 de 6 estén ✓ → lanzamos. Comunicación clara de "beta" mantiene tolerancia
a bugs de los primeros usuarios.

## Notas finales

Este plan es una **hipótesis estructurada**. Los números están para dar
dimensión, no para comprometer. La disciplina real es:

1. Lanzar MVP con la data que tengamos
2. Medir qué segmento (nicho) se engancha más rápido
3. Doblar la apuesta en ese nicho
4. Rechazar features que no sirvan al nicho ganador

Iterar cada 4-6 semanas revisando el North Star Metric.
