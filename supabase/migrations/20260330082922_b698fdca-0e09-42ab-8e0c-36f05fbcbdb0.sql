CREATE POLICY "Premium users can create matches"
ON public.matches FOR INSERT
TO authenticated
WITH CHECK (
  user1_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_premium = true
  )
);