-- Auditoría 27-ago-2026 (sesión Cowork): barrido de fees=0 con fuente genérica,
-- siguiendo el patrón detectado en Western Union GB-AR (migración 20260827150835).
-- Regla: fee=0 sin distinción explícita regular/promo, con fuente que no cruza
-- una calculadora en vivo con metodología documentada, se baja a sin_confirmar.

-- LemFi: 5 filas cargadas en bloque con fuente idéntica "Direct research Aug 2026
-- (lemfi.com, aggregator reviews)", fee=0 y sin nota de verificación de promo.
-- Evidencia encontrada hoy: support.lemfi.com/hc/en-us/articles/45776845553809
-- ("What fees will I pay?") dice textualmente que "the first transfer to a new
-- country is typically free, subsequent transfers may attract fees" -- exactamente
-- el mismo patrón de contaminación promocional que WU GB-AR.
update fx_rates
set verified_status = 'sin_confirmar',
    data_source = data_source || ' -- RE-VERIFICAR (27-ago-2026): fuente generica sin distincion regular/promo. support.lemfi.com/hc/en-us/articles/45776845553809 confirma textualmente "the first transfer to a new country is typically free, subsequent transfers may attract fees" -- mismo patron que Western Union GB-AR (ver migracion 20260827150835). Cerrar con navegador real antes de restaurar a confirmado_activo.'
where provider_slug = 'lemfi'
  and fee = 0
  and verified_status = 'confirmado_activo'
  and data_source ilike '%aggregator reviews%';

-- LemFi GB-NG: segunda fila para el mismo corredor, medida directamente en la
-- calculadora (500 GBP, spread corregido a -3.17) pero tampoco descarta
-- explícitamente que sea la tasa de primera transferencia -- mismo riesgo.
-- NOTA para próxima sesión: hay DOS filas para GB-NG (esta y la de arriba, ambas
-- ahora sin_confirmar) -- posible duplicado a resolver, no se borró ninguna por
-- prudencia (no está claro cuál es más confiable sin re-verificar ambas).
update fx_rates
set verified_status = 'sin_confirmar',
    data_source = data_source || ' -- RE-VERIFICAR (27-ago-2026): mismo hallazgo que las demas filas de LemFi -- support.lemfi.com confirma que el fee=0 puede ser tasa de primera transferencia, no descartado explicitamente en esta medicion. DUPLICADO: existe otra fila LemFi GB-NG (spread 1.0, fuente "aggregator reviews") -- resolver cual es correcta antes de restaurar cualquiera de las dos.'
where provider_slug = 'lemfi'
  and sending_country = 'GB' and receiving_country = 'NG'
  and fee = 0.00 and public_spread_percent = -3.17
  and verified_status = 'confirmado_activo';

-- Remitly: 10 filas fee=0 cargadas con fuente generica "aggregator reviews" o
-- "Direct research Aug 2025 (remitly.com)" sin verificacion directa de la
-- calculadora por corredor. Remitly SI distingue "everyday rate" (regular) de
-- "welcome rate" (promo) en su calculadora oficial -- confirmado en otras filas
-- de esta misma tabla (ej. CA-NG, CA-GH, US-NG ya tienen la nota explicita de
-- exclusion de welcome rate) -- pero estas 10 no fueron verificadas asi.
update fx_rates
set verified_status = 'sin_confirmar',
    data_source = data_source || ' -- RE-VERIFICAR (27-ago-2026): fuente generica sin verificacion directa de calculadora por corredor. Remitly distingue "everyday rate" vs "welcome rate" en su sitio (confirmado en otras filas de esta tabla, ej. CA-NG/CA-GH/US-NG) pero esta fila no fue medida asi. Cerrar con calculadora real remitly.com por corredor antes de restaurar a confirmado_activo.'
where provider_slug = 'remitly'
  and fee = 0
  and verified_status = 'confirmado_activo'
  and (data_source ilike '%aggregator reviews%' or data_source ilike 'Direct research Aug 2025 (remitly.com)%');
