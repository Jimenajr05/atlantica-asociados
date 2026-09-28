import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Calendar, Clock, ArrowRight, MessageCircle } from 'lucide-react';
import { getPublicPosts } from '@/lib/posts-store';
import { BlogPost } from '@/types';
import { COMPANY, WHATSAPP_URL } from '@/content/company';

export const metadata: Metadata = {
  title: 'Blog y Guías Ciudadanas | ATLÁNTICA & ASOCIADOS',
  description:
    'Artículos prácticos, guías de trámites ante la CCSS, municipalidades y Sala IV explicados en palabras sencillas.',
};

// Revalidar cada 5 segundos para que los nuevos artículos se reflejen casi al instante
export const revalidate = 5;

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const resolvedParams = await searchParams;
  const currentPage = parseInt(resolvedParams.page || '1', 10);
  const postsPerPage = 6;

  const posts: BlogPost[] = await getPublicPosts();

  const totalPosts = posts.length;
  const totalPages = Math.ceil(totalPosts / postsPerPage) || 1;
  const startIndex = (currentPage - 1) * postsPerPage;
  const paginatedPosts = posts.slice(startIndex, startIndex + postsPerPage);

  return (
    <div className="space-y-12 sm:space-y-16 py-12 sm:py-16 bg-[#fafafc]">
      {/* Encabezado */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-azul-rey text-xs font-bold uppercase tracking-wider border border-slate-200">
          <span>{COMPANY.tagline}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-serif font-bold text-azul-rey">
          Blog &amp; Guías Ciudadanas
        </h1>
        <p className="max-w-2xl mx-auto text-base text-slate-600 leading-relaxed">
          Explicamos las leyes y los procedimientos administrativos de Costa Rica en lenguaje directo para que sepa exactamente qué exigir y cómo proceder.
        </p>
      </section>

      {/* Listado de Artículos */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {paginatedPosts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
            <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="font-bold text-slate-800">Próximamente nuevos artículos</p>
            <p className="text-xs text-slate-500 mt-1">Estamos preparando nuevas guías para la ciudadanía.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {paginatedPosts.map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow transition-all duration-200 p-6 sm:p-7 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                    <Calendar className="w-3.5 h-3.5 text-dorado" />
                    <span>
                      {new Date(post.published_at || post.created_at).toLocaleDateString('es-CR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {post.reading_time_minutes || 4} min
                    </span>
                  </div>

                  <h2 className="text-lg sm:text-xl font-bold text-azul-rey group-hover:text-dorado transition-colors mb-3 leading-snug">
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6 line-clamp-3">
                    {post.excerpt}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="text-xs font-bold text-azul-rey hover:text-dorado flex items-center gap-1.5 transition-colors"
                  >
                    <span>Continuar leyendo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <Link
                key={pageNum}
                href={`/blog?page=${pageNum}`}
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-colors ${
                  pageNum === currentPage
                    ? 'bg-azul-rey text-white shadow'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {pageNum}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Llamada a la acción inferior */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-sm">
          <h3 className="text-lg font-serif font-bold text-azul-rey">
            ¿Su caso requiere una redacción o gestión inmediata?
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
            {COMPANY.purpose}
          </p>
          <div className="pt-2">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white px-6 py-3 rounded-xl font-bold text-sm shadow transition-all"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Consultar caso al {COMPANY.phoneDisplay}</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
