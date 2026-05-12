
ALTER TABLE public.account_deletions
  ADD COLUMN IF NOT EXISTS user_email text,
  ADD COLUMN IF NOT EXISTS user_full_name text;

-- Backfill from existing profiles where still available
UPDATE public.account_deletions ad
SET user_email = p.email,
    user_full_name = p.full_name
FROM public.profiles p
WHERE ad.user_id = p.id
  AND (ad.user_email IS NULL OR ad.user_full_name IS NULL);

-- Auto-snapshot on insert if not provided
CREATE OR REPLACE FUNCTION public.snapshot_deletion_user_info()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_email IS NULL OR NEW.user_full_name IS NULL THEN
    SELECT
      COALESCE(NEW.user_email, p.email),
      COALESCE(NEW.user_full_name, p.full_name)
    INTO NEW.user_email, NEW.user_full_name
    FROM public.profiles p
    WHERE p.id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS snapshot_deletion_user_info_trigger ON public.account_deletions;
CREATE TRIGGER snapshot_deletion_user_info_trigger
BEFORE INSERT ON public.account_deletions
FOR EACH ROW
EXECUTE FUNCTION public.snapshot_deletion_user_info();
