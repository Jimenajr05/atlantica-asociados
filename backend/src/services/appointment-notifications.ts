import fs from 'node:fs';
import path from 'node:path';
import nodemailer from 'nodemailer';
import { CaseRecord } from '../types';
import { normalizeEmail, normalizeWhatsApp } from './notification-contact';
import { appointmentEmail, AppointmentEvent, eventLabels } from '../templates/appointment-email';
import { whatsappTemplates } from '../templates/appointment-whatsapp';

interface Job { key: string; channel: 'email' | 'whatsapp'; to: string; values: string[]; event: AppointmentEvent; office: boolean; attempts: number; next: number; state: 'pending' | 'sent' | 'failed'; }
const file = () => path.resolve(process.env.NOTIFICATION_STORE_PATH || 'data/appointment-notifications.json');
function read(): Job[] { return fs.existsSync(file()) ? JSON.parse(fs.readFileSync(file(), 'utf8')) : []; }
function save(jobs: Job[]) { fs.mkdirSync(path.dirname(file()), { recursive: true }); fs.writeFileSync(file() + '.tmp', JSON.stringify(jobs, null, 2)); fs.renameSync(file() + '.tmp', file()); }
let busy = false;

export function queueAppointmentNotifications(record: CaseRecord, event: AppointmentEvent, transitionId?: string) {
  try {
    if (!record.appointment_requested) return;
    const date = record.preferred_date ? new Intl.DateTimeFormat('es-CR', { timeZone: 'America/Costa_Rica', dateStyle: 'long' }).format(new Date(`${record.preferred_date}T12:00:00-06:00`)) : 'Por coordinar';
    const values = [record.full_name, date, record.preferred_time_slot || 'Por coordinar', 'Asesoría ciudadana en línea', eventLabels[event], process.env.APPOINTMENT_CONTACT || 'infoatlantica.asociados@gmail.com / +506 6002-4545'];
    const jobs = read();
    const add = (channel: Job['channel'], contact: string, office = false) => {
      try {
        const to = channel === 'email' ? normalizeEmail(contact) : normalizeWhatsApp(contact);
        const key = [record.id, event, record.preferred_date, record.preferred_time_slot, channel, office, ...(transitionId ? [transitionId] : [])].join(':');
        if (!jobs.some(j => j.key === key)) jobs.push({ key, channel, to, values, event, office, attempts: 0, next: Date.now(), state: 'pending' });
      } catch { console.error('[cita-notificación] Contacto inválido', { caseId: record.id, channel, office }); }
    };
    add('email', record.email || ''); add('whatsapp', record.phone);
    if (event === 'creada') add('email', process.env.NOTIFICATION_EMAIL_TO || 'infoatlantica.asociados@gmail.com', true);
    save(jobs);
    void processNotificationQueue();
  } catch { console.error('[cita-notificación] No se pudo guardar la cola; la cita permanece guardada.', { caseId: record.id }); }
}

async function deliver(job: Job) {
  if (process.env.NOTIFICATIONS_TEST_MODE === 'true') {
    console.log('[cita-notificación PRUEBA]', job.channel, job.to, job.channel === 'email' ? appointmentEmail(job.values, job.office) : { template: whatsappTemplates[job.event], values: job.values });
    return;
  }
  if (job.channel === 'email') {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) throw new Error('SMTP no configurado');
    const transport = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: process.env.SMTP_SECURE === 'true', auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }, connectionTimeout: 10000, socketTimeout: 15000 });
    await transport.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to: job.to, ...appointmentEmail(job.values, job.office) });
    return;
  }
  const { WHATSAPP_API_VERSION: version, WHATSAPP_PHONE_NUMBER_ID: id, WHATSAPP_ACCESS_TOKEN: token } = process.env;
  if (!version || !id || !token || !/^v\d+\.\d+$/.test(version) || !/^\d+$/.test(id)) throw new Error('WhatsApp no configurado');
  const response = await fetch(`https://graph.facebook.com/${version}/${id}/messages`, { method: 'POST', signal: AbortSignal.timeout(15000), headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ messaging_product: 'whatsapp', to: job.to.slice(1), type: 'template', template: { name: whatsappTemplates[job.event].name, language: { code: process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'es' }, components: [{ type: 'body', parameters: job.values.map(text => ({ type: 'text', text })) }] } }) });
  if (!response.ok) throw new Error(`WhatsApp HTTP ${response.status}`);
}

export async function processNotificationQueue() {
  if (busy) return;
  busy = true;
  try {
    const due = read().filter(j => j.state === 'pending' && j.next <= Date.now());
    await Promise.all(due.map(async job => {
      job.attempts++;
      try { await deliver(job); job.state = 'sent'; }
      catch { job.state = job.attempts >= 3 ? 'failed' : 'pending'; job.next = Date.now() + 1000 * 5 ** job.attempts; console.error('[cita-notificación] Envío fallido', { key: job.key, attempt: job.attempts, channel: job.channel }); }
      const latest = read(); const index = latest.findIndex(j => j.key === job.key);
      if (index >= 0) { latest[index] = job; save(latest); }
    }));
  } catch { console.error('[cita-notificación] Error procesando cola'); }
  finally { busy = false; }
}

export function startNotificationWorker() {
  void processNotificationQueue();
  setInterval(() => void processNotificationQueue(), 1000).unref();
}
