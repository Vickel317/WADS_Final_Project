import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-session";
import { apiError } from "@/lib/api-response";
import {
  generateObjectKey,
  isMinioEnabled,
  putObjectBytes,
  ensureBucketExists,
} from "@/lib/storage";
import { isRestrictedAccount } from "@/lib/moderation";
import { validateUploadedFile } from "@/lib/validation";

const MAX_FILE_BYTES = 50 * 1024 * 1024;

/**
 * Server-side file upload to MinIO.
 * Avoids browser CORS issues with direct presigned PUT to MinIO (common in local dev).
 */
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

    const formData = await request.formData().catch(() => null);
    const file = formData?.get("file");
    if (!(file instanceof File)) {
      return apiError(400, "Missing file", "BAD_REQUEST");
    }

    if (file.size > MAX_FILE_BYTES) {
      return apiError(400, "File exceeds the 50 MB limit", "BAD_REQUEST");
    }

    const validation = validateUploadedFile({
      name: file.name,
      type: file.type || "application/octet-stream",
      size: file.size,
    });
    if (!validation.ok) {
      return apiError(400, validation.error, "BAD_REQUEST");
    }

    const key = generateObjectKey(validation.value.fileName);
    const buffer = Buffer.from(await file.arrayBuffer());

    await ensureBucketExists();
    await putObjectBytes(key, buffer, validation.value.fileType);

    return NextResponse.json(
      {
        key,
        fileName: validation.value.fileName,
        fileType: validation.value.fileType,
        fileSize: validation.value.fileSize,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Storage upload error:", error);
    const message =
      error instanceof Error && error.message.includes("ECONNREFUSED")
        ? "Cannot reach MinIO. Start MinIO (e.g. docker compose up minio) and check MINIO_ENDPOINT in .env.local"
        : "Internal server error";
    return apiError(500, message, "INTERNAL_ERROR");
  }
}
