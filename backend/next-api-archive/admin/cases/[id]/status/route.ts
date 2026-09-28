import { NextRequest, NextResponse } from 'next/server';
import { updateCaseStatus } from '@/lib/cases-store';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const validStatuses = ['nuevo', 'en_analisis', 'en_proceso', 'finalizado'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Estado de caso no válido.' }, { status: 400 });
    }

    await updateCaseStatus(id, status);

    return NextResponse.json({ success: true, status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
