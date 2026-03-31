
-- Create video call signals table for incoming call notifications
CREATE TABLE public.video_call_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL,
  caller_id uuid NOT NULL,
  callee_id uuid NOT NULL,
  room_url text,
  status text NOT NULL DEFAULT 'ringing',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.video_call_signals ENABLE ROW LEVEL SECURITY;

-- Callers can insert signals
CREATE POLICY "Users can insert call signals"
  ON public.video_call_signals FOR INSERT
  TO authenticated
  WITH CHECK (caller_id = auth.uid());

-- Both parties can view their signals
CREATE POLICY "Users can view own call signals"
  ON public.video_call_signals FOR SELECT
  TO authenticated
  USING (caller_id = auth.uid() OR callee_id = auth.uid());

-- Both parties can update signals (accept/decline/end)
CREATE POLICY "Users can update own call signals"
  ON public.video_call_signals FOR UPDATE
  TO authenticated
  USING (caller_id = auth.uid() OR callee_id = auth.uid())
  WITH CHECK (caller_id = auth.uid() OR callee_id = auth.uid());

-- Cleanup: allow deletion by either party
CREATE POLICY "Users can delete own call signals"
  ON public.video_call_signals FOR DELETE
  TO authenticated
  USING (caller_id = auth.uid() OR callee_id = auth.uid());

-- Service role full access
CREATE POLICY "Service role can manage call signals"
  ON public.video_call_signals FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_call_signals;
