import { NextRequest, NextResponse } from 'next/server';
import { addCaseNote } from '@/lib/cases-store';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { content, authorEmail } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'La nota no puede estar vacía.' }, { status: 400 });
    }

    const note = await addCaseNote(id, content.trim(), authorEmail || 'admin');

    return NextResponse.json({ success: true, note });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
