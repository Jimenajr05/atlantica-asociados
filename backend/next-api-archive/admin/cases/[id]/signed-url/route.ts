import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: caseId } = await params;
    const body = await request.json();
    const { filePath } = body;

    if (!filePath) {
      return NextResponse.json({ error: 'Ruta de archivo no especificada.' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();
    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'case-documents';

    if (adminSupabase) {
      // Generar URL firmada válida por 300 segundos (5 minutos)
      const { data, error } = await adminSupabase.storage
        .from(bucketName)
        .createSignedUrl(filePath, 300);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, signedUrl: data.signedUrl });
    }

    // Modo local / demo
    return NextResponse.json({
      success: true,
      signedUrl: '#',
      note: 'Modo demostración local: configure las credenciales de Supabase para generar enlaces firmados reales.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
