import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-session";
import { apiError } from "@/lib/api-response";
import { parseJson, parseRequiredString } from "@/lib/validation";




/**
 * @swagger
 * /api/posts/{postId}/comments:
 *   get:
 *     summary: Get comments for a post
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of comments
 *       404:
 *         description: No comments found
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Add a comment to a post
 *     tags: [Comments]
 *     security:
 *       - sessionCookieAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
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
 *                 example: This is a helpful comment.
 *     responses:
 *       201:
 *         description: Comment created successfully
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Internal server error
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId  } = await params;
    const postComments = await prisma.comment.findMany({
      where: { postID: postId },
      include: { author: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(
      {
        comments: postComments.map((c) => ({
          id: c.commentID,
          postId: c.postID,
          content: c.content,
          authorId: c.authorID,
          authorName: c.author.name,
          createdAt: c.createdAt.toISOString(),
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get comments error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const decoded = await verifyToken(request);
    if (!decoded) {
      return apiError(401, "Not authenticated", "UNAUTHORIZED");
    }

    const { postId  } = await params;
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

    const post = await prisma.post.findUnique({ where: { postID: postId } });
    if (!post) {
      return apiError(404, "Post not found", "NOT_FOUND");
    }

    const author = await prisma.user.findFirst({
      where: {
        OR: [
          { userId: decoded.id },
          ...(decoded.email ? [{ email: decoded.email }] : []),
        ],
      },
    });
    if (!author) {
      return apiError(401, "Not authenticated", "UNAUTHORIZED");
    }

    const newComment = await prisma.comment.create({
      data: {
        postID: postId,
        content: content.value!,
        authorID: author.userId,
      },
      include: { author: { select: { name: true } } },
    });

    return NextResponse.json(
      {
        message: "Comment created successfully",
        comment: {
          id: newComment.commentID,
          postId: newComment.postID,
          content: newComment.content,
          authorId: newComment.authorID,
          authorName: newComment.author.name,
          createdAt: newComment.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create comment error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}





