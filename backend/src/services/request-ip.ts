import { Request } from 'express';
import { isIP } from 'node:net';

export function getRequestIp(req: Request): string {
  // Vercel sustituye este encabezado. Fuera de Vercel se usa Express y TRUST_PROXY.
  if (process.env.VERCEL === '1') {
    const forwarded = req.get('x-vercel-forwarded-for') || req.get('x-forwarded-for');
    const address = forwarded?.split(',')[0].trim();
    if (address && isIP(address)) return address;
  }
  return req.ip || req.socket.remoteAddress || '127.0.0.1';
}
