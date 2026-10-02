export function apiUrl(path: string): string {
  if (!path.startsWith('/api/')) throw new Error('Ruta de API inválida.');
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base || base.includes('placeholder')) throw new Error('Configure la URL pública de Supabase.');
  return `${base.replace(/\/$/, '')}/functions/v1/atlantica-api${path}`;
}

export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(apiUrl(path), init);
}
