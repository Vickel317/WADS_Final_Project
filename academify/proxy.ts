import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

function getClientIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function applySecurityHeaders(response: NextResponse, request: NextRequest) {
  const protocol = request.headers.get("x-forwarded-proto");

  if (protocol === "https") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  if (!request.nextUrl.pathname.startsWith("/api/")) {
    response.headers.set(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https:",
        "font-src 'self' data:",
        "connect-src 'self' ws: wss: http://localhost:3001",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join("; ")
    );
  }
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/api/")) {
    const ip = getClientIp(request);
    const isWrite = ["POST", "PUT", "PATCH", "DELETE"].includes(request.method);
    const isAuth = pathname.startsWith("/api/auth");
    const preset = isAuth ? "auth" : isWrite ? "write" : "read";
    const limit = checkRateLimit(`${preset}:${ip}`, preset);

    if (!limit.ok) {
      const retryAfterSec = Math.max(1, Math.ceil(limit.retryAfterMs / 1000));
      const response = NextResponse.json(
        {
          error: {
            code: "RATE_LIMITED",
            message: "Too many requests. Please try again later.",
          },
        },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfterSec) },
        }
      );
      applySecurityHeaders(response, request);
      return response;
    }
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  applySecurityHeaders(response, request);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
