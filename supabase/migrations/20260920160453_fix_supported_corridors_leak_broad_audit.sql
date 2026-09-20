-- 2026-09-20 (continuacion): auditoria completa tras el bug encontrado en
-- vivo (Belo/Cocos en Reino Unido->Angola). 41 proveedores en total tenian
-- is_corridor_specific=true con supported_corridors=null -- el bug de fondo
-- (fx.functions.ts linea 812) hace que TODOS ellos pudieran aparecer en
-- cualquier corredor de la app con un fee/tasa que no le corresponde.
--
-- Este UPDATE arregla 29 de los 31 proveedores genuinamente acotados
-- (single-market/regional), usando EXACTAMENTE los corredores que cada uno
-- ya tiene como filas reales en fx_rates -- no se inventa ningun corredor
-- nuevo, solo se restringe a lo ya investigado y cargado. azimo, iremit y
-- zing quedan sin arreglar (cero filas de fx_rates -- no hay evidencia de
-- que corredores cubren realmente, necesitan investigacion antes de poder
-- restringirlos con confianza).
--
-- NOTA aparte, no resuelta en esta migracion: western-union, moneygram, ria,
-- remitly, worldremit, xoom, paysend, sendwave, taptap-send tambien tienen
-- is_corridor_specific=true con supported_corridors=null -- pero estos SON
-- redes genuinamente amplias (cientos de corredores reales), asi que el
-- flag is_corridor_specific=true en ellos parece ser un error de
-- modelado de datos (probablemente deberia ser false), no un caso de fuga
-- activa como los 29 de abajo -- sin supported_corridors, el codigo los
-- trata efectivamente como amplios de todos modos (mismo resultado que si
-- is_corridor_specific=false), asi que no estan causando el bug hoy. Queda
-- como recomendacion para una proxima sesion, no arreglado aca porque
-- cambiar ese flag es una decision de modelado distinta al problema urgente
-- de fuga que motivo esta migracion.
update public.providers set supported_corridors = array['AE-IN'] where slug = 'al-ansari';
update public.providers set supported_corridors = array['AE-IN'] where slug = 'al-fardan-exchange';
update public.providers set supported_corridors = array['AE-IN','GB-IN','US-IN'] where slug = 'aspora';
update public.providers set supported_corridors = array['ES-VE','US-AR'] where slug = 'binance-pay';
update public.providers set supported_corridors = array['US-CO','US-MX'] where slug = 'bitso';
update public.providers set supported_corridors = array['GB-NG'] where slug = 'cashminute';
update public.providers set supported_corridors = array['FR-MA'] where slug = 'chaabi-cash';
update public.providers set supported_corridors = array['NG-KE','UG-KE','ZA-NG'] where slug = 'chipper-cash';
update public.providers set supported_corridors = array['DE-BG'] where slug = 'dahabshiil';
update public.providers set supported_corridors = array['AE-IN'] where slug = 'directremit-nbd';
update public.providers set supported_corridors = array['AE-IN','AE-PK'] where slug = 'e-and-money';
update public.providers set supported_corridors = array['AE-IN'] where slug = 'emirates-nbd';
update public.providers set supported_corridors = array['AE-IN'] where slug = 'gcc-exchange';
update public.providers set supported_corridors = array['ET-KE'] where slug = 'hellocash';
update public.providers set supported_corridors = array['AE-IN','AE-PK'] where slug = 'hubpay';
update public.providers set supported_corridors = array['CA-PH','US-PH'] where slug = 'kabayan-remit';
update public.providers set supported_corridors = array['AE-IN'] where slug = 'lari';
update public.providers set supported_corridors = array['CA-NG','GB-GH','GB-IN','GB-KE','GB-NG','GB-PH','GB-PK','US-NG'] where slug = 'lemfi';
update public.providers set supported_corridors = array['KW-EG'] where slug = 'lulu-money';
update public.providers set supported_corridors = array['ZA-ZW'] where slug = 'mama-money';
update public.providers set supported_corridors = array['KE-TZ','KE-UG'] where slug = 'mpesa-safaricom';
update public.providers set supported_corridors = array['BW-GB','BW-US','BW-ZA','GB-ZW','KE-DE','KE-GB','KE-US','LS-GB','LS-US','LS-ZA','RW-GB','UG-GB','ZA-BW','ZA-DE','ZA-GB','ZA-MW','ZA-MZ','ZA-US','ZA-ZW','ZM-DE','ZM-GB','ZM-US'] where slug = 'mukuru';
update public.providers set supported_corridors = array['GB-GH','GB-IN','GB-KE','GB-NG','GB-PH','GB-PK','GB-TZ','GB-UG','US-KE','US-TZ','US-UG'] where slug = 'nala';
update public.providers set supported_corridors = array['AU-IN'] where slug = 'orbit-remit';
update public.providers set supported_corridors = array['US-VN'] where slug = 'pangea';
update public.providers set supported_corridors = array['AE-IN','AE-PK'] where slug = 'payit';
update public.providers set supported_corridors = array['US-MX','US-NG','US-SV'] where slug = 'strike';
update public.providers set supported_corridors = array['AE-IN'] where slug = 'wall-st-exchange';
