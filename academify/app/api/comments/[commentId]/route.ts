import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-session";
import { apiError } from "@/lib/api-response";
import { parseJson, parseRequiredString } from "@/lib/validation";
import { sanitizeText } from "@/lib/sanitization";




/**
 * @swagger
 * /api/comments/{commentId}:
 *   put:
 *     summary: Update a comment
 *     tags: [Comments]
 *     security:
 *       - sessionCookieAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *                 example: Updated comment content.
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: Delete a comment
 *     tags: [Comments]
 *     security:
 *       - sessionCookieAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Internal server error
 */

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const decoded = await verifyToken(request);
    if (!decoded) {
      return apiError(401, "Not authenticated", "UNAUTHORIZED");
    }

    const { commentId  } = await params;
    const body = await parseJson<{ content?: unknown }>(request);
    if (!body) {
      return apiError(400, "Invalid JSON", "BAD_REQUEST");
    }

    const content = parseRequiredString(body.content);
    if (content.error) {
      return apiError(400, "Invalid request", "BAD_REQUEST", [
        { field: "content", message: `content ${content.error}` },
      ]);
    }

    const comment = await prisma.comment.findUnique({
      where: { commentID: commentId },
    });
    if (!comment) {
      return apiError(404, "Comment not found", "NOT_FOUND");
    }

    const isModerator =
      decoded.role === "moderator" || decoded.role === "admin";

    if (comment.authorID !== decoded.id && !isModerator) {
      return apiError(
        403,
        "Forbidden: You can only edit your own comments",
        "FORBIDDEN"
      );
    }

    const updated = await prisma.comment.update({
      where: { commentID: commentId },
      data: { content: sanitizeText(content.value!) },
    });

    return NextResponse.json(
      {
        message: "Comment updated successfully",
        comment: {
          id: updated.commentID,
          postId: updated.postID,
          authorId: updated.authorID,
          content: updated.content,
          createdAt: updated.createdAt.toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update comment error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const decoded = await verifyToken(request);
    if (!decoded) {
      return apiError(401, "Not authenticated", "UNAUTHORIZED");
    }

    const { commentId  } = await params;
    const comment = await prisma.comment.findUnique({
      where: { commentID: commentId },
    });
    if (!comment) {
      return apiError(404, "Comment not found", "NOT_FOUND");
    }

    const isModerator =
      decoded.role === "moderator" || decoded.role === "admin";

    if (comment.authorID !== decoded.id && !isModerator) {
      return apiError(
        403,
        "Forbidden: You can only delete your own comments",
        "FORBIDDEN"
      );
    }

    await prisma.comment.delete({ where: { commentID: commentId } });

    return NextResponse.json(
      { message: "Comment deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete comment error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}





