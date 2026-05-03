-- 1. Add column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_flagged boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_profiles_is_flagged ON public.profiles(is_flagged) WHERE is_flagged = true;

-- 2. Update admin_flag_user to also set the flag
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

  UPDATE public.profiles SET is_flagged = true WHERE id = target_user_id;

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

-- 3. Admin unflag function
CREATE OR REPLACE FUNCTION public.admin_unflag_user(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can unflag users';
  END IF;

  UPDATE public.profiles SET is_flagged = false WHERE id = target_user_id;

  -- Mark all related flag notifications as read
  UPDATE public.notifications
  SET read = true
  WHERE type = 'flagged_user' AND related_user_id = target_user_id;
END;
$$;

-- 4. Hide flagged from Discover (browse_profiles)
CREATE OR REPLACE FUNCTION public.browse_profiles(exclude_ids uuid[] DEFAULT '{}'::uuid[], filter_gender text DEFAULT NULL::text, filter_country text DEFAULT NULL::text, filter_user_type text DEFAULT NULL::text, filter_min_age integer DEFAULT NULL::integer, filter_max_age integer DEFAULT NULL::integer, result_limit integer DEFAULT 50, result_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, full_name text, age integer, gender text, country text, city text, province text, bio text, interests text[], relationship_intent text, relocation_intent text, photos text[], avatar_url text, is_verified boolean, user_type text, international_preference boolean, created_at timestamp with time zone, last_seen timestamp with time zone, education text, language text, want_children text, height_cm integer, weight_kg integer, is_premium boolean, relationship_status text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    p.id, p.full_name, p.age, p.gender, p.country, p.city, p.province, p.bio, p.interests,
    p.relationship_intent, p.relocation_intent, p.photos, p.avatar_url,
    p.is_verified, p.user_type, p.international_preference, p.created_at,
    p.last_seen, p.education, p.language, p.want_children, p.height_cm,
    p.weight_kg, p.is_premium, p.relationship_status
  FROM public.profiles p
  WHERE p.onboarding_completed = true
    AND p.id != auth.uid()
    AND COALESCE(p.is_flagged, false) = false
    AND NOT (p.id = ANY(exclude_ids))
    AND (filter_gender IS NULL OR p.gender = filter_gender)
    AND (filter_country IS NULL OR p.country = filter_country)
    AND (filter_user_type IS NULL OR p.user_type = filter_user_type)
    AND (filter_min_age IS NULL OR p.age >= filter_min_age)
    AND (filter_max_age IS NULL OR p.age <= filter_max_age)
  ORDER BY
    (EXISTS (SELECT 1 FROM public.profile_boosts b WHERE b.user_id = p.id AND b.expires_at > now())) DESC,
    (EXISTS (
      SELECT 1 FROM public.subscriptions s 
      WHERE s.user_id = p.id 
        AND s.status = 'active' 
        AND s.plan IN ('3-month', 'yearly')
    )) DESC,
    p.created_at DESC
  LIMIT result_limit
  OFFSET result_offset
$function$;

-- 5. Block messaging when sender or recipient is flagged
DROP POLICY IF EXISTS "Users can send messages in their matches" ON public.messages;
CREATE POLICY "Users can send messages in their matches"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_flagged = true)
  AND EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = messages.match_id
      AND ((m.user1_id = auth.uid()) OR (m.user2_id = auth.uid()))
      AND NOT EXISTS (
        SELECT 1 FROM public.profiles p2
        WHERE p2.id IN (m.user1_id, m.user2_id) AND p2.is_flagged = true
      )
  )
);

DROP POLICY IF EXISTS "Participants can send DM messages" ON public.dm_messages;
CREATE POLICY "Participants can send DM messages"
ON public.dm_messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_flagged = true)
  AND EXISTS (
    SELECT 1 FROM public.dm_conversations c
    WHERE c.id = dm_messages.conversation_id
      AND ((c.initiator_id = auth.uid()) OR (c.recipient_id = auth.uid()))
      AND NOT EXISTS (
        SELECT 1 FROM public.profiles p2
        WHERE p2.id IN (c.initiator_id, c.recipient_id) AND p2.is_flagged = true
      )
  )
);