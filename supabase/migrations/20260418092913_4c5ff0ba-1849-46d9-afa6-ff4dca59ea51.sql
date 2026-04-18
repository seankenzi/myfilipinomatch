-- Delete all test accounts and their related data
-- Deleting from auth.users will cascade delete the profile and related rows via FK references

DO $$
DECLARE
  test_user_ids uuid[];
BEGIN
  -- Collect test user IDs
  SELECT array_agg(id) INTO test_user_ids
  FROM public.profiles
  WHERE email ILIKE '%@test.com'
     OR email ILIKE '%@test.lovable.app'
     OR email ILIKE '%@filoheart-test.com';

  IF test_user_ids IS NULL OR array_length(test_user_ids, 1) = 0 THEN
    RAISE NOTICE 'No test accounts found';
    RETURN;
  END IF;

  -- Delete dependent rows in public schema (cleanup before auth.users delete)
  DELETE FROM public.likes WHERE liker_id = ANY(test_user_ids) OR liked_id = ANY(test_user_ids);
  DELETE FROM public.messages WHERE sender_id = ANY(test_user_ids);
  DELETE FROM public.matches WHERE user1_id = ANY(test_user_ids) OR user2_id = ANY(test_user_ids);
  DELETE FROM public.dm_messages WHERE sender_id = ANY(test_user_ids);
  DELETE FROM public.dm_conversations WHERE initiator_id = ANY(test_user_ids) OR recipient_id = ANY(test_user_ids);
  DELETE FROM public.notifications WHERE user_id = ANY(test_user_ids) OR related_user_id = ANY(test_user_ids);
  DELETE FROM public.blocked_users WHERE blocker_id = ANY(test_user_ids) OR blocked_id = ANY(test_user_ids);
  DELETE FROM public.reports WHERE reporter_id = ANY(test_user_ids) OR reported_id = ANY(test_user_ids);
  DELETE FROM public.profile_boosts WHERE user_id = ANY(test_user_ids);
  DELETE FROM public.verifications WHERE user_id = ANY(test_user_ids);
  DELETE FROM public.subscriptions WHERE user_id = ANY(test_user_ids);
  DELETE FROM public.video_call_sessions WHERE user_id = ANY(test_user_ids);
  DELETE FROM public.video_call_signals WHERE caller_id = ANY(test_user_ids) OR callee_id = ANY(test_user_ids);
  DELETE FROM public.push_subscriptions WHERE user_id = ANY(test_user_ids);
  DELETE FROM public.feature_flags WHERE user_id = ANY(test_user_ids);
  DELETE FROM public.account_deletions WHERE user_id = ANY(test_user_ids);
  DELETE FROM public.user_roles WHERE user_id = ANY(test_user_ids);
  DELETE FROM public.profiles WHERE id = ANY(test_user_ids);

  -- Finally remove the auth users
  DELETE FROM auth.users WHERE id = ANY(test_user_ids);

  RAISE NOTICE 'Deleted % test accounts', array_length(test_user_ids, 1);
END $$;