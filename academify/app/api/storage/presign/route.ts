import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-session";
import { apiError } from "@/lib/api-response";
import { isMinioEnabled, getPresignedPutUrl, generateObjectKey } from "@/lib/storage";
import { isRestrictedAccount } from "@/lib/moderation";
import { validateUploadFileName } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser(request.headers);
    if (!session) return apiError(401, "Unauthorized", "UNAUTHORIZED");
    if (isRestrictedAccount(session.user)) {
      return apiError(403, "Your account is restricted from uploading files", "FORBIDDEN");
    }

    if (!isMinioEnabled()) {
      return apiError(400, "MinIO not configured", "BAD_REQUEST");
    }

    const body = (await request.json().catch(() => null)) as { fileName?: string; contentType?: string } | null;
    if (!body || !body.fileName || !body.contentType) return apiError(400, "Missing fileName/contentType", "BAD_REQUEST");

    const fileName = validateUploadFileName(body.fileName);
    if (!fileName.ok) return apiError(400, fileName.error, "BAD_REQUEST");

    const key = generateObjectKey(fileName.value);
    const url = await getPresignedPutUrl(key, body.contentType);

    return NextResponse.json({ url, key }, { status: 200 });
  } catch (error) {
    console.error("Presign error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}
