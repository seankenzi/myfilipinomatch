
CREATE OR REPLACE FUNCTION public.cleanup_stale_video_signals()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.video_call_signals
  SET status = 'ended', updated_at = now()
  WHERE status IN ('ringing', 'accepted')
    AND updated_at < now() - interval '5 minutes';
END;
$$;
