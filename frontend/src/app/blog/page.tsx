import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Calendar, Clock, ArrowRight, MessageCircle } from 'lucide-react';
import { getPublicPosts } from '@/lib/posts-store';
import { BlogPost } from '@/types';
import { COMPANY, WHATSAPP_URL } from '@/content/company';
import { PageHero } from '@/components/PageHero';

export const metadata: Metadata = {
  title: 'Blog y noticias | ATLÁNTICA & ASOCIADOS',
  description:
    'Guías ciudadanas, artículos de orientación y noticias de Costa Rica en un solo lugar.',
};

// Revalidar cada 5 segundos para que los nuevos artículos se reflejen casi al instante
export const revalidate = 5;

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string }>;
}) {
  const resolvedParams = await searchParams;
  const category = resolvedParams.category === 'noticias' ? 'noticias' : 'blog';
  const requestedPage = Number(resolvedParams.page || 1);
  const postsPerPage = 10;

  const posts: BlogPost[] = await getPublicPosts();

  const filteredPosts = posts.filter((post) => (post.category || 'blog') === category);
  const totalPosts = filteredPosts.length;
  const totalPages = Math.ceil(totalPosts / postsPerPage) || 1;
  const currentPage = Number.isInteger(requestedPage) ? Math.max(1, Math.min(requestedPage, totalPages)) : 1;
  const startIndex = (currentPage - 1) * postsPerPage;
  const paginatedPosts = filteredPosts.slice(startIndex, startIndex + postsPerPage);

  return (
    <div className="space-y-6 sm:space-y-8 lg:space-y-12 pb-10 sm:pb-12 lg:pb-16 bg-[#fafafc]">
      <PageHero
        eyebrow={COMPANY.tagline}
        title="Blog y noticias"
        description="Guías para conocer sus derechos y noticias para mantenerse al día. Explore cada sección según lo que necesite."
        asideValue={String(totalPosts).padStart(2, '0')}
        asideLabel={category === 'noticias' ? 'noticias publicadas' : 'artículos del blog'}
      />

      {/* Listado de Artículos */}
      <section id="publicaciones" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <nav aria-label="Secciones de Blog y noticias" className="mb-6 grid grid-cols-2 gap-1 rounded-2xl border border-slate-200 bg-slate-100 p-1 sm:max-w-md">
          {(['blog', 'noticias'] as const).map((type) => (
            <Link key={type} href={`/blog?category=${type}#publicaciones`} aria-current={category === type ? 'page' : undefined} className={`flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold transition-colors ${category === type ? 'bg-azul-rey text-white shadow-sm' : 'text-slate-600 hover:bg-white'}`}>
              {type === 'blog' ? 'Blog' : 'Noticias'}
              <span className={`rounded-full px-2 py-0.5 text-xs ${category === type ? 'bg-white/15 text-white' : 'bg-white text-slate-500'}`}>{posts.filter((post) => (post.category || 'blog') === type).length}</span>
            </Link>
          ))}
        </nav>
        <h2 className="mb-2 text-2xl font-bold text-azul-rey">{category === 'noticias' ? 'Noticias' : 'Blog'}</h2>
        <p className="mb-6 text-sm text-slate-600">{category === 'noticias' ? 'Actualidad y novedades de interés para la ciudadanía.' : 'Artículos, consejos y guías para conocer sus derechos y realizar sus trámites.'}</p>
        {paginatedPosts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 px-5 py-10 sm:p-12 text-center text-slate-500">
            <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="font-bold text-slate-800">{category === 'noticias' ? 'Próximamente nuevas noticias' : 'Próximamente nuevos artículos'}</p>
            <p className="text-xs text-slate-500 mt-1">{category === 'noticias' ? 'Aquí encontrará las próximas novedades.' : 'Estamos preparando nuevas guías para la ciudadanía.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-5 lg:gap-6">
            {paginatedPosts.map((post) => (
              <article
                key={post.id}
                className="min-w-0 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow transition-all duration-200 p-3 sm:p-5 lg:p-6 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] sm:text-xs text-slate-500 mb-3">
                    <span className="inline-flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 shrink-0 text-dorado" />
                    <span>
                      {new Date(post.published_at || post.created_at).toLocaleDateString('es-CR', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    </span>
                    <span className="inline-flex items-center gap-1 whitespace-nowrap">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {post.reading_time_minutes || 4} min
                    </span>
                  </div>

                  <h3 className="line-clamp-3 text-sm sm:text-lg lg:text-xl font-bold text-azul-rey group-hover:text-dorado transition-colors mb-3 leading-snug">
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-3 line-clamp-2 sm:line-clamp-3">
                    {post.excerpt}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="min-h-11 w-full text-xs sm:text-sm font-bold text-azul-rey hover:text-dorado flex items-center justify-between gap-2 transition-colors"
                  >
                    <span className="sm:hidden">Leer más</span><span className="hidden sm:inline">Continuar leyendo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <nav aria-label="Paginación de publicaciones" className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-t border-slate-200 pt-6 sm:mx-auto sm:max-w-md sm:gap-4">
            {currentPage > 1 ? (
              <Link rel="prev" href={`/blog?category=${category}&page=${currentPage - 1}#publicaciones`} className="flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-2 text-sm font-semibold text-azul-rey hover:bg-slate-100">Anterior</Link>
            ) : <span aria-disabled="true" className="flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-2 text-sm text-slate-400">Anterior</span>}
            <span aria-live="polite" className="text-center text-xs font-medium text-slate-600">{currentPage} de {totalPages}</span>
            {currentPage < totalPages ? (
              <Link rel="next" href={`/blog?category=${category}&page=${currentPage + 1}#publicaciones`} className="flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-2 text-sm font-semibold text-azul-rey hover:bg-slate-100">Siguiente</Link>
            ) : <span aria-disabled="true" className="flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-2 text-sm text-slate-400">Siguiente</span>}
          </nav>
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
              className="inline-flex w-full sm:w-auto min-h-12 justify-center items-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white px-4 sm:px-6 py-3 rounded-xl font-bold text-sm shadow transition-all"
            >
              <MessageCircle className="w-4 h-4 shrink-0 fill-white" />
              <span>Consultar caso al {COMPANY.phoneDisplay}</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
