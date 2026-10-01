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
import { serializeAppointments } from '../middleware/serialize-appointments';
import { deleteLocalAttachments, getLocalAttachmentPath } from '../services/local-attachments';
import fs from 'node:fs';

const router = Router();
router.use(requireAdmin);

router.patch('/:id/appointment', serializeAppointments(async (req: Request, res: Response): Promise<void> => {
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

    const caseItem = await getCaseById(req.params.id);
    if (caseItem?.appointment_status === 'cancelada' && status !== 'cancelada') {
      if (!caseItem.preferred_date || !caseItem.preferred_time_slot ||
          !(await isAppointmentSlotAvailable(caseItem.preferred_date, caseItem.preferred_time_slot as TimeSlot, { excludeBookingId: caseItem.id }))) {
        res.status(409).json({ error: 'La hora de la cita ya no está disponible. Asigne otra hora antes de reactivarla.' });
        return;
      }
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
}));

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

    if (!(await updateCaseStatus(id, status))) {
      res.status(404).json({ error: 'Caso no encontrado.' });
      return;
    }
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

    if (!(await getCaseById(id))) { res.status(404).json({ error: 'Caso no encontrado.' }); return; }
    if (content.trim().length > 5000) { res.status(400).json({ error: 'La nota no puede exceder 5000 caracteres.' }); return; }
    const author = res.locals.adminUser?.email || (typeof authorEmail === 'string' ? authorEmail : '') || 'admin';
    const note = await addCaseNote(id, content.trim(), author);
    res.json({ success: true, note });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/admin/cases/:id/delete or DELETE /api/admin/cases/:id
router.delete(['/:id', '/:id/delete'], async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const existing = await getCaseById(id);
    if (!existing) { res.status(404).json({ error: 'Caso no encontrado.' }); return; }
    const adminSupabase = createAdminClient();

    if (adminSupabase) {
      const { data: files, error: filesError } = await adminSupabase
        .from('case_files')
        .select('file_path')
        .eq('case_id', existing.id);
      if (filesError) throw filesError;

      if (files && files.length > 0) {
        const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'case-documents';
        const pathsToDelete = files.map((f: any) => f.file_path);
        const { error: storageError } = await adminSupabase.storage.from(bucketName).remove(pathsToDelete);
        if (storageError) throw storageError;
      }
    }

    deleteLocalAttachments((existing.files || []).map((file) => file.file_path));
    await deleteCaseRecord(existing.id);
    res.json({ success: true, message: 'Caso y archivos eliminados exitosamente.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/files/:fileId', async (req: Request, res: Response): Promise<void> => {
  try {
    const caseItem = await getCaseById(req.params.id);
    const file = caseItem?.files?.find((item) => item.id === req.params.fileId);
    if (!file || !file.file_path.startsWith('local/')) {
      res.status(404).json({ error: 'Documento local no encontrado.' });
      return;
    }
    const resolved = getLocalAttachmentPath(file.file_path);
    if (!fs.existsSync(resolved)) {
      res.status(404).json({ error: 'Documento local no encontrado.' });
      return;
    }
    res.setHeader('X-File-Name', encodeURIComponent(file.file_name));
    res.download(resolved, file.file_name);
  } catch {
    res.status(500).json({ error: 'No se pudo descargar el documento.' });
  }
});

// POST /api/admin/cases/:id/signed-url
router.post('/:id/signed-url', async (req: Request, res: Response): Promise<void> => {
  try {
    const { filePath } = req.body || {};

    if (typeof filePath !== 'string' || !filePath) {
      res.status(400).json({ error: 'Ruta de archivo no especificada.' });
      return;
    }

    const caseItem = await getCaseById(req.params.id);
    if (!caseItem?.files?.some((file) => file.file_path === filePath)) {
      res.status(404).json({ error: 'El archivo no pertenece a este caso.' });
      return;
    }
    const localFile = caseItem.files.find((file) => file.file_path === filePath && file.file_path.startsWith('local/'));
    if (localFile) {
      res.json({ success: true, signedUrl: `/api/admin/cases/${encodeURIComponent(caseItem.id)}/files/${encodeURIComponent(localFile.id)}` });
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
