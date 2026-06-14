DROP FUNCTION IF EXISTS public.admin_remove_photo(uuid, text, text);

CREATE OR REPLACE FUNCTION public.admin_remove_photo(
  target_user_id uuid,
  photo_url text,
  p_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_avatar text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can remove photos';
  END IF;

  IF photo_url IS NULL OR length(trim(photo_url)) = 0 THEN
    RAISE EXCEPTION 'photo_url is required';
  END IF;

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
$$;

GRANT EXECUTE ON FUNCTION public.admin_remove_photo(uuid, text, text) TO authenticated;