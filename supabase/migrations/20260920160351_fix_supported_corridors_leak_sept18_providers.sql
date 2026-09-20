-- 2026-09-20: BUG CRITICO encontrado por el usuario en produccion (vio Belo y
-- Cocos apareciendo en Reino Unido->Angola, un corredor que no investigamos
-- nunca para esos proveedores). Causa raiz confirmada leyendo fx.functions.ts
-- linea 812: el whitelist de supported_corridors SOLO se aplica cuando el
-- array esta poblado (`p.supported_corridors && p.supported_corridors.length
-- > 0`) -- is_corridor_specific=true por si solo, sin supported_corridors,
-- NO restringe nada. Los 9 proveedores cargados el 18-sep (comparadolar.ar,
-- corredor EEUU->Argentina) se insertaron con is_corridor_specific=true pero
-- supported_corridors=null -- el mismo patron de bug ya identificado y
-- corregido para SBI Remit el mismo dia por otra sesion, cometido de forma
-- independiente en esta carga sin que me diera cuenta hasta que el usuario
-- lo vio en vivo.
--
-- Efecto real: estos 9 proveedores (con su fee/tasa especifico de EEUU->
-- Argentina) podian aparecer en CUALQUIER corredor de toda la app, mostrando
-- un numero que no le corresponde a esa ruta -- un bug de integridad de
-- datos en produccion, no solo un problema cosmetico.
update public.providers set supported_corridors = array['US-AR']
where slug in ('belo', 'lemon', 'arq', 'cocos', 'takenos', 'wallbit', 'astropay', 'ripio');

-- Global66 es distinto: YA tenia corredores reales en otros pares antes del
-- 18-sep (AR-ES, AR-IT, AR-GB, GB-AR) ademas del nuevo US-AR -- se listan
-- todos, no solo el ultimo agregado, para no romper corredores que ya
-- funcionaban bien.
update public.providers set supported_corridors = array['AR-ES', 'AR-IT', 'AR-GB', 'GB-AR', 'US-AR']
where slug = 'global66';
