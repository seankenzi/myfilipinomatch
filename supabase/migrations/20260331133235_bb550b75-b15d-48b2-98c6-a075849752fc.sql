
-- Fix: Only count sessions that have actually ended (have duration or ended_at)
-- Ignore orphaned/abandoned sessions with no end data
CREATE OR REPLACE FUNCTION public.get_monthly_video_usage(p_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(
    CASE 
      WHEN duration_seconds IS NOT NULL THEN duration_seconds
      WHEN ended_at IS NOT NULL THEN EXTRACT(EPOCH FROM (ended_at - started_at))::integer
      ELSE 0 -- ignore orphaned sessions with no end data
    END
  ), 0)::integer
  FROM public.video_call_sessions
  WHERE user_id = p_user_id
    AND started_at >= date_trunc('month', now())
$$;

-- Clean up orphaned sessions (no ended_at, no duration, older than 1 hour)
DELETE FROM public.video_call_sessions
WHERE ended_at IS NULL
  AND duration_seconds IS NULL
  AND started_at < now() - interval '1 hour';
