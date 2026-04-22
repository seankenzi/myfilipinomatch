-- Bypass triggers in this transaction only, so we can grandfather these accounts
SET LOCAL session_replication_role = 'replica';

UPDATE public.profiles
SET onboarding_completed = true,
    updated_at = now()
WHERE id IN (
  'f6cfdec3-6c22-4fcb-85f9-c37458c51d9e',
  '5df5162b-6277-4a88-8ea4-431f689edaff',
  'f3a0456b-f5f0-45f9-8d00-056726ba3a89',
  '65748fb1-6130-439f-9ab3-e8781fc8d029',
  'd791b7bf-6c46-4b9a-9586-9535f97720b0',
  'f25f465d-8974-4917-8419-962477b3c5d9',
  'fd5c06e4-3bca-46c0-b59a-a0e99b6b6586',
  '1c3b16ae-bee5-470e-9e57-6e89d26bca82',
  '718d5707-c6dc-420f-bbe1-434a1c2c54aa',
  'aad78351-7cf8-420b-9580-d4f8aa529d51'
);

SET LOCAL session_replication_role = 'origin';