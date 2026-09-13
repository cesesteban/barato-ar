# Quickstart · F019 — "Ir a la tienda" externo

Validación end-to-end del feature.

## Prerrequisitos

- Repo checked out en `feat/019-store-product-links` (o main post-merge)
- Node 20 + pnpm
- Neon prod accesible (envs `DATABASE_URL` + `DATABASE_URL_UNPOOLED`)

## Paso 1 — Tests unit

```bash
pnpm test --run tests/unit/lib/store-links.test.ts
```

**Expected**: ~11-13 tests pasan (1 por chain con builder + priority + fallback + query cleanup).

## Paso 2 — Verificación local (dev)

```bash
pnpm dev
```

Navegador → `http://localhost:3000/producto/{slug}?zone=caba-palermo` (usar un producto que tenga precio de al menos 2 cadenas).

**Verificar en cada fila**:
- Botón "Ir a la tienda →" tiene `target="_blank"` ✓
- Right-click → "Copiar dirección del enlace" → la URL apunta al dominio de la cadena, NO a `barato-ar.vercel.app/tienda/...`
- Click abre nueva pestaña con búsqueda pre-cargada del producto

**Verificar por cadena** (al menos las 8 mapeadas):

| Cadena | URL esperada (sample) |
|---|---|
| Carrefour | `carrefour.com.ar/*?_q=<producto>&map=ft` |
| Coto | `cotodigital3.com.ar/sitios/cdigi/browse?Ntt=<producto>` |
| Día | `diaonline.supermercadosdia.com.ar/*?_q=<producto>&map=ft` |
| Jumbo | `jumbo.com.ar/*?_q=<producto>&map=ft` |
| Vea | `vea.com.ar/*?_q=<producto>&map=ft` |
| Disco | `disco.com.ar/*?_q=<producto>&map=ft` |
| La Anónima | `laanonimaonline.com/busqueda?q=<producto>` |
| Changomas | `changomas.com.ar/*?_q=<producto>&map=ft` |

## Paso 3 — Query cleanup verifica

Buscar un producto SEPA con nombre "feo" (ej. cualquiera de Coto que incluya `BOT-` o `PCK-`):

```bash
# Local o prod:
curl -s "https://barato-ar.vercel.app/producto/<slug>?zone=caba-palermo" | grep -oE 'href="[^"]*(carrefour|coto)[^"]*"' | head -3
```

**Expected**: la URL NO contiene `BOT-750-ml`, `PCK-6-un`, ni `cc` como unidad (cleanup aplicó).

## Paso 4 — Deploy + verificación en prod

Push a main → Vercel auto-deploy → verificar `/health` para confirmar commit.

Repetir Paso 2 en `https://barato-ar.vercel.app/producto/<slug>` con múltiples cadenas.

## Paso 5 — Click tracking (Plausible)

Solo verificable si `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` está seteado.

1. Abrir DevTools → Network → filtrar por `plausible`
2. Click en "Ir a la tienda"
3. Verificar POST a `plausible.io/api/event` con:
   ```json
   {
     "name": "Store Click",
     "props": { "chain": "coto", "hasPdp": false }
   }
   ```

Si no está Plausible configurado, este paso queda para cuando F017.12 se resuelva.

## Paso 6 — Update docs

Editar en el mismo commit del merge:

- [ ] `docs/AUDIT.md` → agregar sección "F019 aplicado" mencionando fix del bug "botón lleva a landing interna"
- [ ] `docs/ESTADO_ACTUAL.md` → agregar F019 al scorecard con estado 🟢 (código + data + config)
- [ ] `docs/VISTAS.md` → nota en `/producto/[slug]` que los links de tienda son externos (no internos)
- [ ] `docs/FLUJO_FRONTEND.md` → sección "Componentes clave" actualizar `<PriceComparisonRow>` con la nueva prop `chainWebsiteUrl`

## Rollback

Si algún builder rompe:
- Revert del commit → los links vuelven al fallback `/tienda/[slug]` interno (peor UX pero funcional)
- Alternativa: agregar guard en `resolveStoreLink` que devuelve null → caller usa fallback

Si el rate limit de una cadena bloquea (poco probable, no scrapeamos, solo linkeamos):
- Setear temporalmente el builder de esa chain a `googleSiteSearch` fallback
- Investigar
