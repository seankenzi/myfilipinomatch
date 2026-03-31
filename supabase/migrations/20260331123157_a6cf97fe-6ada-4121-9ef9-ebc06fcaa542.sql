
-- Table to track video call sessions for monthly usage limits (2 hours/month for yearly members)
CREATE TABLE public.video_call_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  match_id uuid NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  duration_seconds integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.video_call_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own sessions
CREATE POLICY "Users can view own video sessions"
  ON public.video_call_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Service role can manage all sessions (edge functions use service role)
CREATE POLICY "Service role can manage video sessions"
  ON public.video_call_sessions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Users can insert their own sessions
CREATE POLICY "Users can insert own video sessions"
  ON public.video_call_sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own sessions (to set ended_at)
CREATE POLICY "Users can update own video sessions"
  ON public.video_call_sessions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Function to get total seconds used this month
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
      ELSE EXTRACT(EPOCH FROM (now() - started_at))::integer -- ongoing call
    END
  ), 0)::integer
  FROM public.video_call_sessions
  WHERE user_id = p_user_id
    AND started_at >= date_trunc('month', now())
$$;
