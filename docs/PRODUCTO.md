# Producto

Qué hace Barato.ar, para quién, y con qué user stories principales.

## Propuesta de valor en 1 frase

**"El precio más bajo cerca tuyo, para el mismo producto, sin cuenta y sin
que tengas que abrir 5 apps de super."**

## Público objetivo primario

Consumidor argentino que:
- Compra habitual en super (semanal o quincenal)
- Vive en CABA o GBA
- Tiene smartphone con conexión
- Es sensible al precio (compara antes de comprar)
- Prefiere comprar en persona o mixto (super + delivery)

Ver [PLAN_NEGOCIO.md](PLAN_NEGOCIO.md) para segmentación de nichos con priorización.

## Historias de usuario principales

### US-1: Búsqueda de precio puntual

> **Como** usuario que va a hacer compras al super,
> **quiero** ver dónde está más barato el aceite Natura 900ml en mi zona,
> **para** decidir a cuál voy o pedir por delivery.

**Flujo actual**:
1. Entrar a `barato.ar` desde el navegador
2. (Primera visita) modal "Elegí tu zona" — pick "Palermo"
3. Search bar → escribir "aceite natura" → autocomplete sugiere
4. Click → llega a `/producto/aceite-natura-girasol-900ml`
5. Ve tabla comparativa con Carrefour $2.450, Día $2.290, Coto $2.510
6. Decide: click en "Ir a la tienda" o "Comprar por delivery"

**Estado**: ✅ funciona. Falta que TODAS las cadenas tengan data (hoy solo Coto).

### US-2: Alerta de precio

> **Como** usuario que consume Coca 2.25L,
> **quiero** que me avisen cuando baje de $800 en mi zona,
> **para** aprovechar la oferta sin tener que chequear todos los días.

**Flujo actual**:
1. En `/producto/coca-cola-2-25`, tocar "Crear alerta"
2. Poner email + precio umbral (ej. $800) + zona
3. Recibir email "verificá tu alerta" → click en link
4. Alert queda activa
5. Cuando el cron detecta precio bajo threshold en cualquier cadena de la zona → email con link directo

**Estado**: ✅ funciona local. En prod solo envía a `ces.esteban@gmail.com` (sandbox Resend). Post-dominio queda open.

### US-3: Explorar ofertas

> **Como** usuario que hace la lista de compras,
> **quiero** ver todas las promos activas en mi zona,
> **para** decidir qué comprar esta semana.

**Flujo actual**:
1. Entrar a `/ofertas`
2. Filtrar por vertical "Supermercado" y cadena "Coto"
3. Sortear por "Mayor descuento"
4. Scroll infinito con 24 ofertas por batch
5. Click en una card → detalle del producto

**Estado**: ✅ funciona. Falta filtrar "solo ofertas reales" (delta >= 10% vs promedio). Roadmap.

### US-4: Reportar oferta / precio

> **Como** usuario que vio un precio inusual en una sucursal,
> **quiero** reportarlo para ayudar a otros,
> **para** que Barato.ar tenga data que ninguna cadena publica.

**Flujo actual**:
1. Botón "Reportar oferta" en Nav
2. Form: producto (autocomplete), tienda (autocomplete), precio, foto opcional
3. Submit → status pending → admin revisa
4. Approved → aparece en el detalle del producto con badge "Reportado por comunidad"

**Estado**: ✅ funciona. Turnstile antispam en roadmap. Auto-approve con >10 upvotes también.

### US-5: Comprar por delivery

> **Como** usuario que quiere aprovechar la oferta sin ir físico,
> **quiero** un shortcut a la app de delivery,
> **para** completar la compra en 2 clicks.

**Flujo actual**:
1. En detalle producto, botón "Buscar en PedidosYa" o "Rappi" o "MercadoLibre"
2. Abre nueva pestaña con búsqueda pre-cargada
3. PY/Rappi: Google site search (workaround al selector de dirección)
4. ML: URL nativa directa

**Estado**: ✅ funciona. Cuando cerremos deal con PY/Rappi, cambia a URL nativa con afiliado.

## Historias secundarias (soportadas pero no destacadas)

- **US-6**: Ver mi propia zona persistida entre visitas.
- **US-7**: Compartir link de producto con amigos (URL preserva zone).
- **US-8**: Ver historial de precio de un producto (chart 90d) para saber si "esta oferta" es realmente barata.
- **US-9**: Ver alternativas de packaging (Coca 2.25L retornable vs descartable).

## Anti-historias (lo que NO queremos que hagan)

- ❌ Crear cuenta obligatoria para navegar
- ❌ Aceptar cookies de marketing
- ❌ Ser trackeado en otros sitios
- ❌ Ver "recomendados patrocinados" primero
- ❌ Pagar por comparar precios básicos

## Diferenciadores vs competencia

| Competidor | Cubre | Barato.ar diferencia por |
|---|---|---|
| PreciosClaros gov | Todos los precios SEPA | UI web decente, ranking, alertas, agregación por producto |
| Delivering (cerrado 2022) | Delivery apps | Legalmente limpio (deep links, no scraping bulk) |
| Google Shopping | Todo | Local, específico AR, sin login |
| Cada app de super | Su propia data | Comparativa cross-cadena en 1 lugar |
| MercadoLibre | E-commerce | Foco en super físico, precios de listado real |
| Menta / Cuponstar | Cupones | Precios sistemáticos, no solo promos negociadas |

## Rituals del producto

- **Semanal (miércoles)**: fresh de data SEPA + normalizer + refresh MV.
- **Cada compra semanal del usuario**: viene a chequear qué está barato.
- **Cada oferta destacada**: usuario recibe alerta si cae bajo umbral.
- **Trimestral (nosotros)**: revisar métricas → ajustar filtros / features.

## Métricas de producto que trackeamos

- **Adquisición**: sesiones/mes, source (organic, referral, direct)
- **Activación**: % que hace 1 búsqueda + % que abre 1 detalle
- **Engagement**: producto detail views / sesión, alerts creadas / sesión, delivery clicks / sesión
- **Retención**: returning visitors % semanal
- **Contribución**: reports enviados, reports aprobados

Todos vía Plausible (cookieless). Sin usuario id ni cross-site.

## Limitaciones que comunicamos honestamente

En `/sobre` y footer:

- "Precios referenciales, verificá siempre en la tienda antes de comprar"
- "Fuentes: SEPA (gobierno), folletos oficiales de cadenas, aportes de comunidad"
- "Delivery apps: solo redirigimos, no publicamos sus precios"
- "Nos financiamos con afiliados de plataformas donde comprás — no pagás de más"

## Voz y tono

- **Directo y práctico**: "Coca 2.25L en Coto Belgrano — $890" mejor que "descubrí las mejores ofertas de bebidas en tu zona"
- **Argentino informal pero no vulgar**: "elegí tu zona", "aprovechá esta oferta"
- **Transparente sobre datos**: siempre fuente + fecha. Nunca "el mejor precio garantizado"
- **Sin hype**: nada de "🔥 OFERTA IMPERDIBLE!!!" ni countdown timers
- **Empático con el consumidor**: reconocemos que hacer las compras es un chocolate
