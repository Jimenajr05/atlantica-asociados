'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { BlogPost } from '@/types';
import { ArrowRight, BookOpen } from 'lucide-react';
import Link from 'next/link';
export function RecentPosts({ initialPosts }: { initialPosts: BlogPost[] }) {
  const [recentPosts, setPosts] = useState(initialPosts);
  useEffect(() => {
    let active = true;
    createClient().from('posts').select('*').eq('published',true).order('published_at',{ascending:false}).limit(3)
      .then(({ data, error }) => { if (active && !error) setPosts(data as BlogPost[]); });
    return () => { active = false; };
  }, []);
  return <>      {recentPosts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-azul-rey bg-azul-rey/5 px-3 py-1 rounded-full inline-block mb-2">
                Blog & noticias
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-azul-rey">
                Orientación ciudadana y actualidad
              </h2>
            </div>
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-azul-rey hover:text-dorado-hover transition-colors"
            >
              <span>Ver blog & noticias</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="home-card-grid home-post-grid grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {recentPosts.map((post) => (
              <article
                key={post.id}
                className="min-w-0 bg-white rounded-xl border border-slate-200 hover:border-slate-300 p-6 flex flex-col justify-between transition-all shadow-sm hover:shadow"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-2.5">
                    <BookOpen className="w-3.5 h-3.5 text-azul-rey" />
                    <span>
                      {new Date(post.published_at || post.created_at).toLocaleDateString('es-CR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                    <span>•</span>
                    <span>{post.reading_time_minutes || 4} min lectura</span>
                  </div>
                  <p className="mb-2 text-xs font-bold text-azul-rey">{post.category === 'noticias' ? 'Noticias' : 'Blog'}</p>
                  <h3 className="line-clamp-3 text-base sm:text-lg font-bold text-azul-rey hover:text-dorado-hover transition-colors mb-2 leading-snug">
                    <a href={`/blog/${post.slug}`}>{post.title}</a>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed mb-4">
                    {post.excerpt}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <a
                    href={`/blog/${post.slug}`}
                    className="text-xs font-bold text-azul-rey hover:text-dorado-hover flex items-center gap-1 transition-colors"
                  >
                    <span>Leer guía completa</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}</>;
}
