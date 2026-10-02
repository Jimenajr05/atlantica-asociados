import { LiveBlogArticle } from '@/components/LiveBlogArticle';
import { Suspense } from 'react';
import { parseAndSanitizeMarkdown } from '@/lib/markdown';
import { getPostBySlug, getPublicPosts } from '@/lib/posts-store';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;
export async function generateStaticParams() {
  const posts = await getPublicPosts();
  return posts.length ? posts.map(post => ({ slug: post.slug })) : [{ slug: '__empty' }];
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: 'Artículo no encontrado | ATLÁNTICA & ASOCIADOS',
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://infoatlanticaasociados.com';
  const postUrl = `${siteUrl}/blog/${post.slug}`;

  return {
    title: `${post.title} | ATLÁNTICA & ASOCIADOS`,
    description: post.meta_description || post.excerpt,
    alternates: {
      canonical: postUrl,
    },
    openGraph: {
      title: post.title,
      description: post.meta_description || post.excerpt,
      type: 'article',
      url: postUrl,
      publishedTime: post.published_at || post.created_at,
      authors: ['ATLÁNTICA & ASOCIADOS'],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.meta_description || post.excerpt,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const cleanHtmlContent = await parseAndSanitizeMarkdown(post.content);
  return <Suspense fallback={<p>Cargando art?culo?</p>}><LiveBlogArticle initialPost={post} initialHtml={cleanHtmlContent} /></Suspense>;
}
