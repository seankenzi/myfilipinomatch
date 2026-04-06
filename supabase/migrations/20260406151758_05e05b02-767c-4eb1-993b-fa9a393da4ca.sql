
-- contact_submissions: validate user_id if provided
DROP POLICY IF EXISTS "Anyone can submit contact form" ON public.contact_submissions;
CREATE POLICY "Anyone can submit contact form"
ON public.contact_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (
  user_id IS NULL OR user_id = auth.uid()
);

-- cookie_consents: validate user_id if provided
DROP POLICY IF EXISTS "Anyone can insert consent" ON public.cookie_consents;
CREATE POLICY "Anyone can insert consent"
ON public.cookie_consents
FOR INSERT
TO anon, authenticated
WITH CHECK (
  user_id IS NULL OR user_id = auth.uid()
);

-- crash_logs: validate user_id if provided
DROP POLICY IF EXISTS "Anyone can insert crash logs" ON public.crash_logs;
CREATE POLICY "Anyone can insert crash logs"
ON public.crash_logs
FOR INSERT
TO anon, authenticated
WITH CHECK (
  user_id IS NULL OR user_id = auth.uid()
);

-- page_visits: validate user_id if provided
DROP POLICY IF EXISTS "Anyone can insert visits" ON public.page_visits;
CREATE POLICY "Anyone can insert visits"
ON public.page_visits
FOR INSERT
TO anon, authenticated
WITH CHECK (
  user_id IS NULL OR user_id = auth.uid()
);
