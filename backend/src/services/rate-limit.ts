import { createHash } from 'node:crypto';
import { createAdminClient } from './supabase-admin';
import { usesCloudStorage } from './deployment';

// En Vercel el contador debe compartirse entre instancias.
export async function consumeIpRateLimit(ip: string, limit = 5, windowMs = 3600000) {
  if (!usesCloudStorage()) return checkIpRateLimit(ip, limit, windowMs);
  const client = createAdminClient();
  if (!client) throw new Error('Supabase no configurado');
  const { data, error } = await client.rpc('consume_submission_limit', {
    rate_key: createHash('sha256').update(ip).digest('hex'),
    max_requests: limit,
    window_ms: windowMs,
  });
  if (error || !data?.[0]) throw new Error('No se pudo verificar el límite de envíos.');
  return { allowed: data[0].allowed, remaining: data[0].remaining, resetInMinutes: data[0].reset_in_minutes };
}

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const ipRequestMap = new Map<string, RateLimitRecord>();

// Periodic cleanup of stale entries
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipRequestMap.entries()) {
    if (now > record.resetTime) {
      ipRequestMap.delete(ip);
    }
  }
}, 10 * 60 * 1000).unref();

export function checkIpRateLimit(
  ip: string,
  limit: number = 5,
  windowMs: number = 60 * 60 * 1000 // 1 hour
): { allowed: boolean; remaining: number; resetInMinutes: number } {
  const now = Date.now();
  const record = ipRequestMap.get(ip);

  if (!record || now > record.resetTime) {
    ipRequestMap.set(ip, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      allowed: true,
      remaining: limit - 1,
      resetInMinutes: Math.ceil(windowMs / (60 * 1000)),
    };
  }

  if (record.count >= limit) {
    const diffMs = Math.max(0, record.resetTime - now);
    return {
      allowed: false,
      remaining: 0,
      resetInMinutes: Math.ceil(diffMs / (60 * 1000)),
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: limit - record.count,
    resetInMinutes: Math.ceil((record.resetTime - now) / (60 * 1000)),
  };
}
