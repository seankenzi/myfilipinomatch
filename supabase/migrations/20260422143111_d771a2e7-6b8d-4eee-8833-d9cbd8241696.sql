UPDATE public.page_visits
SET country = NULL
WHERE country IS NOT NULL
  AND (
    length(country) > 60
    OR country ILIKE '%http%'
    OR country ILIKE '%ipapi.co%'
    OR country ILIKE '%trial%'
    OR country ILIKE '%pricing%'
    OR country ILIKE '%sign up%'
    OR country ILIKE '%contact us%'
  );