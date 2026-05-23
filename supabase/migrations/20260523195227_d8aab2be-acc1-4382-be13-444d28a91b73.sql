revoke execute on function public.has_role(uuid, app_role) from public, anon, authenticated;
grant execute on function public.has_role(uuid, app_role) to service_role;
comment on policy "Anyone can log click" on public.affiliate_clicks is 'Intentional: public affiliate click tracking, like a contact form submission';
comment on policy "Anyone submit lead" on public.leads is 'Intentional: public B2B lead capture form';