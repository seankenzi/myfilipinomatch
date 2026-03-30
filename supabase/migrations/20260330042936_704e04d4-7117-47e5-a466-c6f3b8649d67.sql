
-- Fix the security definer view issue - recreate as SECURITY INVOKER
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker = true)
AS
SELECT 
  id, full_name, age, gender, country, city, bio, interests, 
  relationship_intent, relocation_intent, photos, avatar_url, 
  is_verified, user_type, international_preference, created_at, 
  last_seen, education, language, want_children, height_cm, 
  weight_kg, is_premium, onboarding_completed, relationship_status
FROM public.profiles;
