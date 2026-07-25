-- Drop duplicate admin update policy
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

-- Strengthen restrictive policy to also protect email and user_type
DROP POLICY IF EXISTS "Prevent self-elevation of protected fields" ON public.profiles;

CREATE POLICY "Prevent self-elevation of protected fields"
ON public.profiles
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    NOT (is_premium  IS DISTINCT FROM (SELECT p.is_premium  FROM public.profiles p WHERE p.id = auth.uid()))
    AND NOT (is_verified IS DISTINCT FROM (SELECT p.is_verified FROM public.profiles p WHERE p.id = auth.uid()))
    AND NOT (is_flagged  IS DISTINCT FROM (SELECT p.is_flagged  FROM public.profiles p WHERE p.id = auth.uid()))
    AND NOT (email       IS DISTINCT FROM (SELECT p.email       FROM public.profiles p WHERE p.id = auth.uid()))
    AND NOT (user_type   IS DISTINCT FROM (SELECT p.user_type   FROM public.profiles p WHERE p.id = auth.uid()))
  )
);