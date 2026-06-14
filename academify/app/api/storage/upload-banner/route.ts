import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-session";
import { apiError } from "@/lib/api-response";
import { generateObjectKey, isMinioEnabled, putObjectBytes, deleteObject } from "@/lib/storage";
import { prisma } from "@/lib/prisma";

const MAX_BANNER_BYTES = 5 * 1024 * 1024;

function fileToDataUrl(file: File, buffer: Buffer) {
  const mimeType = file.type || "application/octet-stream";
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser(request.headers);
    if (!session) return apiError(401, "Unauthorized", "UNAUTHORIZED");

    const formData = await request.formData().catch(() => null);
    const file = formData?.get("file");

    if (!(file instanceof File)) {
      return apiError(400, "Missing banner file", "BAD_REQUEST");
    }

    if (!file.type.startsWith("image/")) {
      return apiError(400, "Banner must be an image", "BAD_REQUEST");
    }

    if (file.size > MAX_BANNER_BYTES) {
      return apiError(400, "Banner must be 5MB or smaller", "BAD_REQUEST");
    }

    const key = generateObjectKey(file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    let storedBannerUrl = key;

    try {
      await putObjectBytes(key, buffer, file.type || "application/octet-stream");
    } catch (storageError) {
      console.warn("MinIO upload failed, falling back to inline banner storage:", storageError);
      storedBannerUrl = fileToDataUrl(file, buffer);
    }

    try {
      const previous = await prisma.user.findUnique({ where: { userId: session.user.userId }, select: { bannerUrl: true } });
      await prisma.user.update({ where: { userId: session.user.userId }, data: { bannerUrl: storedBannerUrl } });

      const prevKey = previous?.bannerUrl;
      if (prevKey && prevKey !== storedBannerUrl && !prevKey.startsWith("http") && !prevKey.startsWith("/") && !prevKey.startsWith("data:")) {
        try {
          await deleteObject(prevKey);
        } catch (e) {
          console.warn("Failed to delete previous banner object:", e);
        }
      }
    } catch (e) {
      console.warn("Failed to persist banner key to DB:", e);
    }

    return NextResponse.json({ key: storedBannerUrl, bannerUrl: storedBannerUrl }, { status: 200 });
  } catch (error) {
    console.error("Upload banner error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}
