// npm run build --prefix backend && node --test backend/tests/appointment-notifications.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

test('citas: persistencia, eventos, duplicados, validación y fallos independientes', async () => {
  const cwd = process.cwd();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'atlantica-notifications-'));
  process.chdir(dir);
  process.env.NODE_ENV = 'test';
  process.env.SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.SUPABASE_SERVICE_ROLE_KEY = '';
  process.env.NOTIFICATIONS_TEST_MODE = 'false';
  process.env.SMTP_HOST = 'test'; process.env.SMTP_USER = 'test@example.com'; process.env.SMTP_PASS = 'test';
  process.env.WHATSAPP_API_VERSION = 'v25.0'; process.env.WHATSAPP_PHONE_NUMBER_ID = '123'; process.env.WHATSAPP_ACCESS_TOKEN = 'test';
  process.env.NOTIFICATION_EMAIL_TO = 'office@example.com';
  process.env.NOTIFICATION_STORE_PATH = path.join(dir, 'queue.json');
  const nodemailer = require('../node_modules/nodemailer');
  const originalTransport = nodemailer.createTransport;
  const originalFetch = global.fetch;
  let mails = 0; let whatsapp = 0;
  nodemailer.createTransport = () => ({ sendMail: async () => { mails++; throw new Error('simulated SMTP failure'); } });
  global.fetch = async (_url, options) => { whatsapp++; const payload = JSON.parse(options.body); assert.equal(payload.to, '50688888888'); assert.equal(payload.template.components[0].parameters.length, 6); return { ok: true }; };
  try {
    const { normalizeWhatsApp, normalizeEmail } = require('../dist/services/notification-contact');
    assert.equal(normalizeWhatsApp('8888-8888'), '+50688888888');
    assert.equal(normalizeWhatsApp('0050688888888'), '+50688888888');
    assert.equal(normalizeEmail(' TEST@EXAMPLE.COM '), 'test@example.com');
    assert.throws(() => normalizeWhatsApp('++++++++'));
    assert.throws(() => normalizeEmail('invalid'));
    const store = require('../dist/services/cases-store');
    const notifications = require('../dist/services/appointment-notifications');
    const record = await store.createCaseRecord({ id: 'test-cita', full_name: 'Persona de prueba', phone: '88888888', email: 'client@example.com', appointment_requested: true, preferred_date: '2026-10-05', preferred_time_slot: '09:00' });
    assert.equal(record.id, 'test-cita');
    notifications.queueAppointmentNotifications(record, 'creada');
    const settle = async () => { await new Promise(resolve => setTimeout(resolve, 30)); await notifications.processNotificationQueue(); };
    await settle();
    const read = () => JSON.parse(fs.readFileSync(process.env.NOTIFICATION_STORE_PATH));
    assert.equal(read().length, 3);
    assert.equal(read().filter(j => j.state === 'sent').length, 1);
    notifications.queueAppointmentNotifications(record, 'creada'); await settle();
    assert.equal(read().length, 3);
    for (let attempt = 0; attempt < 2; attempt++) {
      const jobs = read(); jobs.forEach(j => j.next = 0); fs.writeFileSync(process.env.NOTIFICATION_STORE_PATH, JSON.stringify(jobs)); await settle();
    }
    assert.equal(mails, 6); assert.equal(whatsapp, 1);
    assert.equal(read().filter(j => j.state === 'failed' && j.attempts === 3).length, 2);
    nodemailer.createTransport = () => ({ sendMail: async () => { mails++; } });
    await store.updateCaseAppointmentStatus(record.id, 'confirmada'); await settle();
    await store.updateCaseAppointmentStatus(record.id, 'confirmada'); await settle();
    assert.equal(read().length, 5);
    await store.updateCaseAppointmentTime(record.id, '10:00'); await settle();
    await store.updateCaseAppointmentStatus(record.id, 'cancelada'); await settle();
    assert.equal(read().length, 9);
    assert.equal((await store.getCaseById(record.id)).appointment_status, 'cancelada');
    process.env.NOTIFICATIONS_TEST_MODE = 'true';
    const before = whatsapp;
    notifications.queueAppointmentNotifications({ ...record, id: 'dry-run' }, 'creada'); await settle();
    assert.equal(whatsapp, before);
    const app = require('../dist/server').default;
    const server = await new Promise(resolve => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)); });
    try {
      const dates = require('../dist/services/appointments-store');
      let date = dates.addDays(dates.getCostaRicaDate(), 2);
      while ([0,6].includes(new Date(date + 'T12:00:00Z').getUTCDay())) date = dates.addDays(date, 1);
      const form = new FormData();
      Object.entries({fullName:'Persona API de prueba',phone:'8888-8888',email:'api@example.com',description:'Consulta de prueba para una cita en línea.',privacyAccepted:'true',appointmentRequested:'true',preferredDate:date,preferredTimeSlot:'11:00'}).forEach(([key,value])=>form.append(key,value));
      const base = `http://127.0.0.1:${server.address().port}`;
      const response = await originalFetch(base + '/api/cases', {method:'POST',body:form});
      assert.equal(response.status, 200);
      const body = await response.json();
      const persisted = await store.getCaseById(body.caseCode);
      assert.equal(persisted.phone, '+50688888888');
      const patch = () => originalFetch(base + `/api/admin/cases/${persisted.id}/appointment`, {method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:'confirmada'})});
      assert.equal((await patch()).status, 200); await settle();
      const count = read().length;
      assert.equal((await patch()).status, 200); await settle();
      assert.equal(read().length, count);
      assert.equal(read().filter(job=>job.key.startsWith(persisted.id + ':')).length, 5);
    } finally { await new Promise(resolve=>server.close(resolve)); }
  } finally {
    nodemailer.createTransport = originalTransport; global.fetch = originalFetch; process.chdir(cwd);
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
