import { usesCloudStorage } from './deployment';
import { readLocalRecords, writeLocalRecords } from './local-json-store';
import path from 'path';
import { randomUUID } from 'node:crypto';
import { BlogPost } from '../types';
import { createAdminClient } from './supabase-admin';

const dataDir = path.resolve(process.cwd(), 'data');
const postsFilePath = path.join(dataDir, 'posts.json');

function ensureLocalStore(): BlogPost[] {
  return readLocalRecords<BlogPost>(postsFilePath);
}

function saveLocalStore(posts: BlogPost[]) {
  writeLocalRecords(postsFilePath, posts);
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
        if (!usesCloudStorage()) saveLocalStore(data as BlogPost[]);
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
        .maybeSingle();

      if (!error) {
        return data as BlogPost | null;
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
        .eq(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ? 'id' : 'slug', id)
        .maybeSingle();

      if (!error) {
        return data as BlogPost | null;
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
  const existing = await getPostBySlug(postData.slug || '');
  if (existing) throw new Error('Ya existe una publicación con ese slug.');
  const now = new Date().toISOString();
  const newId = `post-${randomUUID()}`;
  const newPost: BlogPost = {
    id: newId,
    slug: postData.slug || `articulo-${Date.now()}`,
    title: postData.title || 'Sin Título',
    category: postData.category || 'blog',
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
          category: newPost.category,
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

      if (error) throw error;
      if (data) {
        newPost.id = data.id;
      }
    } catch (err) {
      console.error('Error insertando en Supabase:', err);
      throw new Error('No se pudo guardar la publicación en la base de datos. Verifique las migraciones pendientes.');
    }
  }

  if (!usesCloudStorage()) {
    const current = ensureLocalStore();
    const updated = [newPost, ...current.filter((p) => p.slug !== newPost.slug)];
    saveLocalStore(updated);

  }
  return newPost;
}

// 6. Actualizar un artículo existente
export async function updatePost(id: string, postData: Partial<BlogPost>): Promise<BlogPost | null> {
  const now = new Date().toISOString();
  const existing = await getPostById(id);
  if (!existing) return null;
  if (postData.slug && postData.slug !== existing.slug) {
    const duplicate = await getPostBySlug(postData.slug);
    if (duplicate && duplicate.id !== existing.id) throw new Error('Ya existe una publicación con ese slug.');
  }
  const updated: BlogPost = {
    ...existing,
    ...postData,
    updated_at: now,
    published_at: (postData.published ?? existing.published) ? (existing.published_at || now) : null,
    reading_time_minutes: postData.content !== undefined
      ? Math.max(2, Math.ceil(postData.content.split(/\s+/).length / 200))
      : existing.reading_time_minutes,
  };
  const adminSupabase = createAdminClient();

  if (adminSupabase) {
    try {
      const payload: any = {
        ...postData,
        updated_at: now,
        published_at: updated.published_at,
        reading_time_minutes: updated.reading_time_minutes,
      };

      const { error } = await adminSupabase.from('posts').update(payload).eq('id', existing.id);
      if (error) throw error;
    } catch (err) {
      console.error('Error actualizando en Supabase:', err);
      throw new Error('No se pudo actualizar la publicación en la base de datos. Verifique las migraciones pendientes.');
    }
  }

  if (!usesCloudStorage()) {
    const current = ensureLocalStore();
    saveLocalStore([updated, ...current.filter((p) => p.id !== existing.id)]);
  }
  return updated;
}

// 7. Eliminar un artículo
export async function deletePost(id: string): Promise<boolean> {
  const existing = await getPostById(id);
  if (!existing) return false;
  const adminSupabase = createAdminClient();
  if (adminSupabase) {
    try {
      const { error } = await adminSupabase.from('posts').delete().eq('id', existing.id);
      if (error) throw error;
    } catch (err) {
      console.error('Error eliminando en Supabase:', err);
      throw new Error('No se pudo eliminar la publicación en la base de datos.');
    }
  }

  if (!usesCloudStorage()) {
    const current = ensureLocalStore();
    const updated = current.filter((p) => p.id !== existing.id);
    saveLocalStore(updated);
  }
  return true;
}
