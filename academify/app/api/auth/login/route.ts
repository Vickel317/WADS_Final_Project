import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { firebaseSignIn } from "@/lib/firebase-auth";
import { getJwtSecret } from "@/lib/auth-jwt";

export async function POST(request: NextRequest) {
  try {
    const jwtSecret = getJwtSecret();
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

    // Create JWT token
    const token = jwt.sign(
      {
        id: firebaseUser.localId,
        email: firebaseUser.email,
        role: "student",
        name: displayName,
      },
      jwtSecret,
      { expiresIn: "1h" }
    );

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

    // Set HTTP-only cookie
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600,
    });

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
