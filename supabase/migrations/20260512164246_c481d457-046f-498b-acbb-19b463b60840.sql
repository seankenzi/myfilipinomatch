
CREATE OR REPLACE FUNCTION public.admin_get_user_activity(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can view user activity';
  END IF;

  SELECT jsonb_build_object(
    'profile', (
      SELECT jsonb_build_object(
        'id', p.id, 'full_name', p.full_name, 'email', p.email,
        'is_premium', p.is_premium, 'is_verified', p.is_verified,
        'is_flagged', p.is_flagged, 'created_at', p.created_at,
        'last_seen', p.last_seen, 'country', p.country, 'city', p.city
      )
      FROM profiles p WHERE p.id = target_user_id
    ),
    'counts', jsonb_build_object(
      'likes_sent', (SELECT count(*) FROM likes WHERE liker_id = target_user_id),
      'likes_received', (SELECT count(*) FROM likes WHERE liked_id = target_user_id),
      'matches', (SELECT count(*) FROM matches WHERE user1_id = target_user_id OR user2_id = target_user_id),
      'messages_sent', (SELECT count(*) FROM messages WHERE sender_id = target_user_id),
      'dm_sent', (SELECT count(*) FROM dm_messages WHERE sender_id = target_user_id),
      'video_calls', (SELECT count(*) FROM video_call_sessions WHERE user_id = target_user_id),
      'reports_filed', (SELECT count(*) FROM reports WHERE reporter_id = target_user_id),
      'reports_received', (SELECT count(*) FROM reports WHERE reported_id = target_user_id)
    ),
    'likes_sent', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', l.id, 'created_at', l.created_at,
        'other_user_id', l.liked_id,
        'other_user_name', p.full_name, 'other_user_email', p.email
      ) ORDER BY l.created_at DESC)
      FROM (SELECT * FROM likes WHERE liker_id = target_user_id ORDER BY created_at DESC LIMIT 200) l
      LEFT JOIN profiles p ON p.id = l.liked_id
    ), '[]'::jsonb),
    'likes_received', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', l.id, 'created_at', l.created_at,
        'other_user_id', l.liker_id,
        'other_user_name', p.full_name, 'other_user_email', p.email
      ) ORDER BY l.created_at DESC)
      FROM (SELECT * FROM likes WHERE liked_id = target_user_id ORDER BY created_at DESC LIMIT 200) l
      LEFT JOIN profiles p ON p.id = l.liker_id
    ), '[]'::jsonb),
    'matches', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', m.id, 'created_at', m.created_at,
        'other_user_id', CASE WHEN m.user1_id = target_user_id THEN m.user2_id ELSE m.user1_id END,
        'other_user_name', p.full_name, 'other_user_email', p.email
      ) ORDER BY m.created_at DESC)
      FROM (
        SELECT * FROM matches
        WHERE user1_id = target_user_id OR user2_id = target_user_id
        ORDER BY created_at DESC LIMIT 200
      ) m
      LEFT JOIN profiles p ON p.id = CASE WHEN m.user1_id = target_user_id THEN m.user2_id ELSE m.user1_id END
    ), '[]'::jsonb),
    'messages_sent', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', msg.id, 'created_at', msg.created_at, 'content', msg.content,
        'recipient_id', CASE WHEN m.user1_id = target_user_id THEN m.user2_id ELSE m.user1_id END,
        'recipient_name', p.full_name, 'recipient_email', p.email
      ) ORDER BY msg.created_at DESC)
      FROM (SELECT * FROM messages WHERE sender_id = target_user_id ORDER BY created_at DESC LIMIT 200) msg
      JOIN matches m ON m.id = msg.match_id
      LEFT JOIN profiles p ON p.id = CASE WHEN m.user1_id = target_user_id THEN m.user2_id ELSE m.user1_id END
    ), '[]'::jsonb),
    'dm_sent', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', dm.id, 'created_at', dm.created_at, 'content', dm.content,
        'recipient_id', CASE WHEN c.initiator_id = target_user_id THEN c.recipient_id ELSE c.initiator_id END,
        'recipient_name', p.full_name, 'recipient_email', p.email
      ) ORDER BY dm.created_at DESC)
      FROM (SELECT * FROM dm_messages WHERE sender_id = target_user_id ORDER BY created_at DESC LIMIT 200) dm
      JOIN dm_conversations c ON c.id = dm.conversation_id
      LEFT JOIN profiles p ON p.id = CASE WHEN c.initiator_id = target_user_id THEN c.recipient_id ELSE c.initiator_id END
    ), '[]'::jsonb),
    'video_calls', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', v.id, 'started_at', v.started_at, 'ended_at', v.ended_at,
        'duration_seconds', v.duration_seconds,
        'other_user_id', CASE WHEN m.user1_id = target_user_id THEN m.user2_id ELSE m.user1_id END,
        'other_user_name', p.full_name, 'other_user_email', p.email
      ) ORDER BY v.started_at DESC)
      FROM (SELECT * FROM video_call_sessions WHERE user_id = target_user_id ORDER BY started_at DESC LIMIT 200) v
      LEFT JOIN matches m ON m.id = v.match_id
      LEFT JOIN profiles p ON p.id = CASE WHEN m.user1_id = target_user_id THEN m.user2_id ELSE m.user1_id END
    ), '[]'::jsonb),
    'reports_filed', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', r.id, 'created_at', r.created_at, 'reason', r.reason,
        'details', r.details, 'status', r.status,
        'other_user_id', r.reported_id,
        'other_user_name', p.full_name, 'other_user_email', p.email
      ) ORDER BY r.created_at DESC)
      FROM (SELECT * FROM reports WHERE reporter_id = target_user_id ORDER BY created_at DESC LIMIT 200) r
      LEFT JOIN profiles p ON p.id = r.reported_id
    ), '[]'::jsonb),
    'reports_received', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', r.id, 'created_at', r.created_at, 'reason', r.reason,
        'details', r.details, 'status', r.status,
        'other_user_id', r.reporter_id,
        'other_user_name', p.full_name, 'other_user_email', p.email
      ) ORDER BY r.created_at DESC)
      FROM (SELECT * FROM reports WHERE reported_id = target_user_id ORDER BY created_at DESC LIMIT 200) r
      LEFT JOIN profiles p ON p.id = r.reporter_id
    ), '[]'::jsonb),
    'flag_history', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', f.id, 'created_at', f.created_at, 'action', f.action,
        'reason', f.reason, 'admin_id', f.admin_id,
        'admin_name', p.full_name, 'admin_email', p.email
      ) ORDER BY f.created_at DESC)
      FROM (SELECT * FROM flag_audit_log WHERE target_user_id = admin_get_user_activity.target_user_id ORDER BY created_at DESC LIMIT 200) f
      LEFT JOIN profiles p ON p.id = f.admin_id
    ), '[]'::jsonb)
  ) INTO result;

  RETURN result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_get_user_activity(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_user_activity(uuid) TO authenticated;
