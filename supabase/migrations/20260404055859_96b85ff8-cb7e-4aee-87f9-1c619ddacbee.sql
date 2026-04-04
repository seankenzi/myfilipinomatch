
-- Create dm_conversations table
CREATE TABLE public.dm_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  initiator_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (initiator_id, recipient_id)
);

ALTER TABLE public.dm_conversations ENABLE ROW LEVEL SECURITY;

-- Only premium users can create DM conversations
CREATE POLICY "Premium users can create DM conversations"
ON public.dm_conversations FOR INSERT TO authenticated
WITH CHECK (
  initiator_id = auth.uid()
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_premium = true)
);

-- Participants can view their own conversations
CREATE POLICY "Participants can view DM conversations"
ON public.dm_conversations FOR SELECT TO authenticated
USING (initiator_id = auth.uid() OR recipient_id = auth.uid());

-- Create dm_messages table
CREATE TABLE public.dm_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.dm_conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dm_messages ENABLE ROW LEVEL SECURITY;

-- Participants can view messages in their conversations
CREATE POLICY "Participants can view DM messages"
ON public.dm_messages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM dm_conversations c
    WHERE c.id = dm_messages.conversation_id
    AND (c.initiator_id = auth.uid() OR c.recipient_id = auth.uid())
  )
);

-- Participants can send messages in their conversations
CREATE POLICY "Participants can send DM messages"
ON public.dm_messages FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM dm_conversations c
    WHERE c.id = dm_messages.conversation_id
    AND (c.initiator_id = auth.uid() OR c.recipient_id = auth.uid())
  )
);

-- Recipients can mark messages as read
CREATE POLICY "Recipients can mark DM messages as read"
ON public.dm_messages FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM dm_conversations c
    WHERE c.id = dm_messages.conversation_id
    AND (c.initiator_id = auth.uid() OR c.recipient_id = auth.uid())
  )
  AND sender_id <> auth.uid()
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM dm_conversations c
    WHERE c.id = dm_messages.conversation_id
    AND (c.initiator_id = auth.uid() OR c.recipient_id = auth.uid())
  )
  AND sender_id <> auth.uid()
);

-- Enable realtime for dm_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.dm_messages;

-- Create trigger to update dm_conversations.updated_at when a new message is sent
CREATE OR REPLACE FUNCTION public.update_dm_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.dm_conversations SET updated_at = now() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_dm_conversation_on_message
AFTER INSERT ON public.dm_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_dm_conversation_timestamp();

-- Create indexes for performance
CREATE INDEX idx_dm_conversations_initiator ON public.dm_conversations(initiator_id);
CREATE INDEX idx_dm_conversations_recipient ON public.dm_conversations(recipient_id);
CREATE INDEX idx_dm_messages_conversation ON public.dm_messages(conversation_id);
CREATE INDEX idx_dm_messages_created ON public.dm_messages(conversation_id, created_at);
