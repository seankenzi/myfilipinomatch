
CREATE TABLE public.page_visits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  user_agent text,
  device_type text,
  browser text,
  os text,
  page_path text,
  referrer text,
  country text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.page_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert visits"
  ON public.page_visits FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view all visits"
  ON public.page_visits FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own visits"
  ON public.page_visits FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX idx_page_visits_created_at ON public.page_visits (created_at DESC);
CREATE INDEX idx_page_visits_device_type ON public.page_visits (device_type);
