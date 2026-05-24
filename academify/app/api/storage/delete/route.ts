import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-session";
import { apiError } from "@/lib/api-response";
import { deleteObject, isMinioEnabled } from "@/lib/storage";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser(request.headers);
    if (!session) return apiError(401, "Unauthorized", "UNAUTHORIZED");

    if (!isMinioEnabled()) {
      return apiError(400, "MinIO not configured", "BAD_REQUEST");
    }

    const body = (await request.json().catch(() => null)) as { key?: string } | null;
    if (!body || !body.key) return apiError(400, "Missing key", "BAD_REQUEST");

    await deleteObject(body.key);
    return NextResponse.json({ message: "Object deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Delete object error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}