# Plan de puesta en producción con data real

Un plan por fases. Cada fase tiene: **qué creás vos**, **qué credenciales me pasás**, **qué hago yo**, **checkpoint verificable**.

Los servicios están ordenados por dependencia — no salteés fases. Cada fase toma entre 15 min y 2 h (mayormente esperando propagación de DNS o builds).

**Duración estimada total**: 2-3 días calendario, ~6 horas de trabajo efectivo.

**Costo**: $0 en free tiers para el MVP.

---

## Fase 0 — Preparación (10 min, sin cuentas)

**Vos hacés:**
1. Decidís el email de contacto que va a ser owner del proyecto (ej. `vos@gmail.com`). Usalo consistentemente para crear todas las cuentas.
2. Decidís el nombre de marca final. Confirmado: **Barato.ar**.
3. Instalás [1Password](https://1password.com) o similar si no tenés — vas a manejar ~25 credenciales.

**Yo hago:**
- Nada. Espero tu OK para arrancar Fase 1.

**Checkpoint:** me confirmás que arrancamos.

---

## Fase 1 — Dominio (30 min de trabajo + hasta 24 h de propagación DNS)

**Vos hacés:**
1. Registrar `barato.ar` en [nic.ar](https://nic.ar/) — necesita CUIT o DNI + tarjeta. ~$500 ARS/año.
2. Crear cuenta gratis en [cloudflare.com](https://cloudflare.com).
3. Cloudflare → Add Site → `barato.ar` → plan **Free**.
4. Cloudflare te da 2 nameservers (ej. `xxx.ns.cloudflare.com`).
5. Volver a nic.ar → panel del dominio → cambiar nameservers a los que te dio Cloudflare.

**Vos me pasás:**
- **Nada aún** — solo confirmás cuando el dominio esté delegado a Cloudflare (Cloudflare te avisa por email; puede tardar hasta 24 h).

**Yo hago:**
- Nada. Espero el OK.

**Checkpoint:** `dig NS barato.ar` devuelve los nameservers de Cloudflare.

---

## Fase 2 — Neon Postgres (20 min)

**Vos hacés:**
1. Cuenta en [neon.tech](https://neon.tech) — sign up con GitHub o email.
2. New Project → nombre `barato-ar` → región **AWS US East 2 (Ohio)** → Postgres 16.
3. Neon Console → SQL Editor → ejecutar:
   ```sql
   CREATE EXTENSION IF NOT EXISTS pg_trgm;
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
4. Dashboard → Connection Details → copiar las **dos** URLs:
   - **Pooled connection** (viene con `-pooler` en el host)
   - **Direct connection** (para migraciones)

**Vos me pasás:**
- `DATABASE_URL` (pooled)
- `DATABASE_URL_UNPOOLED` (direct)

**Yo hago:**
- Aplico las 5 migraciones existentes contra Neon:
  ```bash
  DATABASE_URL_UNPOOLED=<...> pnpm prisma migrate deploy
  ```
- Corro el seed base (11 chains + 15 zones + AppMeta).
- Ejecuto los 3 índices GiST que faltan (workaround al bug de migration
  detectado durante la verificación).
- Verifico con `SELECT COUNT(*) FROM chains` (debe dar 11).

**Checkpoint:** te muestro captura de `\dt public.*` con 15 tablas + 5 migraciones aplicadas.

---

## Fase 3 — Resend + DNS de email (30 min + hasta 30 min propagación)

**Vos hacés:**
1. Cuenta en [resend.com](https://resend.com).
2. Dashboard → **Domains** → Add Domain → `barato.ar`.
3. Resend te muestra 3-4 registros DNS (SPF + DKIM + DMARC + optional MX).
4. Cloudflare Dashboard → `barato.ar` → **DNS** → agregar cada registro **exactamente como Resend lo pide** (nombre + tipo + valor). Todos como "DNS only" (nube gris, no naranja).
5. En Resend, volver al domain y darle **Verify DNS Records**. Esperar hasta ver ✅.
6. Crear API Key en Resend → nombre `barato-ar-prod` → permisos `Sending access` → copiar una sola vez.

**Vos me pasás:**
- `RESEND_API_KEY`
- Screenshot o confirmación de que Resend muestra ✅ Verified.

**Yo hago:**
- Test de envío real con curl para confirmar que llega:
  ```bash
  curl https://api.resend.com/emails -H "Authorization: Bearer $RESEND_API_KEY" \
    -d '{"from":"alertas@barato.ar","to":"<tu email>","subject":"test","html":"ok"}'
  ```
- Te aviso cuando lo recibas.

**Checkpoint:** email de test en tu inbox con `SPF ✓ DKIM ✓ DMARC ✓` en headers (revisar en [mail-tester.com](https://mail-tester.com) — target 8+/10).

---

## Fase 4 — GitHub + Vercel (30 min)

**Vos hacés:**
1. Si no tenés, crear cuenta [github.com](https://github.com).
2. Crear repo `barato-ar` **privado** (después decidís si abrís).
3. Cuenta en [vercel.com](https://vercel.com) — sign in con GitHub.
4. Vercel → **Import Project** → autorizar GitHub → seleccionar `barato-ar`. **Aún no deployeás** — Framework detectado: Next.js. Root: `/`. **Cancelar el deploy inicial** por ahora — falta configurar envs.

**Vos me pasás:**
- URL del repo GitHub (o me invitás como collaborator si es privado).
- Confirmación de que Vercel importó el repo pero no deployeó todavía.

**Yo hago:**
1. Push del código a `origin`:
   ```bash
   git remote add origin git@github.com:<user>/barato-ar.git
   git push -u origin main
   ```
2. Genero los dos secrets críticos con `openssl rand -base64 32`:
   - `AUTH_SECRET`
   - `REVALIDATE_SECRET`
3. **Te paso la lista completa de env vars** que tenés que pegar en Vercel Dashboard (Production + Preview + Development). Son 15-20 vars. Se los pegás vos porque prefiero no manejar credenciales tuyas directo en un panel externo.
4. **En paralelo** configuro los mismos secrets en **GitHub → Repository Settings → Secrets and variables → Actions** para que los cron workflows funcionen.

**Vos hacés:**
1. Pegás las envs en Vercel según la lista que te doy.
2. En GitHub → Settings → Secrets → agregás los secrets que te paso (para workflows).
3. Vercel → **Domains** → agregar `barato.ar` (apex) + `www.barato.ar` (redirect a apex).
4. Cloudflare → DNS → agregar los 2 registros que Vercel pide (típicamente A + CNAME).
5. Trigger primer deploy: Vercel → Deployments → Redeploy.

**Checkpoint:**
- `https://barato.ar` responde con la home (sin ofertas — DB vacía).
- `https://barato.ar/health` responde `{status:"ok", db:"connected"}`.
- Rich Results Test valida el JSON-LD del home.

---

## Fase 5 — Primera ingesta real (1-2 h)

Este es el momento en que Barato.ar deja de ser una demo. Hago la primera corrida manual y observo qué se rompe con datos reales.

**Vos me pasás:**
- Nada. Solo confirmás que la Fase 4 está OK.

**Yo hago:**

### 5.1 Carrefour (parser listo)

```bash
# En GitHub Actions:
Actions → Weekly Flyer Ingestion → Run workflow → chain: carrefour
```

Resultado esperado: 200-500 productos + precios en Neon. Si falla:
- Ajusto los selectores del parser (`src/ingestion/chains/carrefour/parser.ts`).
- Guardo el HTML como fixture (`tests/fixtures/flyers/carrefour/<week>.html`).
- Snapshot test previene regresión futura.

### 5.2 Precios Claros / SEPA

Este es el más frágil. **Vos me pasás:**
- Confirmación de que puedo publicar un `manifest.json` en tu bucket
  Cloudflare R2 (Fase 6.5). O alternativa temporal: subir los 4 CSVs
  a un GitHub Gist público.

**Yo hago:**
1. Descargo los 4 CSVs oficiales de
   [datos.produccion.gob.ar/dataset/sepa-precios](https://datos.produccion.gob.ar/dataset/sepa-precios-de-argentina).
2. Publico un `manifest.json` con las URLs.
3. Actualizo `SEPA_CHAIN_MAP` en `src/ingestion/pcl/chains.ts` con los IDs reales del `comercios.csv`.
4. `SEPA_MANIFEST_URL` como env en Vercel + GitHub Actions.
5. Trigger workflow `ingest-pcl.yml`.
6. Verifico > 5000 rows + 200+ stores reales en Neon.

### 5.3 Normalizer

```bash
Actions → Normalize Weekly → Run workflow
```

Match automático por EAN + fuzzy. Los borderline quedan en cola admin.

### 5.4 Refresh views

```bash
Actions → Refresh Materialized Views → Run workflow
```

**Checkpoint:**
- `https://barato.ar` muestra ofertas reales con precios de Carrefour + otras cadenas si SEPA funcionó.
- `https://barato.ar/producto/<algún-slug>` con chart histórico + comparación multi-cadena.
- `https://barato.ar/ofertas?vertical=supermarket&minDiscount=20` filtra correctamente.

---

## Fase 6 — Servicios auxiliares (2 h)

Podés hacer estas en paralelo o después del launch. Ninguna bloquea el MVP.

### 6.1 Auth admin (obligatorio para revisar reports/normalizer)

**Vos me pasás:**
- Email(s) que van a tener acceso a `/admin` (típicamente el tuyo).

**Yo hago:**
- Setear `ADMIN_EMAILS` en Vercel + GitHub.
- Test: pegás en `https://barato.ar/admin` → recibís magic link por email → click → entrás.

### 6.2 Cloudflare R2 (obligatorio para fotos de productos)

**Vos hacés:**
1. Cloudflare Dashboard → **R2** → Create Bucket:
   - `barato-ar-products` — Location: `WNAM` (Americas) — **Public access: enabled**
   - `barato-ar-reports` — Location: `WNAM` — **Private**
2. R2 → Products bucket → Settings → **Custom Domains** → Add `img.barato.ar`. Cloudflare agrega el CNAME solo.
3. R2 → **Manage R2 API Tokens** → Create API token:
   - Permissions: **Object Read & Write** en ambos buckets.
4. Copiar Account ID + Access Key ID + Secret Access Key.

**Vos me pasás:**
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`.
- Confirmación de que `https://img.barato.ar/test.txt` responde (después de subir un test).

**Yo hago:**
- Agrego envs a Vercel + GitHub.
- Publico el `manifest.json` de SEPA acá (si aún no lo hicimos).
- Habilito el photo scraper post-ingesta (F03 tenía skeleton).

### 6.3 Upstash Redis (opcional, mejora latencia)

Sin esto la app usa el stub in-memory — funciona pero pierde el cache al reiniciar el container.

**Vos hacés:**
1. Cuenta en [upstash.com](https://upstash.com).
2. Create Database → `barato-ar-cache` → Region **us-east-1** → tipo **Regional**.
3. Copiar REST URL + REST Token.

**Vos me pasás:**
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.

**Yo hago:**
- Envs → Vercel. Redeploy → cache activo.

### 6.4 Sentry (opcional, obs)

**Vos hacés:**
1. Cuenta en [sentry.io](https://sentry.io) — plan Developer (free).
2. Create Project → Platform: **Next.js** → Name: `barato-ar`.
3. Copiar DSN.
4. Crear otro Project → Platform: **Node.js** → Name: `barato-ar-ingest`. Copiar DSN.

**Vos me pasás:**
- `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` (mismo valor), `SENTRY_DSN_INGEST`.

### 6.5 Plausible (opcional, analytics)

**Vos hacés:**
1. Cuenta en [plausible.io](https://plausible.io) — plan Growth $9/mes o self-hosted en Cloudflare.
2. Add Site → `barato.ar`.

**Vos me pasás:**
- Confirmación de que el site está agregado.

**Yo hago:**
- Setear `NEXT_PUBLIC_PLAUSIBLE_DOMAIN=barato.ar` en Vercel.
- Redeploy. El script solo carga en prod, es cookieless, respeta Ppio IV.

### 6.6 Better Stack (opcional, uptime)

**Vos hacés:**
1. Cuenta en [betterstack.com](https://betterstack.com) — free tier.
2. Monitors → New → HTTP Monitor → URL `https://barato.ar/health` → check cada 3 min → email notification al owner.

**Checkpoint:** te llega alerta si `/health` responde ≠ 200.

---

## Fase 7 — SEO submission (30 min)

**Vos hacés:**
1. [Google Search Console](https://search.google.com/search-console) → Add property → `barato.ar` → verificar via TXT record en Cloudflare DNS.
2. Sitemaps → Add → `https://barato.ar/sitemap.xml`.
3. [Bing Webmaster](https://www.bing.com/webmasters) → Add site → Import from GSC.
4. Testear con [Rich Results Test](https://search.google.com/test/rich-results) en al menos 3 URLs `/producto/<slug>`.

**Checkpoint:**
- GSC muestra sitemap con `Success`.
- Rich Results válido: `Product` + `AggregateOffer`.

---

## Fase 8 — Launch (1 día)

**Vos hacés:**
1. Abrís `LAUNCH.md` — 40+ items en 6 secciones.
2. Vas tildando lo que fuiste completando en fases 1-7.
3. Los items nuevos que aparezcan (ej. contenido legal revisado por asesor si lo necesitás), los resolvés.

**Yo hago:**
- Reviso contigo `LAUNCH.md` completo.
- Corro `pnpm test` + Lighthouse CI en producción → verifico presupuesto de performance.
- Test end-to-end de todos los flujos contra `https://barato.ar` real.

**Vos hacés:**
- Redactás el post de anuncio (LinkedIn, X, Producthunt) — lo puedo ayudar si querés.
- Publicás.

---

## Cronograma sugerido (6 días de calendario)

| Día | Fases | Tu tiempo | Bloqueado por |
|---|---|---|---|
| **1** | 0, 1, 2 | 1h | Propagación DNS (24h) |
| **2** | 3, 4 | 1.5h | Verificación Resend (30min-2h) |
| **3** | 5 | 0.5h (yo hago la mayoría) | — |
| **4** | 6.1, 6.2, 6.3 | 1h | — |
| **5** | 6.4, 6.5, 6.6, 7 | 1h | Google Search Console indexing |
| **6** | 8 · Launch | 1h | — |

---

## Info que necesito de vos, ordenada

Copiá esta lista y la vamos completando de a poco. Me pasás cada bloque cuando esté listo:

### Bloque A (Fase 1-2)
```
Email owner:                _______________
Timezone del owner:         ART (default)
Dominio confirmado:         barato.ar

DATABASE_URL (Neon pooled):
DATABASE_URL_UNPOOLED (Neon direct):
```

### Bloque B (Fase 3)
```
RESEND_API_KEY:
Email de test para verificar SPF/DKIM:
```

### Bloque C (Fase 4)
```
GitHub repo URL:
Confirmación de que me diste acceso al repo:
Confirmación de Vercel proyecto importado:
Emails autorizados para /admin (CSV):
```

### Bloque D (Fase 5.2 SEPA)
```
Confirmación de bucket R2 público (para publicar manifest):
  (o alternativa: link a GitHub Gist con los 4 CSVs)
```

### Bloque E (Fase 6, opcional pero recomendado)
```
R2_ACCOUNT_ID:
R2_ACCESS_KEY_ID:
R2_SECRET_ACCESS_KEY:
UPSTASH_REDIS_REST_URL:
UPSTASH_REDIS_REST_TOKEN:
SENTRY_DSN:
NEXT_PUBLIC_SENTRY_DSN:
SENTRY_DSN_INGEST:
```

---

## Seguridad — cómo pasarme credenciales

**No pegues secrets en el chat directo si el histórico se puede compartir.** Preferido:

1. **1Password shared vault** — creás vault "Barato.ar" y me compartís acceso.
2. **doppler.com** — free tier para secrets management.
3. **Segundo mejor**: pegás en el chat pero **rotás los tokens** después del launch (Resend, R2, Sentry todos permiten regenerarlas rápido).

**Nunca commiteés** `.env.local` con secrets reales. Ya está en `.gitignore`.

---

## Qué NO va a estar en el MVP inicial

Documentado desde F001-F012 pero requieren trabajo adicional:

- **Parsers Coto/Día/Jumbo/Vea/Disco** (F03 Fase 4): copiar estructura de `carrefour/`, ~150 líneas cada uno, ~1 día de trabajo. Podés lanzar solo con Carrefour + SEPA (cubre a las 7 cadenas grandes).
- **Photo scraping** (C-006): skeleton listo en `src/ingestion/photos/scraper.ts` pero no se llama nadie. Se activa con un cron adicional cuando R2 esté configurado.
- **Turnstile captcha** en /reportar: schema acepta el token, no lo verifica. Con Cloudflare Turnstile es ~30 min de trabajo.
- **NSFW moderation** en fotos de reports: F011 tiene el hook pero requiere modelo (nsfwjs o Cloudflare Images).
- **Delivery apps** (PedidosYa/Rappi): F011 los deja para post-MVP con review legal.

---

## Rollback y seguridad operativa

Si algo rompe en prod:

- **Deploy roto**: Vercel Dashboard → Deployments → deploy anterior verde → "Promote to Production" (30 seg).
- **Migration rota**: `_prisma_migrations` update + revert DDL manual. Prisma no tiene rollback automático.
- **Ingesta rota**: pausar workflow en GitHub Actions.
- **Ataque/abuso**: Cloudflare → Under Attack Mode (1 click).
- **Fuga de secret**: rotar en el servicio + actualizar Vercel/GitHub envs + redeploy.
- **Base comprometida**: Neon → Restore → Point in Time (últimas 7 días en free tier).
