DROP POLICY IF EXISTS "Users can insert own boosts" ON public.profile_boosts;

CREATE POLICY "Only premium users can insert boosts"
ON public.profile_boosts FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND is_premium = true
  )
);