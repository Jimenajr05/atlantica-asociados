import { NextRequest, NextResponse } from 'next/server';
import { getPostById, updatePost, deletePost } from '@/lib/posts-store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const post = await getPostById(id);

    if (post) {
      return NextResponse.json({ success: true, post });
    }

    return NextResponse.json({ error: 'Artículo no encontrado.' }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, slug, excerpt, content, meta_description, published } = body;

    const updated = await updatePost(id, {
      title,
      slug,
      excerpt,
      content,
      meta_description,
      published: Boolean(published),
    });

    if (updated) {
      return NextResponse.json({ success: true, post: updated });
    }

    return NextResponse.json({ error: 'No se pudo actualizar el artículo.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deletePost(id);
    return NextResponse.json({ success: true, message: 'Artículo eliminado.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
