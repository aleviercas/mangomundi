-- Idempotent re-application (2026-09-11): this exact UPDATE was run via a
-- raw execute_sql call earlier in this session, not apply_migration, so it
-- was never tracked in supabase_migrations.schema_migrations -- same class
-- of mistake already fixed once today for load_business_terms_and_estimates.
-- Re-running it now (values already confirmed identical) gives it a real,
-- honest migration version instead of leaving it untracked.
update public.providers
set active = true,
    notes = notes || ' ACTUALIZACION 11-sep-2026: corredores AR->ES/IT re-confirmados y AR<->GB agregados via capturas de pantalla directas del usuario de global66.com (calculadora JS, no scrapeable por herramientas automaticas). active=true: ya hay suficiente evidencia directa confirmada. Global66 tambien ofrece conversion directa a USDT y USDC (compra y venta) en ARS -- hallazgo nuevo, NO cargado a fx_rates todavia porque el esquema actual no representa bien "recibis en stablecoin, convertis cuando quieras" (mismo problema ya documentado para Belo/Lemon) -- ver docs/data-sources para el detalle y las cifras crudas.'
where slug = 'global66'
  and notes not like '%ACTUALIZACION 11-sep-2026: corredores AR->ES/IT re-confirmados%';
