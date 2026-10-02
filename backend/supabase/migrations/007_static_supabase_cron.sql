BEGIN;
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Secrets are configured in Supabase Vault, never in this migration.
CREATE OR REPLACE FUNCTION public.invoke_atlantica_notifications()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE project_url text; cron_secret text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.notification_jobs WHERE state = 'pending'
    AND next <= (extract(epoch FROM now()) * 1000)::bigint
    AND lease_until <= (extract(epoch FROM now()) * 1000)::bigint) THEN RETURN; END IF;
  SELECT decrypted_secret INTO project_url FROM vault.decrypted_secrets WHERE name = 'atlantica_project_url';
  SELECT decrypted_secret INTO cron_secret FROM vault.decrypted_secrets WHERE name = 'atlantica_cron_secret';
  IF project_url IS NULL OR cron_secret IS NULL THEN
    RAISE WARNING 'Configure atlantica_project_url y atlantica_cron_secret en Vault';
    RETURN;
  END IF;
  PERFORM net.http_get(
    url := rtrim(project_url, '/') || '/functions/v1/atlantica-api/api/internal/notifications',
    headers := jsonb_build_object('Authorization', 'Bearer ' || cron_secret),
    timeout_milliseconds := 60000
  );
END;
$$;
REVOKE ALL ON FUNCTION public.invoke_atlantica_notifications() FROM PUBLIC, anon, authenticated;

CREATE TABLE public.static_site_rebuild (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  version bigint NOT NULL DEFAULT 0,
  accepted_version bigint NOT NULL DEFAULT 0,
  requested_version bigint,
  request_id bigint,
  requested_at timestamptz
);
INSERT INTO public.static_site_rebuild(id) VALUES (true);
ALTER TABLE public.static_site_rebuild ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.static_site_rebuild FROM anon, authenticated;
GRANT ALL ON public.static_site_rebuild TO service_role;

CREATE OR REPLACE FUNCTION public.queue_static_site_rebuild()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.static_site_rebuild SET version = version + 1 WHERE id;
  RETURN NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.queue_static_site_rebuild() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER posts_queue_static_rebuild AFTER INSERT OR UPDATE OR DELETE ON public.posts
  FOR EACH STATEMENT EXECUTE FUNCTION public.queue_static_site_rebuild();

CREATE OR REPLACE FUNCTION public.invoke_atlantica_rebuild()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE job public.static_site_rebuild; hook text; response_status integer; response_error text;
BEGIN
  SELECT * INTO job FROM public.static_site_rebuild WHERE id FOR UPDATE;
  IF job.request_id IS NOT NULL THEN
    SELECT status_code, error_msg INTO response_status, response_error
      FROM net._http_response WHERE id = job.request_id;
    IF response_status BETWEEN 200 AND 299 THEN
      UPDATE public.static_site_rebuild SET accepted_version = job.requested_version,
        request_id = NULL, requested_at = NULL WHERE id;
      job.accepted_version := job.requested_version;
    ELSIF response_status IS NULL AND response_error IS NULL AND job.requested_at > now() - interval '5 minutes' THEN
      RETURN;
    ELSE
      UPDATE public.static_site_rebuild SET request_id = NULL, requested_at = NULL WHERE id;
    END IF;
  END IF;
  IF job.version <= job.accepted_version THEN RETURN; END IF;
  SELECT decrypted_secret INTO hook FROM vault.decrypted_secrets WHERE name = 'atlantica_deploy_hook';
  IF hook IS NULL THEN RETURN; END IF;
  UPDATE public.static_site_rebuild SET
    request_id = net.http_post(url := hook, body := '{}'::jsonb, timeout_milliseconds := 10000),
    requested_version = version, requested_at = now() WHERE id;
END;
$$;
REVOKE ALL ON FUNCTION public.invoke_atlantica_rebuild() FROM PUBLIC, anon, authenticated;
SELECT cron.schedule('atlantica-notifications', '* * * * *', 'SELECT public.invoke_atlantica_notifications()');
SELECT cron.schedule('atlantica-static-rebuild', '*/5 * * * *', 'SELECT public.invoke_atlantica_rebuild()');
COMMIT;
