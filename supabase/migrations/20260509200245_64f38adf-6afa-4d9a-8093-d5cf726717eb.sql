-- Repair existing completed profiles that do not meet the photo requirement
UPDATE public.profiles
SET onboarding_completed = false,
    onboarding_step = 7,
    avatar_url = NULL,
    updated_at = now()
WHERE onboarding_completed = true
  AND COALESCE(array_length(photos, 1), 0) < 3;

-- Enforce the required photo count whenever a profile is marked complete
CREATE OR REPLACE FUNCTION public.validate_onboarding_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only validate completed profiles. This also catches later photo removal
  -- from already-completed accounts.
  IF NEW.onboarding_completed = true THEN
    IF NEW.photos IS NULL
       OR array_length(NEW.photos, 1) IS NULL
       OR array_length(NEW.photos, 1) < 3 THEN
      RAISE EXCEPTION 'Onboarding requires at least 3 photos';
    END IF;

    -- Required core fields
    IF NEW.full_name IS NULL OR length(trim(NEW.full_name)) = 0 THEN
      RAISE EXCEPTION 'Onboarding requires a full name';
    END IF;
    IF NEW.age IS NULL OR NEW.age < 18 THEN
      RAISE EXCEPTION 'Onboarding requires a valid age (18+)';
    END IF;
    IF NEW.gender IS NULL OR length(trim(NEW.gender)) = 0 THEN
      RAISE EXCEPTION 'Onboarding requires gender';
    END IF;
    IF NEW.country IS NULL OR length(trim(NEW.country)) = 0 THEN
      RAISE EXCEPTION 'Onboarding requires country';
    END IF;
    IF NEW.city IS NULL OR length(trim(NEW.city)) = 0 THEN
      RAISE EXCEPTION 'Onboarding requires city';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS validate_onboarding_completion_trigger ON public.profiles;
CREATE TRIGGER validate_onboarding_completion_trigger
BEFORE INSERT OR UPDATE OF onboarding_completed, photos, full_name, age, gender, country, city
ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.validate_onboarding_completion();

-- Ensure direct profile pages only resolve complete, photo-valid, unflagged profiles
CREATE OR REPLACE FUNCTION public.get_profile_by_id(profile_id uuid)
RETURNS TABLE(id uuid, full_name text, age integer, gender text, country text, city text, province text, bio text, interests text[], relationship_intent text, relocation_intent text, photos text[], avatar_url text, is_verified boolean, user_type text, international_preference boolean, education text, language text, want_children text, height_cm integer, weight_kg integer, relationship_status text, is_premium boolean, created_at timestamp with time zone, last_seen timestamp with time zone)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    p.id, p.full_name, p.age, p.gender, p.country, p.city, p.province, p.bio, p.interests,
    p.relationship_intent, p.relocation_intent, p.photos, p.avatar_url,
    p.is_verified, p.user_type, p.international_preference, p.education,
    p.language, p.want_children, p.height_cm, p.weight_kg, p.relationship_status,
    p.is_premium, p.created_at, p.last_seen
  FROM public.profiles p
  WHERE p.id = profile_id
    AND p.onboarding_completed = true
    AND COALESCE(p.is_flagged, false) = false
    AND COALESCE(array_length(p.photos, 1), 0) >= 3
$function$;

-- Ensure Discover excludes any profile without the required 3 photos
CREATE OR REPLACE FUNCTION public.browse_profiles(exclude_ids uuid[] DEFAULT '{}'::uuid[], filter_gender text DEFAULT NULL::text, filter_country text DEFAULT NULL::text, filter_user_type text DEFAULT NULL::text, filter_min_age integer DEFAULT NULL::integer, filter_max_age integer DEFAULT NULL::integer, result_limit integer DEFAULT 50, result_offset integer DEFAULT 0)
RETURNS TABLE(id uuid, full_name text, age integer, gender text, country text, city text, province text, bio text, interests text[], relationship_intent text, relocation_intent text, photos text[], avatar_url text, is_verified boolean, user_type text, international_preference boolean, created_at timestamp with time zone, last_seen timestamp with time zone, education text, language text, want_children text, height_cm integer, weight_kg integer, is_premium boolean, relationship_status text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    p.id, p.full_name, p.age, p.gender, p.country, p.city, p.province, p.bio, p.interests,
    p.relationship_intent, p.relocation_intent, p.photos, p.avatar_url,
    p.is_verified, p.user_type, p.international_preference, p.created_at,
    p.last_seen, p.education, p.language, p.want_children, p.height_cm,
    p.weight_kg, p.is_premium, p.relationship_status
  FROM public.profiles p
  WHERE p.onboarding_completed = true
    AND p.id != auth.uid()
    AND COALESCE(p.is_flagged, false) = false
    AND COALESCE(array_length(p.photos, 1), 0) >= 3
    AND NOT (p.id = ANY(exclude_ids))
    AND (filter_gender IS NULL OR p.gender = filter_gender)
    AND (filter_country IS NULL OR p.country = filter_country)
    AND (filter_user_type IS NULL OR p.user_type = filter_user_type)
    AND (filter_min_age IS NULL OR p.age >= filter_min_age)
    AND (filter_max_age IS NULL OR p.age <= filter_max_age)
  ORDER BY
    (EXISTS (SELECT 1 FROM public.profile_boosts b WHERE b.user_id = p.id AND b.expires_at > now())) DESC,
    (EXISTS (
      SELECT 1 FROM public.subscriptions s 
      WHERE s.user_id = p.id 
        AND s.status = 'active' 
        AND s.plan IN ('3-month', 'yearly')
    )) DESC,
    p.created_at DESC
  LIMIT result_limit
  OFFSET result_offset
$function$;