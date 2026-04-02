CREATE POLICY "Admins can view all video sessions"
ON public.video_call_sessions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));