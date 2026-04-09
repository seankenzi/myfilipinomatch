UPDATE app_config SET value = '1.0.0', updated_at = now() WHERE key = 'min_app_version';
UPDATE app_config SET value = '1.0.3', updated_at = now() WHERE key = 'latest_app_version';