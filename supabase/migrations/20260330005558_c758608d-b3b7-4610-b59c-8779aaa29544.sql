
-- Make the profile-photos bucket private (this was already applied above)
UPDATE storage.buckets SET public = false WHERE id = 'profile-photos';

-- Only add the SELECT policy (the upload/delete policies already exist)
DROP POLICY IF EXISTS "Authenticated users can view photos" ON storage.objects;
CREATE POLICY "Authenticated users can view photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'profile-photos');
