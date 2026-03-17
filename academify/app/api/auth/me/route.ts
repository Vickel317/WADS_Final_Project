import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "@/lib/auth-jwt";

export async function GET(request: NextRequest) {
  try {
    const jwtSecret = getJwtSecret();
    // Get token from header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify token
    const decoded = jwt.verify(token, jwtSecret) as {
      id: string;
      email: string;
      role?: string;
      name?: string;
      iat?: number;
    };

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
