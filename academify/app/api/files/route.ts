import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-session";
import { getPresignedGetUrl } from "@/lib/storage";
import { getAccessibleFileWhere } from "@/lib/file-access";
import { validateFileUpload } from "@/lib/validation";

type FileWithRelations = Prisma.FileGetPayload<{
  include: { uploadedBy: true; space: true };
}>;

/**
 * @swagger
 * /api/files:
 *   get:
 *     summary: Get all shared files
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search files by name
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by file type (pdf, image, zip)
 *     responses:
 *       200:
 *         description: List of files
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 files:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/File'
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Upload a new file
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File to upload (max 50MB)
 *     responses:
 *       201:
 *         description: File uploaded successfully
 *       400:
 *         description: No file provided or file too large
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

export type FileRecord = {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedBy: { id: string; name: string };
  spaceId?: string | null;
  createdAt: string;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const type = searchParams.get("type");
    const spaceId = searchParams.get("spaceId");
    const sessionUser = await getSessionUser(request.headers);
    if (!sessionUser) {
      return apiError(401, "Unauthorized", "UNAUTHORIZED");
    }

    const where: Prisma.FileWhereInput = await getAccessibleFileWhere(sessionUser.user.userId);
    if (search) where.fileName = { contains: search, mode: "insensitive" };
    if (type) where.fileType = { contains: type };
    if (spaceId) where.spaceID = spaceId;

    try {
      const dbFiles = await prisma.file.findMany({
        where,
        include: { uploadedBy: true, space: true },
        orderBy: { updatedAt: "desc" },
      });

      const mapped: FileRecord[] = await Promise.all(
        dbFiles.map(async (f: FileWithRelations) => {
          const url = await getPresignedGetUrl(f.fileUrl);
          return {
            id: f.fileID,
            name: f.fileName,
            size: f.fileSize,
            type: f.fileType,
            url,
            uploadedBy: { id: f.uploadedBy.userId, name: f.uploadedBy.name },
            spaceId: f.spaceID ?? null,
            createdAt: f.updatedAt.toISOString(),
          } as FileRecord;
        })
      );

      return NextResponse.json({ files: mapped }, { status: 200 });
    } catch (pErr: unknown) {
      // If the schema is not migrated (missing File.spaceID column), avoid returning 500
      const prismaErr = pErr as { code?: string; message?: string };
      if (prismaErr?.code === "P2022" && /spaceID/i.test(prismaErr.message ?? "")) {
        console.warn(
          "Prisma schema mismatch: File.spaceID column missing. Returning empty file list. Run prisma migrate to update the database.",
          prismaErr.message
        );
        return NextResponse.json({ files: [] }, { status: 200 });
      }
      throw pErr;
    }
  } catch (error) {
    console.error("Get files error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}

export async function POST(request: NextRequest) {
  try {
    // MinIO-only flow: client uploads directly to MinIO and calls this endpoint with JSON { objectKey, fileName, fileType, fileSize, spaceId }

    const contentType = request.headers.get("content-type") || "";
    const sessionUser = await getSessionUser(request.headers);
    if (!sessionUser) return apiError(401, "Unauthorized", "UNAUTHORIZED");

    if (!contentType.includes("application/json")) {
      return apiError(400, "MinIO upload metadata must be sent as JSON", "BAD_REQUEST");
    }

    const raw = await request.json().catch(() => null);
    const validation = validateFileUpload(raw);
    if (!validation.ok) return apiError(400, validation.error, "BAD_REQUEST");

    const { objectKey, fileName, fileType, fileSize, spaceId } = validation.data;
    const data: Prisma.FileUncheckedCreateInput = {
      uploadedByID: sessionUser.user.userId,
      fileName,
      fileUrl: objectKey,
      fileType,
      fileSize,
      ...(spaceId ? { spaceID: spaceId } : {}),
    };

    const created = await prisma.file.create({ data });

    const resp: FileRecord = {
      id: created.fileID,
      name: created.fileName,
      size: created.fileSize,
      type: created.fileType,
      url: created.fileUrl,
      uploadedBy: { id: sessionUser.user.userId, name: sessionUser.user.name },
      spaceId: created.spaceID ?? null,
      createdAt: created.updatedAt.toISOString(),
    };

    return NextResponse.json({ message: "File uploaded successfully", file: resp }, { status: 201 });
  } catch (error: unknown) {
    console.error("Upload file error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return apiError(500, message, "INTERNAL_ERROR");
  }
}
