
-- Create profile-photos storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-photos', 'profile-photos', true);

-- Allow authenticated users to upload their own photos
CREATE POLICY "Users can upload own photos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow anyone to view photos
CREATE POLICY "Anyone can view photos" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'profile-photos');

-- Allow users to delete their own photos
CREATE POLICY "Users can delete own photos" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to update their own photos
CREATE POLICY "Users can update own photos" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
