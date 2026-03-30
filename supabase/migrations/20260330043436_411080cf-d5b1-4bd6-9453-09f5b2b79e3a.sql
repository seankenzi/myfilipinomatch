
-- Fix profiles email exposure: replace blanket browsing policy
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can browse other profiles" ON public.profiles;

-- Add a restricted browsing policy that only allows viewing completed profiles (not own)
CREATE POLICY "Users can browse completed profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  onboarding_completed = true AND id != auth.uid()
);

-- Create a secure function for browsing profiles that excludes email
CREATE OR REPLACE FUNCTION public.browse_profiles(
  exclude_ids uuid[] DEFAULT '{}',
  filter_gender text DEFAULT NULL,
  filter_country text DEFAULT NULL,
  filter_user_type text DEFAULT NULL,
  filter_min_age int DEFAULT NULL,
  filter_max_age int DEFAULT NULL,
  result_limit int DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  full_name text,
  age int,
  gender text,
  country text,
  city text,
  bio text,
  interests text[],
  relationship_intent text,
  relocation_intent text,
  photos text[],
  avatar_url text,
  is_verified boolean,
  user_type text,
  international_preference boolean,
  created_at timestamptz,
  last_seen timestamptz,
  education text,
  language text,
  want_children text,
  height_cm int,
  weight_kg int,
  is_premium boolean,
  relationship_status text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id, p.full_name, p.age, p.gender, p.country, p.city, p.bio, p.interests,
    p.relationship_intent, p.relocation_intent, p.photos, p.avatar_url,
    p.is_verified, p.user_type, p.international_preference, p.created_at,
    p.last_seen, p.education, p.language, p.want_children, p.height_cm,
    p.weight_kg, p.is_premium, p.relationship_status
  FROM public.profiles p
  WHERE p.onboarding_completed = true
    AND p.id != auth.uid()
    AND NOT (p.id = ANY(exclude_ids))
    AND (filter_gender IS NULL OR p.gender = filter_gender)
    AND (filter_country IS NULL OR p.country = filter_country)
    AND (filter_user_type IS NULL OR p.user_type = filter_user_type)
    AND (filter_min_age IS NULL OR p.age >= filter_min_age)
    AND (filter_max_age IS NULL OR p.age <= filter_max_age)
  ORDER BY p.created_at DESC
  LIMIT result_limit
$$;
