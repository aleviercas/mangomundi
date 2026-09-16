-- 2026-09-16: implementa la Seccion 1 del plan de implementacion
-- (2026-09-15-plan-implementacion-badge-ars-cripto.md). El badge ya esta
-- construido en codigo (ComparatorSection.tsx ~5669: "Promo: {promo_text}",
-- prefijo t("comparator.badge.promoPrefix")="Promo:") y el ranking ya usa
-- la tasa regular (fx.functions.ts linea ~958: sort por `received`, que se
-- calcula de spread/fee regulares, nunca de una promo) -- solo faltaba el
-- dato.
--
-- LIMITACION CONOCIDA: `providers.promo_text` es un campo de texto simple,
-- sin variante por idioma (a diferencia del resto de la copy del sitio,
-- que pasa por t() con claves en 3+ idiomas) -- se carga en espanol,
-- idioma principal del proyecto. Si en algun momento se quiere que
-- respete el idioma activo del usuario, hace falta una columna JSONB
-- por-locale o una tabla de traduccion separada -- fuera de alcance de
-- esta carga de datos.
--
-- Los tres textos son genericos a nivel proveedor (no dependen del
-- corredor especifico), consistente con que el campo vive en `providers`
-- y no en `fx_rates` -- confirmado en la investigacion de cada caso:
-- Remitly (fee $0 + tasa igual/mejor que mid-market en el primer envio,
-- tope USD 1.000, confirmado en 4+ corredores distintos); MoneyGram
-- (badge "primera transferencia online: tasa preferencial", visto en
-- ES->MA y ES->AR); Dahabshiil (fee 0 en la primera transferencia vs.
-- EUR 1.99 regular, DE->BG).
update public.providers set promo_text = 'Primera transferencia (hasta USD 1.000): sin comisión' where slug = 'remitly';
update public.providers set promo_text = 'Tasa preferencial en tu primera transferencia online' where slug = 'moneygram';
update public.providers set promo_text = 'Primera transferencia: sin comisión' where slug = 'dahabshiil';
