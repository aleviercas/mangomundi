-- 2026-09-14 research: found a clean, trustworthy dual-rate source
-- (cibercuba.com, real news outlet, gives official AND informal rates
-- side by side daily) that resolves the ambiguity from the earlier
-- attempt (2026-09-11) to use eltoque.com, which blocked access, and a
-- set of other sources that disagreed wildly for the same day (490 to
-- 694 CUP -- turned out those were mixing different reference currencies
-- (USD cash vs "Zelle dollar" vs MLC), not real disagreement).
--
-- CiberCuba, 14-sep-2026: oficial (Banco Central de Cuba, Segmento III)
-- 655 CUP/USD; informal (calle) 694 CUP/USD -- brecha real hoy: 5.95%.
-- Trend shown in the same article: 664 CUP a month ago, 683 a week ago,
-- 694 today -- ~4.5% monthly depreciation, a fast-moving currency.
--
-- This existing row's applied rate (628 CUP/USD) is from 2026-08-23,
-- over 3 weeks old -- in a currency depreciating this fast, that's
-- meaningful drift (informal moved from an estimated high-500s/low-600s
-- around that date to 694 today). NOT correcting the number here --
-- correcting it would require a fresh WU quote, not just a fresh
-- benchmark (same principle already applied to the Prex ARS->VES fix,
-- 2026-09-10: benchmark and applied-rate staleness are two different
-- problems, only fix the one you actually have fresh data for).
-- Downgrading to sin_confirmar pending a fresh WU measurement.
update public.fx_rates
set verified_status = 'sin_confirmar',
    data_source = data_source || ' -- DOWNGRADED 2026-09-14: applied rate (628, from 2026-08-23) is now 3+ weeks old in a fast-depreciating currency (cibercuba.com confirms ~4.5%/month: 664 CUP/USD a month ago -> 694 today, oficial 655). Needs a fresh Western Union quote before restoring to confirmado_activo -- the benchmark is now fresh (cibercuba.com, daily oficial+informal side by side) but the applied rate itself is not.'
where id = '555d6e75-4da0-4e26-9d1f-9a0eca15483c';
