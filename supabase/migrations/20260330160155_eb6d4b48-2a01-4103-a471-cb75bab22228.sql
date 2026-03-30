
CREATE TABLE public.crash_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  error_message text NOT NULL,
  error_stack text,
  page_url text,
  user_agent text,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crash_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view crash logs" ON public.crash_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can insert crash logs" ON public.crash_logs
  FOR INSERT TO authenticated, anon
  WITH CHECK (true);
