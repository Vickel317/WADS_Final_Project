import { NextRequest, NextResponse } from "next/server";
import { firebaseSignIn } from "@/lib/firebase-auth";
import { setAuthCookies, signAccessToken } from "@/lib/auth-jwt";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const firebaseUser = await firebaseSignIn(email, password);
    const displayName = firebaseUser.displayName || "";

    const token = signAccessToken({
      id: firebaseUser.localId,
      email: firebaseUser.email,
      role: "student",
      name: displayName,
    });

    // Create response with cookie
    const response = NextResponse.json(
      {
        token,
        refreshToken: firebaseUser.refreshToken,
        firebaseIdToken: firebaseUser.idToken,
        user: {
          id: firebaseUser.localId,
          email: firebaseUser.email,
          name: displayName,
        },
      },
      { status: 200 }
    );

    setAuthCookies(response, token, firebaseUser.refreshToken);

    return response;
  } catch (error) {
    console.error("Login error:", error);
    const status =
      typeof error === "object" && error && "status" in error
        ? Number((error as { status?: number }).status)
        : 500;
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: message || "Internal server error" },
      { status: status || 500 }
    );
  }
}
