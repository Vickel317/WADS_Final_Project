import { NextRequest, NextResponse } from "next/server";
import { getAccessTokenFromRequest, verifyAccessToken } from "@/lib/auth-jwt";

export async function GET(request: NextRequest) {
  try {
    const token = getAccessTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name || "",
        role: decoded.role || "student",
        createdAt: decoded.iat
          ? new Date(decoded.iat * 1000).toISOString()
          : null,
        updatedAt: new Date(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 }
    );
  }
}
