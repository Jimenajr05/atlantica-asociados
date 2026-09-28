import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createCaseRecord } from '@/lib/cases-store';
import {
  caseSubmissionSchema,
  ALLOWED_EXTENSIONS,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE,
  MAX_FILES_COUNT,
} from '@/lib/validations/case';
import { checkIpRateLimit } from '@/lib/rate-limit';
import { sendCaseNotificationEmail } from '@/lib/email';

// Helper para generar código de caso costarricense amigable
function generateCaseCode(): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `CAS-${year}-${randomNum}`;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Detección y limitación de tasa por IP (Spam / Abuso)
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

    const rateLimit = checkIpRateLimit(ip, 5, 60 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Ha alcanzado el límite de envíos de consultas desde su conexión. Por favor intente de nuevo en ${rateLimit.resetInMinutes} minutos o escríbanos directamente al WhatsApp.`,
        },
        { status: 429 }
      );
    }

    // 2. Extraer FormData
    const formData = await request.formData();

    const rawData = {
      fullName: (formData.get('fullName') as string) || '',
      phone: (formData.get('phone') as string) || '',
      email: (formData.get('email') as string) || '',
      institution: (formData.get('institution') as string) || '',
      description: (formData.get('description') as string) || '',
      privacyAccepted: formData.get('privacyAccepted') === 'true',
      appointmentRequested: formData.get('appointmentRequested') === 'true',
      preferredDate: (formData.get('preferredDate') as string) || '',
      preferredTimeSlot: (formData.get('preferredTimeSlot') as string) || '',
      websiteUrlHoneypot: (formData.get('websiteUrlHoneypot') as string) || '',
    };

    // 3. Validación de Honeypot (si viene lleno, es un bot)
    if (rawData.websiteUrlHoneypot && rawData.websiteUrlHoneypot.trim().length > 0) {
      console.warn(`[SPAM BLOQUEADO] Honeypot activado desde IP ${ip}`);
      // Simular éxito para despistar al bot
      return NextResponse.json({
        success: true,
        caseCode: 'CAS-VERIFIED',
        message: 'Consulta recibida.',
      });
    }

    // 4. Validación estricta con Zod en Servidor
    const parseResult = caseSubmissionSchema.safeParse(rawData);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || 'Datos de formulario inválidos.';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const validatedData = parseResult.data;

    // 5. Validación de Archivos Adjuntos
    const rawFiles = formData.getAll('files') as File[];
    const validFiles: File[] = [];

    if (rawFiles.length > MAX_FILES_COUNT) {
      return NextResponse.json(
        { error: `No puede adjuntar más de ${MAX_FILES_COUNT} archivos.` },
        { status: 400 }
      );
    }

    for (const file of rawFiles) {
      if (file && file.size > 0) {
        if (file.size > MAX_FILE_SIZE) {
          return NextResponse.json(
            { error: `El archivo "${file.name}" supera el tamaño máximo permitido de 10 MB.` },
            { status: 400 }
          );
        }

        const extension = '.' + file.name.split('.').pop()?.toLowerCase();
        const hasValidExtension = ALLOWED_EXTENSIONS.includes(extension);
        const hasValidMime = ALLOWED_FILE_TYPES.includes(file.type) || file.type === '';

        if (!hasValidExtension && !hasValidMime) {
          return NextResponse.json(
            {
              error: `El archivo "${file.name}" no está permitido. Solo se aceptan formatos PDF, JPG, PNG, DOC y DOCX.`,
            },
            { status: 400 }
          );
        }

        validFiles.push(file);
      }
    }

    const caseCode = generateCaseCode();
    const adminSupabase = createAdminClient();
    let savedCaseId = `case-${Date.now()}`;

    // Metadatos de archivos para registro
    const filesMeta = validFiles.map((f) => ({
      name: f.name,
      size: f.size,
      mimeType: f.type || 'application/octet-stream',
      path: `${savedCaseId}/${f.name}`,
    }));

    // 6. Guardar en Supabase si está configurado
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
          const fileExt = file.name.split('.').pop();
          const safeFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
          const filePath = `${savedCaseId}/${safeFileName}`;
          const fileBuffer = Buffer.from(await file.arrayBuffer());

          const { error: storageError } = await adminSupabase.storage
            .from(bucketName)
            .upload(filePath, fileBuffer, {
              contentType: file.type || 'application/octet-stream',
              upsert: false,
            });

          if (!storageError) {
            await adminSupabase.from('case_files').insert({
              case_id: savedCaseId,
              file_name: file.name,
              file_path: filePath,
              file_size: file.size,
              mime_type: file.type || 'application/octet-stream',
            });
          }
        }
      }
    }

    // Persistir siempre en el almacenamiento del sistema
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
        preferred_time_slot: validatedData.appointmentRequested ? validatedData.preferredTimeSlot : null,
        status: 'nuevo',
        ip_address: ip,
      },
      filesMeta
    );

    // 7. Enviar notificación por correo electrónico
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

    return NextResponse.json({
      success: true,
      caseCode,
      message: 'Su consulta ha sido registrada exitosamente.',
      appointmentRequested: validatedData.appointmentRequested,
    });
  } catch (error: any) {
    console.error('Error en POST /api/cases:', error);
    return NextResponse.json(
      { error: error.message || 'Ocurrió un error inesperado al procesar su solicitud.' },
      { status: 500 }
    );
  }
}
