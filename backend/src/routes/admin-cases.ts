import { Router, Request, Response } from 'express';
import {
  getAllCases,
  getCaseById,
  updateCaseStatus,
  addCaseNote,
  deleteCaseRecord,
  updateCaseAppointmentTime,
} from '../services/cases-store';
import { createAdminClient } from '../services/supabase-admin';
import { APPOINTMENT_TIME_SLOTS, AppointmentStatus, CaseStatus, TimeSlot } from '../types';
import { requireAdmin } from '../middleware/require-admin';
import { updateCaseAppointmentStatus } from '../services/cases-store';
import { isAppointmentSlotAvailable } from '../services/appointments-store';

const router = Router();

router.patch('/:id/appointment', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const preferredTimeSlot = req.body?.preferredTimeSlot as TimeSlot | undefined;
    if (preferredTimeSlot !== undefined) {
      if (!APPOINTMENT_TIME_SLOTS.includes(preferredTimeSlot)) {
        res.status(400).json({ error: 'Seleccione una hora válida.' });
        return;
      }

      const caseItem = await getCaseById(req.params.id);
      if (!caseItem?.appointment_requested || !caseItem.preferred_date) {
        res.status(404).json({ error: 'No se encontró la solicitud de cita.' });
        return;
      }

      const available = await isAppointmentSlotAvailable(caseItem.preferred_date, preferredTimeSlot, {
        excludeBookingId: caseItem.id,
        ignoreLegacyReservations: true,
      });
      if (!available) {
        res.status(409).json({ error: 'Esa hora ya no está disponible. Seleccione otra.' });
        return;
      }

      const updated = await updateCaseAppointmentTime(caseItem.id, preferredTimeSlot);
      if (!updated) {
        res.status(404).json({ error: 'No se pudo asignar una hora a esta solicitud.' });
        return;
      }

      res.json({ success: true, preferredTimeSlot });
      return;
    }

    const status = req.body?.status as AppointmentStatus;
    const validStatuses: AppointmentStatus[] = ['pendiente', 'confirmada', 'cancelada'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: 'Estado de cita no válido.' });
      return;
    }

    const updated = await updateCaseAppointmentStatus(req.params.id, status);
    if (!updated) {
      res.status(404).json({ error: 'No se encontró la solicitud de cita.' });
      return;
    }

    res.json({ success: true, status });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'No se pudo actualizar la cita.' });
  }
});

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
