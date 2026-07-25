-- Tighten realtime channel authorization: only match/DM participants may join
-- the corresponding topic. Broadcasts (including typing indicators) flow through
-- realtime.messages, so this single policy covers both message events and presence.

DROP POLICY IF EXISTS "Authenticated users can use realtime" ON realtime.messages;

CREATE POLICY "Participants can use chat realtime topics"
ON realtime.messages
FOR ALL
TO authenticated
USING (
  CASE
    WHEN realtime.topic() LIKE 'messages-%' THEN EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = NULLIF(substring(realtime.topic() FROM 'messages-(.*)$'), '')::uuid
        AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
    WHEN realtime.topic() LIKE 'dm-%' THEN EXISTS (
      SELECT 1 FROM public.dm_conversations c
      WHERE c.id = NULLIF(substring(realtime.topic() FROM 'dm-(.*)$'), '')::uuid
        AND (c.initiator_id = auth.uid() OR c.recipient_id = auth.uid())
    )
    ELSE false
  END
)
WITH CHECK (
  CASE
    WHEN realtime.topic() LIKE 'messages-%' THEN EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = NULLIF(substring(realtime.topic() FROM 'messages-(.*)$'), '')::uuid
        AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
    WHEN realtime.topic() LIKE 'dm-%' THEN EXISTS (
      SELECT 1 FROM public.dm_conversations c
      WHERE c.id = NULLIF(substring(realtime.topic() FROM 'dm-(.*)$'), '')::uuid
        AND (c.initiator_id = auth.uid() OR c.recipient_id = auth.uid())
    )
    ELSE false
  END
);
