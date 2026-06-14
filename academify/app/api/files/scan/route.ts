import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-session";
import { apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

// ClamAV scan implementation cancelled.
// Keep the endpoint so existing clients don’t break, but report that scanning is disabled.
export async function POST(request: NextRequest) {

  try {
    const decoded = await verifyToken(request);
    if (!decoded) return apiError(401, "Not authenticated", "UNAUTHORIZED");

    // Validate body shape loosely to avoid breaking older clients.
    const body = (await request.json().catch(() => null)) as
      | { fileId?: string; objectKey?: string; fileName?: string }
      | null;

    if (!body || typeof body !== "object") {
      return apiError(400, "Missing request body", "BAD_REQUEST");
    }

    // Do NOT call scanObjectFromMinio (ClamAV disabled).
    // Return deterministic response.
    return NextResponse.json(
      {
        message: "File scanning disabled",
        infected: false,
        error: "CLAMAV_DISABLED",
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("File scan endpoint error:", err);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}




