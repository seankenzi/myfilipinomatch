ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS preferred_min_age integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS preferred_max_age integer DEFAULT NULL;