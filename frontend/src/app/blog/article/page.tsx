import { Suspense } from 'react';
import { LiveBlogArticle } from '@/components/LiveBlogArticle';
export const metadata = { title: 'Artículo', robots: { index: false, follow: true } };
export default function ArticlePage() {
  return <Suspense fallback={<p>Cargando artículo…</p>}><LiveBlogArticle /></Suspense>;
}
