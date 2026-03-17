import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { firebaseLookupByIdToken, firebaseRefresh } from "@/lib/firebase-auth";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Refresh token is required" },
        { status: 400 }
      );
    }

    const refreshed = await firebaseRefresh(refreshToken);
    const firebaseUser = await firebaseLookupByIdToken(refreshed.idToken);

    // Create new access token used by current app routes.
    const newToken = jwt.sign(
      {
        id: refreshed.userId,
        email: firebaseUser?.email || "",
        role: "student",
        name: firebaseUser?.displayName || "",
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    return NextResponse.json(
      {
        token: newToken,
        refreshToken: refreshed.refreshToken,
        firebaseIdToken: refreshed.idToken,
        expiresIn: Number(refreshed.expiresIn),
      },
      { status: 200 }
    );
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
