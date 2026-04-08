
-- Enable pg_net for HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Function to call send-push edge function on notification insert
CREATE OR REPLACE FUNCTION public.send_push_on_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  edge_url text;
  service_key text;
  payload jsonb;
BEGIN
  edge_url := current_setting('app.settings.supabase_url', true);
  service_key := current_setting('app.settings.service_role_key', true);

  -- If settings are not available, try env-style approach
  IF edge_url IS NULL OR edge_url = '' THEN
    edge_url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL' LIMIT 1);
  END IF;
  IF service_key IS NULL OR service_key = '' THEN
    service_key := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1);
  END IF;

  -- Skip if we can't resolve the URL
  IF edge_url IS NULL OR service_key IS NULL THEN
    RAISE WARNING 'send_push_on_notification: missing SUPABASE_URL or SERVICE_ROLE_KEY';
    RETURN NEW;
  END IF;

  payload := jsonb_build_object(
    'record', jsonb_build_object(
      'user_id', NEW.user_id,
      'title', NEW.title,
      'body', NEW.body,
      'type', NEW.type,
      'related_match_id', NEW.related_match_id,
      'related_user_id', NEW.related_user_id
    )
  );

  PERFORM net.http_post(
    url := edge_url || '/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := payload
  );

  RETURN NEW;
END;
$$;

-- Create trigger on notifications table
CREATE TRIGGER trigger_send_push_on_notification
AFTER INSERT ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.send_push_on_notification();
