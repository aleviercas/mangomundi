-- 2026-09-19: BrandLogo.tsx resuelve el icono real de cada proveedor via
-- unavatar.io a partir de website_url (extractDomain) -- sin website_url,
-- cae a iniciales en un circulo gris. logo_emoji NO se usa en ningun
-- componente de la UI (confirmado via grep completo de src/) -- es un
-- campo legado, no hace falta poblarlo.
--
-- Arregla los 6 proveedores cargados el 18-sep con website_url='' (mi
-- propia carga, verificados ahora con busqueda cada uno):
update public.providers set website_url = 'https://www.arqfinance.com' where slug = 'arq';
update public.providers set website_url = 'https://cocos.capital' where slug = 'cocos';
update public.providers set website_url = 'https://takenos.com' where slug = 'takenos';
update public.providers set website_url = 'https://www.wallbit.io' where slug = 'wallbit';
update public.providers set website_url = 'https://www.astropay.com' where slug = 'astropay';
update public.providers set website_url = 'https://www.ripio.com' where slug = 'ripio';
