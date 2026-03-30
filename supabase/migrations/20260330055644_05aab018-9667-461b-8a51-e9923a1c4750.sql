
-- 1. FIX: Prevent users from self-elevating is_premium, is_verified via profile UPDATE
-- Add a RESTRICTIVE policy that prevents changing protected columns
CREATE POLICY "Prevent self-elevation of protected fields"
ON public.profiles AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (
  is_premium IS NOT DISTINCT FROM (SELECT p.is_premium FROM public.profiles p WHERE p.id = auth.uid())
  AND is_verified IS NOT DISTINCT FROM (SELECT p.is_verified FROM public.profiles p WHERE p.id = auth.uid())
);

-- 2. FIX: Remove authenticated INSERT policy on notifications (only service_role should insert)
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
