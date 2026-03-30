
-- Drop the overly permissive UPDATE policy on messages
DROP POLICY IF EXISTS "Users can update messages in their matches" ON public.messages;

-- Create a new policy: only the recipient (non-sender) can mark messages as read
CREATE POLICY "Recipients can mark messages as read"
ON public.messages
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.matches
    WHERE matches.id = messages.match_id
    AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
  )
  AND sender_id != auth.uid()
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.matches
    WHERE matches.id = messages.match_id
    AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
  )
  AND sender_id != auth.uid()
);
