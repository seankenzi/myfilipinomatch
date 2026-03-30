
-- Strengthen user_roles deny policies: convert from PERMISSIVE to RESTRICTIVE
DROP POLICY IF EXISTS "Deny authenticated insert on user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Deny authenticated update on user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Deny authenticated delete on user_roles" ON public.user_roles;

CREATE POLICY "Deny authenticated insert on user_roles"
ON public.user_roles AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "Deny authenticated update on user_roles"
ON public.user_roles AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "Deny authenticated delete on user_roles"
ON public.user_roles AS RESTRICTIVE
FOR DELETE
TO authenticated
USING (false);
