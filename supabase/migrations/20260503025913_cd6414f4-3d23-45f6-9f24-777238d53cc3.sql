CREATE OR REPLACE FUNCTION public.admin_flag_user(target_user_id uuid, reason text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted_count integer := 0;
  target_name text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can flag users';
  END IF;

  SELECT full_name INTO target_name FROM public.profiles WHERE id = target_user_id;

  INSERT INTO public.notifications (user_id, type, title, body, related_user_id)
  SELECT ur.user_id,
         'flagged_user',
         'User Flagged 🚩',
         COALESCE(target_name, 'A user') || ' was flagged for review. Reason: ' || reason,
         target_user_id
  FROM public.user_roles ur
  WHERE ur.role = 'admin';

  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RETURN inserted_count;
END;
$$;