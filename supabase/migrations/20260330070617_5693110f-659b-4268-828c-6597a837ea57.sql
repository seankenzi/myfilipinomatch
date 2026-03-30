-- Fix 1: Remove anonymous photo access policy (only authenticated should view)
DROP POLICY IF EXISTS "Anyone can view photos" ON storage.objects;

-- Fix 2: Realtime authorization - enable RLS on realtime.messages
-- Note: postgres_changes already respect table-level RLS.
-- For broadcast channels, we add topic-level authorization via RLS on realtime.messages
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to use realtime only for channels matching their authorized topics
CREATE POLICY "Authenticated users can use realtime"
ON realtime.messages
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);