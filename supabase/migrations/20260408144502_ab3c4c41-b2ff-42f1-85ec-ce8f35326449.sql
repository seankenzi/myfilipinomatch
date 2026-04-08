CREATE TABLE public.app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

INSERT INTO public.app_config (key, value) VALUES ('min_app_version', '1.0.0');
INSERT INTO public.app_config (key, value) VALUES ('latest_app_version', '1.0.0');
INSERT INTO public.app_config (key, value) VALUES ('play_store_url', 'https://play.google.com/store/apps/details?id=app.lovable.d7e8e2e60b614c99bb9551ec2800fd55');

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read app config"
  ON public.app_config FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Only admins can update app config"
  ON public.app_config FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can insert app config"
  ON public.app_config FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));