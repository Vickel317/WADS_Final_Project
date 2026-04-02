import { NextRequest, NextResponse } from "next/server";
import jwt, { SignOptions } from "jsonwebtoken";

export const ACCESS_TOKEN_COOKIE = "auth_token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";

const ACCESS_TOKEN_MAX_AGE_SECONDS = 60 * 15;
const REFRESH_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type AuthTokenPayload = {
  id: string;
  email: string;
  role?: string;
  name?: string;
  tokenVersion?: number;
};

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    const err = new Error("Missing JWT_SECRET environment variable") as Error & {
      status?: number;
    };
    err.status = 500;
    throw err;
  }

  return secret;
}

export function signAccessToken(
  payload: AuthTokenPayload,
  expiresIn: SignOptions["expiresIn"] = "15m"
) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn });
}

export function verifyAccessToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as AuthTokenPayload;
  } catch {
    return null;
  }
}

export function getAccessTokenFromRequest(request: NextRequest) {
  const cookieToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (cookieToken) {
    return cookieToken;
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.substring(7);
}

export function getRefreshTokenFromRequest(request: NextRequest) {
  const cookieToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  if (cookieToken) {
    return cookieToken;
  }

  return null;
}

export function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string
) {
  const isProd = process.env.NODE_ENV === "production";

  response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    path: "/",
    maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
  });

  response.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    path: "/",
    maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
  });
}

export function clearAuthCookies(response: NextResponse) {
  const isProd = process.env.NODE_ENV === "production";

  response.cookies.set(ACCESS_TOKEN_COOKIE, "", {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });

  response.cookies.set(REFRESH_TOKEN_COOKIE, "", {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}
