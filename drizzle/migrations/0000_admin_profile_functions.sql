CREATE OR REPLACE FUNCTION public.admin_list_users(search text DEFAULT NULL, onboarding_filter text DEFAULT 'all')
RETURNS TABLE(id uuid, full_name text, email text, avatar_url text, created_at timestamptz, last_seen timestamptz, is_premium boolean, is_verified boolean, is_flagged boolean, onboarding_completed boolean, onboarding_step integer, user_type text, country text, city text, age integer, gender text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can list users';
  END IF;
  RETURN QUERY
  SELECT p.id, p.full_name, p.email, p.avatar_url, p.created_at, p.last_seen, p.is_premium, p.is_verified, p.is_flagged,
         p.onboarding_completed, p.onboarding_step, p.user_type, p.country, p.city, p.age, p.gender
  FROM public.profiles p
  WHERE (search IS NULL OR btrim(search) = '' OR p.full_name ILIKE '%' || btrim(search) || '%' OR p.email ILIKE '%' || btrim(search) || '%')
    AND (onboarding_filter IS NULL OR onboarding_filter = 'all'
         OR (onboarding_filter = 'completed' AND p.onboarding_completed = true)
         OR (onboarding_filter = 'incomplete' AND COALESCE(p.onboarding_completed, false) = false))
  ORDER BY p.created_at DESC
  LIMIT 100;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_profiles(user_ids uuid[])
RETURNS TABLE(id uuid, full_name text, email text, is_premium boolean, is_verified boolean, is_flagged boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can read profiles';
  END IF;
  RETURN QUERY
  SELECT p.id, p.full_name, p.email, p.is_premium, p.is_verified, p.is_flagged
  FROM public.profiles p WHERE p.id = ANY(user_ids);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_search_users(term text)
RETURNS TABLE(id uuid, full_name text, email text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can search users';
  END IF;
  RETURN QUERY
  SELECT p.id, p.full_name, p.email FROM public.profiles p
  WHERE p.full_name ILIKE '%' || btrim(term) || '%' OR p.email ILIKE '%' || btrim(term) || '%'
  ORDER BY p.created_at DESC
  LIMIT 5;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_list_users(text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_get_profiles(uuid[]) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_search_users(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_users(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_profiles(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_search_users(text) TO authenticated;