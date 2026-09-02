-- Research v8 (2026-09-02): after the previous migration in this batch
-- loaded real per-corridor spreads for 13 of Prex's 15 whitelisted
-- corridors, the provider-level notes/spread_percent (originally set
-- 2026-08-25 as a stopgap "spread_percent=1.0, ESTIMACION PROVISORIA" for
-- every corridor) are stale for those 13 -- fx.functions.ts already prefers
-- a corridor-specific fx_rates row over this provider-level fallback, so
-- this update only changes the fallback used by the 2 corridors that still
-- lack one: AR-US and AR-ES.
--
-- spread_percent moves from 1.0 to 10.5: earlier research (v5/v6,
-- 2026-08-25 to 2026-09-01, cited in docs/data-sources/
-- 2026-09-01-research-corredores-xoom-worldremit-v6.md Section 2 and in the
-- v8 addendum Section 2.2) measured AR-US at ~9.95% and AR-ES at
-- ~10.67-11.15%, but never recorded the exact rate/fee pair needed for a
-- real fx_rates row -- 10.5 is the midpoint of that already-documented
-- range, not a new estimate. This replaces a fallback (1.0%) that the 13
-- newly-measured corridors (7.86%-11.81%, Venezuela's ~3.86% aside) show was
-- roughly 10x too low, while being honest that AR-US/AR-ES still don't have
-- their own measured row.
update public.providers
set
  spread_percent = 10.5,
  notes = 'Fintech argentina (tarjeta + wallet). Remesa P2P real Argentina -> USA, Alemania, España, Francia, Italia, Portugal, México, Brasil, Colombia, Bolivia, Paraguay, Venezuela, Peru, Uruguay, Chile. Fee: USD 2.99 flat por transferencia en USD a cuenta bancaria; GRATIS si se envia en ARS; USD 0.99 para "Prex a Prex" (solo Peru/Chile/Uruguay, instantaneo) -- OJO: Peru/Uruguay/Chile tienen ademas un fee explicito de 1.663,20 ARS (~1,66% sobre 100.000 ARS enviados) segun medicion research v8, sin explicacion clara de por que solo esos 3. Limites: transferencia bancaria max USD 500/operacion y USD 1.000/dia; Prex a Prex max USD 1.000/operacion y por dia. ACTUALIZADO research v8 (2-sep-2026): 13 de 15 corredores del whitelist (Mexico, Brasil, Colombia, Bolivia, Paraguay, Venezuela, Peru, Uruguay, Chile, Alemania, Francia, Italia, Portugal) ya tienen spread real medido directamente cargado en fx_rates (no estimado) -- ver esas filas para el dato preciso por corredor. Venezuela quedo con verified_status=sin_confirmar por spread atipico (~3,86%, muy por debajo del resto) pendiente de una segunda medicion. Los unicos 2 corredores que SIGUEN sin fila propia en fx_rates son AR-US y AR-ES: investigacion previa (v5/v6, 25-ago-2026) les midio un spread aproximado de ~10-11% pero sin registrar el par tasa/fee exacto, asi que no se pudo cargar una fila real sin inventar un numero -- siguen usando este spread_percent de nivel-proveedor (actualizado de 1.0 a 10.5, el punto medio del rango ~10-11% ya documentado, en vez del 1.0 "estimacion provisoria" original que quedo demostrado muy por debajo de la realidad una vez medidos los otros 13 corredores) como fallback hasta conseguir la cotizacion exacta de esos dos. Hubo una promo de comision 0% del 1-ene al 31-jul-2026 (ya vencida a la fecha de esta carga). Fuente corredores originales: prexcard.com.ar/transferencias-internacionales/enviar-dinero-desde-argentina-a-estados-unidos, .../enviar-dinero-desde-argentina-a-peru, y centro de ayuda (limites), verificadas 25-ago-2026. Fuente 13 corredores nuevos: prexcard.com.ar/transferencias-internacionales/enviar-dinero-desde-argentina-a-{pais}, verificadas 2-sep-2026 (research v8).'
where slug = 'prex';
