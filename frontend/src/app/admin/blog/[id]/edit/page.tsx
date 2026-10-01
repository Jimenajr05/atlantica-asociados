'use client';

import { ArticleEditor } from '@/components/ArticleEditor';
import { adminFetch } from '@/lib/admin-fetch';
import { PostCategory } from '@/types';
import { AlertCircle, ArrowLeft, Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

export default function EditBlogPostPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const postId = params?.id || '';

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<PostCategory>('blog');
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!postId) return;
    async function fetchPost() {
      try {
        const res = await adminFetch(`/api/admin/posts/${encodeURIComponent(postId)}`);
        const data = await res.json();
        if (!res.ok || !data.post) throw new Error('No se pudo cargar el artículo.');
        if (data.post) {
          setTitle(data.post.title || '');
          setSlug(data.post.slug || '');
          setExcerpt(data.post.excerpt || '');
          setContent(data.post.content || '');
          setCategory(data.post.category === 'noticias' ? 'noticias' : 'blog');
          setPublished(Boolean(data.post.published));
        }
      } catch {
        setErrorMessage('No se pudo cargar el artículo para edición.');
      } finally {
        setLoading(false);
      }
    }
    if (postId) {
      fetchPost();
    }
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim() || !content.trim()) {
      setErrorMessage('Por favor complete el título y el contenido del artículo.');
      return;
    }

    setSaving(true);
    try {
      const res = await adminFetch(`/api/admin/posts/${encodeURIComponent(postId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug,
          excerpt,
          content,
          category,
          published,
        }),
      });

      if (res.ok) {
        router.push(`/admin?tab=blog&category=${category}&updated=true`);
      } else {
        const data = await res.json();
        setErrorMessage(data.error || 'Error al actualizar el artículo.');
      }
    } catch {
      setErrorMessage('Ocurrió un error inesperado al guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafc]">
        <Loader2 className="w-8 h-8 animate-spin text-azul-rey" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafc] py-5 sm:py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link
            href="/admin"
            className="inline-flex max-w-full items-center gap-1.5 text-xs font-bold text-azul-rey transition-colors hover:text-dorado"
          >
            <ArrowLeft className="w-4 h-4" /> Volver al panel de administración
          </Link>
          <span className="text-xs text-slate-500 sm:text-right">Editar publicación</span>
        </div>

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3 text-xs text-red-700 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:space-y-6 sm:rounded-2xl sm:p-6 lg:p-8">
          <div className="flex flex-col items-start gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-azul-rey">
              Editar publicación
            </h1>
            <label className="flex max-w-full items-start gap-2 text-xs font-bold leading-snug text-slate-700 select-none cursor-pointer sm:items-center">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="mt-0.5 shrink-0 rounded border-slate-300 text-azul-rey focus:ring-dorado sm:mt-0"
              />
              <span className="min-w-0 break-words">Publicado en el sitio web</span>
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="post-category" className="mb-1 block text-xs font-bold text-slate-700">Tipo de publicación</label>
              <select id="post-category" value={category} onChange={(event) => setCategory(event.target.value as PostCategory)} className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800">
                <option value="blog">Blog</option>
                <option value="noticias">Noticias</option>
              </select>
              <p className="mt-1 text-xs text-slate-500">Se mostrará en la pestaña correspondiente de Blog y noticias.</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Título de la publicación <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-azul-rey focus:ring-1 focus:ring-azul-rey"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Resumen / Extracto
              </label>
              <textarea
                rows={2}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:border-azul-rey focus:ring-1 focus:ring-azul-rey"
              />
            </div>

            <ArticleEditor value={content} onChange={setContent} />
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
            <Link
              href="/admin"
              className="inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100 sm:w-auto"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-azul-rey px-4 py-2.5 text-xs font-bold text-white shadow transition-colors hover:bg-azul-rey-dark disabled:opacity-60 sm:w-auto sm:px-6"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-dorado" />}
              <span>Guardar Cambios</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
