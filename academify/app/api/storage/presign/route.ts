import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-session";
import { apiError } from "@/lib/api-response";
import { isMinioEnabled, getPresignedPutUrl, generateObjectKey } from "@/lib/storage";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser(request.headers);
    if (!session) return apiError(401, "Unauthorized", "UNAUTHORIZED");

    if (!isMinioEnabled()) {
      return apiError(400, "MinIO not configured", "BAD_REQUEST");
    }

    const body = (await request.json().catch(() => null)) as { fileName?: string; contentType?: string } | null;
    if (!body || !body.fileName || !body.contentType) return apiError(400, "Missing fileName/contentType", "BAD_REQUEST");

    const key = generateObjectKey(body.fileName);
    const url = await getPresignedPutUrl(key, body.contentType);

    return NextResponse.json({ url, key }, { status: 200 });
  } catch (error) {
    console.error("Presign error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}
