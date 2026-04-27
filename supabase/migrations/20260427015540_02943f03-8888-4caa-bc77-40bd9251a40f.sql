-- Analytics events table for funnel/source tracking
CREATE TABLE public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name TEXT NOT NULL,
  source TEXT,
  session_id TEXT,
  user_id UUID,
  page_path TEXT,
  referrer TEXT,
  country TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert analytics events"
ON public.analytics_events
FOR INSERT
TO anon, authenticated
WITH CHECK ((user_id IS NULL) OR (user_id = auth.uid()));

CREATE POLICY "Admins can view all analytics events"
ON public.analytics_events
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own analytics events"
ON public.analytics_events
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE INDEX idx_analytics_events_created_at ON public.analytics_events (created_at DESC);
CREATE INDEX idx_analytics_events_event_name ON public.analytics_events (event_name);
CREATE INDEX idx_analytics_events_source ON public.analytics_events (source);
CREATE INDEX idx_analytics_events_session_id ON public.analytics_events (session_id);
CREATE INDEX idx_analytics_events_user_id ON public.analytics_events (user_id);