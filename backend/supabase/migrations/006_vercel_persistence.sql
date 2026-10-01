BEGIN;

-- Estado compartido entre instancias de Vercel. Acceso exclusivo del backend.
CREATE TABLE public.notification_jobs (
  key text PRIMARY KEY,
  channel text NOT NULL CHECK (channel IN ('email', 'whatsapp')),
  "to" text NOT NULL,
  "values" jsonb NOT NULL,
  event text NOT NULL,
  office boolean NOT NULL DEFAULT false,
  attempts integer NOT NULL DEFAULT 0,
  next bigint NOT NULL,
  state text NOT NULL CHECK (state IN ('pending', 'sent', 'failed')),
  lease_until bigint NOT NULL DEFAULT 0,
  lease_token uuid
);
ALTER TABLE public.notification_jobs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.notification_jobs FROM anon, authenticated;
GRANT ALL ON public.notification_jobs TO service_role;
CREATE INDEX notification_jobs_due ON public.notification_jobs(next) WHERE state = 'pending';

CREATE FUNCTION public.claim_notification_jobs(batch_size integer DEFAULT 10)
RETURNS SETOF public.notification_jobs
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.notification_jobs SET state = 'failed', lease_token = NULL, lease_until = 0
  WHERE state = 'pending' AND attempts >= 3
    AND lease_until <= (extract(epoch FROM now()) * 1000)::bigint;
  WITH due AS (
    SELECT key FROM public.notification_jobs
    WHERE state = 'pending'
      AND next <= (extract(epoch FROM now()) * 1000)::bigint
      AND lease_until <= (extract(epoch FROM now()) * 1000)::bigint
    ORDER BY next LIMIT least(greatest(batch_size, 1), 10)
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.notification_jobs AS jobs
  SET attempts = attempts + 1,
      lease_until = (extract(epoch FROM now()) * 1000)::bigint + 120000,
      lease_token = uuid_generate_v4()
  FROM due WHERE jobs.key = due.key RETURNING jobs.*;
$$;
REVOKE ALL ON FUNCTION public.claim_notification_jobs(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_notification_jobs(integer) TO service_role;

CREATE TABLE public.submission_rate_limits (
  key text PRIMARY KEY,
  count integer NOT NULL,
  reset_at bigint NOT NULL
);
ALTER TABLE public.submission_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.submission_rate_limits FROM anon, authenticated;
GRANT ALL ON public.submission_rate_limits TO service_role;
CREATE FUNCTION public.consume_submission_limit(rate_key text, max_requests integer, window_ms bigint)
RETURNS TABLE(allowed boolean, remaining integer, reset_in_minutes integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE current_ms bigint := (extract(epoch FROM now()) * 1000)::bigint;
  entry public.submission_rate_limits;
BEGIN
  DELETE FROM public.submission_rate_limits WHERE reset_at < current_ms - 86400000;
  INSERT INTO public.submission_rate_limits AS limits(key, count, reset_at)
  VALUES (rate_key, 1, current_ms + window_ms)
  ON CONFLICT(key) DO UPDATE SET
    count = CASE WHEN limits.reset_at <= current_ms THEN 1 ELSE limits.count + 1 END,
    reset_at = CASE WHEN limits.reset_at <= current_ms THEN current_ms + window_ms ELSE limits.reset_at END
  RETURNING * INTO entry;
  RETURN QUERY SELECT entry.count <= max_requests, greatest(0, max_requests - entry.count),
    ceil(greatest(0, entry.reset_at - current_ms)::numeric / 60000)::integer;
END;
$$;
REVOKE ALL ON FUNCTION public.consume_submission_limit(text, integer, bigint) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_submission_limit(text, integer, bigint) TO service_role;

-- Si existen citas duplicadas, resolverlas antes de aplicar esta migración.
CREATE UNIQUE INDEX cases_active_appointment_slot
ON public.cases(preferred_date, preferred_time_slot)
WHERE appointment_requested AND coalesce(appointment_status, 'pendiente') <> 'cancelada'
  AND preferred_time_slot NOT IN ('manana', 'tarde');

-- Coordinar también las reservas con los cambios de disponibilidad entre instancias.
CREATE FUNCTION public.guard_appointment_booking()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT NEW.appointment_requested OR coalesce(NEW.appointment_status, 'pendiente') = 'cancelada'
    OR NEW.preferred_time_slot IN ('manana', 'tarde') THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' THEN
    IF NEW.preferred_date IS NOT DISTINCT FROM OLD.preferred_date
      AND NEW.preferred_time_slot IS NOT DISTINCT FROM OLD.preferred_time_slot
      AND NEW.appointment_requested IS NOT DISTINCT FROM OLD.appointment_requested
      AND coalesce(OLD.appointment_status, 'pendiente') <> 'cancelada' THEN RETURN NEW; END IF;
  END IF;
  IF NEW.preferred_date IS NULL OR NEW.preferred_time_slot IS NULL THEN
    RAISE EXCEPTION 'La cita necesita fecha y hora.' USING ERRCODE = '23P01';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('appointment:' || NEW.preferred_date::text, 0));
  IF NEW.preferred_date <= (now() AT TIME ZONE 'America/Costa_Rica')::date
    OR extract(isodow FROM NEW.preferred_date) IN (6, 7)
    OR EXISTS (SELECT 1 FROM public.appointment_availability
      WHERE date = NEW.preferred_date AND time_slot = NEW.preferred_time_slot AND NOT is_available)
  THEN RAISE EXCEPTION 'La hora ya no está disponible.' USING ERRCODE = '23P01'; END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.guard_appointment_booking() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER cases_guard_booking BEFORE INSERT OR UPDATE ON public.cases
FOR EACH ROW EXECUTE FUNCTION public.guard_appointment_booking();

CREATE FUNCTION public.guard_appointment_availability()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('appointment:' || NEW.date::text, 0));
  IF EXISTS (SELECT 1 FROM public.cases WHERE appointment_requested
    AND preferred_date = NEW.date AND coalesce(appointment_status, 'pendiente') <> 'cancelada'
    AND (preferred_time_slot = NEW.time_slot
      OR (preferred_time_slot = 'manana' AND NEW.time_slot <= '12:00')
      OR (preferred_time_slot = 'tarde' AND NEW.time_slot >= '13:00')))
  THEN RAISE EXCEPTION 'La hora tiene una solicitud activa.' USING ERRCODE = '23P01'; END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.guard_appointment_availability() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER availability_guard_booking BEFORE INSERT OR UPDATE ON public.appointment_availability
FOR EACH ROW EXECUTE FUNCTION public.guard_appointment_availability();

-- Cada cambio de cita y sus notificaciones se guardan en la misma transacción.
CREATE FUNCTION public.enqueue_appointment_notifications()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE event_name text;
  event_label text;
  message_values jsonb;
  event_key text := uuid_generate_v4()::text;
  recipient text;
BEGIN
  IF NOT NEW.appointment_requested THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN event_name := 'creada';
  ELSIF NEW.preferred_time_slot IS DISTINCT FROM OLD.preferred_time_slot THEN event_name := 'reprogramada';
  ELSIF NEW.appointment_status IS DISTINCT FROM OLD.appointment_status THEN event_name := NEW.appointment_status;
  ELSE RETURN NEW;
  END IF;
  event_label := CASE event_name
    WHEN 'creada' THEN 'Solicitud recibida'
    WHEN 'confirmada' THEN 'Cita confirmada'
    WHEN 'cancelada' THEN 'Cita cancelada'
    WHEN 'reprogramada' THEN 'Hora de cita asignada'
    ELSE 'Solicitud pendiente' END;
  message_values := jsonb_build_array(NEW.full_name, coalesce(NEW.preferred_date::text, 'Por coordinar'),
    coalesce(NEW.preferred_time_slot, 'Por coordinar'), 'Asesoría ciudadana en línea', event_label,
    'infoatlantica.asociados@gmail.com / +506 6002-4545');
  IF NEW.email IS NOT NULL AND length(trim(NEW.email)) > 0 THEN
    INSERT INTO public.notification_jobs(key, channel, "to", "values", event, office, next, state)
    VALUES (NEW.id::text || ':' || event_key || ':email', 'email', lower(trim(NEW.email)), message_values,
      event_name, false, (extract(epoch FROM now()) * 1000)::bigint, 'pending');
  END IF;
  recipient := regexp_replace(NEW.phone, '[^0-9]', '', 'g');
  IF length(recipient) = 8 THEN recipient := '506' || recipient; END IF;
  IF left(recipient, 2) = '00' THEN recipient := substr(recipient, 3); END IF;
  IF length(recipient) BETWEEN 8 AND 15 THEN
    INSERT INTO public.notification_jobs(key, channel, "to", "values", event, office, next, state)
    VALUES (NEW.id::text || ':' || event_key || ':whatsapp', 'whatsapp', '+' || recipient, message_values,
      event_name, false, (extract(epoch FROM now()) * 1000)::bigint, 'pending');
  END IF;
  IF event_name = 'creada' THEN
    INSERT INTO public.notification_jobs(key, channel, "to", "values", event, office, next, state)
    VALUES (NEW.id::text || ':' || event_key || ':office', 'email', 'infoatlantica.asociados@gmail.com',
      message_values, event_name, true, (extract(epoch FROM now()) * 1000)::bigint, 'pending');
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.enqueue_appointment_notifications() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER cases_enqueue_notifications AFTER INSERT OR UPDATE ON public.cases
FOR EACH ROW EXECUTE FUNCTION public.enqueue_appointment_notifications();

COMMIT;
