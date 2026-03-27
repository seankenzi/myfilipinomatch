-- Allow authenticated users to insert matches (needed for mutual like detection)
CREATE POLICY "Users can insert matches"
ON public.matches FOR INSERT
TO authenticated
WITH CHECK (user1_id = auth.uid() OR user2_id = auth.uid());