import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-session";
import { apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { getPresignedGetUrl, deleteObject } from "@/lib/storage";
import { canAccessFile } from "@/lib/file-access";

/**
 * @swagger
 * /api/files/{fileId}:
 *   get:
 *     summary: Get a single file by ID
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 file:
 *                   $ref: '#/components/schemas/File'
 *       404:
 *         description: File not found
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: Delete a file
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File deleted successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden - not the file owner
 *       404:
 *         description: File not found
 *       500:
 *         description: Internal server error
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const decoded = await verifyToken(request);
    if (!decoded) {
      return apiError(401, "Not authenticated", "UNAUTHORIZED");
    }

    const { fileId } = await params;
    const file = await prisma.file.findUnique({
      where: { fileID: fileId },
      include: { uploadedBy: true, space: true },
    });

    if (!file) {
      return apiError(404, "File not found", "NOT_FOUND");
    }

    if (!(await canAccessFile(file, decoded.id))) {
      return apiError(404, "File not found", "NOT_FOUND");
    }

    const url = await getPresignedGetUrl(file.fileUrl);

    return NextResponse.json(
      {
        file: {
          id: file.fileID,
          name: file.fileName,
          size: file.fileSize,
          type: file.fileType,
          url,
          uploadedBy: { id: file.uploadedBy.userId, name: file.uploadedBy.name },
          spaceId: file.spaceID ?? null,
          createdAt: file.updatedAt.toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get file error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const decoded = await verifyToken(request);
    if (!decoded) {
      return apiError(401, "Not authenticated", "UNAUTHORIZED");
    }

    const { fileId } = await params;
    const file = await prisma.file.findUnique({
      where: { fileID: fileId },
    });

    if (!file) {
      return apiError(404, "File not found", "NOT_FOUND");
    }

    if (file.uploadedByID !== decoded.id) {
      return apiError(
        403,
        "Forbidden: You can only delete your own files",
        "FORBIDDEN"
      );
    }

    await deleteObject(file.fileUrl).catch((e) => console.warn("MinIO delete failed:", e));

    const deleted = await prisma.file.delete({ where: { fileID: fileId } });

    return NextResponse.json(
      {
        message: "File deleted successfully",
        file: {
          id: deleted.fileID,
          name: deleted.fileName,
          size: deleted.fileSize,
          type: deleted.fileType,
          url: deleted.fileUrl,
          spaceId: deleted.spaceID ?? null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete file error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const decoded = await verifyToken(request);
    if (!decoded) {
      return apiError(401, "Not authenticated", "UNAUTHORIZED");
    }

    const { fileId } = await params;
    const body = (await request.json().catch(() => null)) as
      | { spaceId?: string | null }
      | null;

    if (!body || !("spaceId" in body)) {
      return apiError(400, "Missing spaceId", "BAD_REQUEST");
    }

    const file = await prisma.file.findUnique({
      where: { fileID: fileId },
    });

    if (!file) {
      return apiError(404, "File not found", "NOT_FOUND");
    }

    if (file.uploadedByID !== decoded.id) {
      return apiError(
        403,
        "Forbidden: You can only share your own files",
        "FORBIDDEN"
      );
    }

    const updated = await prisma.file.update({
      where: { fileID: fileId },
      data: {
        spaceID: body.spaceId || null,
      },
    });

    return NextResponse.json(
      {
        message: "File shared successfully",
        file: {
          id: updated.fileID,
          name: updated.fileName,
          size: updated.fileSize,
          type: updated.fileType,
          url: updated.fileUrl,
          spaceId: updated.spaceID ?? null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Share file error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}

