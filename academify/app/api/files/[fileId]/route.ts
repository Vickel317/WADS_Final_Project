import { NextRequest, NextResponse } from "next/server";
import { files } from "@/app/api/files/route";
import { verifyToken } from "@/lib/auth-session";
import { apiError } from "@/lib/api-response";

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
    const { fileId } = await params;
    const file = files.find((f) => f.id === fileId);

    if (!file) {
      return apiError(404, "File not found", "NOT_FOUND");
    }

    return NextResponse.json({ file }, { status: 200 });
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
    const fileIndex = files.findIndex((f) => f.id === fileId);

    if (fileIndex === -1) {
      return apiError(404, "File not found", "NOT_FOUND");
    }

    if (files[fileIndex].uploadedBy.id !== decoded.id) {
      return apiError(
        403,
        "Forbidden: You can only delete your own files",
        "FORBIDDEN"
      );
    }

    // TODO: delete from real storage in Week 7
    const deleted = files.splice(fileIndex, 1)[0];

    return NextResponse.json(
      { message: "File deleted successfully", file: deleted },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete file error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}

