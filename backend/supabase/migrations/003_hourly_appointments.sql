ALTER TABLE public.cases
  DROP CONSTRAINT IF EXISTS cases_preferred_time_slot_check;

ALTER TABLE public.cases
  ADD CONSTRAINT cases_preferred_time_slot_check
  CHECK (preferred_time_slot IS NULL OR preferred_time_slot IN (
    '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', 'manana', 'tarde'
  ));

ALTER TABLE public.appointment_availability
  DROP CONSTRAINT IF EXISTS appointment_availability_time_slot_check;

INSERT INTO public.appointment_availability (date, time_slot, is_available, updated_at)
SELECT availability.date, expanded.time_slot, availability.is_available, availability.updated_at
FROM public.appointment_availability AS availability
CROSS JOIN LATERAL unnest(
  CASE availability.time_slot
    WHEN 'manana' THEN ARRAY['07:00', '08:00', '09:00', '10:00', '11:00', '12:00']
    WHEN 'tarde' THEN ARRAY['13:00', '14:00', '15:00', '16:00']
  END
) AS expanded(time_slot)
WHERE availability.time_slot IN ('manana', 'tarde')
ON CONFLICT (date, time_slot) DO UPDATE
SET is_available = EXCLUDED.is_available,
    updated_at = EXCLUDED.updated_at;

DELETE FROM public.appointment_availability
WHERE time_slot IN ('manana', 'tarde');

ALTER TABLE public.appointment_availability
  ADD CONSTRAINT appointment_availability_time_slot_check
  CHECK (time_slot IN (
    '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00'
  ));