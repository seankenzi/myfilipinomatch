
-- Step 1: Add province column
ALTER TABLE public.profiles ADD COLUMN province text DEFAULT NULL;

-- Step 2: Drop functions first, then recreate with province
DROP FUNCTION IF EXISTS public.browse_profiles(uuid[],text,text,text,integer,integer,integer);
CREATE FUNCTION public.browse_profiles(
  exclude_ids uuid[] DEFAULT '{}'::uuid[],
  filter_gender text DEFAULT NULL,
  filter_country text DEFAULT NULL,
  filter_user_type text DEFAULT NULL,
  filter_min_age integer DEFAULT NULL,
  filter_max_age integer DEFAULT NULL,
  result_limit integer DEFAULT 50
)
RETURNS TABLE(
  id uuid, full_name text, age integer, gender text, country text, city text, province text, bio text,
  interests text[], relationship_intent text, relocation_intent text, photos text[],
  avatar_url text, is_verified boolean, user_type text, international_preference boolean,
  created_at timestamptz, last_seen timestamptz, education text, language text,
  want_children text, height_cm integer, weight_kg integer, is_premium boolean,
  relationship_status text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    p.id, p.full_name, p.age, p.gender, p.country, p.city, p.province, p.bio, p.interests,
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
  ORDER BY
    (EXISTS (SELECT 1 FROM public.profile_boosts b WHERE b.user_id = p.id AND b.expires_at > now())) DESC,
    p.created_at DESC
  LIMIT result_limit
$$;

DROP FUNCTION IF EXISTS public.get_profile_by_id(uuid);
CREATE FUNCTION public.get_profile_by_id(profile_id uuid)
RETURNS TABLE(
  id uuid, full_name text, age integer, gender text, country text, city text, province text, bio text,
  interests text[], relationship_intent text, relocation_intent text, photos text[],
  avatar_url text, is_verified boolean, user_type text, international_preference boolean,
  education text, language text, want_children text, height_cm integer, weight_kg integer,
  relationship_status text, is_premium boolean, created_at timestamptz, last_seen timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    p.id, p.full_name, p.age, p.gender, p.country, p.city, p.province, p.bio, p.interests,
    p.relationship_intent, p.relocation_intent, p.photos, p.avatar_url,
    p.is_verified, p.user_type, p.international_preference, p.education,
    p.language, p.want_children, p.height_cm, p.weight_kg, p.relationship_status,
    p.is_premium, p.created_at, p.last_seen
  FROM public.profiles p
  WHERE p.id = profile_id
    AND p.onboarding_completed = true
$$;

-- Step 3: Recreate public_profiles view
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles AS
  SELECT
    id, full_name, age, gender, country, city, province, bio, interests,
    relationship_intent, relocation_intent, photos, avatar_url,
    is_verified, user_type, international_preference, education,
    language, want_children, height_cm, weight_kg, is_premium,
    relationship_status, onboarding_completed, created_at, last_seen
  FROM public.profiles;
