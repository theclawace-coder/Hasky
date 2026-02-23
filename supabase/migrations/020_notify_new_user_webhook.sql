-- Migration 020: Notify product owner when a new user signs up
--
-- When a row is inserted into profiles, a trigger calls the notify-new-user Edge Function,
-- which sends an email to PLATFORM_ADMIN_EMAIL via Resend.
--
-- SETUP REQUIRED:
-- 1. Deploy the notify-new-user Edge Function (no-verify-jwt)
-- 2. Set secrets: RESEND_API_KEY, RESEND_FROM_EMAIL, PLATFORM_ADMIN_EMAIL
-- 3. Add webhook config so the trigger can call the function:
--
--    INSERT INTO public.webhook_config (key, value) VALUES
--      ('notify_new_user_url', 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/notify-new-user'),
--      ('notify_new_user_anon_key', 'YOUR_ANON_KEY')
--    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
--
--    For local dev, use: 'http://host.docker.internal:54321/functions/v1/notify-new-user'
--
-- If webhook_config is not populated, the trigger skips the notification (insert still succeeds).

-- Enable pg_net for async HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Config table for webhook URL and anon key (avoids hardcoding in migrations)
CREATE TABLE IF NOT EXISTS public.webhook_config (
  key text primary key,
  value text
);

-- Restrict access: only platform admins can read; only postgres/service can write
ALTER TABLE public.webhook_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Platform admins can read webhook_config"
  ON public.webhook_config FOR SELECT
  TO authenticated
  USING (public.is_platform_admin());
-- No INSERT/UPDATE policy for authenticated: use SQL Editor (postgres) to configure

-- Trigger function: on profiles INSERT, call the Edge Function via pg_net
CREATE OR REPLACE FUNCTION public.notify_new_user_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_url text;
  anon_key text;
  fn_url text;
  payload jsonb;
BEGIN
  SELECT value INTO base_url FROM public.webhook_config WHERE key = 'notify_new_user_url' LIMIT 1;
  SELECT value INTO anon_key FROM public.webhook_config WHERE key = 'notify_new_user_anon_key' LIMIT 1;

  IF base_url IS NULL OR trim(coalesce(base_url, '')) = '' OR
     anon_key IS NULL OR trim(coalesce(anon_key, '')) = '' THEN
    RETURN NEW;
  END IF;

  fn_url := rtrim(base_url, '/');
  IF fn_url NOT LIKE '%/functions/v1/notify-new-user' THEN
    fn_url := fn_url || '/functions/v1/notify-new-user';
  END IF;

  payload := jsonb_build_object(
    'type', 'INSERT',
    'table', 'profiles',
    'schema', 'public',
    'record', to_jsonb(NEW),
    'old_record', NULL
  );

  PERFORM net.http_post(
    url := fn_url,
    body := payload,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    ),
    timeout_milliseconds := 5000
  );

  RETURN NEW;
END;
$$;

-- Trigger on profiles INSERT
DROP TRIGGER IF EXISTS on_profile_insert_notify_new_user ON public.profiles;
CREATE TRIGGER on_profile_insert_notify_new_user
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_user_on_insert();
