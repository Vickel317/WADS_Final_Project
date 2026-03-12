import { NextRequest, NextResponse } from "next/server";
import { files } from "@/app/api/files/route";

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
 *       403:
 *         description: Forbidden - not the file owner
 *       404:
 *         description: File not found
 *       500:
 *         description: Internal server error
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const file = files.find((f) => f.id === params.fileId);

    if (!file) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ file }, { status: 200 });
  } catch (error) {
    console.error("Get file error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const fileIndex = files.findIndex((f) => f.id === params.fileId);

    if (fileIndex === -1) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    // TODO: verify file owner via JWT in Week 8
    // TODO: delete from real storage in Week 7
    const deleted = files.splice(fileIndex, 1)[0];

    return NextResponse.json(
      { message: "File deleted successfully", file: deleted },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete file error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}