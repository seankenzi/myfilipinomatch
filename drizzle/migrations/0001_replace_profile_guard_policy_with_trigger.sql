DROP POLICY IF EXISTS "Prevent self-elevation of protected fields" ON public.profiles;

CREATE OR REPLACE FUNCTION public.guard_profile_protected_fields()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon')
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    IF NEW.is_premium  IS DISTINCT FROM OLD.is_premium
       OR NEW.is_verified IS DISTINCT FROM OLD.is_verified
       OR NEW.is_flagged  IS DISTINCT FROM OLD.is_flagged
       OR NEW.email       IS DISTINCT FROM OLD.email THEN
      RAISE EXCEPTION 'You cannot change protected profile fields';
    END IF;
    IF OLD.user_type IS NOT NULL AND NEW.user_type IS DISTINCT FROM OLD.user_type THEN
      RAISE EXCEPTION 'Account type cannot be changed once set';
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_guard_profile_protected_fields ON public.profiles;
CREATE TRIGGER trg_guard_profile_protected_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_protected_fields();