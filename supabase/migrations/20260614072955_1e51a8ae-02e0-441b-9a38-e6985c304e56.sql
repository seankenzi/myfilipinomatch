-- Subscriptions: prevent regular authenticated clients from reading Stripe IDs.
-- Service role and admin queries (which use the same authenticated role from the dashboard
-- but go through admin-only RLS policies) need these for management, so we keep them granted
-- to service_role. Admin dashboard now selects explicit non-stripe columns.
REVOKE SELECT (stripe_customer_id, stripe_subscription_id) ON public.subscriptions FROM authenticated;
REVOKE SELECT (stripe_customer_id, stripe_subscription_id) ON public.subscriptions FROM anon;

-- cookie_consents: drop owner self-read; admins keep access via has_role policy.
DROP POLICY IF EXISTS "Users can view own consents" ON public.cookie_consents;

-- page_visits: drop owner self-read; admins keep access via has_role policy.
DROP POLICY IF EXISTS "Users can view own visits" ON public.page_visits;