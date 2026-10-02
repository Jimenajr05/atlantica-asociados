import { apiFetch } from '@/lib/api-fetch';
import { createClient } from '@/lib/supabase/client';

export async function adminFetch(input: string, init: RequestInit = {}) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const headers = new Headers(init.headers);

  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
  }

  return apiFetch(input, { ...init, headers });
}