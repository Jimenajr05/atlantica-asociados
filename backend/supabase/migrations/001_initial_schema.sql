-- ==============================================================================
-- ATLÁNTICA & ASOCIADOS - MIGRACIÓN COMPLETA DE BASE DE DATOS (SUPABASE)
-- ==============================================================================
-- Incluye: Tablas, Relaciones, Row Level Security (RLS) y Políticas de Storage.

-- 1. Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. TABLA: PROFILES (Roles y Permisos de Usuarios)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 3. TABLA: CASES (Expedientes y Consultas Ciudadanas)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_code TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  institution TEXT,
  description TEXT NOT NULL,
  privacy_accepted BOOLEAN NOT NULL DEFAULT true,
  appointment_requested BOOLEAN NOT NULL DEFAULT false,
  preferred_date DATE,
  preferred_time_slot TEXT CHECK (preferred_time_slot IN ('manana', 'tarde')),
  status TEXT NOT NULL DEFAULT 'nuevo' CHECK (status IN ('nuevo', 'en_analisis', 'en_proceso', 'finalizado')),
  internal_notes TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Índice para búsquedas rápidas en panel de administración
CREATE INDEX IF NOT EXISTS idx_cases_status ON public.cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_created_at ON public.cases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cases_appointment ON public.cases(appointment_requested);

-- ==============================================================================
-- 4. TABLA: CASE_FILES (Archivos Adjuntos en Storage Privado)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.case_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_case_files_case_id ON public.case_files(case_id);

-- ==============================================================================
-- 5. TABLA: CASE_NOTES (Historial de Notas Internas de Expediente)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.case_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_email TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_case_notes_case_id ON public.case_notes(case_id);

-- ==============================================================================
-- 6. TABLA: POSTS (Artículos del Blog y Guías Ciudadanas)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  meta_description TEXT,
  cover_image TEXT,
  published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  reading_time_minutes INT DEFAULT 4,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_posts_slug ON public.posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_published ON public.posts(published, published_at DESC);

-- ==============================================================================
-- 7. FUNCIÓN DE SEGURIDAD: VERIFICAR SI EL USUARIO ES ADMIN
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil automático cuando un usuario se registra en Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'staff');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) - ACTIVACIÓN EN TODAS LAS TABLAS
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Políticas para PROFILES
CREATE POLICY "Usuarios autenticados pueden ver su propio perfil"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Solo administradores pueden gestionar perfiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.is_admin());

-- Políticas para CASES
CREATE POLICY "Público anónimo puede INSERTAR casos nuevos"
  ON public.cases FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Solo administradores pueden LEER casos"
  ON public.cases FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Solo administradores pueden ACTUALIZAR casos"
  ON public.cases FOR UPDATE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Solo administradores pueden ELIMINAR casos"
  ON public.cases FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Políticas para CASE_FILES
CREATE POLICY "Público anónimo puede INSERTAR metadatos de archivos"
  ON public.case_files FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Solo administradores pueden LEER y ELIMINAR archivos"
  ON public.case_files FOR ALL
  TO authenticated
  USING (public.is_admin());

-- Políticas para CASE_NOTES
CREATE POLICY "Solo administradores pueden gestionar notas internas"
  ON public.case_notes FOR ALL
  TO authenticated
  USING (public.is_admin());

-- Políticas para POSTS
CREATE POLICY "Cualquier persona puede LEER artículos publicados"
  ON public.posts FOR SELECT
  TO anon, authenticated
  USING (published = true);

CREATE POLICY "Solo administradores pueden gestionar todos los artículos"
  ON public.posts FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ==============================================================================
-- 9. CONFIGURACIÓN DEL BUCKET PRIVADO DE STORAGE
-- ==============================================================================
-- Crear bucket 'case-documents' como PRIVADO
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'case-documents',
  'case-documents',
  false,
  10485760, -- 10 MB límite
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760;

-- Política de Storage: El público puede SUBIR archivos
CREATE POLICY "El público puede subir documentos al bucket de casos"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'case-documents');

-- Política de Storage: Solo administradores pueden LEER / DESCARGAR archivos
CREATE POLICY "Solo administradores pueden descargar documentos del bucket"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'case-documents' AND public.is_admin());

-- Política de Storage: Solo administradores pueden ELIMINAR archivos
CREATE POLICY "Solo administradores pueden eliminar documentos del bucket"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'case-documents' AND public.is_admin());
