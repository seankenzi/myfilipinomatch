-- Add type column to matches
ALTER TABLE public.matches 
ADD COLUMN type text NOT NULL DEFAULT 'mutual' 
CHECK (type IN ('mutual', 'direct_message'));

-- Add index for filtering by type
CREATE INDEX idx_matches_type ON public.matches (type);