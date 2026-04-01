
CREATE TABLE public.cookie_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  anonymous_id text NOT NULL,
  consent_type text NOT NULL CHECK (consent_type IN ('accepted', 'declined')),
  ip_address text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.cookie_consents ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous) can insert consent records
CREATE POLICY "Anyone can insert consent" ON public.cookie_consents
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Users can view their own consent records
CREATE POLICY "Users can view own consents" ON public.cookie_consents
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Admins can view all consent records
CREATE POLICY "Admins can view all consents" ON public.cookie_consents
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));
