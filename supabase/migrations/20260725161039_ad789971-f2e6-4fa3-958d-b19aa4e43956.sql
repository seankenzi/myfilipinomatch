-- Restrict client read access to profiles.email via column-level privileges.
-- Table-level SELECT covers all columns, so we must revoke it and re-grant
-- SELECT on every column EXCEPT email.

REVOKE SELECT ON public.profiles FROM authenticated, anon;

DO $$
DECLARE
  col_list text;
BEGIN
  SELECT string_agg(quote_ident(column_name), ', ')
    INTO col_list
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name <> 'email';

  EXECUTE format('GRANT SELECT (%s) ON public.profiles TO authenticated', col_list);
  EXECUTE format('GRANT SELECT (%s) ON public.profiles TO anon', col_list);
END $$;

-- service_role retains full access (GRANT ALL was previously issued and is unaffected).
-- SECURITY DEFINER functions (e.g. get_profile_by_id, admin_* helpers) run as their
-- owner and continue to read email as needed.
