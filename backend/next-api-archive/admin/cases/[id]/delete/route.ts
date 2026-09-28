import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { deleteCaseRecord } from '@/lib/cases-store';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adminSupabase = createAdminClient();

    if (adminSupabase) {
      // 1. Obtener archivos asociados para borrarlos del bucket
      const { data: files } = await adminSupabase
        .from('case_files')
        .select('file_path')
        .eq('case_id', id);

      if (files && files.length > 0) {
        const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'case-documents';
        const pathsToDelete = files.map((f) => f.file_path);
        await adminSupabase.storage.from(bucketName).remove(pathsToDelete);
      }
    }

    await deleteCaseRecord(id);

    return NextResponse.json({ success: true, message: 'Caso y archivos eliminados exitosamente.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
