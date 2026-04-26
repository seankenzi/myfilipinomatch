-- Enforce Latin-only names on profiles (rejects CJK / Cyrillic / etc.)
-- ~ regex uses POSIX classes; we explicitly reject any character that is NOT
-- in our allowed set (Latin letters, accented Latin, spaces, hyphens, apostrophes, dots).

CREATE OR REPLACE FUNCTION public.validate_profile_name()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  trimmed_name text;
BEGIN
  -- Skip if no name change
  IF NEW.full_name IS NULL THEN
    RETURN NEW;
  END IF;

  -- Admins bypass
  IF auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  trimmed_name := btrim(NEW.full_name);

  IF trimmed_name = '' THEN
    RETURN NEW;
  END IF;

  -- Reject any character outside Latin script + common name punctuation.
  -- \p{L} alone would allow CJK; we restrict to Latin + Latin-1 Supplement + Latin Extended ranges.
  IF trimmed_name !~ '^[A-Za-z\u00C0-\u024F\u1E00-\u1EFF\s''\u2019\-.\u00B7]+$' THEN
    RAISE EXCEPTION 'Name must use Latin letters only (no Chinese, Japanese, Korean, or other non-Latin scripts).';
  END IF;

  IF char_length(trimmed_name) < 2 THEN
    RAISE EXCEPTION 'Name must be at least 2 characters.';
  END IF;

  IF char_length(trimmed_name) > 100 THEN
    RAISE EXCEPTION 'Name must be less than 100 characters.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_profile_name_trigger ON public.profiles;
CREATE TRIGGER validate_profile_name_trigger
BEFORE INSERT OR UPDATE OF full_name ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.validate_profile_name();

-- Reset the offending user's name so they are forced to re-enter a valid one.
UPDATE public.profiles
SET full_name = ''
WHERE id = '9e0a8d1e-9f86-4905-ac5e-9d1e74c39719';