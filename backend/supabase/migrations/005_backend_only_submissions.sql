-- Las solicitudes y adjuntos entran por Express, que valida y limita los envíos.
-- La clave service_role del backend conserva acceso; anon no debe saltarse la API.
DROP POLICY IF EXISTS "Público anónimo puede INSERTAR casos nuevos" ON public.cases;
DROP POLICY IF EXISTS "Público anónimo puede INSERTAR metadatos de archivos" ON public.case_files;
DROP POLICY IF EXISTS "El público puede subir documentos al bucket de casos" ON storage.objects;

ALTER FUNCTION public.is_admin() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
