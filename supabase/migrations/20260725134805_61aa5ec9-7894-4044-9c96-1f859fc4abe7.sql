
CREATE OR REPLACE FUNCTION public.get_conversation_list(p_user_id uuid)
RETURNS TABLE (
  conversation_id uuid,
  source text,
  match_type text,
  activity_at timestamptz,
  other_user_id uuid,
  other_full_name text,
  other_photo text,
  other_avatar_url text,
  other_is_verified boolean,
  other_age integer,
  other_city text,
  other_country text,
  other_is_premium boolean,
  other_last_seen timestamptz,
  last_message_content text,
  last_message_created_at timestamptz,
  last_message_sender_id uuid,
  last_message_read boolean,
  unread_count integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH blocked AS (
    SELECT blocked_id FROM public.blocked_users WHERE blocker_id = p_user_id
  ),
  convos AS (
    SELECT
      m.id AS conversation_id,
      'match'::text AS source,
      m.type AS match_type,
      m.created_at AS activity_at,
      CASE WHEN m.user1_id = p_user_id THEN m.user2_id ELSE m.user1_id END AS other_user_id
    FROM public.matches m
    WHERE (m.user1_id = p_user_id OR m.user2_id = p_user_id)
      AND (CASE WHEN m.user1_id = p_user_id THEN m.user2_id ELSE m.user1_id END)
          NOT IN (SELECT blocked_id FROM blocked)
    UNION ALL
    SELECT
      c.id,
      'dm'::text,
      'direct_message'::text,
      c.updated_at,
      CASE WHEN c.initiator_id = p_user_id THEN c.recipient_id ELSE c.initiator_id END
    FROM public.dm_conversations c
    WHERE (c.initiator_id = p_user_id OR c.recipient_id = p_user_id)
      AND (CASE WHEN c.initiator_id = p_user_id THEN c.recipient_id ELSE c.initiator_id END)
          NOT IN (SELECT blocked_id FROM blocked)
  )
  SELECT
    cv.conversation_id,
    cv.source,
    cv.match_type,
    COALESCE(lm.created_at, cv.activity_at) AS activity_at,
    p.id,
    p.full_name,
    CASE
      WHEN p.photos IS NOT NULL AND array_length(p.photos, 1) > 0 THEN p.photos[1]
      ELSE p.avatar_url
    END AS other_photo,
    p.avatar_url,
    p.is_verified,
    p.age,
    p.city,
    p.country,
    p.is_premium,
    p.last_seen,
    lm.content,
    lm.created_at,
    lm.sender_id,
    lm.read,
    COALESCE(uc.unread_count, 0)::integer
  FROM convos cv
  JOIN public.profiles p ON p.id = cv.other_user_id
  LEFT JOIN LATERAL (
    SELECT content, created_at, sender_id, read
    FROM public.messages
    WHERE cv.source = 'match' AND match_id = cv.conversation_id
    ORDER BY created_at DESC
    LIMIT 1
  ) lm_match ON cv.source = 'match'
  LEFT JOIN LATERAL (
    SELECT content, created_at, sender_id, read
    FROM public.dm_messages
    WHERE cv.source = 'dm' AND conversation_id = cv.conversation_id
    ORDER BY created_at DESC
    LIMIT 1
  ) lm_dm ON cv.source = 'dm'
  LEFT JOIN LATERAL (
    SELECT
      COALESCE(lm_match.content, lm_dm.content) AS content,
      COALESCE(lm_match.created_at, lm_dm.created_at) AS created_at,
      COALESCE(lm_match.sender_id, lm_dm.sender_id) AS sender_id,
      COALESCE(lm_match.read, lm_dm.read) AS read
  ) lm ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::int AS unread_count
    FROM public.messages
    WHERE cv.source = 'match'
      AND match_id = cv.conversation_id
      AND read = false
      AND sender_id <> p_user_id
  ) uc_match ON cv.source = 'match'
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::int AS unread_count
    FROM public.dm_messages
    WHERE cv.source = 'dm'
      AND conversation_id = cv.conversation_id
      AND read = false
      AND sender_id <> p_user_id
  ) uc_dm ON cv.source = 'dm'
  LEFT JOIN LATERAL (
    SELECT COALESCE(uc_match.unread_count, uc_dm.unread_count) AS unread_count
  ) uc ON true
  WHERE auth.uid() = p_user_id
  ORDER BY activity_at DESC NULLS LAST;
$$;

REVOKE ALL ON FUNCTION public.get_conversation_list(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_conversation_list(uuid) TO authenticated;
