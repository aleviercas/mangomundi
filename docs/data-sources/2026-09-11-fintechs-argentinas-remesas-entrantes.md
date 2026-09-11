# Fintechs argentinas para remesas entrantes — 2026-09-11

> Responde el pendiente "Identificar fintechs argentinas específicas para remesas
> entrantes" (pregunta abierta que necesitaba tu input). Investigué los candidatos
> obvios; el resultado no es "cargar N filas nuevas" sino un hallazgo arquitectónico
> que conviene decidir antes de cargar nada.

---

## 1. Por qué Global66 no aparece hoy

`providers.active = false` para Global66. La razón está en sus propias notas: el
corredor real (Europa→Argentina, remesa a tercero, confirmado que existe) nunca se
pudo medir en vivo porque su cotizador es 100% JS y una sesión anterior tuvo
contención de navegador. **Intenté de nuevo esta sesión** (sin contención) y sigue
sin poder leerse — la calculadora devuelve `0 ARS` como placeholder hasta que el
usuario interactúa con ella en un browser real, no accesible vía fetch estático.

Tampoco aparece en Monito para este corredor (revisé Alemania→Argentina y
España→Argentina): Monito simplemente no lo indexa ahí, aunque sí indexa a Global66
para otros corredores del proyecto (Chile, Perú, México, Colombia, y los 3 de salida
desde Argentina ya cargados).

Encontré un número publicado (`remesas.com`, blog de terceros): "Argentina: comisión
$0 ARS, markup ~1.02%". **No lo cargué** — el mismo 1.02% aparece repetido palabra por
palabra para Argentina, EEUU, Reino Unido y Canadá en la misma tabla, lo que huele a
contenido genérico/boilerplate, no a una medición real por corredor. No pasa el
estándar de fuente que usa el resto del proyecto.

**Conclusión**: Global66 sigue inactivo, correctamente, hasta conseguir una medición
en vivo real (necesita un browser interactivo, no solo fetch de HTML — la próxima
sesión con esa capacidad debería poder resolverlo en un intento).

## 2. El hallazgo real: Belo y Lemon no son remesadoras tradicionales

Investigué los candidatos obvios de fintechs argentinas para recibir dinero del
exterior — **Belo** y **Lemon Cash** aparecen una y otra vez en búsquedas y reviews.
Ambas tienen el mismo problema estructural, confirmado con fuentes oficiales de cada
una:

- **Belo** (`belo.app/blog/como-recibir-dinero-del-exterior-en-argentina`, fuente
  propia): el dinero recibido del exterior se acredita como **USDC (dólar digital),
  no como ARS**. Cita textual: *"no estás obligado a convertirlos a pesos... podés
  usarlos directamente para pagar, ahorrar o enviar a otros contactos sin pasar por
  una conversión forzada"*. No hay una "tasa de cambio aplicada al llegar" — el
  usuario decide cuándo (y si) convertir a pesos, en un paso separado.
- **Lemon** (`help.lemon.me`, `lemon.me/blog/cuenta-dolares`, `.../cuenta-euros`,
  fuentes propias): mismo patrón — dólares/euros del exterior se acreditan como USDC.
  Comisión de la transferencia SÍ está publicada y es concreta: **1.5% + USD 12
  fijos, depósito mínimo USD 100** (dólares); mismo 1.5% para la cuenta de euros.

### Por qué esto no encaja en `fx_rates` tal como está

El esquema actual modela "proveedor cobra fee + aplica una tasa de cambio origen→destino
al momento del envío" — un solo número de margen por corredor. Belo y Lemon son
distintos: **la conversión de moneda es un paso separado y opcional**, que el usuario
controla. Cargar solo el fee de entrada (1.5%+$12 para Lemon, por ejemplo) como si
fuera el "spread" total estaría incompleto — falta el costo real de la conversión
USDC→ARS cuando el usuario finalmente la hace, que tiene su propio spread (no
investigado todavía) y que además varía según cuándo decida convertir.

Encontré además una mención suelta (La Nación, hace 1 semana) de una "nueva
alternativa" de Lemon donde traer 2.000 USD "puede terminar en más de 2.030 USD" —
sugiere una promoción de rendimiento o algo relacionado a la brecha CCL/blue, pero no
alcancé a confirmar el mecanismo exacto ni una fuente primaria — no cargado, queda
como pista para la próxima ronda.

### Ualá — no es un proveedor de precio propio en este caso

Ualá tiene una alianza con Western Union (desde 2023) para recibir remesas
directamente en la app. Esto significa que el precio que aplica **es el de Western
Union**, ya cargado en el proyecto — Ualá es un canal/destino, no una fuente de
margen distinta. No hace falta una fila separada.

## 3. Decisión que te toca a vos

Antes de investigar más a fondo el lado USDC→ARS de Belo/Lemon, conviene decidir:

- **Opción A** — Extender el modelo de datos para representar productos "recibís en
  USDC, convertís cuando quieras" como una categoría propia (con su propio fee de
  entrada + nota de que la conversión final es responsabilidad/timing del usuario),
  en vez de forzarlos al modelo de spread único.
- **Opción B** — Investigar y cargar el costo *efectivo* end-to-end (fee de entrada +
  spread de conversión USDC→ARS medido en un momento dado), documentando que es una
  instantánea, no un número estable como el resto de los proveedores.
- **Opción C** — Dejarlos fuera del comparador por ahora (documentados acá para
  referencia), ya que estructuralmente son un producto distinto (cuenta cripto
  multi-moneda) más que una remesadora — podría no ser lo que un usuario busca al
  comparar "remesas".

No tomé esta decisión por vos porque cambia qué tipo de producto compara la app, no
es solo un dato de tarifa.

---

## 4. Estado de esta sesión

No se cargó ningún dato nuevo a Supabase en esta ronda — toda la investigación
resultó en hallazgos que necesitan una decisión de producto (Sección 3) o una
capacidad de browsing interactivo que esta sesión no tiene (Sección 1, Global66)
antes de poder cargar algo con confianza.
