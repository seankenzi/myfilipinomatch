
-- 1) Drop the overly broad messages policy
DROP POLICY IF EXISTS "Authenticated users can use realtime" ON public.messages;

-- 2) Tighten profiles self-update guard to also protect is_flagged
DROP POLICY IF EXISTS "Prevent self-elevation of protected fields" ON public.profiles;

CREATE POLICY "Prevent self-elevation of protected fields"
ON public.profiles
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_premium IS NOT DISTINCT FROM (SELECT p.is_premium FROM public.profiles p WHERE p.id = auth.uid())
    AND is_verified IS NOT DISTINCT FROM (SELECT p.is_verified FROM public.profiles p WHERE p.id = auth.uid())
    AND is_flagged IS NOT DISTINCT FROM (SELECT p.is_flagged FROM public.profiles p WHERE p.id = auth.uid())
  )
);
