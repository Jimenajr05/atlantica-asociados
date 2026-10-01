import nodemailer from 'nodemailer';
import { normalizeWhatsApp } from './notification-contact';

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]!));
}

interface CaseEmailNotificationData {
  caseCode: string;
  fullName: string;
  phone: string;
  email?: string | null;
  institution?: string | null;
  description: string;
  appointmentRequested: boolean;
  preferredDate?: string | null;
  preferredTimeSlot?: string | null;
  filesCount: number;
}

export async function sendCaseNotificationEmail(data: CaseEmailNotificationData): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true';
  const recipient = process.env.NOTIFICATION_EMAIL_TO || 'infoatlantica.asociados@gmail.com';

  // Si no hay configuración SMTP completa, registrar en logs sin romper el flujo
  if (!host || !user || !pass || host.includes('placeholder') || recipient.includes('[CORREO_TEMPORAL]')) {
    console.log('ℹ️ [NOTIFICACIÓN DE CASO] Configuración SMTP no detectada o es temporal. Detalles del caso:');
    console.log(`- Código: ${data.caseCode}`);
    console.log(`- Cliente: ${data.fullName} (${data.phone})`);
    console.log(`- Institución: ${data.institution || 'No especificada'}`);
    console.log(`- Cita solicitada: ${data.appointmentRequested ? `Sí (${data.preferredDate} - ${data.preferredTimeSlot})` : 'No'}`);
    console.log(`- Archivos adjuntos: ${data.filesCount}`);
    return true;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });

    const timeSlotLabel = data.preferredTimeSlot
      ? new Date(`2000-01-01T${data.preferredTimeSlot}:00Z`).toLocaleTimeString('es-CR', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          timeZone: 'UTC',
        })
      : 'Hora pendiente de asignación';

    const safe = Object.fromEntries(Object.entries(data).map(([key, value]) => [key, typeof value === 'string' ? escapeHtml(value) : value])) as unknown as CaseEmailNotificationData;
    let whatsappLink = '';
    try { whatsappLink = `https://wa.me/${normalizeWhatsApp(data.phone).slice(1)}`; } catch { /* Tel?fono antiguo sin formato internacional. */ }
    const mailOptions = {
      from: process.env.SMTP_FROM || `"Atlántica & Asociados" <${user}>`,
      to: recipient,
      subject: `🚨 Nuevo Caso Recibido: ${data.caseCode} - ${data.fullName}`,
      text: `
NUEVO CASO RECIBIDO EN ATLÁNTICA & ASOCIADOS
==============================================
Código de Caso: ${data.caseCode}
Fecha: ${new Date().toLocaleString('es-CR', { timeZone: 'America/Costa_Rica' })}

DATOS DEL CIUDADANO:
- Nombre: ${data.fullName}
- Teléfono / WhatsApp: ${data.phone}
- Correo Electrónico: ${data.email || 'No proporcionado'}
- Institución involucrada: ${data.institution || 'No especificada'}

DETALLE DE LA CONSULTA:
${data.description}

SOLICITUD DE CITA:
${data.appointmentRequested ? `SÍ - Fecha preferida: ${data.preferredDate} | Franja horaria: ${timeSlotLabel}` : 'NO solicitó cita previa (solo consulta escrita)'}

ARCHIVOS ADJUNTOS:
${data.filesCount > 0 ? `${data.filesCount} archivo(s) adjunto(s). Ingrese al panel administrativo para visualizarlos o descargarlos.` : 'Sin documentos adjuntos'}

==============================================
Este es un mensaje automático generado desde la plataforma web oficial de Atlántica & Asociados.
`,
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; color: #1e293b;">
  <div style="background-color: #0A192F; padding: 24px; text-align: center;">
    <h2 style="color: #C5A059; margin: 0; font-size: 20px; letter-spacing: 1px;">ATLÁNTICA & ASOCIADOS</h2>
    <p style="color: #cbd5e1; margin: 6px 0 0 0; font-size: 13px;">Notificación de Nueva Consulta Ciudadana</p>
  </div>
  
  <div style="padding: 24px;">
    <div style="background-color: #f8fafc; border-left: 4px solid #C5A059; padding: 12px 16px; margin-bottom: 20px;">
      <span style="font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: bold;">Código de Gestión:</span>
      <h3 style="margin: 4px 0 0 0; color: #0A192F; font-size: 22px;">${safe.caseCode}</h3>
    </div>

    <h4 style="color: #0A192F; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-top: 0;">Datos del Solicitante</h4>
    <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
      <tr>
        <td style="padding: 6px 0; color: #64748b; width: 40%;"><strong>Nombre:</strong></td>
        <td style="padding: 6px 0; color: #0f172a;">${safe.fullName}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #64748b;"><strong>Teléfono / WhatsApp:</strong></td>
        <td style="padding: 6px 0; color: #0f172a;"><a href="${whatsappLink}" style="color: #25D366; text-decoration: none; font-weight: bold;">${safe.phone} (Abrir en WhatsApp)</a></td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #64748b;"><strong>Correo:</strong></td>
        <td style="padding: 6px 0; color: #0f172a;">${safe.email || 'No indicado'}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #64748b;"><strong>Institución:</strong></td>
        <td style="padding: 6px 0; color: #0f172a;">${safe.institution || 'No especificada'}</td>
      </tr>
    </table>

    <h4 style="color: #0A192F; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-top: 0;">Detalle del Caso</h4>
    <div style="background-color: #f1f5f9; padding: 14px; border-radius: 6px; font-size: 14px; line-height: 1.6; color: #334155; white-space: pre-wrap; margin-bottom: 20px;">
${safe.description}
    </div>

    ${
      data.appointmentRequested
        ? `<div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 12px 16px; border-radius: 6px; margin-bottom: 20px;">
            <p style="margin: 0; color: #065f46; font-size: 13px;">
              <strong>📅 Solicitud de Cita:</strong> El usuario solicitó atención el día <strong>${safe.preferredDate}</strong> a las <strong>${timeSlotLabel}</strong>.
            </p>
          </div>`
        : ''
    }

    <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 12px 16px; border-radius: 6px; font-size: 13px; color: #1e40af;">
      📎 <strong>Documentos adjuntos:</strong> ${safe.filesCount} archivo(s) recibidos en el servidor.
    </div>
  </div>

  <div style="background-color: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
    Este correo fue generado por el sistema de recepción de consultas de <strong>Atlántica & Asociados</strong>.
  </div>
</div>
`,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error al enviar correo SMTP:', error);
    return false;
  }
}
