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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  try {
    const session = await getSessionUser(request.headers);
    if (!session) return apiError(401, "Unauthorized", "UNAUTHORIZED");

    const { type, id } = await params;

    if (type !== "event" && type !== "space") {
      return apiError(400, "Invalid type. Must be 'event' or 'space'", "BAD_REQUEST");
    }

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
      if (type === "event") {
        const previous = await prisma.event.findUnique({ where: { eventID: id }, select: { bannerUrl: true } });
        await prisma.event.update({ where: { eventID: id }, data: { bannerUrl: storedBannerUrl } });
        const prevKey = previous?.bannerUrl;
        if (prevKey && prevKey !== storedBannerUrl && !prevKey.startsWith("http") && !prevKey.startsWith("/") && !prevKey.startsWith("data:")) {
          try { await deleteObject(prevKey); } catch { /* ignore */ }
        }
      } else {
        const previous = await prisma.collabSpace.findUnique({ where: { spaceID: id }, select: { bannerUrl: true } });
        await prisma.collabSpace.update({ where: { spaceID: id }, data: { bannerUrl: storedBannerUrl } });
        const prevKey = previous?.bannerUrl;
        if (prevKey && prevKey !== storedBannerUrl && !prevKey.startsWith("http") && !prevKey.startsWith("/") && !prevKey.startsWith("data:")) {
          try { await deleteObject(prevKey); } catch { /* ignore */ }
        }
      }
    } catch (e) {
      console.warn("Failed to persist banner key to DB:", e);
    }

    return NextResponse.json({ bannerUrl: storedBannerUrl }, { status: 200 });
  } catch (error) {
    console.error("Upload entity banner error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}
