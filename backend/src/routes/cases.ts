import { Router, Request, Response } from 'express';
import multer from 'multer';
import { createAdminClient } from '../services/supabase-admin';
import { createCaseRecord } from '../services/cases-store';
import {
  caseSubmissionSchema,
  ALLOWED_EXTENSIONS,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE,
  MAX_FILES_COUNT,
} from '../validations/case';
import { checkIpRateLimit } from '../services/rate-limit';
import { sendCaseNotificationEmail } from '../services/email';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
});

function generateCaseCode(): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `CAS-${year}-${randomNum}`;
}

router.post('/', upload.array('files', MAX_FILES_COUNT), async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. IP rate limiting
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      '127.0.0.1';

    const rateLimit = checkIpRateLimit(ip, 5, 60 * 60 * 1000);
    if (!rateLimit.allowed) {
      res.status(429).json({
        error: `Ha alcanzado el límite de envíos de consultas desde su conexión. Por favor intente de nuevo en ${rateLimit.resetInMinutes} minutos o escríbanos directamente al WhatsApp.`,
      });
      return;
    }

    const body = req.body || {};
    const rawData = {
      fullName: (body.fullName as string) || '',
      phone: (body.phone as string) || '',
      email: (body.email as string) || '',
      institution: (body.institution as string) || '',
      description: (body.description as string) || '',
      privacyAccepted: body.privacyAccepted === 'true' || body.privacyAccepted === true,
      appointmentRequested: body.appointmentRequested === 'true' || body.appointmentRequested === true,
      preferredDate: (body.preferredDate as string) || '',
      preferredTimeSlot: (body.preferredTimeSlot as string) || '',
      websiteUrlHoneypot: (body.websiteUrlHoneypot as string) || '',
    };

    // 2. Anti-spam honeypot
    if (rawData.websiteUrlHoneypot && rawData.websiteUrlHoneypot.trim().length > 0) {
      console.warn(`[SPAM BLOQUEADO] Honeypot activado desde IP ${ip}`);
      res.json({
        success: true,
        caseCode: 'CAS-VERIFIED',
        message: 'Consulta recibida.',
      });
      return;
    }

    // 3. Schema validation
    const parseResult = caseSubmissionSchema.safeParse(rawData);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || 'Datos de formulario inválidos.';
      res.status(400).json({ error: firstError });
      return;
    }

    const validatedData = parseResult.data;

    // 4. File attachments validation
    const files = (req.files as Express.Multer.File[]) || [];
    if (files.length > MAX_FILES_COUNT) {
      res.status(400).json({ error: `No puede adjuntar más de ${MAX_FILES_COUNT} archivos.` });
      return;
    }

    const validFiles: Express.Multer.File[] = [];
    for (const file of files) {
      if (file && file.size > 0) {
        if (file.size > MAX_FILE_SIZE) {
          res.status(400).json({ error: `El archivo "${file.originalname}" supera el tamaño máximo permitido de 10 MB.` });
          return;
        }

        const extension = '.' + file.originalname.split('.').pop()?.toLowerCase();
        const hasValidExtension = ALLOWED_EXTENSIONS.includes(extension);
        const hasValidMime = ALLOWED_FILE_TYPES.includes(file.mimetype) || file.mimetype === '';

        if (!hasValidExtension && !hasValidMime) {
          res.status(400).json({
            error: `El archivo "${file.originalname}" no está permitido. Solo se aceptan formatos PDF, JPG, PNG, DOC y DOCX.`,
          });
          return;
        }

        validFiles.push(file);
      }
    }

    const caseCode = generateCaseCode();
    const adminSupabase = createAdminClient();
    let savedCaseId = `case-${Date.now()}`;

    const filesMeta = validFiles.map((f) => ({
      name: f.originalname,
      size: f.size,
      mimeType: f.mimetype || 'application/octet-stream',
      path: `${savedCaseId}/${f.originalname}`,
    }));

    // 5. Persist to Supabase if available
    if (adminSupabase) {
      const { data: caseRecord, error: caseInsertError } = await adminSupabase
        .from('cases')
        .insert({
          case_code: caseCode,
          full_name: validatedData.fullName,
          phone: validatedData.phone,
          email: validatedData.email || null,
          institution: validatedData.institution || null,
          description: validatedData.description,
          privacy_accepted: true,
          appointment_requested: validatedData.appointmentRequested,
          preferred_date: validatedData.appointmentRequested ? validatedData.preferredDate : null,
          preferred_time_slot: validatedData.appointmentRequested ? validatedData.preferredTimeSlot : null,
          status: 'nuevo',
          ip_address: ip,
        })
        .select('id')
        .single();

      if (!caseInsertError && caseRecord) {
        savedCaseId = caseRecord.id;
        const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'case-documents';

        for (const file of validFiles) {
          const fileExt = file.originalname.split('.').pop();
          const safeFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
          const filePath = `${savedCaseId}/${safeFileName}`;

          const { error: storageError } = await adminSupabase.storage
            .from(bucketName)
            .upload(filePath, file.buffer, {
              contentType: file.mimetype || 'application/octet-stream',
              upsert: false,
            });

          if (!storageError) {
            await adminSupabase.from('case_files').insert({
              case_id: savedCaseId,
              file_name: file.originalname,
              file_path: filePath,
              file_size: file.size,
              mime_type: file.mimetype || 'application/octet-stream',
            });
          }
        }
      }
    }

    // 6. Persist to store
    await createCaseRecord(
      {
        id: savedCaseId,
        case_code: caseCode,
        full_name: validatedData.fullName,
        phone: validatedData.phone,
        email: validatedData.email || null,
        institution: validatedData.institution || null,
        description: validatedData.description,
        privacy_accepted: true,
        appointment_requested: validatedData.appointmentRequested,
        preferred_date: validatedData.appointmentRequested ? validatedData.preferredDate : null,
        preferred_time_slot: (validatedData.appointmentRequested && validatedData.preferredTimeSlot) ? (validatedData.preferredTimeSlot as any) : null,
        status: 'nuevo',
        ip_address: ip,
      },
      filesMeta
    );

    // 7. Send email notification
    try {
      await sendCaseNotificationEmail({
        caseCode,
        fullName: validatedData.fullName,
        phone: validatedData.phone,
        email: validatedData.email,
        institution: validatedData.institution,
        description: validatedData.description,
        appointmentRequested: validatedData.appointmentRequested,
        preferredDate: validatedData.preferredDate,
        preferredTimeSlot: validatedData.preferredTimeSlot,
        filesCount: validFiles.length,
      });
    } catch (mailError) {
      console.error('Error al enviar correo (caso guardado con éxito):', mailError);
    }

    res.json({
      success: true,
      caseCode,
      message: 'Su consulta ha sido registrada exitosamente.',
      appointmentRequested: validatedData.appointmentRequested,
    });
  } catch (error: any) {
    console.error('Error en POST /api/cases:', error);
    res.status(500).json({
      error: error.message || 'Ocurrió un error inesperado al procesar su solicitud.',
    });
  }
});

export default router;
