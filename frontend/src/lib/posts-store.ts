import { BlogPost } from '@/types';
import { INITIAL_POSTS } from '@/content/initial-posts';

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:5000';

// 1. Obtener todos los artículos (Admin)
export async function getAllPosts(): Promise<BlogPost[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/posts`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.posts) && data.posts.length > 0) {
        return data.posts;
      }
    }
  } catch (err) {
    console.warn('[FRONTEND] Backend no disponible para getAllPosts(), usando datos iniciales:', err);
  }

  return INITIAL_POSTS;
}

// 2. Obtener artículos públicos para Blog y SEO
export async function getPublicPosts(): Promise<BlogPost[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/posts`, {
      next: { revalidate: 10 },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.posts) && data.posts.length > 0) {
        return data.posts;
      }
    }
  } catch (err) {
    console.warn('[FRONTEND] Backend no disponible para getPublicPosts(), usando datos iniciales:', err);
  }

  return INITIAL_POSTS.filter((p) => p.published);
}

// 3. Obtener un artículo por su slug
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/posts/${encodeURIComponent(slug)}`, {
      next: { revalidate: 10 },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.post) {
        return data.post;
      }
    }
  } catch (err) {
    console.warn('[FRONTEND] Backend no disponible para getPostBySlug, buscando en locales:', err);
  }

  const found = INITIAL_POSTS.find((p) => p.slug === slug);
  return found || null;
}

// 4. Obtener un artículo por ID
export async function getPostById(id: string): Promise<BlogPost | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/posts/${encodeURIComponent(id)}`, {
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

  const found = INITIAL_POSTS.find((p) => p.id === id || p.slug === id);
  return found || null;
}
