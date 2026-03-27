
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS user_type text,
  ADD COLUMN IF NOT EXISTS international_preference boolean DEFAULT null,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;
