'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Eye, Edit3, Loader2, AlertCircle } from 'lucide-react';
import { parseAndSanitizeMarkdown } from '@/lib/markdown';

export default function EditBlogPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [content, setContent] = useState('');
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<'editor' | 'preview'>('editor');
  const [previewHtml, setPreviewHtml] = useState('');

  useEffect(() => {
    async function fetchPost() {
      try {
        const res = await fetch(`/api/admin/posts/${postId}`);
        const data = await res.json();
        if (data.post) {
          setTitle(data.post.title || '');
          setSlug(data.post.slug || '');
          setExcerpt(data.post.excerpt || '');
          setMetaDescription(data.post.meta_description || '');
          setContent(data.post.content || '');
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

  const handleTogglePreview = async (tab: 'editor' | 'preview') => {
    setPreviewTab(tab);
    if (tab === 'preview') {
      const html = await parseAndSanitizeMarkdown(content);
      setPreviewHtml(html);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim() || !slug.trim() || !content.trim()) {
      setErrorMessage('Por favor complete los campos obligatorios: Título, Slug URL y Contenido en Markdown.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug,
          excerpt,
          meta_description: metaDescription || excerpt,
          content,
          published,
        }),
      });

      if (res.ok) {
        router.push('/admin?tab=blog&updated=true');
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
    <div className="min-h-screen bg-[#fafafc] py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-azul-rey hover:text-dorado transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Volver al panel de administración
          </Link>
          <span className="text-xs text-slate-500">Editar Artículo</span>
        </div>

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3 text-xs text-red-700 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-azul-rey">
              Editar Artículo
            </h1>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 select-none">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="rounded border-slate-300 text-azul-rey focus:ring-dorado"
              />
              <span>Publicado en el sitio web</span>
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Título del Artículo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-azul-rey focus:ring-1 focus:ring-azul-rey"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Slug URL <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center">
                  <span className="text-xs text-slate-400 bg-slate-100 px-3 py-2.5 rounded-l-xl border border-r-0 border-slate-300">
                    /blog/
                  </span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-r-xl border border-slate-300 text-xs font-mono focus:border-azul-rey focus:ring-1 focus:ring-azul-rey"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Meta Descripción SEO
                </label>
                <input
                  type="text"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:border-azul-rey focus:ring-1 focus:ring-azul-rey"
                />
              </div>
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

            {/* Editor de Markdown con Vista Previa */}
            <div className="border border-slate-300 rounded-xl overflow-hidden">
              <div className="bg-slate-100 px-4 py-2 border-b border-slate-300 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Contenido en Markdown</span>
                <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-300">
                  <button
                    type="button"
                    onClick={() => handleTogglePreview('editor')}
                    className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1 transition-colors ${
                      previewTab === 'editor' ? 'bg-azul-rey text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Edit3 className="w-3 h-3" /> Editor
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTogglePreview('preview')}
                    className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1 transition-colors ${
                      previewTab === 'preview' ? 'bg-azul-rey text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Eye className="w-3 h-3" /> Vista Previa
                  </button>
                </div>
              </div>

              {previewTab === 'editor' ? (
                <textarea
                  rows={14}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full p-4 font-mono text-xs focus:outline-none leading-relaxed text-slate-800"
                />
              ) : (
                <div
                  className="p-6 prose prose-slate max-w-none min-h-[300px] bg-white text-sm"
                  dangerouslySetInnerHTML={{ __html: previewHtml || '<p class="text-slate-400 italic">No hay contenido para previsualizar.</p>' }}
                />
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link
              href="/admin"
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-azul-rey hover:bg-azul-rey-dark text-white font-bold text-xs shadow transition-colors flex items-center gap-1.5 disabled:opacity-60"
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
