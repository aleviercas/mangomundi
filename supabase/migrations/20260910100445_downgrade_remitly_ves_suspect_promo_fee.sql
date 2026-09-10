-- 2026-09-10 research: Remitly's own site confirms "The fee for all
-- transfers is $1.99" (remitly.com/us/en/currency-converter/usd-to-ves-rate)
-- -- fee=0 only applies to a first-transfer "welcome rate" promo, capped at
-- USD 1,000, universal across Remitly corridors (confirmed same pattern on
-- MXN/INR/VND/EUR pages, and independently by wise.com/us/blog/remitly-fees:
-- "You can access a promotional exchange rate for your first transfer...
-- equal to or even slightly above the fair mid-market rate"). This existing
-- row (fee=0, World Bank RPW Q3 2025) matches that promo signature exactly
-- -- same pattern already confirmed and downgraded for WU GB->AR
-- (2026-08-27) and LemFi/other Remitly rows (2026-08-27). Downgrading to
-- sin_confirmar, NOT deleting and NOT replacing with a new number -- a v26
-- research pass (research-findings-2026-09-09-v26.md) also measured this
-- corridor via Monito and got -0.45% recalculated against ve.dolarapi.com
-- parallel rate, but that measurement also shows fee=0 and is very likely
-- the same promo rate, not a regular-price measurement -- NOT loaded as a
-- replacement number for the same reason. Needs a genuine >=1,000 USD (or
-- returning-customer) measurement before this corridor can be marked
-- confirmado_activo again.
update public.fx_rates
set verified_status = 'sin_confirmar',
    data_source = data_source || ' -- DOWNGRADED 2026-09-10: fee=0 matches Remitly''s confirmed first-transfer "welcome rate" promo pattern (regular fee is $1.99 per remitly.com/us/en/currency-converter/usd-to-ves-rate; promo capped at USD 1,000, confirmed universal across Remitly corridors, independently corroborated by wise.com/us/blog/remitly-fees). Same downgrade pattern already applied to WU GB->AR and other Remitly rows (2026-08-27). Needs re-measurement at >=1,000 USD or as a returning customer before restoring to confirmado_activo -- do not restore based on a Monito re-check alone, since Monito appears to surface the same promo rate (see also the -0.45% v26 research figure, NOT loaded for the same reason).'
where id = 'dffc7167-7838-464d-a249-cc29ec23f2ce';
