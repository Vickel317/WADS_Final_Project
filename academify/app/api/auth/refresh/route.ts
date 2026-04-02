import { NextRequest, NextResponse } from "next/server";
import { firebaseLookupByIdToken, firebaseRefresh } from "@/lib/firebase-auth";
import {
  getRefreshTokenFromRequest,
  setAuthCookies,
  signAccessToken,
} from "@/lib/auth-jwt";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const refreshToken =
      getRefreshTokenFromRequest(request) ||
      (typeof body === "object" ? (body as { refreshToken?: string }).refreshToken : undefined);

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Refresh token is required" },
        { status: 400 }
      );
    }

    const refreshed = await firebaseRefresh(refreshToken);
    const firebaseUser = await firebaseLookupByIdToken(refreshed.idToken);

    const newToken = signAccessToken({
      id: refreshed.userId,
      email: firebaseUser?.email || "",
      role: "student",
      name: firebaseUser?.displayName || "",
    });

    const response = NextResponse.json(
      {
        token: newToken,
        refreshToken: refreshed.refreshToken,
        firebaseIdToken: refreshed.idToken,
        expiresIn: Number(refreshed.expiresIn),
      },
      { status: 200 }
    );

    setAuthCookies(response, newToken, refreshed.refreshToken);

    return response;
  } catch (error) {
    console.error("Refresh token error:", error);
    const status =
      typeof error === "object" && error && "status" in error
        ? Number((error as { status?: number }).status)
        : 401;
    const message =
      error instanceof Error ? error.message : "Invalid or expired refresh token";
    return NextResponse.json(
      { error: message || "Invalid or expired refresh token" },
      { status: status || 401 }
    );
  }
}
