-- 2026-09-19: continua arreglando website_url faltantes para que BrandLogo.tsx
-- pueda resolver el logo real via unavatar.io. Solo dominios de alta confianza
-- (empresas conocidas/ya usadas como fuente esta semana) -- se deja el resto
-- (Al Fardan Exchange, Chaabi Cash, DirectRemit NBD, e& money, GCC Exchange,
-- HelloCash, Hubpay, iRemit, Kabayan Remit, Lari Exchange, Payit, Wall St
-- Exchange, CashMinute) sin tocar por no tener el dominio exacto verificado.
update public.providers set website_url = 'https://mukuru.com' where slug = 'mukuru';
update public.providers set website_url = 'https://www.smallworldfs.com' where slug = 'small-world';
update public.providers set website_url = 'https://strike.me' where slug = 'strike';
update public.providers set website_url = 'https://bitso.com' where slug = 'bitso';
update public.providers set website_url = 'https://www.chippercash.com' where slug = 'chipper-cash';
update public.providers set website_url = 'https://www.binance.com/en/binancepay' where slug = 'binance-pay';
update public.providers set website_url = 'https://www.pangeamoneytransfer.com' where slug = 'pangea';
update public.providers set website_url = 'https://www.orbitremit.com' where slug = 'orbit-remit';
update public.providers set website_url = 'https://www.alansariexchange.com' where slug = 'al-ansari';
update public.providers set website_url = 'https://www.mamamoney.co.za' where slug = 'mama-money';
update public.providers set website_url = 'https://www.safaricom.co.ke' where slug = 'mpesa-safaricom';
update public.providers set website_url = 'https://www.emiratesnbd.com' where slug = 'emirates-nbd';
update public.providers set website_url = 'https://www.aspora.com' where slug = 'aspora';
update public.providers set website_url = 'https://www.azimo.com' where slug = 'azimo';
