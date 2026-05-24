import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-session";
import { apiError } from "@/lib/api-response";
import { generateObjectKey, isMinioEnabled, putObjectBytes, deleteObject } from "@/lib/storage";
import { prisma } from "@/lib/prisma";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

function fileToDataUrl(file: File, buffer: Buffer) {
  const mimeType = file.type || "application/octet-stream";
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser(request.headers);
    if (!session) return apiError(401, "Unauthorized", "UNAUTHORIZED");

    if (!isMinioEnabled()) {
      return apiError(400, "MinIO not configured", "BAD_REQUEST");
    }

    const formData = await request.formData().catch(() => null);
    const file = formData?.get("file");

    if (!(file instanceof File)) {
      return apiError(400, "Missing avatar file", "BAD_REQUEST");
    }

    if (!file.type.startsWith("image/")) {
      return apiError(400, "Avatar must be an image", "BAD_REQUEST");
    }

    if (file.size > MAX_AVATAR_BYTES) {
      return apiError(400, "Avatar must be 2MB or smaller", "BAD_REQUEST");
    }

    const key = generateObjectKey(file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    let storedAvatarUrl = key;

    try {
      await putObjectBytes(key, buffer, file.type || "application/octet-stream");
    } catch (storageError) {
      console.warn("MinIO upload failed, falling back to inline avatar storage:", storageError);
      storedAvatarUrl = fileToDataUrl(file, buffer);
    }

    // Persist the avatar key to the user's profile so it remains after refresh
    try {
      const previous = await prisma.user.findUnique({ where: { userId: session.user.userId }, select: { avatarUrl: true } });
      await prisma.user.update({ where: { userId: session.user.userId }, data: { avatarUrl: storedAvatarUrl } });

      // Cleanup previous object if it exists and looks like an object key (not an external URL or internal redirect path)
      const prevKey = previous?.avatarUrl;
      if (prevKey && prevKey !== storedAvatarUrl && !prevKey.startsWith("http") && !prevKey.startsWith("/") && !prevKey.startsWith("data:")) {
        try {
          await deleteObject(prevKey);
        } catch (e) {
          console.warn("Failed to delete previous avatar object:", e);
        }
      }
    } catch (e) {
      console.warn("Failed to persist avatar key to DB:", e);
    }

    return NextResponse.json({ key: storedAvatarUrl, avatarUrl: storedAvatarUrl }, { status: 200 });
  } catch (error) {
    console.error("Upload avatar error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}