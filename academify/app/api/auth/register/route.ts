import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { firebaseSignUp, firebaseUpdateProfile } from "@/lib/firebase-auth";
import { getJwtSecret } from "@/lib/auth-jwt";

export async function POST(request: NextRequest) {
  try {
    const jwtSecret = getJwtSecret();
    const body = await request.json();
    const { email, password, name } = body;

    // Validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const firebaseUser = await firebaseSignUp(email, password);

    // Best effort profile update so display name is available in Firebase Console.
    if (name) {
      await firebaseUpdateProfile(firebaseUser.idToken, name);
    }

    const token = jwt.sign(
      {
        id: firebaseUser.localId,
        email: firebaseUser.email,
        role: "student",
        name,
      },
      jwtSecret,
      { expiresIn: "1h" }
    );

    const response = NextResponse.json(
      {
        token,
        refreshToken: firebaseUser.refreshToken,
        firebaseIdToken: firebaseUser.idToken,
        user: {
          id: firebaseUser.localId,
          email: firebaseUser.email,
          name,
        },
      },
      { status: 201 }
    );

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600,
    });

    return response;
  } catch (error) {
    console.error("Register error:", error);
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
