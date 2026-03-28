ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS education text,
  ADD COLUMN IF NOT EXISTS language text,
  ADD COLUMN IF NOT EXISTS want_children text,
  ADD COLUMN IF NOT EXISTS height_cm integer,
  ADD COLUMN IF NOT EXISTS weight_kg integer,
  ADD COLUMN IF NOT EXISTS relationship_status text;