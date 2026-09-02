# Plan — workflow completo del request de business (proveedores + comisiones)

Alejandro pidió el plan primero, implementación más adelante. Esto es
**solo diseño**, no toca código. Cubre lo que falta después del mail
automático de confirmación (ya implementado esta ronda, ver el handoff
correspondiente): disparar el pedido a los proveedores, trackear sus
respuestas, confirmar al cliente, y trackear todo para poder cobrar
comisiones.

## 0. Lo que ya existe (base para todo lo demás)

- Cada request de business ya se guarda en `enterprise_leads` con un
  `request_id` único (`B2B-<timestamp36>-<random8>`), el email del
  cliente, ruta (`from_currency`/`to_currency`/`sending_country`/
  `receiving_country`), volumen, `contract_type`, `frequency`, y
  `selected_provider_slugs` (los brokers que el cliente eligió con "Add
  to request").
- Ya se dispara un mail interno (a `LEAD_NOTIFICATION_EMAIL`) con todo
  el detalle del pedido, y — desde esta ronda — un mail de confirmación
  al cliente.
- Ya existe un webhook opcional (`RFQ_WEBHOOK_URL`) que recibe el mismo
  payload por POST, pensado para automatizaciones de terceros (Zapier,
  n8n, etc.) — un punto de entrada natural para lo que sigue, si en
  algún momento se preferiere no construir el tracking adentro de este
  repo.

## 1. Lo que falta — 3 piezas separadas

### 1.1 Disparar el pedido a los proveedores elegidos

**El problema real:** no hay integración de API con ningún broker (Wise,
Currencies Direct, etc.) — el sitio los compara con datos públicos/
afiliados, nunca les mandó un pedido de cotización en vivo. Tampoco hay
una dirección de contacto comercial guardada por proveedor (`providers`
solo tiene `affiliate_url`/`website_url`, no un email de "mesa de
negocios").

**Opciones, de más simple a más automatizada:**

a) **Manual con el mail ya armado** (mínimo esfuerzo, disponible ya):
   el mail interno que llega a `LEAD_NOTIFICATION_EMAIL` ya tiene todo
   el detalle — Alejandro (o quien gestione esto) reenvía manualmente
   ese pedido a cada broker seleccionado desde su propio mail. No
   requiere código nuevo, pero no es trackeable automáticamente.

b) **Semi-automático con `business_contact_email` por proveedor**:
   agregar una columna a `providers` (ej. `business_contact_email`,
   nullable — solo se completa a mano por los brokers que realmente
   tienen un contacto comercial conocido, nunca inventado) y un
   servidor-función que, al enviarse el request, dispare un mail
   individual a cada proveedor seleccionado con el pedido. Cubre solo
   los proveedores que tengan ese dato cargado; para el resto, cae al
   flujo manual (a).

c) **Vía el webhook existente**: apuntar `RFQ_WEBHOOK_URL` a una
   automatización externa (Zapier/n8n/Make) que arme y envíe los mails a
   cada proveedor según reglas configurables ahí, sin tocar este repo
   para cada cambio de proceso. Más flexible a mediano plazo, pero
   depende de una herramienta externa.

**Recomendación:** empezar con (a) ya mismo (cero desarrollo) y avanzar
a (b) recién cuando haya un puñado de proveedores con contacto comercial
real confirmado — no tiene sentido construir el envío automático para
proveedores que de todas formas van a caer al flujo manual.

### 1.2 Trackear el estado de cada pedido (por proveedor)

Hoy `enterprise_leads` tiene UN estado (`status`) para todo el pedido,
pero un mismo request puede tener 2-3 proveedores seleccionados, cada
uno con su propio timeline (uno puede responder en un día, otro en una
semana, otro nunca). Eso necesita trackearse por separado.

**Tabla nueva propuesta — `enterprise_lead_providers`:**

| columna | tipo | notas |
|---|---|---|
| `id` | uuid, PK | |
| `lead_id` | uuid, FK → `enterprise_leads.id` | |
| `provider_slug` | text | uno de `selected_provider_slugs` |
| `status` | text | `pending_dispatch` → `dispatched` → `quoted` → `declined` → `won` (ver abajo) |
| `dispatched_at` | timestamptz, nullable | cuándo se le mandó el pedido a este proveedor |
| `quoted_at` | timestamptz, nullable | cuándo respondió con una cotización |
| `quote_summary` | text, nullable | lo que cotizó, texto libre — nunca inventado, solo lo que el proveedor realmente contestó |
| `won_at` | timestamptz, nullable | si el cliente terminó cerrando con este proveedor |
| `commission_expected` | numeric, nullable | si el acuerdo de afiliado/referido define un monto o % esperado |
| `commission_status` | text | `not_applicable` → `expected` → `invoiced` → `received` |
| `commission_received_at` | timestamptz, nullable | |
| `notes` | text, nullable | seguimiento manual |

Una fila por (`lead_id`, `provider_slug`) — se crean automáticamente al
guardar el `enterprise_leads` (mismo `selected_provider_slugs`), en
estado `pending_dispatch`.

### 1.3 Confirmar al cliente cuando el/los proveedores responden

Con la tabla de arriba, "confirmar al cliente" se vuelve una acción
puntual: cuando alguien (Alejandro, manualmente por ahora) marca una
fila como `quoted` con su `quote_summary`, se dispara un mail al cliente
(mismo `sendClientConfirmationEmail` ya armado esta ronda, reusable)
resumiendo la cotización recibida. Automatizarlo del todo (que se
dispare solo al cambiar el estado) es directo una vez que exista la
tabla — un trigger de Supabase o simplemente la función que actualiza el
estado también dispara el mail en el mismo paso.

## 2. Cómo se opera esto sin un dashboard nuevo (para arrancar)

No hace falta construir una pantalla de admin todavía. Con la tabla
`enterprise_lead_providers` ya se puede operar:

- Ver pedidos pendientes: `select * from enterprise_lead_providers where status = 'pending_dispatch'`
  desde el SQL editor de Supabase o un tool MCP.
- Marcar como cotizado: un `update` puntual con el resumen — dispara el
  mail al cliente si se conecta la función descrita en 1.3.

Un dashboard simple (lista de pedidos + estado + botón para marcar
cotizado) es la extensión natural del `/admin` que ya existe para
i18n-status (mismo patrón de página protegida) — vale la pena una vez
que el volumen de pedidos justifique no vivir en el SQL editor.

## 3. Orden sugerido de implementación (cuando se apruebe)

1. Migración: tabla `enterprise_lead_providers` + trigger/función que la
   puebla automáticamente al insertar en `enterprise_leads`.
2. Ajustar el mail interno para incluir el link/instrucciones de cómo
   marcar el estado (aunque sea "actualizá esta fila en Supabase" al
   principio).
3. Función servidor que, al marcar `quoted`, dispara el mail de
   confirmación al cliente con el resumen de la cotización.
4. (Opcional, más adelante) columna `business_contact_email` en
   `providers` + función de disparo automático a los proveedores que la
   tengan cargada.
5. (Opcional, más adelante) página de admin simple para operar sin el
   SQL editor.

## 4. Lo que este plan NO resuelve todavía

- No hay forma de saber automáticamente si un proveedor "ganó" el
  negocio sin que alguien lo marque a mano (no hay integración con la
  facturación real del broker).
- El monto de comisión esperado por proveedor no está cargado en
  ningún lado hoy — habría que conseguirlo (contratos de afiliado
  reales) antes de que `commission_expected` tenga sentido, mismo
  principio de "nunca inventar datos" que rige el resto del proyecto.
