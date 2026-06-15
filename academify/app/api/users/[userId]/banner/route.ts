import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-response";
import { getObjectBytes, isMinioEnabled } from "@/lib/storage";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> | { userId: string } }
) {
  try {
    const { userId } = await Promise.resolve(params);
    const user = await prisma.user.findUnique({
      where: { userId },
      select: { bannerUrl: true },
    });

    if (!user?.bannerUrl) {
      return apiError(404, "Banner not found", "NOT_FOUND");
    }

    if (user.bannerUrl.startsWith("http")) {
      return NextResponse.redirect(user.bannerUrl, 302);
    }

    if (user.bannerUrl.startsWith("data:")) {
      const match = user.bannerUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) return apiError(400, "Invalid banner data URL", "BAD_REQUEST");
      const body = Buffer.from(match[2], "base64");
      return new NextResponse(body, {
        status: 200,
        headers: {
          "Content-Type": match[1],
          "Cache-Control": "private, max-age=31536000, immutable",
        },
      });
    }

    if (!isMinioEnabled()) {
      return apiError(400, "MinIO not configured", "BAD_REQUEST");
    }

    const object = await getObjectBytes(user.bannerUrl);
    const body = await object.body.transformToByteArray();

    return new NextResponse(Buffer.from(body), {
      status: 200,
      headers: {
        "Content-Type": object.contentType,
        ...(object.contentLength ? { "Content-Length": String(object.contentLength) } : {}),
        ...(object.lastModified ? { "Last-Modified": object.lastModified } : {}),
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Get banner error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}
