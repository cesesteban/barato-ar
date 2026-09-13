# Objetivo

## Misión

Que cualquier persona en CABA/GBA sepa en 3 clicks dónde está más barato el mismo
producto — sin tener que crear una cuenta, sin ser trackeada entre sitios, y con
precios auditables (fuente + timestamp visibles).

## Visión

Barato.ar aspira a convertirse en el comparador de referencia de precios de
consumo diario en Argentina. Empezamos con supermercados en AMBA y expandimos
a delivery, farmacias y otras verticales cuando la data lo permita.

## Criterio de éxito del MVP

**Un usuario tiene que poder, sin fricción, hacer esto en <30 segundos:**

1. Entrar a la home
2. Buscar "Coca 2.25" (o cualquier producto que consume)
3. Ver dónde está más barato en su zona
4. (Opcional) crear una alerta por email cuando baje de $X

**No requerido para MVP** — se difieren para post-launch:
- Cuenta de usuario propia (todo funciona sin login)
- Datos de delivery en tiempo real (se usan deep-links a PY/Rappi/ML)
- Cobertura fuera de CABA/GBA
- App mobile (progresivo con PWA si la demanda lo justifica)

## Principios no negociables

Están formalizados en [`../.specify/memory/constitution.md`](../.specify/memory/constitution.md):

1. **Testability first** — cada feature con tests unitarios/integración antes de deploy
2. **Simplicity** — sin abstracción prematura; no features que "podrían servir"
3. **Data honesty** — nunca inventar precios; fuente + timestamp visibles
4. **Performance** — LCP < 2.5s p75 mobile 4G
5. **Privacy by design** — sin cuentas obligatorias, sin tracking cross-site,
   ip hasheada con salt diario, analytics cookieless

## Por qué existe Barato.ar

- Los precios de supermercado en Argentina varían >30% entre cadenas para el mismo
  producto y esa asimetría de información penaliza al consumidor.
- El Estado publica el dataset SEPA (Precios Claros) pero su UI es difícil de
  usar, incompleta y no ranking-oriented — la data está pero no es útil.
- Los comparadores previos (Delivering, Mostruos) o cerraron o pivotaron —
  hay lugar para una propuesta simple, honesta y bien ejecutada.
- Delivery apps (PedidosYa, Rappi) no publican precios crudos y monetizar a
  través de ellas requiere volumen previo — llegar primero es la ventaja.

## No-goals explícitos

- No competimos con las apps de delivery en sí — las complementamos con deep-links
- No somos un market place — no vendemos productos, solo mostramos precios
- No damos consejos financieros ni "cupones inventados"
- No hacemos price prediction — solo mostramos datos reales
