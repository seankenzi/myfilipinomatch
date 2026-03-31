-- Fix the corrupt session with absurdly high duration
UPDATE video_call_sessions
SET duration_seconds = EXTRACT(EPOCH FROM (ended_at - started_at))::integer
WHERE duration_seconds > 7200;

-- Clean up orphaned callee sessions (no ended_at, user 718d5707 is the callee)
DELETE FROM video_call_sessions
WHERE user_id = '718d5707-c6dc-420f-bbe1-434a1c2c54aa'
  AND ended_at IS NULL
  AND duration_seconds IS NULL;