// In-memory rate limiter for backend
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
}, 10 * 60 * 1000);

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
