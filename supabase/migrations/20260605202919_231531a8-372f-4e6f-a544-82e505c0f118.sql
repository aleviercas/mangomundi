
-- fx_rates: public read
CREATE TABLE public.fx_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency text NOT NULL,
  to_currency text NOT NULL,
  rate numeric NOT NULL,
  fee numeric NOT NULL DEFAULT 0,
  provider_slug text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX fx_rates_pair_idx ON public.fx_rates (from_currency, to_currency);
GRANT SELECT ON public.fx_rates TO anon, authenticated;
GRANT ALL ON public.fx_rates TO service_role;
ALTER TABLE public.fx_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads fx rates" ON public.fx_rates FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage fx rates" ON public.fx_rates FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- chat conversations + messages: server-fn only
CREATE TABLE public.chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX chat_conversations_session_idx ON public.chat_conversations (session_id);
GRANT ALL ON public.chat_conversations TO service_role;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read conversations" ON public.chat_conversations FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX chat_messages_conv_idx ON public.chat_messages (conversation_id, created_at);
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read messages" ON public.chat_messages FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- enterprise leads
CREATE TABLE public.enterprise_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  feature_source text,
  status text NOT NULL DEFAULT 'beta_pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.enterprise_leads TO anon, authenticated;
GRANT ALL ON public.enterprise_leads TO service_role;
ALTER TABLE public.enterprise_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone submit enterprise lead" ON public.enterprise_leads FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins read enterprise leads" ON public.enterprise_leads FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
