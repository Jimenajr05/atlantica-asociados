import fs from 'fs';
import path from 'path';
import { BlogPost } from '../types';
import { createAdminClient } from './supabase-admin';

const dataDir = path.resolve(process.cwd(), 'data');
const postsFilePath = path.join(dataDir, 'posts.json');

function ensureLocalStore(): BlogPost[] {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(postsFilePath)) {
      fs.writeFileSync(postsFilePath, '[]', 'utf-8');
      return [];
    }
    const content = fs.readFileSync(postsFilePath, 'utf-8');
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    console.error('Error inicializando almacenamiento local de posts:', err);
    return [];
  }
}

function saveLocalStore(posts: BlogPost[]) {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(postsFilePath, JSON.stringify(posts, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error guardando en archivo local de posts:', err);
  }
}

// 1. Obtener todos los artículos (Admin: publicados y borradores)
export async function getAllPosts(): Promise<BlogPost[]> {
  const adminSupabase = createAdminClient();
  if (adminSupabase) {
    try {
      const { data, error } = await adminSupabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        saveLocalStore(data as BlogPost[]);
        return data as BlogPost[];
      }
    } catch (e) {
      console.warn('Fallback a almacenamiento local para posts:', e);
    }
  }

  return ensureLocalStore();
}

// 2. Obtener solo artículos publicados (Público / SEO)
export async function getPublicPosts(): Promise<BlogPost[]> {
  const adminSupabase = createAdminClient();
  if (adminSupabase) {
    try {
      const { data, error } = await adminSupabase
        .from('posts')
        .select('*')
        .eq('published', true)
        .order('published_at', { ascending: false });

      if (!error && data) {
        saveLocalStore(data as BlogPost[]);
        return data as BlogPost[];
      }
    } catch (e) {
      console.warn('Fallback a almacenamiento local para posts públicos:', e);
    }
  }

  const all = ensureLocalStore();
  return all.filter((p) => p.published);
}

// 3. Obtener un artículo por Slug
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const adminSupabase = createAdminClient();
  if (adminSupabase) {
    try {
      const { data, error } = await adminSupabase
        .from('posts')
        .select('*')
        .eq('slug', slug)
        .single();

      if (!error && data) {
        return data as BlogPost;
      }
    } catch (e) {
      // Fallback
    }
  }

  const all = ensureLocalStore();
  const found = all.find((p) => p.slug === slug);
  return found || null;
}

// 4. Obtener un artículo por ID
export async function getPostById(id: string): Promise<BlogPost | null> {
  const adminSupabase = createAdminClient();
  if (adminSupabase) {
    try {
      const { data, error } = await adminSupabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        return data as BlogPost;
      }
    } catch (e) {
      // Fallback
    }
  }

  const all = ensureLocalStore();
  const found = all.find((p) => p.id === id || p.slug === id);
  return found || null;
}

// 5. Crear un nuevo artículo
export async function createPost(postData: Partial<BlogPost>): Promise<BlogPost> {
  const now = new Date().toISOString();
  const newId = `post-${Date.now()}`;
  const newPost: BlogPost = {
    id: newId,
    slug: postData.slug || `articulo-${Date.now()}`,
    title: postData.title || 'Sin Título',
    excerpt: postData.excerpt || '',
    content: postData.content || '',
    meta_description: postData.meta_description || postData.excerpt || '',
    cover_image: postData.cover_image || null,
    published: Boolean(postData.published),
    published_at: postData.published ? now : null,
    created_at: now,
    updated_at: now,
    reading_time_minutes: Math.max(2, Math.ceil((postData.content || '').split(/\s+/).length / 200)),
  };

  const adminSupabase = createAdminClient();
  if (adminSupabase) {
    try {
      const { data, error } = await adminSupabase
        .from('posts')
        .insert({
          title: newPost.title,
          slug: newPost.slug,
          excerpt: newPost.excerpt,
          content: newPost.content,
          meta_description: newPost.meta_description,
          published: newPost.published,
          published_at: newPost.published_at,
          reading_time_minutes: newPost.reading_time_minutes,
        })
        .select()
        .single();

      if (!error && data) {
        newPost.id = data.id;
      }
    } catch (err) {
      console.error('Error insertando en Supabase:', err);
    }
  }

  const current = ensureLocalStore();
  const updated = [newPost, ...current.filter((p) => p.slug !== newPost.slug)];
  saveLocalStore(updated);

  return newPost;
}

// 6. Actualizar un artículo existente
export async function updatePost(id: string, postData: Partial<BlogPost>): Promise<BlogPost | null> {
  const now = new Date().toISOString();
  const adminSupabase = createAdminClient();

  if (adminSupabase) {
    try {
      const payload: any = {
        ...postData,
        updated_at: now,
      };
      if (postData.published) {
        payload.published_at = postData.published_at || now;
      }

      await adminSupabase.from('posts').update(payload).eq('id', id);
    } catch (err) {
      console.error('Error actualizando en Supabase:', err);
    }
  }

  const current = ensureLocalStore();
  const idx = current.findIndex((p) => p.id === id || p.slug === id);
  if (idx !== -1) {
    current[idx] = {
      ...current[idx],
      ...postData,
      updated_at: now,
      published_at: postData.published ? (current[idx].published_at || now) : null,
      reading_time_minutes: postData.content
        ? Math.max(2, Math.ceil(postData.content.split(/\s+/).length / 200))
        : current[idx].reading_time_minutes,
    };
    saveLocalStore(current);
    return current[idx];
  }

  return null;
}

// 7. Eliminar un artículo
export async function deletePost(id: string): Promise<boolean> {
  const adminSupabase = createAdminClient();
  if (adminSupabase) {
    try {
      await adminSupabase.from('posts').delete().eq('id', id);
    } catch (err) {
      console.error('Error eliminando en Supabase:', err);
    }
  }

  const current = ensureLocalStore();
  const updated = current.filter((p) => p.id !== id && p.slug !== id);
  saveLocalStore(updated);
  return true;
}
