
-- Fix: Allow admins to bypass the self-elevation restriction
DROP POLICY IF EXISTS "Prevent self-elevation of protected fields" ON public.profiles;

CREATE POLICY "Prevent self-elevation of protected fields"
ON public.profiles AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_premium IS NOT DISTINCT FROM (SELECT p.is_premium FROM public.profiles p WHERE p.id = auth.uid())
    AND is_verified IS NOT DISTINCT FROM (SELECT p.is_verified FROM public.profiles p WHERE p.id = auth.uid())
  )
);
