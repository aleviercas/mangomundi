
# Refactor masivo: identidad "mangoglobal" + agentes + Coming Soon

## 1. Favicons y webmanifest
- Copiar los 6 assets subidos a `public/`: `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`, `android-chrome-192x192.png`, `android-chrome-512x512.png`.
- Crear `public/site.webmanifest` con el JSON indicado (name/short_name = "mangoglobal").
- En `src/routes/__root.tsx`, reemplazar los `links` actuales (incluido el `favicon.svg`) por el set nuevo: `.ico`, `16x16`, `32x32`, `apple-touch-icon` (180), `manifest`. Añadir `meta theme-color = #ffffff`.
- Mantener los `<link>` de Google Fonts intactos (Lightning CSS no permite @import remoto).

## 2. Wordmark "mangoglobal" (negro + grosor)
- Reescribir `src/components/Wordmark.tsx`:
  - Render: `<span class="lowercase tracking-tight"><span class="font-black text-slate-950">mango</span><span class="font-light text-slate-950">global</span></span>`.
  - Sin amber. Solo grosor diferenciado.
- Actualizar textos "MangoGlobal" / "Mango" en:
  - `Footer.tsx` copyright → "mangoglobal".
  - `__root.tsx` meta tags (title/og/twitter) → "mangoglobal — The Global FX Decision Engine".
  - `routes/index.tsx` head meta.
  - Cualquier string visible "MangoGlobal" / "Mango Global" en secciones (rg para verificar y reemplazar consistente).

## 3. Grilla técnica de fondo global
- En `RootComponent` (root.tsx), insertar antes del contenido el wrapper fijo:
  ```
  <div aria-hidden class="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#F8FAFC]">
    <div class="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#0F172A_1px,transparent_1px),linear-gradient(to_bottom,#0F172A_1px,transparent_1px)] bg-[size:4rem_4rem]" />
    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-amber-200/20 to-transparent blur-[120px]" />
  </div>
  ```
- Cambiar el wrapper principal a `bg-transparent` y añadir `z-10` al contenido para que la grilla quede de fondo.
- Eliminar/aliviar el grid local duplicado en `HeroSection.tsx` (queda el global).

## 4. Estructura del Hero principal
- Reescribir la columna izquierda del `HeroSection.tsx` con el bloque solicitado:
  - Badge negra píldora "⚡ Agentic AI for Global FX | **mango**`global`" (mango font-black blanca, global font-light slate-300).
  - H1 `text-slate-950 font-extrabold tracking-tight`: "The Global FX Decision Engine".
  - Párrafo `text-slate-500` con destacado `text-slate-950 font-semibold` en "one optimal decision".
- Mantener la columna derecha (widget comparador) y el form de rate alerts existentes.
- Mantener `t()` keys donde corresponda; los nuevos strings del badge/H1/párrafo van como copy fijo (instrucción explícita del bloque).

## 5. Backend agéntico + leads

### 5a. Migración Supabase
Nuevas tablas (con GRANTs y RLS):
- `fx_rates` — `id`, `from_currency text`, `to_currency text`, `rate numeric`, `fee numeric default 0`, `provider_slug text`, `updated_at timestamptz default now()`. Lectura pública (`anon, authenticated`).
- `chat_conversations` — `id uuid pk`, `session_id text` (anon), `user_id uuid null`, `created_at`. Insert público; select por `session_id` o admin.
- `chat_messages` — `id uuid pk`, `conversation_id uuid fk`, `role text check (user|assistant)`, `content text`, `created_at`. Insert/select por conversación propia (match `session_id`) o admin.
- `enterprise_leads` — `id`, `email text not null`, `feature_source text`, `status text default 'beta_pending'`, `created_at`. Insert público; select solo admin.

Seed mínimo de `fx_rates` (GBP→ARS, USD→ARS, EUR→USD, USD→MXN) para que el agente devuelva cálculos reales.

### 5b. Server functions (`src/lib/agent.functions.ts`)
- `chatTurn({ sessionId, message })`:
  1. Detectar patrón con RegExp: `/(\d+(?:\.\d+)?)\s*([A-Z]{3})\s*(?:to|→|->)\s*([A-Z]{3})/i`.
  2. Si match: leer `fx_rates` para todos los providers del par, calcular `(amount * rate) - fee`, ordenar desc, devolver respuesta markdown con top 3.
  3. Si no match: fallback a Lovable AI (`google/gemini-3-flash-preview`) vía gateway con system prompt FX-neutral. Usar `LOVABLE_API_KEY`.
  4. Persistir user message + assistant reply en `chat_messages` (crear conversation si no existe).
- `captureEnterpriseLead({ email, featureSource })`: validar email con zod, insertar en `enterprise_leads` con `status='beta_pending'`. Devolver `{ ok: true }`.

### 5c. UI Chat
- Nuevo componente `src/components/ChatWidget.tsx`: floating button (esquina inferior derecha) que abre un panel con historial + input. Usa `sessionId` persistido en `localStorage`. Renderiza markdown (instalar `react-markdown` si no está).
- Montar `<ChatWidget />` en `RootComponent` (debajo de `<Footer />`).

## 6. Modal "Coming Soon" (Enterprise Beta)
- Nuevo componente `src/components/ComingSoonModal.tsx` (Radix Dialog ya disponible vía shadcn `ui/dialog`):
  - Props: `open`, `onOpenChange`, `source` (string).
  - Input email + botón "Solicitar acceso prioritario".
  - On submit: llama `captureEnterpriseLead({ email, featureSource: source })`, muestra "Estamos desplegando esta automatización en fase beta cerrada. Te hemos asignado acceso prioritario."
- Context provider `ComingSoonProvider` con hook `useComingSoon()` que expone `open(source)`.
- Envolver en `RootComponent`.
- Interceptar clics: añadir `data-coming-soon="<source>"` a botones marcados como Enterprise Beta / Coming Soon en `FeaturesSection`, `AISection`, `business.tsx`, `insurance.tsx`. Un listener global (delegación en el provider) abre el modal con el source correspondiente. Alternativa: helper `<ComingSoonButton source="...">` para reemplazos puntuales. Usaré la variante de helper para los CTAs evidentes y delegación global para residuales.

## 7. QA
- Verificar build TS pasa (auto).
- Verificar que el `<link rel="icon">` antiguo a `/favicon.svg` queda removido (no romper si el archivo sigue ahí).
- Smoke: cargar `/`, verificar wordmark "mangoglobal", grid técnico visible sutil, chat abre, modal Coming Soon captura lead.

## Detalles técnicos clave
- Lovable AI vía gateway (no exponer key al cliente): la server fn `chatTurn` hace `fetch('https://ai.gateway.lovable.dev/v1/chat/completions', ...)` con `process.env.LOVABLE_API_KEY`.
- RLS chat: para permitir lectura anónima del propio historial sin auth, las policies se basan en `session_id` pasado en el filtro y se ejecutan vía server fn con `supabaseAdmin` (bypass RLS) — más seguro que abrir SELECT a `anon` globalmente. Insert también vía server fn.
- Sin Edge Functions; todo en `createServerFn`.
- No tocar `client.ts`, `client.server.ts`, `types.ts`, `.env`.
