-- Audit log table
CREATE TABLE public.flag_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  target_user_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('flag','unflag')),
  reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_flag_audit_target ON public.flag_audit_log(target_user_id, created_at DESC);
CREATE INDEX idx_flag_audit_created ON public.flag_audit_log(created_at DESC);

ALTER TABLE public.flag_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view flag audit log"
ON public.flag_audit_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Update flag function to write audit row
CREATE OR REPLACE FUNCTION public.admin_flag_user(target_user_id uuid, reason text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  inserted_count integer := 0;
  target_name text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can flag users';
  END IF;

  SELECT full_name INTO target_name FROM public.profiles WHERE id = target_user_id;

  UPDATE public.profiles SET is_flagged = true WHERE id = target_user_id;

  INSERT INTO public.flag_audit_log (admin_id, target_user_id, action, reason)
  VALUES (auth.uid(), target_user_id, 'flag', reason);

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
$function$;

-- Update unflag function to write audit row (accept optional reason)
CREATE OR REPLACE FUNCTION public.admin_unflag_user(target_user_id uuid, reason text DEFAULT NULL)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can unflag users';
  END IF;

  UPDATE public.profiles SET is_flagged = false WHERE id = target_user_id;

  INSERT INTO public.flag_audit_log (admin_id, target_user_id, action, reason)
  VALUES (auth.uid(), target_user_id, 'unflag', reason);

  UPDATE public.notifications
  SET read = true
  WHERE type = 'flagged_user' AND related_user_id = target_user_id;
END;
$function$;