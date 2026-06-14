const lastCallByKey = new Map<string, number>();

const DEFAULT_COOLDOWN_MS = Number(process.env.AI_RATE_LIMIT_MS ?? 15000);

export function checkAiRateLimit(
  userId: string,
  route: string,
  cooldownMs = DEFAULT_COOLDOWN_MS
): { ok: true } | { ok: false; retryAfterMs: number } {
  const key = `${userId}:${route}`;
  const now = Date.now();
  const last = lastCallByKey.get(key) ?? 0;
  const elapsed = now - last;

  if (elapsed < cooldownMs) {
    return { ok: false, retryAfterMs: cooldownMs - elapsed };
  }

  lastCallByKey.set(key, now);
  return { ok: true };
}

export function resetAiRateLimitsForTests() {
  lastCallByKey.clear();
}
