-- 1. Attach existing validation function as a trigger (it was orphaned)
DROP TRIGGER IF EXISTS trg_validate_onboarding_photos ON public.profiles;
CREATE TRIGGER trg_validate_onboarding_photos
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.validate_onboarding_photos();

-- 2. Stronger guard: require core fields too, and prevent direct user bypass
CREATE OR REPLACE FUNCTION public.validate_onboarding_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only validate when transitioning into completed state
  IF NEW.onboarding_completed = true
     AND (OLD.onboarding_completed IS NULL OR OLD.onboarding_completed = false) THEN

    -- Admins can bypass (e.g. for support / data fixes)
    IF auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin') THEN
      RETURN NEW;
    END IF;

    -- Required photos
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

DROP TRIGGER IF EXISTS trg_validate_onboarding_completion ON public.profiles;
CREATE TRIGGER trg_validate_onboarding_completion
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.validate_onboarding_completion();

-- 3. Reset bypassed accounts so they go through onboarding properly
UPDATE public.profiles
SET onboarding_completed = false,
    onboarding_step = LEAST(onboarding_step, 3),
    updated_at = now()
WHERE onboarding_completed = true
  AND (photos IS NULL OR array_length(photos, 1) IS NULL OR array_length(photos, 1) < 3);
