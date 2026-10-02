import { COMPANY, getWhatsAppCustomUrl } from '@/content/company';
import { ArrowLeft, Calendar, Clock, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import type { BlogPost } from '@/types';
export function BlogArticleView({ post, cleanHtmlContent }: { post: BlogPost; cleanHtmlContent: string }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://infoatlanticaasociados.com';
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': post.category === 'noticias' ? 'NewsArticle' : 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at || post.created_at,
    author: {
      '@type': 'Organization',
      name: 'ATLÁNTICA & ASOCIADOS',
      url: siteUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'ATLÁNTICA & ASOCIADOS',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/assets/logo-transparent.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteUrl}/blog/${post.slug}`,
    },
  };

  const articleWhatsAppUrl = getWhatsAppCustomUrl(
    `Hola, leí su artículo "${post.title}" en su sitio web y deseo consultar sobre una situación similar. ¿Cómo podemos coordinar?`
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema).replace(/</g, '\\u003c') }}
      />

      <article className="py-12 sm:py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 bg-[#fafafc]">
        <Link
          href={`/blog?category=${post.category || 'blog'}`}
          className="inline-flex items-center gap-2 text-xs font-bold text-azul-rey hover:text-dorado transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{post.category === 'noticias' ? 'Volver a noticias' : 'Volver al blog'}</span>
        </Link>

        {/* Encabezado del Artículo */}
        <header className="space-y-4 border-b border-slate-200 pb-8 bg-white p-6 sm:p-8 rounded-2xl border shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-azul-rey">{post.category === 'noticias' ? 'Noticias' : 'Blog'}</p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5 text-dorado font-bold uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(post.published_at || post.created_at).toLocaleDateString('es-CR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {post.reading_time_minutes || 4} min de lectura
            </span>
            <span>•</span>
            <span className="text-azul-rey font-bold">{COMPANY.name}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-bold text-azul-rey leading-tight">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed border-l-4 border-dorado pl-4 py-1">
              {post.excerpt}
            </p>
          )}
        </header>

        {/* Contenido Sanitizado en Markdown */}
        <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-sm">
          <div
            className="article-content text-sm sm:text-base"
            dangerouslySetInnerHTML={{ __html: cleanHtmlContent }}
          />
        </div>

        {/* Banner de Consulta Directa al final del artículo */}
        <div className="pt-4">
          <div className="bg-azul-rey text-white rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-dorado block">
              {COMPANY.tagline}
            </span>
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-white">
              ¿Requiere asesoría o redacción de un documento para este tema?
            </h3>
            <p className="text-sm text-slate-200 leading-relaxed max-w-2xl">
              {COMPANY.description}
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <a
                href={articleWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white px-6 py-3 rounded-xl font-bold text-sm shadow transition-all"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Consultar por WhatsApp al {COMPANY.phoneDisplay}</span>
              </a>
              <Link
                href="/contacto"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors border border-white/20"
              >
                <span>Enviar consulta por formulario</span>
              </Link>
            </div>
          </div>
        </div>
      </article>
    </>
  );
}
