
CREATE TABLE public.account_deletions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  scheduled_for timestamp with time zone NOT NULL DEFAULT (now() + interval '24 hours'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone
);

ALTER TABLE public.account_deletions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can request own deletion" ON public.account_deletions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own deletions" ON public.account_deletions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can cancel own deletion" ON public.account_deletions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (user_id = auth.uid() AND status = 'cancelled');

CREATE POLICY "Admins can view all deletions" ON public.account_deletions
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage deletions" ON public.account_deletions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
