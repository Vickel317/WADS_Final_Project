import { NextRequest, NextResponse } from "next/server";

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 120;

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const rateLimitStore = new Map<string, RateLimitBucket>();

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  return response;
}

function getClientKey(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const firstIp = forwardedFor?.split(",")[0]?.trim();
  return firstIp || "unknown-client";
}

function isMutatingMethod(method: string): boolean {
  return method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE";
}

function enforceRateLimit(request: NextRequest): NextResponse | null {
  const clientKey = getClientKey(request);
  const now = Date.now();
  const existing = rateLimitStore.get(clientKey);

  if (!existing || now > existing.resetAt) {
    rateLimitStore.set(clientKey, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return null;
  }

  if (existing.count >= RATE_LIMIT_MAX_REQUESTS) {
    const response = NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
    response.headers.set("Retry-After", String(Math.max(1, Math.ceil((existing.resetAt - now) / 1000))));
    return addSecurityHeaders(response);
  }

  existing.count += 1;
  rateLimitStore.set(clientKey, existing);
  return null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api")) {
    const rateLimitResponse = enforceRateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    if (isMutatingMethod(request.method)) {
      const origin = request.headers.get("origin");
      const expectedOrigin = request.nextUrl.origin;

      if (origin && origin !== expectedOrigin) {
        return addSecurityHeaders(
          NextResponse.json({ error: "Invalid request origin" }, { status: 403 })
        );
      }

      const isFileUploadRoute = pathname.startsWith("/api/files");
      if (!isFileUploadRoute) {
        const contentType = request.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          return addSecurityHeaders(
            NextResponse.json({ error: "Content-Type must be application/json" }, { status: 415 })
          );
        }
      }
    }
  }

  return addSecurityHeaders(NextResponse.next());
}

export const __internal = {
  rateLimitStore,
};

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
