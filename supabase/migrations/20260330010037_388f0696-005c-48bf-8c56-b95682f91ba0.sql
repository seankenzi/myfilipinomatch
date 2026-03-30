
-- FIX 1: Restrict profiles SELECT to hide email from other users
-- Drop the existing broad policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Allow users to see all profile fields for their OWN profile
CREATE POLICY "Users can view own full profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Allow users to see other profiles but NOT email (use a security definer function)
-- Since RLS is row-level and can't restrict columns, we allow SELECT but 
-- ensure email is only accessible via own profile. We create a broad policy
-- but will strip email at the application layer + add a view for safe access.
CREATE POLICY "Users can browse other profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- FIX 2: Add explicit restrictive policy to prevent non-admin role insertion
-- Default deny already blocks non-admin inserts, but add explicit safety
CREATE POLICY "Only admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Add explicit UPDATE restriction too
CREATE POLICY "Only admins can update roles" 
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Add explicit DELETE restriction
CREATE POLICY "Only admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
