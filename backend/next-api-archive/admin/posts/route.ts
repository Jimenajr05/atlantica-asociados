import { NextRequest, NextResponse } from 'next/server';
import { getAllPosts, createPost } from '@/lib/posts-store';

export async function GET() {
  try {
    const posts = await getAllPosts();
    return NextResponse.json({ success: true, posts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, slug, excerpt, content, meta_description, published } = body;

    if (!title || !slug || !content) {
      return NextResponse.json(
        { error: 'Título, slug y contenido en Markdown son obligatorios.' },
        { status: 400 }
      );
    }

    const post = await createPost({
      title: title.trim(),
      slug: slug.trim().toLowerCase(),
      excerpt: excerpt?.trim() || '',
      meta_description: meta_description?.trim() || excerpt?.trim() || '',
      content,
      published: Boolean(published),
    });

    return NextResponse.json({ success: true, post });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
