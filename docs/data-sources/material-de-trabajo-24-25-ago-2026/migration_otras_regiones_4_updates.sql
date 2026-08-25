-- Re-verificacion de corredores sin_confirmar (25 ago 2026, tanda 4).
-- Se probaron enfoques distintos a los que fallaron en la tanda anterior
-- (montos mas altos, lectura de T&C de promos, comparacion de metodos de
-- entrega). Resultado: 2 de 5 pasan a confirmado_activo (con correccion de
-- dato en un caso), 3 siguen sin_confirmar por motivos estructurales del
-- sitio (no por falta de intento) -- ver docs/data-sources/2026-08-25b-...md.

-- Ria GB->PH: el fee 0 GBP NO era condicion estandar -- se confirmo que es
-- promocional de bienvenida sin limite de monto (T&C riamoneytransfer.com/en-gb/promo/,
-- fee 0 persistio incluso a 2000 GBP). El fee regular real, tachado junto al
-- promocional, es 1.99 GBP. La tasa (84.030918) si se confirmo regular
-- (identica a 500 y 2000 GBP). Se corrige el dato cargado.
update fx_rates
set fee = 1.99,
    verified_status = 'confirmado_activo',
    data_source = 'riamoneytransfer.com/en-gb/send-money-to-philippines, 500 y 2000 GBP (fee 0 persistio a ambos montos, confirmando via T&C en riamoneytransfer.com/en-gb/promo/ que es promo de bienvenida SIN limite de monto, no condicion estandar). Fee regular real: 1.99 GBP (tachado junto al promocional). Tasa 84.030918 confirmada regular (identica a 500 y 2000 GBP). Mid-market xe.com 84.1595 (03:15 UTC 25-ago)',
    updated_at = now()
where provider_slug = 'ria' and sending_country = 'GB' and receiving_country = 'PH';

-- Xoom CA->PH: T&C de la promo (xoom.com/legal/xoom-new-user-promo) excluyen
-- explicitamente transferencias no fondeadas en USD y limitan la promo a
-- residentes de EE.UU. -- Canada queda fuera por diseno. Consistente con la
-- UI: el badge "First Time Rate" desaparece por completo al cambiar a CAD.
-- La tasa ya cargada (43.5816) se confirma como regular, sin cambios de valor.
update fx_rates
set verified_status = 'confirmado_activo',
    data_source = 'xoom.com/philippines/send-money, 500 CAD, confirmado regular via T&C (xoom.com/legal/xoom-new-user-promo excluye fondeo no-USD y limita la promo a residentes de EE.UU., Canada queda fuera por diseno) y via UI (badge de promo ausente en CAD en todos los montos probados). Mid-market xe.com 44.59625768 (14:15 UTC 25-ago)',
    updated_at = now()
where provider_slug = 'xoom' and sending_country = 'CA' and receiving_country = 'PH';
