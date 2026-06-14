import { checkAiRateLimit, resetAiRateLimitsForTests } from "@/lib/ai/rate-limit";

describe("checkAiRateLimit", () => {
  beforeEach(() => {
    resetAiRateLimitsForTests();
  });

  it("allows the first request", () => {
    expect(checkAiRateLimit("user-1", "recommend", 1000)).toEqual({ ok: true });
  });

  it("blocks rapid repeat requests on the same route", () => {
    expect(checkAiRateLimit("user-1", "recommend", 1000)).toEqual({ ok: true });
    const blocked = checkAiRateLimit("user-1", "recommend", 1000);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.retryAfterMs).toBeGreaterThan(0);
    }
  });

  it("tracks different routes separately", () => {
    expect(checkAiRateLimit("user-1", "recommend", 1000)).toEqual({ ok: true });
    expect(checkAiRateLimit("user-1", "summarize", 1000)).toEqual({ ok: true });
  });
});
