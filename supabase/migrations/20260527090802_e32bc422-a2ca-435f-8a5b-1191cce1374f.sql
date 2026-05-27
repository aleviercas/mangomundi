
-- Enrich providers with trust, transparency, regulator, delivery, audience, large-ticket support
UPDATE public.providers SET trust_score=9.5, transparency_score=9.8, regulator='FCA / FinCEN', delivery_minutes=60,  audience='both',     supports_large_tickets=true,  sponsored=true,  sponsored_rank=1 WHERE slug='wise';
UPDATE public.providers SET trust_score=9.0, transparency_score=9.0, regulator='FCA',            delivery_minutes=30,  audience='retail',   supports_large_tickets=false WHERE slug='revolut';
UPDATE public.providers SET trust_score=8.5, transparency_score=8.0, regulator='FinCEN',         delivery_minutes=60,  audience='retail',   supports_large_tickets=false, sponsored=true, sponsored_rank=2 WHERE slug='remitly';
UPDATE public.providers SET trust_score=8.0, transparency_score=6.0, regulator='FinCEN',         delivery_minutes=30,  audience='both',     supports_large_tickets=true  WHERE slug='western-union';
UPDATE public.providers SET trust_score=7.5, transparency_score=6.0, regulator='FinCEN',         delivery_minutes=30,  audience='retail',   supports_large_tickets=false WHERE slug='moneygram';
UPDATE public.providers SET trust_score=9.0, transparency_score=8.5, regulator='ASIC / FCA',     delivery_minutes=1440, audience='both',     supports_large_tickets=true  WHERE slug='ofx';
UPDATE public.providers SET trust_score=8.5, transparency_score=8.0, regulator='FCA',            delivery_minutes=1440, audience='both',     supports_large_tickets=true  WHERE slug='xe';
UPDATE public.providers SET trust_score=8.5, transparency_score=7.5, regulator='FCA',            delivery_minutes=60,   audience='retail',   supports_large_tickets=false WHERE slug='worldremit';
UPDATE public.providers SET trust_score=8.5, transparency_score=8.5, regulator='MAS',            delivery_minutes=60,   audience='retail',   supports_large_tickets=false WHERE slug='instarem';
UPDATE public.providers SET trust_score=7.5, transparency_score=6.5, regulator='FinCEN',         delivery_minutes=60,   audience='retail',   supports_large_tickets=false WHERE slug='ria';
UPDATE public.providers SET trust_score=8.0, transparency_score=7.0, regulator='FinCEN',         delivery_minutes=60,   audience='retail',   supports_large_tickets=false WHERE slug='xoom';
UPDATE public.providers SET trust_score=9.0, transparency_score=8.5, regulator='FCA',            delivery_minutes=1440, audience='both',     supports_large_tickets=true  WHERE slug='currencies-direct';
UPDATE public.providers SET trust_score=9.0, transparency_score=8.5, regulator='FCA',            delivery_minutes=1440, audience='business', supports_large_tickets=true  WHERE slug='torfx';
UPDATE public.providers SET trust_score=7.5, transparency_score=6.5, regulator='FCA',            delivery_minutes=60,   audience='retail',   supports_large_tickets=false WHERE slug='skrill';
UPDATE public.providers SET trust_score=8.0, transparency_score=7.5, regulator='FCA',            delivery_minutes=60,   audience='retail',   supports_large_tickets=false WHERE slug='paysend';
UPDATE public.providers SET trust_score=9.0, transparency_score=9.5, regulator='FCA',            delivery_minutes=60,   audience='retail',   supports_large_tickets=false, sponsored=true, sponsored_rank=3 WHERE slug='atlantic-money';
UPDATE public.providers SET trust_score=9.0, transparency_score=8.0, regulator='FCA',            delivery_minutes=1440, audience='business', supports_large_tickets=true  WHERE slug='moneycorp';
UPDATE public.providers SET trust_score=8.5, transparency_score=7.5, regulator='FCA',            delivery_minutes=1440, audience='business', supports_large_tickets=true  WHERE slug='cab-payments';
UPDATE public.providers SET trust_score=9.0, transparency_score=8.5, regulator='ASIC / FCA',     delivery_minutes=60,   audience='business', supports_large_tickets=true,  sponsored=true, sponsored_rank=1 WHERE slug='airwallex';
UPDATE public.providers SET trust_score=8.5, transparency_score=7.5, regulator='FinCEN',         delivery_minutes=1440, audience='business', supports_large_tickets=true  WHERE slug='payoneer';
UPDATE public.providers SET trust_score=8.0, transparency_score=7.0, regulator='FinCEN',         delivery_minutes=1440, audience='business', supports_large_tickets=true  WHERE slug='western-union-business';
UPDATE public.providers SET trust_score=8.5, transparency_score=8.5, regulator='CBI',            delivery_minutes=1440, audience='both',     supports_large_tickets=true  WHERE slug='currencyfair';
UPDATE public.providers SET trust_score=8.5, transparency_score=8.0, regulator='FCA',            delivery_minutes=30,   audience='retail',   supports_large_tickets=false WHERE slug='transfergo';
UPDATE public.providers SET trust_score=8.0, transparency_score=7.5, regulator='FCA',            delivery_minutes=60,   audience='retail',   supports_large_tickets=false WHERE slug='azimo';
UPDATE public.providers SET trust_score=7.5, transparency_score=7.0, regulator='FCA',            delivery_minutes=60,   audience='retail',   supports_large_tickets=false WHERE slug='small-world';
UPDATE public.providers SET trust_score=8.0, transparency_score=7.5, regulator='FCA',            delivery_minutes=60,   audience='retail',   supports_large_tickets=false WHERE slug='lemfi';
UPDATE public.providers SET trust_score=8.0, transparency_score=7.0, regulator='FinCEN',         delivery_minutes=30,   audience='retail',   supports_large_tickets=false WHERE slug='sendwave';
UPDATE public.providers SET trust_score=8.0, transparency_score=7.5, regulator='FinCEN',         delivery_minutes=30,   audience='retail',   supports_large_tickets=false WHERE slug='taptap-send';
UPDATE public.providers SET trust_score=8.0, transparency_score=8.0, regulator='FCA',            delivery_minutes=30,   audience='retail',   supports_large_tickets=false WHERE slug='nala';
UPDATE public.providers SET trust_score=8.0, transparency_score=7.5, regulator='FCA',            delivery_minutes=60,   audience='retail',   supports_large_tickets=false, sponsored=true, sponsored_rank=2 WHERE slug='zing';

-- For airwallex/ofx leave them as the business-side sponsored top picks (already set above)
