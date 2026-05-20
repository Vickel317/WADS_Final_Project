/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { middleware, __internal } from "../middleware";

describe("security middleware", () => {
  beforeEach(() => {
    __internal.rateLimitStore.clear();
  });

  it("adds security headers", () => {
    const request = new NextRequest("http://localhost/dashboard", {
      method: "GET",
      headers: {
        "x-forwarded-for": "10.10.10.1",
      },
    });

    const response = middleware(request);

    expect(response.headers.get("X-Frame-Options")).toBe("DENY");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
  });

  it("blocks cross-origin mutating API requests", () => {
    const request = new NextRequest("http://localhost/api/events", {
      method: "POST",
      headers: {
        origin: "http://evil.example",
        "content-type": "application/json",
        "x-forwarded-for": "10.10.10.2",
      },
      body: JSON.stringify({ title: "x" }),
    });

    const response = middleware(request);

    expect(response.status).toBe(403);
  });

  it("allows same-origin mutating API requests with JSON", () => {
    const request = new NextRequest("http://localhost/api/posts", {
      method: "POST",
      headers: {
        origin: "http://localhost",
        "content-type": "application/json",
        "x-forwarded-for": "10.10.10.5",
      },
      body: JSON.stringify({ title: "Thread", content: "Valid content", categoryId: "tech" }),
    });

    const response = middleware(request);

    expect(response.status).toBe(200);
  });

  it("enforces JSON content-type for non-file API writes", () => {
    const request = new NextRequest("http://localhost/api/events", {
      method: "POST",
      headers: {
        origin: "http://localhost",
        "content-type": "text/plain",
        "x-forwarded-for": "10.10.10.3",
      },
      body: "hello",
    });

    const response = middleware(request);

    expect(response.status).toBe(415);
  });

  it("allows file upload requests without JSON content-type", () => {
    const request = new NextRequest("http://localhost/api/files", {
      method: "POST",
      headers: {
        origin: "http://localhost",
        "content-type": "multipart/form-data; boundary=abc123",
        "x-forwarded-for": "10.10.10.6",
      },
      body: "--abc123",
    });

    const response = middleware(request);

    expect(response.status).toBe(200);
  });

  it("rate limits API requests after threshold", () => {
    const ip = "10.10.10.4";

    for (let i = 0; i < 120; i += 1) {
      const request = new NextRequest("http://localhost/api/categories", {
        method: "GET",
        headers: {
          "x-forwarded-for": ip,
        },
      });

      const response = middleware(request);
      expect(response.status).not.toBe(429);
    }

    const blockedRequest = new NextRequest("http://localhost/api/categories", {
      method: "GET",
      headers: {
        "x-forwarded-for": ip,
      },
    });

    const blockedResponse = middleware(blockedRequest);
    expect(blockedResponse.status).toBe(429);
    expect(blockedResponse.headers.get("Retry-After")).toBeTruthy();
  });

  it("resets the rate limit window after expiry", () => {
    const ip = "10.10.10.7";
    __internal.rateLimitStore.set(ip, { count: 120, resetAt: Date.now() - 1 });

    const request = new NextRequest("http://localhost/api/categories", {
      method: "GET",
      headers: {
        "x-forwarded-for": ip,
      },
    });

    const response = middleware(request);

    expect(response.status).not.toBe(429);
  });
});
