'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Eye, Edit3, Loader2, AlertCircle } from 'lucide-react';
import { parseAndSanitizeMarkdown } from '@/lib/markdown';

export default function NewBlogPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [published, setPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<'editor' | 'preview'>('editor');
  const [previewHtml, setPreviewHtml] = useState('');

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

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

    const slug = generateSlug(title);
    if (!title.trim() || !slug || !content.trim()) {
      setErrorMessage('Por favor complete el título y el contenido del artículo.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug,
          excerpt,
          content,
          published,
        }),
      });

      if (res.ok) {
        router.push('/admin?tab=blog&created=true');
      } else {
        const data = await res.json();
        setErrorMessage(data.error || 'Error al guardar el artículo.');
      }
    } catch {
      setErrorMessage('Ocurrió un error inesperado al guardar el artículo.');
    } finally {
      setSaving(false);
    }
  };

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
          <span className="text-xs text-slate-500 sm:text-right">Nuevo Artículo de Blog</span>
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
              Crear Nuevo Artículo
            </h1>
            <div className="w-full sm:w-auto">
              <label className="flex max-w-full items-start gap-2 text-xs font-bold leading-snug text-slate-700 select-none cursor-pointer sm:items-center">
                <input
                  type="checkbox"
                  checked={!published}
                  onChange={(e) => setPublished(!e.target.checked)}
                  className="mt-0.5 shrink-0 rounded border-slate-300 text-azul-rey focus:ring-dorado sm:mt-0"
                />
                <span className="min-w-0 break-words">Guardar como borrador</span>
              </label>
            </div>
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
                placeholder="Ej. Guía práctica para trámites ante el Ministerio de Salud"
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
                placeholder="Párrafo breve para la tarjeta de previsualización en el blog..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:border-azul-rey focus:ring-1 focus:ring-azul-rey"
              />
            </div>

            {/* Editor de contenido con vista previa */}
            <div className="border border-slate-300 rounded-xl overflow-hidden">
              <div className="flex flex-col items-start gap-2 border-b border-slate-300 bg-slate-100 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-2">
                <span className="text-xs font-bold text-slate-600">Contenido del artículo</span>
                <div className="flex w-full items-center gap-1 rounded-lg border border-slate-300 bg-white p-0.5 sm:w-auto">
                  <button
                    type="button"
                    onClick={() => handleTogglePreview('editor')}
                    className={`inline-flex flex-1 items-center justify-center gap-1 whitespace-nowrap rounded px-2.5 py-1 text-xs font-bold transition-colors sm:flex-none sm:px-3 ${
                      previewTab === 'editor' ? 'bg-azul-rey text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Edit3 className="w-3 h-3" /> Editor
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTogglePreview('preview')}
                    className={`inline-flex flex-1 items-center justify-center gap-1 whitespace-nowrap rounded px-2.5 py-1 text-xs font-bold transition-colors sm:flex-none sm:px-3 ${
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
                  placeholder="Escriba aquí el texto de su artículo..."
                  className="w-full p-4 font-mono text-xs focus:outline-none leading-relaxed text-slate-800"
                />
              ) : (
                <div
                  className="min-h-[300px] bg-white p-4 text-sm prose prose-slate max-w-none sm:p-6"
                  dangerouslySetInnerHTML={{ __html: previewHtml || '<p class="text-slate-400 italic">No hay contenido para previsualizar.</p>' }}
                />
              )}
            </div>
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
              <span>{published ? 'Guardar y Publicar' : 'Guardar como Borrador'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
