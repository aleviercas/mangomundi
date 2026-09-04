-- W11 (2026-09-02 feedback): fills the min_amount/settlement_terms/
-- contract_type gap left on business/both-segment providers after the
-- 2026-08-30 business_broker_quote_fields migration added the columns.
--
-- Real, sourced data (WebSearch research, 2026-09-02):
--   CurrencyFair min_amount -- https://www.exiap.com/guides/currencyfair-transfer-limits
--   CurrencyFair settlement -- https://moneytransfers.com/companies/currencyfair
--   CurrencyFair contract   -- https://www.businessexpert.co.uk/money-transfer/currencyfair-review/
--   Wise min_amount/settlement -- https://wise.com/gb/blog/payment-settlements,
--     https://wise.com/us/blog/transfer-large-amounts-wise-business
--   Wise contract (spot only) -- https://www.regencyfx.com/currency-transfer-guides/spot-rate-vs-forward-contract-which-is-better-for-you
--   XE min_amount -- https://wise.com/us/blog/xe-transfer-limit
--   XE settlement -- https://moneytransfers.com/companies/xe
--   XE contract -- https://help.xe.com/hc/en-gb/articles/13920861591697-Forward-Exchange-Contracts-FECs-Valid-until-23rd-March-2023,
--     https://www.xe.com/blog/business/forward-contracts-for-business
--   Instarem settlement -- https://www.instarem.com/help-business/faqs-sme/transaction-processing-time/
--   Moneycorp min_amount/settlement -- https://www.moneycorp.com/en-gb/help-support/business-faqs/,
--     https://www.moneycorp.com/en-us/business/foreign-exchange-solutions2/spot-contract/
--   Payoneer min_amount -- https://payoneer.custhelp.com/app/answers/detail/a_id/18605/~/withdraw-to-bank---faq
--   Revolut settlement/contract -- https://www.revolut.com/en-US/business/currency-exchange/,
--     https://www.revolut.com/business/fx-forwards/, https://www.finextra.com/pressarticle/87755/revolut-business-launches-fx-forwards
--
-- Research methodology note: gathered via a subagent using the WebSearch
-- tool only (WebFetch was blocked by this sandbox's egress proxy for every
-- domain tried), so these are WebSearch's own synthesized snippets, not
-- independently re-opened and re-read pages -- worth a human spot-check
-- before treating as fully verified, per the agent's own caveat.
update public.providers set
  min_amount = 10,
  settlement_terms = 'Typically 1-5 business days end-to-end (funding 1-2 days, same-day for GBP Faster Payments/CHAPS; conversion and payout add another 1-2 days)',
  contract_type = 'Spot only — no forward contracts'
where slug = 'currencyfair';

update public.providers set
  min_amount = 0,
  settlement_terms = 'Same day to 2 business days depending on currency and corridor',
  contract_type = 'Spot only — no forward contracts'
where slug = 'wise';

update public.providers set
  min_amount = 0,
  settlement_terms = 'Typically 1-5 business days for business transfers',
  contract_type = 'Spot, Forward (bookable up to 24 months; beyond 12 months needs credit-team approval)'
where slug = 'xe';

update public.providers set
  settlement_terms = 'Most business payments delivered within 1-2 business days; real-time-rail corridors settle same day (over 70% processed within an hour)'
where slug = 'instarem';

update public.providers set
  min_amount = 50,
  settlement_terms = 'Spot contract: payment within 2 working days (T+2)'
where slug = 'moneycorp';

update public.providers set
  min_amount = 50
where slug = 'payoneer';

update public.providers set
  settlement_terms = 'Spot exchange settles near-instantly (typically under 10 seconds); FX Forwards settle on the contract''s chosen fixed or flexible settlement date',
  contract_type = 'Spot, FX Forwards (fixed-date and flexible-date contracts; standard tenor up to 12 months, up to 24 months for qualifying businesses)'
where slug = 'revolut';

-- Logical estimates (no reliable public source found): min_amount is the
-- median among same provider_type ("app") peers with real sourced data
-- (Airwallex 0, CurrencyFair 10, Wise 0, XE 0, Payoneer 50 -> median 10);
-- contract type defaults to the baseline every FX provider offers (Spot)
-- rather than asserting an unconfirmed Forward/Options capability;
-- CAB Payments' settlement mirrors the typical range across the same peer
-- set. Convera (western-union-business) is provider_type "broker" -- its
-- min_amount estimate uses the broker-type peer median instead (Currencies
-- Direct 10, Moneycorp 50, TorFX 100, OFX 150 -> median 75).
update public.providers set
  min_amount = 10, min_amount_estimated = true,
  settlement_terms = 'Typically 1-2 business days (varies by corridor)', settlement_terms_estimated = true,
  contract_type = 'Spot', contract_type_estimated = true
where slug = 'cab-payments';

update public.providers set
  min_amount = 10, min_amount_estimated = true
where slug = 'revolut';

update public.providers set
  min_amount = 10, min_amount_estimated = true,
  contract_type = 'Spot', contract_type_estimated = true
where slug = 'instarem';

update public.providers set
  min_amount = 75, min_amount_estimated = true
where slug = 'western-union-business';
