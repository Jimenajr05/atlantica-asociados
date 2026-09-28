import { Router, Request, Response } from 'express';
import {
  getAllCases,
  updateCaseStatus,
  addCaseNote,
  deleteCaseRecord,
} from '../services/cases-store';
import { createAdminClient } from '../services/supabase-admin';
import { CaseStatus } from '../types';

const router = Router();

// GET /api/admin/cases
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const cases = await getAllCases();
    res.json({ success: true, cases });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/admin/cases/:id/status
router.patch('/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    const validStatuses: CaseStatus[] = ['nuevo', 'en_analisis', 'en_proceso', 'finalizado'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: 'Estado de caso no válido.' });
      return;
    }

    await updateCaseStatus(id, status);
    res.json({ success: true, status });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/cases/:id/notes
router.post('/:id/notes', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { content, authorEmail } = req.body || {};

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      res.status(400).json({ error: 'La nota no puede estar vacía.' });
      return;
    }

    const note = await addCaseNote(id, content.trim(), authorEmail || 'admin');
    res.json({ success: true, note });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/admin/cases/:id/delete or DELETE /api/admin/cases/:id
router.delete(['/:id', '/:id/delete'], async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const adminSupabase = createAdminClient();

    if (adminSupabase) {
      const { data: files } = await adminSupabase
        .from('case_files')
        .select('file_path')
        .eq('case_id', id);

      if (files && files.length > 0) {
        const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'case-documents';
        const pathsToDelete = files.map((f: any) => f.file_path);
        await adminSupabase.storage.from(bucketName).remove(pathsToDelete);
      }
    }

    await deleteCaseRecord(id);
    res.json({ success: true, message: 'Caso y archivos eliminados exitosamente.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/cases/:id/signed-url
router.post('/:id/signed-url', async (req: Request, res: Response): Promise<void> => {
  try {
    const { filePath } = req.body || {};

    if (!filePath) {
      res.status(400).json({ error: 'Ruta de archivo no especificada.' });
      return;
    }

    const adminSupabase = createAdminClient();
    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'case-documents';

    if (adminSupabase) {
      const { data, error } = await adminSupabase.storage
        .from(bucketName)
        .createSignedUrl(filePath, 300);

      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }

      res.json({ success: true, signedUrl: data.signedUrl });
      return;
    }

    // Modo local / demo
    res.json({
      success: true,
      signedUrl: '#',
      note: 'Modo demostración local: configure las credenciales de Supabase para generar enlaces firmados reales.',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
