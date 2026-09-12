# Setup de afiliados (delivery / marketplace)

Guía operativa para cuando consigas IDs de afiliado con cada plataforma.

## Estado actual (2026-Q3)

| Plataforma | Programa público | Cómo se accede |
|---|---|---|
| **PedidosYa** | ❌ No hay programa auto-registro | Deal directo con `partnerships@pedidosya.com.ar` |
| **Rappi** | ❌ No | Rappi Ads (publicidad) o partnership B2B |
| **MercadoLibre** | ✅ MLA Afiliados (auto-registro) | `https://www.mercadolibre.com.ar/afiliados` |

Barato.ar ya emite deep links a las 3 con UTM tracking. El código está
preparado para insertar el ID de afiliado sin re-deploy — solo cambiar el
env var correspondiente en Vercel.

## Estrategia para conseguir afiliados PY/Rappi

1. **Fase tracking (ahora)**: los deep links UTM funcionan sin ID. Vas
   acumulando clicks en Plausible → evidencia de tráfico calificado.
2. **Fase pitch (3-6 meses)**: cuando tengas >5k clicks/mes a delivery,
   escribí a partnerships con:
   - Dashboard de Plausible con clicks a `pedidosya.com.ar` / `rappi.com.ar`
   - CTR desde tus páginas de producto
   - Propuesta CPA fijo por primer pedido O comisión 3-8% por venta
3. **Fase deal**: recibís un ID (formato depende de la plataforma) →
   pegás en Vercel → todos los links del sitio agregan el ID automáticamente.

## Cómo pegar el ID en Vercel

1. Vercel Dashboard → `barato-ar` → **Settings** → **Environment Variables**.
2. **Add New** con los siguientes envs (solo los que ya tengas):

| Env var | Valor de ejemplo | Fuente |
|---|---|---|
| `NEXT_PUBLIC_AFFILIATE_PEDIDOSYA` | `PY-BARATO-42` | El partner manager te lo pasa |
| `NEXT_PUBLIC_AFFILIATE_RAPPI` | `RAP-XYZ-001` | Rappi Ads dashboard |
| `NEXT_PUBLIC_AFFILIATE_MERCADOLIBRE` | `matt_MLA_12345` | ML Afiliados panel |

3. **Environments**: marcá los 3 (Production, Preview, Development).
4. Redeploy (Vercel lo hace automáticamente si activás "Redeploy on env change").

Los envs son `NEXT_PUBLIC_*` a propósito — necesitan estar disponibles del
lado cliente (el link se arma al renderizar la página del producto).

## Formatos por plataforma

Cada plataforma pasa el ID con un parámetro distinto:

- **PedidosYa** → `?partnerId=<ID>&utm_source=<ID>`
- **Rappi** → `?ref=<ID>&utm_source=<ID>`
- **MercadoLibre** → `?matt_word=<ID>&matt_tool=88833099`

Si el partner te da un formato diferente (subdomain propio, token custom),
editá `src/lib/deep-links.ts` — el config de cada partner tiene el
`buildSearchUrl` y ahí ajustás.

## Testing

Después de setear el env:

1. Entrá a cualquier producto en el sitio.
2. Inspeccioná el link "Buscar en PedidosYa" (click derecho → "Copiar
   dirección del enlace").
3. Verificá que la URL contenga `partnerId=<tu-id>`.
4. Copia y probá el link en incognito — debería redirigirte a la búsqueda
   con el ID visible en la URL.

## Tracking de resultados

Cada click ya se registra en Plausible como evento `Delivery Click` con
props `{ platform, query, affiliate: "yes"|"no" }`. Cuando actives
afiliados, el prop `affiliate: "yes"` te permite filtrar clicks
monetizables vs. tracking-only.

Para atribución de ventas (¿cuántos clicks se convirtieron?): la
plataforma te da su propio dashboard cuando firmen el deal. Compará con
Plausible para detectar leakage.
