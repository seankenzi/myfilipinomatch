
DO $$
DECLARE
  jid bigint;
BEGIN
  FOR jid IN
    SELECT jobid FROM cron.job
    WHERE command ILIKE '%process-account-deletions%'
       OR jobname ILIKE '%account-deletion%'
       OR jobname ILIKE '%process-account-deletions%'
  LOOP
    PERFORM cron.unschedule(jid);
  END LOOP;
EXCEPTION WHEN undefined_table OR insufficient_privilege THEN
  -- pg_cron not installed or not accessible; nothing to do
  NULL;
END$$;
