type WindowEntry = { count: number; windowStart: number };

const windows = new Map<string, WindowEntry>();

export type RateLimitPreset = "read" | "write" | "auth";

const PRESETS: Record<RateLimitPreset, { windowMs: number; maxRequests: number }> = {
  read: {
    windowMs: Number(process.env.RATE_LIMIT_READ_WINDOW_MS ?? 60_000),
    maxRequests: Number(process.env.RATE_LIMIT_READ_MAX ?? 120),
  },
  write: {
    windowMs: Number(process.env.RATE_LIMIT_WRITE_WINDOW_MS ?? 60_000),
    maxRequests: Number(process.env.RATE_LIMIT_WRITE_MAX ?? 30),
  },
  auth: {
    windowMs: Number(process.env.RATE_LIMIT_AUTH_WINDOW_MS ?? 60_000),
    maxRequests: Number(process.env.RATE_LIMIT_AUTH_MAX ?? 10),
  },
};

export function checkRateLimit(
  key: string,
  preset: RateLimitPreset = "read"
): { ok: true } | { ok: false; retryAfterMs: number } {
  const config = PRESETS[preset];
  const now = Date.now();
  const entry = windows.get(key);

  if (!entry || now - entry.windowStart >= config.windowMs) {
    windows.set(key, { count: 1, windowStart: now });
    return { ok: true };
  }

  if (entry.count >= config.maxRequests) {
    return { ok: false, retryAfterMs: config.windowMs - (now - entry.windowStart) };
  }

  entry.count += 1;
  return { ok: true };
}

export function resetRateLimitsForTests() {
  windows.clear();
}
