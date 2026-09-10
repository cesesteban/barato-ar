# Investigación: Plataformas de Pedidos y Ofertas en Argentina

> Fecha: 2026-09-09
> Contexto: base para el diseño de una web comparadora de ofertas por zona.

---

## 1. Delivery de comida y multivertical

| Plataforma | Verticales | Cobertura | Notas |
|---|---|---|---|
| **PedidosYa** | Restaurantes, PedidosYa Market (super/kiosco 24h), Farmacias, Bebidas, Flores | Nacional, líder | Ex-Delivery Hero. App dominante en Argentina. Categoría "Ofertas del día" propia. |
| **Rappi** | Restaurantes, Rappi Turbo (10 min), RappiFarma, RappiMall, RappiPay | CABA + principales ciudades | Segundo jugador. Muy fuerte en promos con bancos/tarjetas. |
| **MercadoLibre Meals / Envíos Flex** | Comida y productos con envío en el día | CABA + GBA | Menos maduro pero creciendo, con integración a Mercado Pago. |

## 2. Supermercados online (canal propio)

| Cadena | Web/App | Fortaleza |
|---|---|---|
| **Carrefour Argentina** | carrefour.com.ar | Folleto semanal digital, Carrefour Card con descuentos, Día del Miércoles |
| **Coto Digital** | cotodigital3.com.ar | Miércoles Coto (frutas/verduras), TCI |
| **Día Argentina** | diaonline.supermercadosdia.com.ar | Precios agresivos, Club DIA con app |
| **Jumbo** | jumbo.com.ar | Cencosud, Jumbo Más, mucho combo/2x1 |
| **Vea** | vea.com.ar | Cencosud, línea económica |
| **Disco** | disco.com.ar | Cencosud, mismo motor que Jumbo |
| **Changomas / Hiper Chango** | changomas.com.ar | Walmart Argentina (ex), foco GBA |
| **La Anónima** | laanonimaonline.com | Fuerte en Patagonia/interior |
| **Josimar / Toledo / Único** | varias | Cadenas regionales |

Todos publican folletos semanales en PDF/HTML — **fuente estable para scraping ético** (folleto público).

## 3. Farmacias

| Cadena | Notas |
|---|---|
| **Farmacity** | Web propia + PedidosYa/Rappi. Promos bancos frecuentes. |
| **Dr. Ahorro / Doctor Simi** | Precios bajos, promos institucionales |
| **Farmaonline** | E-commerce agregador |
| **Vantage / Del Pueblo** | Regionales |
| **PAMI convenios** | Descuentos por obra social |

## 4. Bebidas / kioscos / 24h

- **PedidosYa Market** y **Rappi Turbo** cubren la mayoría del segmento.
- **Craft Society, Winery, TragoClub** para vinos/cervezas premium.
- **Distribuidoras directas** (Cervecería y Maltería Quilmes, CCU) con promos ocasionales B2C.

## 5. Sitios comparadores / de ofertas existentes en Argentina

| Sitio | Modelo | Debilidad |
|---|---|---|
| **Promodescuentos.com** | Crowdsourcing puro (comunidad vota) | UX vieja, mucho ruido, no compara precios reales |
| **Preciosclaros.gob.ar** | Gobierno, precios sugeridos de super | Datos desactualizados, cobertura irregular |
| **Ratoneando** | Comparador de super (histórico) | Discontinuado |
| **Ofertia** | Folletos escaneados | Sin comparación por producto, solo hojear folletos |

**Oportunidad clara**: no existe un comparador moderno, rápido y multi-vertical (super + delivery + farmacia) con historial de precios por zona. Ese es el hueco.

## 6. Bloqueadores y consideraciones legales

- **ToS de PedidosYa/Rappi** prohíben scraping automatizado. Riesgo bajo para uso personal/no comercial, pero hay que asumirlo.
- **Folletos semanales de supermercados** son públicos y no infringen ToS.
- **Precios Claros (dato abierto del gobierno)** es una fuente legal y gratuita para supermercados grandes — aunque con delay.
- **Crowdsourcing (usuarios reportan ofertas)** elimina el problema legal.
- **Programas de afiliados**: Mercado Libre, algunos supermercados (Awin, HotSale) — camino de monetización futura.

## 7. Fuentes de datos priorizadas para el MVP

| Fuente | Frescura | Legalidad | Cobertura | Prioridad MVP |
|---|---|---|---|---|
| Folletos oficiales semanales (Carrefour, Coto, Día, Jumbo, Vea, Disco) | Semanal | Alta | Alta en super | **P0** |
| API Precios Claros (SEPA) | Semanal/mensual | Alta | Media | **P0** |
| Scraping puntual de webs de super (JSON públicos) | Diaria | Media | Alta | **P1** |
| Crowdsourcing (usuarios reportan) | Real time | Alta | Baja al inicio | **P1** |
| Scraping PedidosYa/Rappi (menús y ofertas) | Diaria | Baja (riesgo ToS) | Alta | **P2** — evaluar |
