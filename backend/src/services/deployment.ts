// En producción Supabase es la única fuente de datos persistentes.
export function usesCloudStorage(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
}
