import { getJwtSecret } from "@/lib/auth-jwt";
import { handleApiError } from "@/lib/error-handler";
import { validateUpdateCommentPayload } from "@/lib/security";


function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.substring(7);
  try {
    return jwt.verify(token, getJwtSecret()) as {
      id: string;
      email: string;
      role?: string;
    };
  } catch {
    return null;
  }
}

/**
 * @swagger
 * /api/comments/{commentId}:
 *   put:
 *     summary: Update a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
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
 *       - bearerAuth: []
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
  { params }: { params: { commentId: string } }
) {
  try {
    const decoded = verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { commentId } = params;
    const body = await request.json();
    const validationResult = validateUpdateCommentPayload(body);
    if (!validationResult.ok) {
      return NextResponse.json({ error: validationResult.error }, { status: 400 });
    }

    const { content } = validationResult.data;

    const comment = await prisma.comment.findUnique({
      where: { commentID: commentId },
    });
    if (!comment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    const isModerator =
      decoded.role === "moderator" || decoded.role === "admin";

    if (comment.authorID !== decoded.id && !isModerator) {
      return NextResponse.json(
        { error: "Forbidden: You can only edit your own comments" },
        { status: 403 }
      );
    }

    const updated = await prisma.comment.update({
      where: { commentID: commentId },
      data: { content },
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
    return handleApiError("Update comment error:", error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { commentId: string } }
) {
  try {
    const decoded = verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { commentId } = params;
    const comment = await prisma.comment.findUnique({
      where: { commentID: commentId },
    });
    if (!comment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    const isModerator =
      decoded.role === "moderator" || decoded.role === "admin";

    if (comment.authorID !== decoded.id && !isModerator) {
      return NextResponse.json(
        { error: "Forbidden: You can only delete your own comments" },
        { status: 403 }
      );
    }

    await prisma.comment.delete({ where: { commentID: commentId } });

    return NextResponse.json(
      { message: "Comment deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError("Delete comment error:", error);
  }
}
