CREATE OR REPLACE FUNCTION public.notify_admins_new_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_record RECORD;
BEGIN
  FOR admin_record IN
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, type, title, body, related_user_id)
    VALUES (
      admin_record.user_id,
      'new_signup',
      'New User Signup 🆕',
      COALESCE(NEW.full_name, 'A new user') || ' just signed up and may need verification.',
      NEW.id
    );
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_profile_notify_admins
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.notify_admins_new_signup();