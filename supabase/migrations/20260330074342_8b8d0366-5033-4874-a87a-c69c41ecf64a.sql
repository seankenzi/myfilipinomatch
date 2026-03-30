
-- Fix MCKenzi Dern's premium status directly
UPDATE profiles SET is_premium = true WHERE id = 'aad78351-7cf8-420b-9580-d4f8aa529d51';
UPDATE subscriptions SET plan = 'yearly', status = 'active', current_period_end = (now() + interval '1 year')::timestamptz WHERE user_id = 'aad78351-7cf8-420b-9580-d4f8aa529d51';

-- Ensure admins can update profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Admins can update any profile'
  ) THEN
    CREATE POLICY "Admins can update any profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'subscriptions' AND policyname = 'Admins can manage subscriptions'
  ) THEN
    CREATE POLICY "Admins can manage subscriptions"
    ON public.subscriptions
    FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;
