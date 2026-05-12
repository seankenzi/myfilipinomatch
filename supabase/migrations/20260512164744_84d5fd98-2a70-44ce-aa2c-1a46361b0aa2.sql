
CREATE OR REPLACE FUNCTION public.admin_get_recent_activity(
  filter_type text DEFAULT NULL,
  result_limit integer DEFAULT 100
)
RETURNS TABLE (
  activity_type text,
  activity_id uuid,
  created_at timestamptz,
  actor_id uuid,
  actor_name text,
  actor_email text,
  target_id uuid,
  target_name text,
  target_email text,
  content text,
  meta jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can view activity';
  END IF;

  RETURN QUERY
  SELECT * FROM (
    -- Likes
    SELECT 'like'::text, l.id, l.created_at,
      l.liker_id, ap.full_name, ap.email,
      l.liked_id, tp.full_name, tp.email,
      NULL::text, NULL::jsonb
    FROM likes l
    LEFT JOIN profiles ap ON ap.id = l.liker_id
    LEFT JOIN profiles tp ON tp.id = l.liked_id
    WHERE filter_type IS NULL OR filter_type = 'like'

    UNION ALL
    -- Matches
    SELECT 'match'::text, m.id, m.created_at,
      m.user1_id, ap.full_name, ap.email,
      m.user2_id, tp.full_name, tp.email,
      NULL::text, NULL::jsonb
    FROM matches m
    LEFT JOIN profiles ap ON ap.id = m.user1_id
    LEFT JOIN profiles tp ON tp.id = m.user2_id
    WHERE filter_type IS NULL OR filter_type = 'match'

    UNION ALL
    -- Match messages
    SELECT 'message'::text, msg.id, msg.created_at,
      msg.sender_id, ap.full_name, ap.email,
      CASE WHEN m.user1_id = msg.sender_id THEN m.user2_id ELSE m.user1_id END,
      tp.full_name, tp.email,
      msg.content, NULL::jsonb
    FROM messages msg
    JOIN matches m ON m.id = msg.match_id
    LEFT JOIN profiles ap ON ap.id = msg.sender_id
    LEFT JOIN profiles tp ON tp.id = CASE WHEN m.user1_id = msg.sender_id THEN m.user2_id ELSE m.user1_id END
    WHERE filter_type IS NULL OR filter_type = 'message'

    UNION ALL
    -- Direct messages
    SELECT 'dm'::text, dm.id, dm.created_at,
      dm.sender_id, ap.full_name, ap.email,
      CASE WHEN c.initiator_id = dm.sender_id THEN c.recipient_id ELSE c.initiator_id END,
      tp.full_name, tp.email,
      dm.content, NULL::jsonb
    FROM dm_messages dm
    JOIN dm_conversations c ON c.id = dm.conversation_id
    LEFT JOIN profiles ap ON ap.id = dm.sender_id
    LEFT JOIN profiles tp ON tp.id = CASE WHEN c.initiator_id = dm.sender_id THEN c.recipient_id ELSE c.initiator_id END
    WHERE filter_type IS NULL OR filter_type = 'dm'

    UNION ALL
    -- Video calls
    SELECT 'video_call'::text, v.id, v.started_at,
      v.user_id, ap.full_name, ap.email,
      CASE WHEN m.user1_id = v.user_id THEN m.user2_id ELSE m.user1_id END,
      tp.full_name, tp.email,
      NULL::text,
      jsonb_build_object('duration_seconds', v.duration_seconds, 'ended_at', v.ended_at)
    FROM video_call_sessions v
    LEFT JOIN matches m ON m.id = v.match_id
    LEFT JOIN profiles ap ON ap.id = v.user_id
    LEFT JOIN profiles tp ON tp.id = CASE WHEN m.user1_id = v.user_id THEN m.user2_id ELSE m.user1_id END
    WHERE filter_type IS NULL OR filter_type = 'video_call'

    UNION ALL
    -- Reports
    SELECT 'report'::text, r.id, r.created_at,
      r.reporter_id, ap.full_name, ap.email,
      r.reported_id, tp.full_name, tp.email,
      r.details,
      jsonb_build_object('reason', r.reason, 'status', r.status)
    FROM reports r
    LEFT JOIN profiles ap ON ap.id = r.reporter_id
    LEFT JOIN profiles tp ON tp.id = r.reported_id
    WHERE filter_type IS NULL OR filter_type = 'report'
  ) combined
  ORDER BY combined.created_at DESC
  LIMIT result_limit;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_get_recent_activity(text, integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_recent_activity(text, integer) TO authenticated;
