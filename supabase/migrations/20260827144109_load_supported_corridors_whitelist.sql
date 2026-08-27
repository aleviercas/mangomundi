-- Strict whitelist for single-market brands marketed as generic remittance
-- providers but that structurally only operate one (or a short list of)
-- real corridor(s). Without this, eligibleProviders (see
-- src/lib/fx.functions.ts) showed each brand's one real corridor's generic
-- fee_tiers on every corridor a user asked for -- e.g. Money2India (a
-- US->IN-only ICICI Bank product) appearing on GB->AR.
-- See docs/handoff/handoff-2026-08-27-precision-corredores-badges.md
-- section 2.1 / 3.2 for the confirmed research behind each corridor list.

update providers set supported_corridors = array['US-IN'] where slug = 'money2india';
update providers set supported_corridors = array['US-PH'] where slug = 'bdo-remit';
update providers set supported_corridors = array['AE-PK'] where slug = 'ubl-tezraftaar';
update providers set supported_corridors = array[
  'AR-US','AR-DE','AR-ES','AR-FR','AR-IT','AR-PT','AR-MX','AR-BR','AR-CO','AR-BO',
  'AR-PY','AR-VE','AR-PE','AR-CL','AR-UY'
] where slug = 'prex';
