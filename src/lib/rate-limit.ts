/**
 * In-memory sliding-window rate limiter.
 *
 * Works for single-instance deployments (standard Vercel serverless).
 * For multi-region / high-traffic: swap the Map for Upstash Redis.
 */

interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();

// Evict expired entries to prevent unbounded memory growth.
function evict() {
  const now = Date.now();
  for (const [key, val] of store) {
    if (val.resetAt <= now) store.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // Unix ms
}

/**
 * Check and increment the rate-limit counter for `identifier`.
 *
 * @param identifier - e.g. IP address or userId
 * @param limit      - max requests allowed in the window
 * @param windowMs   - window duration in milliseconds
 */
export function rateLimit(
  identifier: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  evict();

  const entry = store.get(identifier);

  if (!entry || entry.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(identifier, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

/**
 * Build a 429 response with Retry-After header.
 */
export function rateLimitResponse(resetAt: number): Response {
  const retryAfterSeconds = Math.ceil((resetAt - Date.now()) / 1000);
  return new Response(
    JSON.stringify({ error: 'Too many requests. Please slow down.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfterSeconds),
      },
    },
  );
}
