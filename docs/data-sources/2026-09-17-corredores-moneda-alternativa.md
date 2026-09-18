# Corredores en moneda alternativa — research por prioridad — 2026-09-17

> Sigue a la verificación de `currencyOverridden` del mismo día. Prioriza qué
> corredores investigar en una moneda distinta a la estándar del país, empezando
> por el caso de mayor probabilidad de uso real.

---

## 1. Metodología de priorización

Crucé la cobertura ya cargada por país+moneda (`fx_rates`) contra qué tan probable
es que un usuario real elija una moneda distinta a la estándar de su país. El
caso #1, por lejos: **Argentina enviando en USD en vez de ARS** — no es un
capricho hipotético, es la cultura financiera argentina real (dolarización,
ahorro en dólares, el propio research de esta semana giró en gran parte
alrededor de esto). Argentina ya tenía 25 filas/5 proveedores, **todas en ARS,
cero en USD**.

## 2. Argentina→exterior en USD — confirmado que el producto existe, con una fuente primaria clara

`prexcard.com.ar/transferencias-internacionales` (fuente propia de Prex, sin
ambigüedad):

> *"Podés enviar plata utilizando tu saldo en pesos o dólares. La persona
> recibirá siempre el envío en la moneda local."* — *"Enviá dólares por solo USD
> 2,99. En pesos, es gratis."*

Confirmado: **fee USD 2,99 si el saldo está en dólares, USD 0 si está en pesos**
— mismo proveedor, mismos corredores, la única diferencia documentada es el fee
de entrada según la moneda de origen del saldo.

### Lo que NO cargué, y por qué

La calculadora de Prex es 100% JS (mismo problema que tuvimos con Global66) — no
pude medir la tasa de conversión exacta para un envío fondeado en USD. Podría
haber derivado un número combinando la tasa ARS ya cargada + un tipo de cambio
USD/ARS de referencia, pero eso apila dos inferencias sobre una medición que
nunca se hizo en vivo — exactamente el tipo de número que esta semana entera
evitamos inventar (Prex Venezuela, Cuba, etc.). **No cargué ninguna fila nueva.**

Lo que sí es sólido y cargable sin inferencias: el **fee** ($2,99 vs. $0) — es un
hecho documentado en la fuente primaria, no una derivación.

## 3. Recomendación concreta

- **Actualizar `providers.notes` de Prex** para que el fee diferencial por moneda
  quede explícito y fácil de encontrar (ya estaba parcialmente documentado en la
  nota general del proveedor desde la migración AG6, pero no como un hecho
  destacado).
- **Próxima ronda, con capacidad de browser real o capturas del usuario** (mismo
  método que resolvió Global66): medir la tasa de conversión real para al menos
  un corredor de referencia (ej. AR→ES en USD) y recién ahí cargar las filas
  completas.

## 4. Próximo en la lista de prioridad (no investigado todavía esta ronda)

- **Zona euro enviando en USD/GBP** (España, Alemania, Italia, Francia — las
  cuatro ya tienen buena cobertura en EUR, 22-43 filas cada una) — corredor
  plausible para expats/cuentas multi-moneda tipo Wise/Revolut.
- **Reino Unido enviando en EUR** (comunidad europea residente en UK).

---

## 5. Estado de esta sesión

No se cargó ningún dato nuevo a `fx_rates` — el hallazgo real (el fee
diferencial de Prex) es sólido y confirmado, pero cargar una fila completa
necesita la tasa de conversión, que sigue sin medirse en vivo.
