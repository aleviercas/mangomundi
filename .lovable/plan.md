# Plan de actualización integral de mangoglobal

## Dirección aprobada
- Implementar la composición **Modern Institutional Terminal v4**: fondo Slate Mist luminoso, superficies blancas translúcidas, tipografía Sora para display, jerarquía editorial limpia y consola de búsqueda de ancho completo.
- Mantener el acento mango reservado para estados y acciones clave, sin perder la sensación de terminal financiera institucional.
- Conservar la marca tipográfica `mango` black + `global` light en Header, Hero, Comparator, About, Blog y Footer.

## 1. Home: nuevo mensaje y Big Search
- Sustituir el H1 por **“Intelligent currency exchange decisions.”** y el subtítulo por **“AI agent for global and local payments. Best rates for individuals and businesses.”**.
- Convertir Origen, Destino y Segmento en una Search Console protagonista: controles grandes, estados de foco inequívocos, separación visual clara y CTA único hacia `/compare`.
- Mantener la detección automática de divisas, la persistencia por parámetros URL y el comportamiento responsive.
- Adaptar Header, fondo global y Footer a la nueva variante clara de la terminal, conservando contraste y accesibilidad.

## 2. i18n y SEO global
- Usar las mismas claves de marca para que Hero y metadata consuman una única fuente de copy.
- Traducir el nuevo título, subtítulo, textos del buscador, About y cierre B2B en los **20 idiomas**; eliminar fallbacks ingleses de las nuevas claves.
- Actualizar `SEO_META` en los 20 idiomas con títulos de menos de 60 caracteres cuando el idioma lo permita y descripciones de menos de 160 caracteres.
- Actualizar `title`, `description`, `og:title`, `og:description`, Twitter metadata, canonical y `og:url` de las rutas públicas relevantes, manteniendo metadata específica por página.
- Retirar `/business` del sitemap y asegurar que Home, About, Compare y Blog sigan siendo indexables.

## 3. Consolidación de navegación y conversión
- Eliminar el archivo de ruta `/business` y todas sus entradas en Header, Footer, sitemap, SEO por ruta, traducciones y CTAs internos.
- Redirigir cualquier promoción de alto volumen del comparador al chat B2B dentro de la propia experiencia, nunca a otra página.
- Mantener Individual/Business como único selector de entrada y conservar el contexto completo del corredor en `/compare`.

## 4. About corporativo
- Reestructurar About en cuatro bloques esenciales: introducción, manifiesto en texto puro y sin emojis, métricas institucionales y Market Coverage.
- Mostrar: **Founded 2026**, **150+ countries covered**, **100+ currencies supported** y **50+ global providers evaluated in real time**.
- Eliminar “Our Principles”, iconografía decorativa y contenido redundante.
- Simplificar el formulario y hacerlo realmente funcional mediante una acción de servidor validada, con estados de envío, éxito y error, reutilizando la infraestructura de leads existente cuando sea compatible.

## 5. Captura B2B Zero-Touch
- Consolidar el flujo conversacional como una máquina de estados ligada al segmento Business y al corredor activo.
- Tras volumen + sector, responder con los dos proveedores mejor clasificados, pedir email corporativo y mostrar consentimiento explícito.
- Guardar solo tras confirmación: email, consentimiento, volumen mensual, sector, monedas, países/ruta, locale, segmento y estado en `enterprise_leads`.
- Mantener el webhook opcional desacoplado: un fallo del partner no debe perder el lead ni bloquear la confirmación al usuario.
- Evitar duplicados mediante una clave de solicitud estable y bloquear dobles envíos mientras la operación está en curso.
- Confirmar en chat únicamente después de que el lead quede persistido y el resumen haya sido encolado para envío.

## 6. Email real del resumen
- Configurar **Lovable Emails** y un dominio remitente de mangoglobal; actualmente no hay dominio de email configurado, por lo que esta parte requerirá una única acción de configuración de dominio al iniciar la implementación.
- Crear una plantilla de email de resumen de mercado con corredor, volumen, sector, dos mejores alternativas y referencia de solicitud.
- Encolar un email individual e idempotente después del consentimiento; si el envío no puede encolarse, conservar el lead y mostrar un cierre honesto en el chat en lugar de afirmar que el correo fue enviado.
- Mantener el email estrictamente ligado a la solicitud del usuario, sin contenido promocional masivo.

## 7. Blog y SEO técnico
- Preservar tablas, funciones y rutas del blog multilingüe, sin romper la generación automática existente.
- Mantener corredor, mercado, audiencia y locale como señales editoriales para contenido internacional.
- Mejorar la metadata dinámica del artículo para usar título, extracto, canonical, OpenGraph y tipo `article` del post real cuando esté disponible.
- Mantener las entradas publicadas en el sitemap dinámico.

## 8. Verificación
- Extender Playwright para comprobar: nuevo Hero, Big Search y navegación URL; ausencia de Business; About simplificado; cambio de idioma; flujo Business volumen → sector → email → consentimiento; guardado único y cierre correcto.
- Ejecutar `bun run i18n:check` y el script existente `bun run e2e`.
- Validar Home, About, Compare y Blog en escritorio y móvil, además de revisar errores de consola y respuestas de servidor.

## Detalles técnicos
- Frontend: TanStack Start + React, componentes de diseño existentes y tokens semánticos Tailwind v4.
- Backend interno: funciones de servidor TanStack; acceso privilegiado cargado únicamente dentro del handler.
- Persistencia: mantener `enterprise_leads` y sus reglas actuales de acceso; no se prevé una migración salvo que la idempotencia o el formulario About requieran un campo/índice que no exista.
- Email: infraestructura en cola, plantilla React Email e idempotencia por `requestId`.
- No se modificará manualmente `routeTree.gen.ts`; se regenerará desde los archivos de rutas.