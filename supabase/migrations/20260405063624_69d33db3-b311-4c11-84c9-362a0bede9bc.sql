CREATE OR REPLACE FUNCTION public.browse_profiles(exclude_ids uuid[] DEFAULT '{}'::uuid[], filter_gender text DEFAULT NULL::text, filter_country text DEFAULT NULL::text, filter_user_type text DEFAULT NULL::text, filter_min_age integer DEFAULT NULL::integer, filter_max_age integer DEFAULT NULL::integer, result_limit integer DEFAULT 50, result_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, full_name text, age integer, gender text, country text, city text, province text, bio text, interests text[], relationship_intent text, relocation_intent text, photos text[], avatar_url text, is_verified boolean, user_type text, international_preference boolean, created_at timestamp with time zone, last_seen timestamp with time zone, education text, language text, want_children text, height_cm integer, weight_kg integer, is_premium boolean, relationship_status text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
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
  OFFSET result_offset
$$;