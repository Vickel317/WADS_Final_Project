import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-session";
import { apiError } from "@/lib/api-response";
import { scanObjectFromMinio } from "@/lib/clamav";

export async function POST(request: NextRequest) {
  try {
    const decoded = await verifyToken(request);
    if (!decoded) return apiError(401, "Not authenticated", "UNAUTHORIZED");

    const body = (await request.json().catch(() => null)) as
      | { fileId?: string; objectKey?: string; fileName?: string }
      | null;

    if (!body || typeof body !== "object") {
      return apiError(400, "Missing request body", "BAD_REQUEST");
    }

    const { objectKey, fileName } = body;
    if (!objectKey || typeof objectKey !== "string") {
      return apiError(400, "Missing objectKey", "BAD_REQUEST");
    }

    const resolvedFileName = typeof fileName === "string" && fileName ? fileName : "uploaded-file";

    const result = await scanObjectFromMinio(objectKey, resolvedFileName);
    if (!result.ok) {
      return NextResponse.json(
        {
          message: "File scan failed",
          infected: false,
          error: result.error,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        message: "File scanned successfully",
        infected: result.infected,
        virusName: result.infected ? result.virusName : undefined,
        error: null,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("File scan endpoint error:", err);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}





