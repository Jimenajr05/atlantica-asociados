'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api-fetch';
import { BlogArticleView } from './BlogArticleView';
import type { BlogPost } from '@/types';

export function LiveBlogArticle({ initialPost = null, initialHtml = '' }: { initialPost?: BlogPost | null; initialHtml?: string }) {
  const query = useSearchParams();
  const [post, setPost] = useState<BlogPost | null>(initialPost);
  const [html, setHtml] = useState(initialHtml);
  const [error, setError] = useState('');
  useEffect(() => {
    const slug = query?.get('slug') || decodeURIComponent(window.location.pathname.replace(/^\/blog\//, '').replace(/\/$/, ''));
    const controller = new AbortController();
    setError('');
    apiFetch(`/api/posts/${encodeURIComponent(slug)}`, { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error(response.status === 404 ? 'Artículo no encontrado.' : 'No se pudo cargar el artículo.');
        return response.json();
      })
      .then(data => {
        if (controller.signal.aborted) return;
        setPost(data.post);
        setHtml(data.html || '');
        document.title = `${data.post.title} | Atlántica & Asociados`;
      })
      .catch(err => { if (!controller.signal.aborted) setError(err.message); });
    return () => controller.abort();
  }, [query]);
  if (error) return <p role="alert" className="p-12 text-center">{error}</p>;
  if (!post) return <p role="status" className="p-12 text-center">Cargando artículo…</p>;
  return <BlogArticleView post={post} cleanHtmlContent={html} />;
}
