import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import multer from 'multer';

// Cargar variables de entorno (soporta .env y .env.local)
if (process.env.SUPABASE_EDGE !== '1') {
  dotenv.config();
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
}

import casesRouter from './routes/cases';
import adminCasesRouter from './routes/admin-cases';
import postsRouter from './routes/posts';
import adminPostsRouter from './routes/admin-posts';
import appointmentsRouter from './routes/appointments';
import { startNotificationWorker, processNotificationQueue } from './services/appointment-notifications';
import { createAdminClient } from './services/supabase-admin';
import { usesCloudStorage } from './services/deployment';
import { timingSafeEqual } from 'node:crypto';

const app = express();
// The Edge gateway is the only upstream proxy of the hosted function.
if (process.env.SUPABASE_EDGE === '1') app.set('trust proxy', 1);
// Configurar solo los proxies conocidos; no confiar directamente en cabeceras del cliente.
if (process.env.TRUST_PROXY) app.set('trust proxy', process.env.TRUST_PROXY.split(',').map((value) => value.trim()));
const PORT = process.env.PORT || 5000;

// Configuración de CORS
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.NEXT_PUBLIC_SITE_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].flatMap((value) => (value || '').split(',').map((origin) => origin.trim()).filter(Boolean));

app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir solicitudes sin origen (como Postman o curl) o que estén en la lista permitida
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  })
);

// Middlewares para parsing de JSON y form data
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

app.use((_req, res, next) => {
  if (usesCloudStorage() && !createAdminClient()) {
    res.status(503).json({ error: 'Configure Supabase antes de recibir solicitudes.' });
    return;
  }
  next();
});

// Supabase Cron invoca este endpoint; la cola vive en Supabase.
app.get('/api/internal/notifications', async (req, res, next) => {
  const secret = process.env.CRON_SECRET;
  const provided = Buffer.from(req.get('authorization') || '');
  const expected = Buffer.from(`Bearer ${secret || ''}`);
  if (!secret || provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    res.status(401).json({ error: 'No autorizado.' });
    return;
  }
  try {
    await processNotificationQueue();
    res.json({ success: true });
  } catch (error) { next(error); }
});

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'atlantica-backend',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Rutas de la API
app.use('/api/cases', casesRouter);
app.use('/api/admin/cases', adminCasesRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/posts', postsRouter);
app.use('/api/admin/posts', adminPostsRouter);

// Manejador de 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Ruta de API no encontrada.' });
});

// Manejador global de errores
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Error de Servidor]:', err);
  const status = err instanceof multer.MulterError ? 400 : err.status || 500;
  res.status(status).json({
    error: status >= 500 ? 'Error interno del servidor.' : err.message || 'Solicitud inválida.',
  });
});

if (process.env.NODE_ENV !== 'test' && process.env.VERCEL !== '1' && process.env.SUPABASE_EDGE !== '1') {
  startNotificationWorker();
  app.listen(PORT, () => {
    console.log(`🚀 [BACKEND] Servidor ejecutándose en http://localhost:${PORT}`);
    console.log(`📡 [HEALTH] http://localhost:${PORT}/api/health`);
  });
}

export default app;
