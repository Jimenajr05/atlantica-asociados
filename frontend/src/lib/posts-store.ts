import { BlogPost } from '@/types';

import { connection } from 'next/server';

async function backendUrl(path: string): Promise<URL> {
  // Service bindings are unavailable during builds. Wait for a request.
  await connection();
  const base = process.env.BACKEND_URL;
  if (!base && process.env.VERCEL === '1') {
    throw new Error('Falta el binding BACKEND_URL del servicio backend.');
  }
  return new URL(path, base || 'http://127.0.0.1:5000');
}

// 2. Obtener artículos públicos para Blog y SEO
export async function getPublicPosts(): Promise<BlogPost[]> {
  const url = await backendUrl('/api/posts');
  try {
    const res = await fetch(url, {
      next: { revalidate: 10 },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.posts) && data.posts.length > 0) {
        return data.posts;
      }
    }
  } catch (err) {
    console.warn('[FRONTEND] Backend no disponible para getPublicPosts():', err);
  }

  return [];
}

// 3. Obtener un artículo por su slug
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const url = await backendUrl(`/api/posts/${encodeURIComponent(slug)}`);
  try {
    const res = await fetch(url, {
      next: { revalidate: 10 },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.post) {
        return data.post;
      }
    }
  } catch (err) {
    console.warn('[FRONTEND] Backend no disponible para getPostBySlug:', err);
  }

  return null;
}

// 4. Obtener un artículo por ID
export async function getPostById(id: string): Promise<BlogPost | null> {
  const url = await backendUrl(`/api/admin/posts/${encodeURIComponent(id)}`);
  try {
    const res = await fetch(url, {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      if (data.post) {
        return data.post;
      }
    }
  } catch (err) {
    console.warn('[FRONTEND] Backend no disponible para getPostById:', err);
  }

  return null;
}
