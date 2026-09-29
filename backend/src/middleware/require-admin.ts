import { NextFunction, Request, Response } from 'express';
import { createAdminClient } from '../services/supabase-admin';

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const adminClient = createAdminClient();
  if (!adminClient) {
    if (process.env.NODE_ENV !== 'production') {
      next();
      return;
    }
    res.status(503).json({ error: 'La autorización de administrador no está configurada.' });
    return;
  }

  const token = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) {
    res.status(401).json({ error: 'Se requiere una sesión de administrador.' });
    return;
  }

  try {
    const { data: { user }, error: authError } = await adminClient.auth.getUser(token);
    if (authError || !user) {
      res.status(401).json({ error: 'La sesión de administrador no es válida.' });
      return;
    }

    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || profile?.role !== 'admin') {
      res.status(403).json({ error: 'No tiene permisos para administrar citas.' });
      return;
    }

    next();
  } catch {
    res.status(401).json({ error: 'No se pudo validar la sesión de administrador.' });
  }
}