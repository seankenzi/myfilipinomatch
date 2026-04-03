
CREATE OR REPLACE FUNCTION public.validate_onboarding_photos()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Only check when onboarding_completed is being set to true
  IF NEW.onboarding_completed = true AND (OLD.onboarding_completed IS NULL OR OLD.onboarding_completed = false) THEN
    IF NEW.photos IS NULL OR array_length(NEW.photos, 1) IS NULL OR array_length(NEW.photos, 1) < 3 THEN
      RAISE EXCEPTION 'At least 3 photos are required to complete onboarding';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_onboarding_photos_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.validate_onboarding_photos();
