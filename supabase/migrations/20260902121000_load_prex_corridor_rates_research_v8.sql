-- Research v8 (2026-09-02), Section 2: the 13 remaining corridors of Prex's
-- 15-corridor whitelist, measured live against prexcard.com.ar's per-country
-- calculator (100,000 ARS sent), compared to xe.com mid-market at the same
-- moment. Before this, only AR-US and AR-ES had ever been measured (v5/v6) --
-- see docs/data-sources/2026-09-02-research-corredores-addendum-v8.md
-- Section 2 for the full table and methodology.
--
-- Venezuela is loaded as sin_confirmar: its spread (~3.86%) breaks the
-- pattern of the other 14 corridors (7.86%-11.81%), and VES's own exchange-
-- rate complexity (multiple references, redenomination) makes the xe.com
-- mid-market a less stable baseline -- see addendum Section 2.3.
--
-- Italy and Portugal were not re-measured directly: Prex quotes by currency,
-- not by country, and Germany/France (also EUR) gave an identical quote --
-- accepted as a high-confidence inference per the addendum's own
-- recommendation (Section 2.1).
insert into public.fx_rates (
  from_currency, to_currency, rate, fee, provider_slug,
  sending_country, receiving_country, is_local_fx,
  public_spread_percent, data_source, data_collected_at, verified_status
) values
  ('ARS', 'MXN', 0.00991, 0, 'prex', 'AR', 'MX', false, 11.77,
   'prexcard.com.ar/transferencias-internacionales/enviar-dinero-desde-argentina-a-mexico, calculadora en vivo, 100.000 ARS. Mid-market xe.com: 0.011231 MXN. Investigado 2-sep-2026 (research v8).',
   '2026-09-02', 'confirmado_activo'),
  ('ARS', 'BRL', 0.00301, 0, 'prex', 'AR', 'BR', false, 11.69,
   'prexcard.com.ar/transferencias-internacionales/enviar-dinero-desde-argentina-a-brasil, calculadora en vivo, 100.000 ARS. Mid-market xe.com: 0.00340856 BRL. Investigado 2-sep-2026 (research v8).',
   '2026-09-02', 'confirmado_activo'),
  ('ARS', 'COP', 1.86086, 0, 'prex', 'AR', 'CO', false, 10.90,
   'prexcard.com.ar/transferencias-internacionales/enviar-dinero-desde-argentina-a-colombia, calculadora en vivo, 100.000 ARS. Mid-market xe.com: 2.08838 COP. Investigado 2-sep-2026 (research v8).',
   '2026-09-02', 'confirmado_activo'),
  ('ARS', 'BOB', 0.00701, 0, 'prex', 'AR', 'BO', false, 11.07,
   'prexcard.com.ar/transferencias-internacionales/enviar-dinero-desde-argentina-a-bolivia, calculadora en vivo, 100.000 ARS. Mid-market xe.com: 0.00788277 BOB. Investigado 2-sep-2026 (research v8).',
   '2026-09-02', 'confirmado_activo'),
  ('ARS', 'PYG', 3.44614, 0, 'prex', 'AR', 'PY', false, 11.81,
   'prexcard.com.ar/transferencias-internacionales/enviar-dinero-desde-argentina-a-paraguay, calculadora en vivo, 100.000 ARS. Mid-market xe.com: 3.90740 PYG. Investigado 2-sep-2026 (research v8).',
   '2026-09-02', 'confirmado_activo'),
  ('ARS', 'VES', 0.50846, 0, 'prex', 'AR', 'VE', false, 3.86,
   'prexcard.com.ar/transferencias-internacionales/enviar-dinero-desde-argentina-a-venezuela, calculadora en vivo, 100.000 ARS. Mid-market xe.com: 0.52888 VES. Spread muy por debajo del resto de los corredores de Prex (7.86%-11.81%) -- cargado sin_confirmar por la volatilidad/complejidad cambiaria propia del VES, pendiente de una segunda medicion (ver addendum v8 Seccion 2.3). Investigado 2-sep-2026 (research v8).',
   '2026-09-02', 'sin_confirmar'),
  ('ARS', 'PEN', 0.00205, 1663.20, 'prex', 'AR', 'PE', false, 7.86,
   'prexcard.com.ar/transferencias-internacionales/enviar-dinero-desde-argentina-a-peru, calculadora en vivo, 100.000 ARS. Fee explicito de 1.663,20 ARS (1.66%), a diferencia de la mayoria de corredores de Prex que no cobran fee -- sin explicacion documentada de por que. Mid-market xe.com: 0.00222487 PEN (spread solo tipo de cambio 7.86%; all-in con fee ~9.42%, ya reflejado en public_spread_percent junto al campo fee separado). Investigado 2-sep-2026 (research v8).',
   '2026-09-02', 'confirmado_activo'),
  ('ARS', 'UYU', 0.0242, 1663.20, 'prex', 'AR', 'UY', false, 9.23,
   'prexcard.com.ar/transferencias-internacionales/enviar-dinero-desde-argentina-a-uruguay, calculadora en vivo, 100.000 ARS. Fee explicito de 1.663,20 ARS (1.66%), mismo monto que Peru y Chile, sin explicacion documentada de por que. Mid-market xe.com: 0.02666155 UYU. Investigado 2-sep-2026 (research v8).',
   '2026-09-02', 'confirmado_activo'),
  ('ARS', 'CLP', 0.56548, 1663.20, 'prex', 'AR', 'CL', false, 8.65,
   'prexcard.com.ar/transferencias-internacionales/enviar-dinero-desde-argentina-a-chile, calculadora en vivo, 100.000 ARS. Fee explicito de 1.663,20 ARS (1.66%), mismo monto que Peru y Uruguay, sin explicacion documentada de por que. Mid-market xe.com: 0.61903065 CLP. Investigado 2-sep-2026 (research v8).',
   '2026-09-02', 'confirmado_activo'),
  ('ARS', 'EUR', 0.00051, 0, 'prex', 'AR', 'DE', false, 10.67,
   'prexcard.com.ar/transferencias-internacionales/enviar-dinero-desde-argentina-a-alemania, calculadora en vivo, 100.000 ARS. Mid-market xe.com: 0.00057091 EUR. Investigado 2-sep-2026 (research v8).',
   '2026-09-02', 'confirmado_activo'),
  ('ARS', 'EUR', 0.00051, 0, 'prex', 'AR', 'FR', false, 10.67,
   'prexcard.com.ar/transferencias-internacionales/enviar-dinero-desde-argentina-a-francia, calculadora en vivo, 100.000 ARS -- cotizacion identica a Alemania (misma moneda EUR, Prex cotiza por moneda no por pais). Mid-market xe.com: 0.00057091 EUR. Investigado 2-sep-2026 (research v8).',
   '2026-09-02', 'confirmado_activo'),
  ('ARS', 'EUR', 0.00051, 0, 'prex', 'AR', 'IT', false, 10.67,
   'Inferido de Alemania/Francia (misma moneda EUR, Prex cotiza por moneda no por pais) -- no remedido por separado. Patron consistente en los 3 paises EUR ya medidos directamente (Espana en v5, Alemania y Francia en research v8). Ver addendum v8 Seccion 2.1.',
   '2026-09-02', 'confirmado_activo'),
  ('ARS', 'EUR', 0.00051, 0, 'prex', 'AR', 'PT', false, 10.67,
   'Inferido de Alemania/Francia (misma moneda EUR, Prex cotiza por moneda no por pais) -- no remedido por separado. Patron consistente en los 3 paises EUR ya medidos directamente (Espana en v5, Alemania y Francia en research v8). Ver addendum v8 Seccion 2.1.',
   '2026-09-02', 'confirmado_activo');
