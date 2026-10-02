import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // Si no hay configuración real o está en modo placeholder, crear cliente seguro
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
    throw new Error('Falta configurar la URL y la clave pública de Supabase.');
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
