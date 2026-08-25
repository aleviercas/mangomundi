# Mangomundi — Global66: ¿opera corredores HACIA Argentina? (España/EE.UU. → Argentina)

**Fecha:** 25 agosto 2026
**Motivo:** el dato cargado (agosto 2025) de Global66 no cubre ningún corredor con Argentina como país RECEPTOR — solo AR→CO (emisor). Se pidió confirmar con fuente primaria si Global66 opera España→Argentina o EE.UU.→Argentina como remesa real (no solo wallet propia), y verificar los 4 datos viejos (ES→CO 0.33%, CL→PE 0.5%, AR→CO 1%, MX→CO 0.8%).

**Metodología y limitación importante:** fuente primaria únicamente (global66.com, ayuda.global66.com), sin agregadores. **No se pudo obtener una cifra numérica en vivo del cotizador** (tasa/fee exactos para 500 EUR) porque la extensión de Chrome de este entorno está compartida entre varios agentes corriendo en simultáneo en este momento — cada intento de abrir el cotizador terminó navegando a pestañas de otros proveedores (wise.com, westernunion.com) por contención de recursos, el mismo incidente ya documentado en `research-tarifas-escalonadas-13-proveedores.md` para el 24 de agosto. En vez de inventar un número, este documento se apoya en fetch estático (HTML) de las páginas oficiales, que confirma texto, existencia de corredor y modelo de costos, pero no la cifra puntual del día.

---

## Resumen de respuestas

| Pregunta | Respuesta |
|---|---|
| 1. ¿Corredor España/Europa→Argentina real (a tercero)? | **Sí**, confirmado por fuente primaria — ver sección 1 |
| 1b. ¿Corredor EE.UU.→Argentina? | **No encontrado / no operativo como remesa dedicada** — ver sección 1 |
| 2. Fee + spread para 500 EUR hoy | **No verificable hoy** (cotizador 100% dinámico, no accesible en vivo por contención del navegador) — ver sección 2 |
| 3. ¿Tabla de tramos? | **No hay tabla pública.** Global66 confirma por escrito que el spread cambiario "disminuye a medida que el monto aumenta" — es dinámico y mejora con volumen, no plano ni tabulado — ver sección 2 |
| 4. Corredores viejos (ES-CO 0.33%, CL-PE 0.5%, AR-CO 1%, MX-CO 0.8%) | Las 4 páginas de corredor siguen **activas y existen hoy**, pero los % puntuales **no se pudieron re-verificar** con el cotizador en vivo (misma limitación de sección 2) — ver sección 4 |

---

## 1. ¿Opera Global66 el envío HACIA Argentina, y es remesa real o solo wallet propia?

**Conclusión: es remesa real a un tercero, no solo movimiento entre cuentas propias — al menos para el corredor Europa→Argentina.**

Evidencia (todo fuente primaria, 25 ago 2026):

- **Página dedicada con calculador:** [global66.com/enviar-dinero/EUR/ARS/](https://www.global66.com/enviar-dinero/EUR/ARS/) — H1 confirmado: *"Envía dinero de Europa a Argentina"*, con el texto *"Enviar Euros (EUR) a Argentina con el mejor precio"* y un widget "Vos enviás [monto EUR] / Tu contacto recibe [monto ARS]". El lenguaje "tu contacto recibe" indica destinatario tercero, no autoenvío.
- **Flujo de destinatario externo confirmado en el Centro de Ayuda:** [ayuda.global66.com — Agrega tu Destinatario](https://ayuda.global66.com/docs/primeros-pasos/agrega-tu-destinatario/) describe dos caminos: agregar un usuario Global66 existente, **o** un destinatario externo con cuenta bancaria (vía "Enviar → transferencia Nacional o Internacional"), es decir soporta pagar a la cuenta bancaria de alguien que no tiene Global66.
- **Argentina no está restringida:** [ayuda.global66.com — Países restringidos](https://ayuda.global66.com/docs/informacion-importante/paises-restringidos-para-envio-y-recepcion-de-dinero/) (última actualización **4 de agosto de 2026**, muy reciente) no incluye a Argentina en ninguna de sus 3 listas (SWIFT restringido, pagos USD restringidos, transferencias de cuentas de empresa restringidas).
- **Argentina es país de "acceso completo":** Global66 opera con todos los beneficios (incluida recepción de transferencias internacionales) en 6 países: Chile, Colombia, Perú, **Argentina**, México y Ecuador — fuente: [ayuda.global66.com — ¿En qué países puedo tener Cuenta Global?](https://ayuda.global66.com/docs/cuenta-global-personas/en-que-paises-puedo-tener-cuenta-global/)

**Matiz importante — coexisten dos productos distintos, y esto probablemente es la fuente de la confusión con el modelo "wallet":**
1. **"Enviar dinero" (remesa C2C):** origen EUR → destino ARS directo a la cuenta/contacto de un tercero en Argentina. Este es el corredor que responde la pregunta del comparador.
2. **"Cuenta Global" (wallet propia):** a los usuarios argentinos Global66 les da un número de ruta (routing) en EE.UU. y un IBAN europeo **a su propio nombre**, para que ellos mismos cobren de clientes/plataformas del exterior en USD/EUR sin convertir a ARS automáticamente — fuente: [ayuda.global66.com — ¿Cómo recibir dólares y euros en mi Cuenta Global?](https://ayuda.global66.com/docs/primeros-pasos/recibe-dinero-directamente-a-tu-cuenta-en-usd-eur-y-gbp-con-global66/). Este SÍ es el modelo "billetera multi-moneda del mismo usuario" que se sospechaba — pero es un producto aparte del flujo de remesas, no el único.

**EE.UU. → Argentina:** no encontré página de corredor dedicada. Los intentos de acceder a `global66.com/enviar-dinero/USD/ARS/` y `global66.com/remesas/USD/ARS/` devolvieron 404 o un fallback a la página genérica (con Chile como origen por defecto) — a diferencia de `EUR/ARS/` que sí carga con contenido específico. Esto sugiere que **Global66 no comercializa activamente el corredor EE.UU.→Argentina como remesa**, aunque no puedo descartar al 100% que un usuario en EE.UU. logre enviar igual vía el flujo genérico sin una landing dedicada — no encontré evidencia de que esté soportado como corredor de remesa real, así que lo reporto como "no confirmado / no operativo" en vez de negarlo de forma tajante.

---

## 2. Fee + spread real para 500 EUR (o 500 USD) — hoy

**No pude verificarlo con un número concreto.** Global66 usa cotizador 100% dinámico vía JavaScript (igual que Wise, Remitly, WorldRemit, etc. — el mismo patrón que ya se documentó para los otros 13 proveedores en `research-tarifas-escalonadas-13-proveedores.md`). El fetch estático del HTML no ejecuta ese JS, así que la página siempre devuelve "1 EUR = 0 ARS" en el snapshot inicial.

Intenté 3 veces con la extensión de Chrome (browser automation) para leer el cotizador en vivo con 500 EUR. Las 3 veces, la pestaña terminó mostrando contenido de **otro** proveedor (mercadopago.com.ar, wise.com/gb/send-money con GBP→ARS, westernunion.com/gb con GBP→ARS) — evidencia de que ahora mismo hay otros agentes corriendo en paralelo sobre la misma extensión de navegador compartida, contaminando las pestañas (mismo incidente que ya está documentado en el research de proveedores del 24 de agosto). No arriesgué inventar un número.

**Lo que sí se pudo confirmar por escrito, fuente primaria** ([blog Global66 — "Lo que otros no te cuentan sobre los costos"](https://www.global66.com/blog/lo-que-otros-no-te-dicen-sobre-los-costos/), publicado 16 ago 2023): el costo total tiene 3 componentes —
1. **Costo de tipo de cambio**: "un porcentaje del monto a convertir **que disminuye en la medida en que el volumen del envío aumenta**" (o sea, sí es escalonado por monto, aunque no publican la tabla).
2. **Costo de carga de cuenta**: varía por método de pago; gratis por canales propios de Global66.
3. **Costo de retiro/pago**: fijo y/o variable, para cubrir la transferencia bancaria en el país receptor.

No publican ningún porcentaje ni monto fijo en esa página — lo remiten al "detalle completo" que solo aparece en el cotizador logueado/en vivo.

**Recomendación:** re-muestrear en vivo (500 EUR → ARS) cuando la extensión de Chrome no esté en contención con otros agentes — idealmente en una sesión donde ningún otro proceso esté usando el navegador compartido, como ya se resolvió para el resto del research el 25 de agosto.

---

## 3. ¿Tabla de tramos por monto?

**No, no hay tabla pública** de fee/spread por tramo (ni PDF, ni página de tarifas fija) para los corredores internacionales de remesa. Esto es consistente con el resto de la industria (solo BDO Remit, entre los 14 proveedores investigados previamente, publica una tabla fija completa). Global66 sí confirma por escrito que el margen cambiario mejora con el volumen (ver sección 2), pero sin tabla concreta.

Nota aparte: existe un **"Tarifario SEDPE"** de Global66 para Perú (PDF en `bases.global66.com`, bloqueado por robots.txt para fetch automático, visible vía Scribd de terceros) — es un documento regulatorio específico de la licencia peruana (SEDPE), no necesariamente aplicable al corredor Europa→Argentina. No se usó como fuente por ser de un país distinto y no accesible directamente.

---

## 4. Verificación de los 4 corredores viejos (dato de agosto 2025)

| Corredor | ¿Página activa hoy? | H1 confirmado | % viejo (ago 2025) | ¿Re-verificado hoy? |
|---|---|---|---|---|
| España→Colombia (EUR→COP) | Sí — [enviar-dinero/EUR/COP/](https://www.global66.com/enviar-dinero/EUR/COP/) | "Envía dinero de Europa a Colombia" (implícito, misma familia de páginas) | 0.33% | No — cotizador dinámico no accesible hoy (sección 2) |
| Chile→Perú (CLP→PEN) | Sí — [enviar-dinero/CLP/PEN/](https://www.global66.com/enviar-dinero/CLP/PEN/) | "Envía dinero de Chile a Perú" | 0.5% | No |
| Argentina→Colombia (ARS→COP) | Sí — [enviar-dinero/ARS/COP/](https://www.global66.com/enviar-dinero/ARS/COP/) | "Envía dinero de Argentina a Colombia" | 1% | No |
| México→Colombia (MXN→COP) | Sí — [enviar-dinero/MXN/COP/](https://www.global66.com/enviar-dinero/MXN/COP/) | "Envía dinero de México a Colombia" | 0.8% | No |

Los 4 corredores **siguen existiendo como página de producto activa hoy** (25 ago 2026) — Global66 no discontinuó ninguno. Pero como el pricing es 100% dinámico (sección 2/3), no hay forma de confirmar con fuente primaria estática si el 0.33%/0.5%/1%/0.8% original sigue vigente exactamente, subió o bajó — esos números casi seguro vinieron de un muestreo en vivo del cotizador en su momento (no de una tabla publicada), y ese tipo de dato puede cambiar sin aviso, igual que se documentó para Western Union/MoneyGram/etc. **No los marco como "vigentes" ni como "vencidos" — quedan como no verificables hoy con las herramientas disponibles en esta sesión.**

---

## Tabla resumen pedida

| Corredor | Fee | Spread | Fuente (URL) | Fecha de verificación |
|---|---|---|---|---|
| Europa (incl. España, EUR) → Argentina (ARS) | No verificable hoy (cotizador dinámico inaccesible) | No verificable hoy | https://www.global66.com/enviar-dinero/EUR/ARS/ | 25 ago 2026 |
| EE.UU. (USD) → Argentina (ARS) | Corredor no encontrado / no operativo como remesa dedicada | — | https://www.global66.com/enviar-dinero/USD/ARS/ (404/fallback) | 25 ago 2026 |
| España (EUR) → Colombia (COP) | No re-verificable hoy (dato viejo: 0.33%, ago 2025) | No re-verificable hoy | https://www.global66.com/enviar-dinero/EUR/COP/ | 25 ago 2026 |
| Chile (CLP) → Perú (PEN) | No re-verificable hoy (dato viejo: 0.5%, ago 2025) | No re-verificable hoy | https://www.global66.com/enviar-dinero/CLP/PEN/ | 25 ago 2026 |
| Argentina (ARS) → Colombia (COP) | No re-verificable hoy (dato viejo: 1%, ago 2025) | No re-verificable hoy | https://www.global66.com/enviar-dinero/ARS/COP/ | 25 ago 2026 |
| México (MXN) → Colombia (COP) | No re-verificable hoy (dato viejo: 0.8%, ago 2025) | No re-verificable hoy | https://www.global66.com/enviar-dinero/MXN/COP/ | 25 ago 2026 |

---

## Próximo paso sugerido

Repetir el muestreo en vivo (cotizador, 500 EUR→ARS y los 4 corredores viejos) en un momento donde la extensión de Chrome no esté compartida con otros agentes corriendo en simultáneo — el mismo ajuste operativo ("un agente por vez") que resolvió el incidente equivalente el 24-25 de agosto para los otros 13 proveedores. Si se aprueba, lo hago apenas se pueda confirmar que no hay contención.

## Fuentes primarias consultadas

- https://www.global66.com/enviar-dinero/EUR/ARS/
- https://www.global66.com/enviar-dinero/USD/ARS/ (404/fallback)
- https://www.global66.com/enviar-dinero/EUR/COP/
- https://www.global66.com/enviar-dinero/CLP/PEN/
- https://www.global66.com/enviar-dinero/ARS/COP/
- https://www.global66.com/enviar-dinero/MXN/COP/
- https://ayuda.global66.com/docs/cuenta-global-personas/en-que-paises-puedo-tener-cuenta-global/
- https://ayuda.global66.com/docs/primeros-pasos/recibe-dinero-directamente-a-tu-cuenta-en-usd-eur-y-gbp-con-global66/
- https://ayuda.global66.com/docs/primeros-pasos/agrega-tu-destinatario/
- https://ayuda.global66.com/docs/informacion-importante/paises-restringidos-para-envio-y-recepcion-de-dinero/
- https://ayuda.global66.com/docs/transferencias/envia-dinero-desde-argentina/
- https://www.global66.com/ar/cuenta-global/
- https://www.global66.com/blog/lo-que-otros-no-te-dicen-sobre-los-costos/ (16 ago 2023)
