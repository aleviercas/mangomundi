# Plan: Financial Intelligence Terminal

## Objetivo
Convertir la experiencia principal en un flujo **Home → Comparator** tipo Rome2Rio: entrada mínima, resultados precargados, refinamiento instantáneo y agente neutral. La primera entrega consolidará el buscador, la ruta real de resultados, divisas, tracking y captura B2B conversacional.

## 1. Home input-first
- Sustituir el hero/comparador actual por un buscador central con:
  - país de origen;
  - país de destino;
  - segmento `Individual | Business`;
  - CTA traducido “Consultar opciones”.
- Mantener el wordmark tipográfico inmutable de **mangoglobal** y diseñar la pantalla como terminal financiera oscura, con acento naranja, amplio espacio negativo y controles compactos.
- Navegar con `Link`/search params a `/compare`, preservando también el idioma activo.
- Añadir tracking no bloqueante del inicio de búsqueda en `affiliate_clicks`.

## 2. Comparator como ruta real
- Convertir `/compare` en una página SSR real en lugar del redirect actual.
- Validar y tipar search params para `origin`, `destination`, `segment`, `from`, `to` y `amount`.
- Al entrar desde Home:
  - inferir la divisa local de cada país;
  - usar un importe inicial de referencia de **1.000 unidades de la divisa origen** para poder precargar resultados aunque Home capture solo países y segmento;
  - cargar tabla y análisis automáticamente.
- Añadir “Nueva búsqueda” arriba a la izquierda para volver al Home sin conservar resultados obsoletos.
- Mantener enlaces compartibles: cualquier cambio de corredor, divisa, importe o segmento actualizará la URL.

## 3. Motor reactivo de países y divisas
- Crear una fuente única país → divisa local para los países soportados.
- Cuando origen y destino sean distintos, sugerir automáticamente ambas divisas locales y permitir refinarlas en el Comparator.
- Cuando sean el mismo país, mostrar de forma destacada ambos selectores de divisa y garantizar que no queden bloqueados en un par idéntico; el usuario podrá, por ejemplo, elegir EUR → USD.
- Aplicar refresco con debounce corto al cambiar país, divisa, importe o segmento:
  - invalidar tabla y análisis anteriores;
  - mostrar estado “Analizando resultados…”;
  - consultar sin recargar la página;
  - evitar respuestas fuera de orden mediante identificación/cancelación lógica de la búsqueda activa.

## 4. Agente IA neutral y contextual
- Consolidar el agente dentro del Comparator como conversación única del flujo, usando el contexto exacto de la tabla y el corredor activo.
- Reescribir instrucciones del agente para prohibir lenguaje de propiedad/intermediación (“nuestros proveedores”) y usar formulaciones neutrales basadas en datos de mercado.
- Reiniciar o contextualizar de forma explícita el análisis cuando cambie el corredor, divisas o segmento, evitando mezclar recomendaciones antiguas.
- Mantener markdown, estado de análisis, foco del composer y mensajes optimistas; adaptar la superficie al sistema Dark Terminal sin burbujas decorativas innecesarias.

## 5. Captura B2B conversacional
- Para `Business`, iniciar proactivamente esta secuencia dentro del chat:
  1. solicitar volumen mensual y sector;
  2. resumir las alternativas mejor posicionadas según los resultados actuales;
  3. solicitar email corporativo;
  4. mostrar un opt-in explícito para compartir la solicitud con los proveedores seleccionados;
  5. guardar solo después de confirmación afirmativa.
- Validar en servidor email, volumen, sector, corredor y consentimiento.
- Ampliar `enterprise_leads` únicamente con los campos estructurados faltantes, como `monthly_volume`, `sector` y `segment`, conservando los campos actuales y dejando `status = 'pending'` para este flujo.
- Registrar además divisas, países, idioma, timestamp de consentimiento y origen del lead.
- Eliminar del flujo principal el formulario RFQ redundante; la captura se completa íntegramente en el chat.

## 6. Automatización zero-touch
- Tras guardar el lead:
  - enviar el payload aprobado al webhook de partners ya configurado, sin bloquear la UX si falla;
  - confirmar en chat que la solicitud fue registrada y que los especialistas seleccionados podrán revisar el caso.
- Preparar el resumen de mercado estructurado para el correo automático.
- **Dependencia externa:** actualmente no hay dominio de envío configurado. La entrega por email se activará con la infraestructura de correo de Lovable cuando se configure un dominio; hasta entonces el lead y el webhook funcionarán, pero no se afirmará que el email fue enviado.

## 7. Dark Terminal y consolidación
- Migrar los tokens semánticos globales a un fondo carbón/navy, superficies elevadas oscuras, texto de alto contraste y naranja reservado para acciones primarias.
- Adaptar Header, Home, Comparator, tabla, agente, popovers y estados de carga al mismo sistema, sin colores hardcodeados en componentes.
- Mantener navegación y páginas secundarias operativas; esta fase no elimina contenido editorial fuera del flujo principal.
- Reutilizar componentes existentes de país, divisa, botón y wordmark, refactorizándolos para el nuevo tema.

## 8. I18n, tracking y calidad
- Añadir todas las nuevas claves en inglés y en los 19 archivos traducidos, incluyendo buscador, nueva búsqueda, estados reactivos, divisas del mismo país y secuencia B2B.
- Mantener todos los eventos existentes de afiliación y añadir contexto de corredor/segmento a búsquedas, cambios y conversiones B2B.
- Corregir textos hardcodeados relevantes en el flujo principal.
- Añadir pruebas E2E para:
  - Home → `/compare` con params;
  - resultados precargados;
  - “Nueva búsqueda”;
  - cambio dinámico de divisas;
  - mismo país;
  - separación Retail/Business;
  - captura B2B con consentimiento;
  - persistencia del tracking de clicks.
- Ejecutar `bun run i18n:validate` y `bun run e2e` al finalizar.

## Cambios técnicos previstos
- Rutas: Home y `/compare` con search params tipados.
- Frontend: buscador Home, Comparator reactivo y chat unificado.
- Backend: funciones de comparación y captura B2B validadas; webhook posterior al guardado.
- Base de datos: migración mínima sobre `enterprise_leads`; sin tocar otras tablas de producción.
- Traducciones: 20 idiomas conservados y validados.

## Criterios de aceptación
- Home solo pide origen, destino y segmento.
- `/compare` abre con resultados sin submit adicional y puede recargarse/compartirse sin perder estado.
- Cambios de corredor/divisa actualizan tabla y agente sin refresh.
- El agente nunca presenta proveedores como propios.
- Business completa volumen, sector, email y consentimiento dentro del chat; el lead queda guardado como `pending` y el webhook se intenta automáticamente.
- No se muestra un formulario RFQ paralelo en el flujo principal.
- Wordmark, tracking, 20 idiomas y pipeline E2E permanecen operativos.