import { Suspense } from 'react';
import type { Metadata } from 'next';
import BlogIndexContent from '@/components/BlogIndexContent';
import { getPublicPosts } from '@/lib/posts-store';
export const metadata: Metadata = {
  alternates: { canonical: '/blog' },
  title: 'Blog & noticias | ATLÁNTICA & ASOCIADOS',
  description:
    'Guías ciudadanas, artículos de orientación y noticias de Costa Rica en un solo lugar.',
};


export default async function BlogIndexPage() {
  const posts = await getPublicPosts();
  return <Suspense fallback={<p>Cargando publicaciones?</p>}><BlogIndexContent initialPosts={posts} /></Suspense>;
}
