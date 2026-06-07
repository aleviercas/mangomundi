
-- ============================================
-- Security Hardening: User-scoped RLS policies
-- ============================================

-- chat_conversations: allow authenticated users to insert + read their own
DROP POLICY IF EXISTS "Users insert own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users read own conversations" ON public.chat_conversations;

CREATE POLICY "Users insert own conversations"
  ON public.chat_conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read own conversations"
  ON public.chat_conversations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT ON public.chat_conversations TO authenticated;

-- chat_messages: scope via parent conversation ownership
DROP POLICY IF EXISTS "Users insert own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users read own messages" ON public.chat_messages;

CREATE POLICY "Users insert own messages"
  ON public.chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_conversations c
      WHERE c.id = chat_messages.conversation_id
        AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users read own messages"
  ON public.chat_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_conversations c
      WHERE c.id = chat_messages.conversation_id
        AND c.user_id = auth.uid()
    )
  );

GRANT SELECT, INSERT ON public.chat_messages TO authenticated;

-- enterprise_leads: tighten INSERT to require explicit privacy_consent (GDPR)
DROP POLICY IF EXISTS "Anyone submit enterprise lead" ON public.enterprise_leads;
CREATE POLICY "Anyone submit enterprise lead with consent"
  ON public.enterprise_leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (privacy_consent = true);

-- retail_leads INSERT policy already enforces privacy_consent = true (kept as-is).
-- SELECT on both leads tables remains admin-only (already configured).
