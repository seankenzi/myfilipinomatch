
CREATE TABLE public.profile_boosts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '24 hours')
);

ALTER TABLE public.profile_boosts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own boosts"
ON public.profile_boosts
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own boosts"
ON public.profile_boosts
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Anyone can read active boosts for sorting"
ON public.profile_boosts
FOR SELECT
TO authenticated
USING (expires_at > now());
