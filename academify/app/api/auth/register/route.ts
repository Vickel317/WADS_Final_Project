import { NextRequest, NextResponse } from "next/server";
import { firebaseSignUp, firebaseUpdateProfile } from "@/lib/firebase-auth";
import { setAuthCookies, signAccessToken } from "@/lib/auth-jwt";

export async function POST(request: NextRequest) {
  try {
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

    const token = signAccessToken({
      id: firebaseUser.localId,
      email: firebaseUser.email,
      role: "student",
      name,
    });

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

    setAuthCookies(response, token, firebaseUser.refreshToken);

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
