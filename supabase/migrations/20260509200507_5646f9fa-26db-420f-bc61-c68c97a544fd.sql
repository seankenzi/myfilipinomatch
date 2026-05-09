REVOKE ALL ON FUNCTION public.validate_onboarding_completion() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.get_profile_by_id(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_profile_by_id(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.browse_profiles(uuid[], text, text, text, integer, integer, integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.browse_profiles(uuid[], text, text, text, integer, integer, integer, integer) TO authenticated;