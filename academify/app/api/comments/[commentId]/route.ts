import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { comments } from "@/app/api/posts/[postId]/comments/route";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.substring(7);
  try {
    return jwt.verify(token, JWT_SECRET) as {
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
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const index = comments.findIndex((c) => c.id === commentId);
    if (index === -1) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    const comment = comments[index];
    const isModerator =
      decoded.role === "moderator" || decoded.role === "admin";

    if (comment.authorId !== decoded.id && !isModerator) {
      return NextResponse.json(
        { error: "Forbidden: You can only edit your own comments" },
        { status: 403 }
      );
    }

    comments[index] = {
      ...comment,
      content,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(
      { message: "Comment updated successfully", comment: comments[index] },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update comment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
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
    const index = comments.findIndex((c) => c.id === commentId);
    if (index === -1) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    const comment = comments[index];
    const isModerator =
      decoded.role === "moderator" || decoded.role === "admin";

    if (comment.authorId !== decoded.id && !isModerator) {
      return NextResponse.json(
        { error: "Forbidden: You can only delete your own comments" },
        { status: 403 }
      );
    }

    comments.splice(index, 1);

    return NextResponse.json(
      { message: "Comment deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete comment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
