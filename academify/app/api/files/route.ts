import { NextRequest, NextResponse } from "next/server";

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
export let files: Array<{
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedBy: { id: string; name: string };
  createdAt: string;
}> = [
  {
    id: "1",
    name: "Binary_Trees_Notes.pdf",
    size: 204800,
    type: "application/pdf",
    url: "/uploads/Binary_Trees_Notes.pdf",
    uploadedBy: { id: "user2", name: "Sarah Chen" },
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "React_Cheatsheet.pdf",
    size: 102400,
    type: "application/pdf",
    url: "/uploads/React_Cheatsheet.pdf",
    uploadedBy: { id: "user1", name: "Alex Turner" },
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Algorithm_Diagrams.png",
    size: 512000,
    type: "image/png",
    url: "/uploads/Algorithm_Diagrams.png",
    uploadedBy: { id: "user3", name: "Mike Johnson" },
    createdAt: new Date().toISOString(),
  },
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const type = searchParams.get("type");

    let result = [...files];

    if (search) {
      result = result.filter((f) =>
        f.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (type) {
      result = result.filter((f) => f.type.includes(type));
    }

    return NextResponse.json({ files: result }, { status: 200 });
  } catch (error) {
    console.error("Get files error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File exceeds 50MB limit" },
        { status: 400 }
      );
    }

    // TODO: upload to real storage (S3, Cloudinary, etc.) in Week 7
    const newFile = {
      id: Date.now().toString(),
      name: file.name,
      size: file.size,
      type: file.type,
      url: `/uploads/${file.name}`,
      uploadedBy: { id: "current-user", name: "Current User" },
      createdAt: new Date().toISOString(),
    };

    files.push(newFile);

    return NextResponse.json(
      { message: "File uploaded successfully", file: newFile },
      { status: 201 }
    );
  } catch (error) {
    console.error("Upload file error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}