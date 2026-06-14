import { checkRateLimit, resetRateLimitsForTests } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    resetRateLimitsForTests();
  });

  it("allows requests under the limit", () => {
    expect(checkRateLimit("read:127.0.0.1", "read")).toEqual({ ok: true });
  });

  it("blocks requests that exceed the write limit", () => {
    for (let i = 0; i < 30; i += 1) {
      expect(checkRateLimit("write:127.0.0.1", "write")).toEqual({ ok: true });
    }

    const blocked = checkRateLimit("write:127.0.0.1", "write");
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.retryAfterMs).toBeGreaterThan(0);
    }
  });

  it("tracks auth and read limits separately", () => {
    expect(checkRateLimit("auth:127.0.0.1", "auth")).toEqual({ ok: true });
    expect(checkRateLimit("read:127.0.0.1", "read")).toEqual({ ok: true });
  });
});
