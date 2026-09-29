ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS appointment_status TEXT;

UPDATE public.cases
SET appointment_status = 'pendiente'
WHERE appointment_requested = true AND appointment_status IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'cases_appointment_status_check'
      AND conrelid = 'public.cases'::regclass
  ) THEN
    ALTER TABLE public.cases
      ADD CONSTRAINT cases_appointment_status_check
      CHECK (appointment_status IS NULL OR appointment_status IN ('pendiente', 'confirmada', 'cancelada'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.appointment_availability (
  date DATE NOT NULL,
  time_slot TEXT NOT NULL CHECK (time_slot IN ('manana', 'tarde')),
  is_available BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (date, time_slot)
);

ALTER TABLE public.appointment_availability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Público puede consultar disponibilidad de citas"
  ON public.appointment_availability;
CREATE POLICY "Público puede consultar disponibilidad de citas"
  ON public.appointment_availability FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Solo administradores pueden gestionar disponibilidad"
  ON public.appointment_availability;
CREATE POLICY "Solo administradores pueden gestionar disponibilidad"
  ON public.appointment_availability FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_cases_active_appointments
  ON public.cases(preferred_date, preferred_time_slot)
  WHERE appointment_requested = true AND appointment_status IS DISTINCT FROM 'cancelada';