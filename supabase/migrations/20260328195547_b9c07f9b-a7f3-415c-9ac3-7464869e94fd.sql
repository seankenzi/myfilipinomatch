
-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  related_user_id uuid,
  related_match_id uuid,
  read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete own notifications
CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Service role can insert notifications (used by triggers)
CREATE POLICY "Service role can insert notifications"
  ON public.notifications FOR INSERT TO service_role
  WITH CHECK (true);

-- Also allow system inserts via triggers (security definer functions)
-- We need insert for authenticated too for edge cases
CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Trigger: notify on new match
CREATE OR REPLACE FUNCTION public.notify_new_match()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, related_user_id, related_match_id)
  VALUES
    (NEW.user1_id, 'match', 'New Match! 💕', 'You have a new match! Start a conversation now.', NEW.user2_id, NEW.id),
    (NEW.user2_id, 'match', 'New Match! 💕', 'You have a new match! Start a conversation now.', NEW.user1_id, NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_match
  AFTER INSERT ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_match();

-- Trigger: notify on new message
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  receiver_id uuid;
  sender_name text;
BEGIN
  -- Find the other user in the match
  SELECT CASE
    WHEN m.user1_id = NEW.sender_id THEN m.user2_id
    ELSE m.user1_id
  END INTO receiver_id
  FROM public.matches m WHERE m.id = NEW.match_id;

  SELECT full_name INTO sender_name FROM public.profiles WHERE id = NEW.sender_id;

  INSERT INTO public.notifications (user_id, type, title, body, related_user_id, related_match_id)
  VALUES (receiver_id, 'message', 'New Message 💬', COALESCE(sender_name, 'Someone') || ' sent you a message.', NEW.sender_id, NEW.match_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_message();

-- Trigger: notify on new like
CREATE OR REPLACE FUNCTION public.notify_new_like()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  liker_name text;
BEGIN
  SELECT full_name INTO liker_name FROM public.profiles WHERE id = NEW.liker_id;

  INSERT INTO public.notifications (user_id, type, title, body, related_user_id)
  VALUES (NEW.liked_id, 'like', 'Someone likes you! ❤️', COALESCE(liker_name, 'Someone') || ' liked your profile.', NEW.liker_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_like
  AFTER INSERT ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_like();
