-- Research v8 (2026-09-02), Section 1: the ES->AR pending item left open in
-- v7 (moneygram.com/mgo/es/es/m/envia-dinero-a-argentina/, public calculator,
-- no login). Regular rate only -- the promotional "first transfer" rate
-- (1858.02 ARS, fee 0) is deliberately NOT loaded, same rule applied to
-- every other MoneyGram corridor already in this table.
--
-- Note on the spread sign: MoneyGram's regular rate (1779.13 ARS) quotes
-- ABOVE xe.com's mid-market (1751.7589 ARS) for this corridor -- the
-- opposite of the usual pattern (see Spain->Morocco, where the regular rate
-- sits below mid-market as expected). This isn't a promotional artifact:
-- ARS has floated within bands since April 2025 with multiple reference
-- rates (official, MEP/financiero), so xe.com's single "mid-market" number
-- is a less stable anchor for ARS specifically than for other currencies.
-- See docs/data-sources/2026-09-02-research-corredores-addendum-v8.md
-- Section 1 for the full discussion.
insert into public.fx_rates (
  from_currency, to_currency, rate, fee, provider_slug,
  sending_country, receiving_country, is_local_fx,
  public_spread_percent, data_source, data_collected_at, verified_status
) values (
  'EUR', 'ARS', 1779.13, 2.49, 'moneygram',
  'ES', 'AR', false,
  -1.56,
  'moneygram.com/mgo/es/es/m/envia-dinero-a-argentina/, cotizador publico sin login, tasa "regular" (excluye promocional de 1a transferencia online: 1858.02 ARS, fee 0). Mid-market xe.com al momento de la medicion: 1751.7589 ARS/EUR -- la tasa regular de MoneyGram queda 1.56% por encima del mid-market (spread negativo); no es una senal de tarifa promocional (ver research v8 addendum Seccion 1). Investigado 2-sep-2026.',
  '2026-09-02',
  'confirmado_activo'
);
