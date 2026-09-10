-- Research addendum v7 (2026-09-01), Section 2: MoneyGram ES->Morocco.
-- moneygram.com/mgo/es/es/m/envia-dinero-a-marruecos/, calculadora sin login,
-- 1.000 EUR. The page shows the REGULAR rate next to a struck-through
-- promotional one ("primera transferencia online"), with explicit legal
-- text confirming the distinction -- the clearest documented case of this
-- provider's promotional-quote pattern found so far. Only the regular rate
-- is loaded (10.6929 MAD, fee 0.99 EUR); the promotional one (10.9105 MAD,
-- fee 0) is NOT a standard recurring rate. Mid-market reference: XE
-- (https://www.xe.com/en-us/currencyconverter/convert/?Amount=1&From=EUR&To=MAD),
-- 1 EUR = 10.8254 MAD, 1-sep-2026 -> spread = (10.8254-10.6929)/10.8254 ~= 1.22%.
-- Distinct row from the existing EUR->MAD (FR->MA, World Bank RPW Q3 2025,
-- rate 10.741729) since sending_country differs (ES vs FR) -- not an update.
insert into fx_rates (
  from_currency, to_currency, rate, fee, provider_slug,
  sending_country, receiving_country, is_local_fx, public_spread_percent,
  min_amount, max_amount, data_source, data_collected_at, verified_status
) values (
  'EUR', 'MAD', 10.6929, 0.99, 'moneygram',
  'ES', 'MA', false, 1.22,
  0.01, null,
  'moneygram.com/mgo/es/es/m/envia-dinero-a-marruecos/, calculadora sin login, 1.000 EUR, tasa regular mostrada junto a la promocional tachada (excluye promo "primera transferencia online": 10.9105 MAD, fee 0). Mid-market xe.com 10.8254 (1-sep-2026)',
  '2026-09-01', 'confirmado_activo'
);
