
-- Allow admin photo removal to bypass the min 3 photos rule.
-- The admin_remove_photo function sets a session-local flag that
-- validate_onboarding_completion checks to skip the photo count guard.

CREATE OR REPLACE FUNCTION public.validate_onboarding_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  bypass_photos text;
BEGIN
  bypass_photos := current_setting('app.bypass_photo_min', true);

  IF NEW.onboarding_completed = true THEN
    IF COALESCE(bypass_photos, '') <> 'on' THEN
      IF NEW.photos IS NULL
         OR array_length(NEW.photos, 1) IS NULL
         OR array_length(NEW.photos, 1) < 3 THEN
        RAISE EXCEPTION 'Onboarding requires at least 3 photos';
      END IF;
    END IF;

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

CREATE OR REPLACE FUNCTION public.admin_remove_photo(target_user_id uuid, photo_url text, p_reason text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_avatar text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can remove photos';
  END IF;

  IF photo_url IS NULL OR length(trim(photo_url)) = 0 THEN
    RAISE EXCEPTION 'photo_url is required';
  END IF;

  -- Bypass the min-3-photos rule for this transaction.
  PERFORM set_config('app.bypass_photo_min', 'on', true);

  UPDATE public.profiles
  SET photos = array_remove(COALESCE(photos, ARRAY[]::text[]), photo_url)
  WHERE id = target_user_id;

  SELECT avatar_url INTO current_avatar FROM public.profiles WHERE id = target_user_id;
  IF current_avatar = photo_url THEN
    UPDATE public.profiles SET avatar_url = NULL WHERE id = target_user_id;
  END IF;

  INSERT INTO public.flag_audit_log (admin_id, target_user_id, action, reason)
  VALUES (
    auth.uid(),
    target_user_id,
    'remove_photo',
    COALESCE(p_reason, '') || ' | photo: ' || photo_url
  );

  UPDATE public.reports r
  SET status = 'resolved'
  WHERE r.reported_id = target_user_id
    AND r.reason = 'inappropriate_photo'
    AND r.status = 'pending'
    AND (r.details IS NULL OR r.details LIKE '%' || photo_url || '%');
END;
$function$;
