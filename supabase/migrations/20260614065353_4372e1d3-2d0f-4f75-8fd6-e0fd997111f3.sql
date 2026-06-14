
-- 1. Recreate public_profiles view as SECURITY INVOKER (fixes SUPA_security_definer_view)
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles
WITH (security_invoker = true) AS
SELECT id, full_name, age, gender, country, city, province, bio, interests,
       relationship_intent, relocation_intent, photos, avatar_url, is_verified,
       user_type, international_preference, education, language, want_children,
       height_cm, weight_kg, is_premium, relationship_status, onboarding_completed,
       created_at, last_seen
FROM public.profiles;
GRANT SELECT ON public.public_profiles TO authenticated;

-- 2. Restrict app_config reads to authenticated users only (fixes app_config_public_read)
DROP POLICY IF EXISTS "Anyone can read app config" ON public.app_config;
CREATE POLICY "Authenticated users can read app config"
ON public.app_config FOR SELECT
TO authenticated
USING (true);

-- 3. Protect verification documents in storage (fixes profile_photos_any_authenticated_view).
--    Regular profile photos remain readable by authenticated users so signed URLs work,
--    but verification ID photos under 'verifications/<user_id>/...' are now restricted
--    to the owner and admins only.
DROP POLICY IF EXISTS "Authenticated users can view photos" ON storage.objects;

CREATE POLICY "Authenticated users can view non-verification photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'profile-photos'
  AND (storage.foldername(name))[1] <> 'verifications'
);

CREATE POLICY "Users and admins can view own verification photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'profile-photos'
  AND (storage.foldername(name))[1] = 'verifications'
  AND (
    (storage.foldername(name))[2] = (auth.uid())::text
    OR public.has_role(auth.uid(), 'admin')
  )
);
