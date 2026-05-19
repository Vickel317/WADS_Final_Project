import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-session";

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

// TODO: replace with Prisma + real file storage (e.g. S3) in Week 7
export const files: Array<{
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedBy: { id: string; name: string };
  spaceId?: string | null;
  createdAt: string;
}> = [
  {
    id: "1",
    name: "Binary_Trees_Notes.pdf",
    size: 204800,
    type: "application/pdf",
    url: "/uploads/Binary_Trees_Notes.pdf",
    uploadedBy: { id: "user2", name: "Sarah Chen" },
    spaceId: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "React_Cheatsheet.pdf",
    size: 102400,
    type: "application/pdf",
    url: "/uploads/React_Cheatsheet.pdf",
    uploadedBy: { id: "user1", name: "Alex Turner" },
    spaceId: "Capstone Sprint",
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Algorithm_Diagrams.png",
    size: 512000,
    type: "image/png",
    url: "/uploads/Algorithm_Diagrams.png",
    uploadedBy: { id: "user3", name: "Mike Johnson" },
    spaceId: "Data Structures Lab",
    createdAt: new Date().toISOString(),
  },
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const type = searchParams.get("type");
    const spaceId = searchParams.get("spaceId");
    // Try DB first (persistent files). If DB unavailable, fallback to in-memory mock.
    try {
      const where: any = {};
      if (search) where.fileName = { contains: search, mode: "insensitive" };
      if (type) where.fileType = { contains: type };
      if (spaceId) where.spaceID = spaceId;

      const dbFiles = await prisma.file.findMany({
        where,
        include: { uploadedBy: true, space: true },
        orderBy: { updatedAt: "desc" },
      });

      const mapped = dbFiles.map((f) => ({
        id: f.fileID,
        name: f.fileName,
        size: f.fileSize,
        type: f.fileType,
        url: f.fileUrl,
        uploadedBy: { id: f.uploadedBy.userId, name: f.uploadedBy.name },
        spaceId: f.spaceID ?? null,
        createdAt: f.updatedAt.toISOString(),
      }));

      return NextResponse.json({ files: mapped }, { status: 200 });
    } catch (err) {
      // fallback to in-memory
      let result = [...files];

      if (search) {
        result = result.filter((f) =>
          f.name.toLowerCase().includes(search.toLowerCase())
        );
      }

      if (type) {
        result = result.filter((f) => f.type.includes(type));
      }

      if (spaceId) {
        result = result.filter((f) => f.spaceId === spaceId);
      }

      return NextResponse.json({ files: result }, { status: 200 });
    }
  } catch (error) {
    console.error("Get files error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const spaceId = (formData.get("spaceId") as string) || null;

    if (!file) {
      return apiError(400, "No file provided", "BAD_REQUEST");
    }

    if (file.size > MAX_FILE_SIZE) {
      return apiError(400, "File exceeds 50MB limit", "BAD_REQUEST");
    }
    const sessionUser = await getSessionUser(request.headers);
    if (!sessionUser) {
      return apiError(401, "Unauthorized", "UNAUTHORIZED");
    }

    // TODO: upload to real storage (S3, Cloudinary, etc.) in Week 7
    const fileUrl = `/uploads/${file.name}`;

    try {
      const created = await prisma.file.create({
        data: {
          uploadedByID: sessionUser.user.userId,
          fileName: file.name,
          fileUrl,
          fileType: file.type,
          fileSize: file.size,
          spaceID: spaceId ?? null,
        },
      });

      const resp = {
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
    } catch (err) {
      // fallback: in-memory mock
      const newFile = {
        id: Date.now().toString(),
        name: file.name,
        size: file.size,
        type: file.type,
        url: fileUrl,
        uploadedBy: { id: sessionUser.user.userId, name: sessionUser.user.name },
        spaceId,
        createdAt: new Date().toISOString(),
      };

      files.push(newFile);

      return NextResponse.json({ message: "File uploaded successfully (mock)", file: newFile }, { status: 201 });
    }
  } catch (error) {
    console.error("Upload file error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}
