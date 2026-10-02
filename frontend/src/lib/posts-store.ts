import { createClient } from '@supabase/supabase-js';
import type { BlogPost } from '@/types';

// Build-time reads use ONLY the public key and published-post RLS policy.
function publicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes('placeholder')) {
    throw new Error('Configure NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY antes de compilar.');
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
export async function getPublicPosts(): Promise<BlogPost[]> {
  const { data, error } = await publicClient().from('posts').select('*').eq('published', true).order('published_at', { ascending: false });
  if (error) throw new Error('No se pudieron leer las publicaciones p?blicas de Supabase: ' + error.message);
  return data as BlogPost[];
}
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const { data, error } = await publicClient().from('posts').select('*').eq('published', true).eq('slug', slug).maybeSingle();
  if (error) throw new Error('No se pudo leer el art?culo: ' + error.message);
  return data as BlogPost | null;
}
