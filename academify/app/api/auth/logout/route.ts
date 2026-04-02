import { NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/auth-jwt";

export async function POST() {
  try {
    // Create response
    const response = NextResponse.json(
      { message: "Logged out successfully" },
      { status: 200 }
    );

    clearAuthCookies(response);

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
