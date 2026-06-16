import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { ModerationStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth-session";
import { apiError } from "@/lib/api-response";
import { parseJson, parseRequiredString } from "@/lib/validation";
import { applyPostModeration } from "@/lib/ai/post-moderation";
import { canViewPost } from "@/lib/post-visibility";
import { sanitizeText } from "@/lib/sanitization";

/**
 * @swagger
 * /api/posts/{postId}:
 *   get:
 *     summary: Get a single post with comments
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post with comments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 post:
 *                   $ref: '#/components/schemas/Post'
 *       404:
 *         description: Post not found
 *       500:
 *         description: Internal server error
 *   put:
 *     summary: Update own post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
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
 *             properties:
 *               title:
 *                 type: string
 *                 example: Updated title
 *               content:
 *                 type: string
 *                 example: Updated content
 *     responses:
 *       200:
 *         description: Post updated successfully
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden - not the post owner
 *       404:
 *         description: Post not found
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: Delete post (own or moderator)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Post not found
 *       500:
 *         description: Internal server error
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const decoded = await verifyToken(request);
    const { postId } = await params;
    const post = await prisma.post.findUnique({
      where: { postID: postId },
      include: {
        author: { select: { name: true } },
        forum: { select: { forumID: true, name: true } },
        file: true,
        comments: { select: { commentID: true } },
      },
    });

    if (!post) {
      return apiError(404, "Post not found", "NOT_FOUND");
    }
    if (!canViewPost(post, decoded ? { id: decoded.id, role: decoded.role } : null)) {
      return apiError(404, "Post not found", "NOT_FOUND");
    }

    return NextResponse.json(
      {
        post: {
          id: post.postID,
          title: post.title,
          content: post.content,
          forumId: post.forumID,
          forumName: post.forum.name,
          attachment: post.file
            ? {
                id: post.file.fileID,
                name: post.file.fileName,
                url: post.file.fileUrl,
                type: post.file.fileType,
                size: post.file.fileSize,
              }
            : null,
          author: post.author.name,
          replyCount: post.comments.length,
          replies: post.comments.length,
          createdAt: post.createdAt.toISOString(),
          updatedAt: post.updatedAt.toISOString(),
          status: post.moderationStatus.toLowerCase(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get post error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const decoded = await verifyToken(request);
    if (!decoded) {
      return apiError(401, "Not authenticated", "UNAUTHORIZED");
    }

    const { postId } = await params;
    const body = await parseJson<{ title?: unknown; content?: unknown }>(request);
    if (!body) {
      return apiError(400, "Invalid JSON", "BAD_REQUEST");
    }

    const title = parseRequiredString(body.title);
    const content = parseRequiredString(body.content);
    const errors = [] as Array<{ field?: string; message: string }>;

    if (title.error) errors.push({ field: "title", message: `title ${title.error}` });
    if (content.error) {
      errors.push({ field: "content", message: `content ${content.error}` });
    }

    if (errors.length) {
      return apiError(400, "Invalid request", "BAD_REQUEST", errors);
    }

    const existing = await prisma.post.findUnique({
      where: { postID: postId },
      select: {
        postID: true,
        authorID: true,
        forumID: true,
        title: true,
        content: true,
        moderationStatus: true,
      },
    });

    if (!existing) {
      return apiError(404, "Post not found", "NOT_FOUND");
    }

    if (existing.authorID !== decoded.id) {
      return apiError(
        403,
        "Forbidden: You can only edit your own posts",
        "FORBIDDEN"
      );
    }
    if (existing.moderationStatus !== "APPROVED") {
      return apiError(
        403,
        "Forbidden: Flagged/blocked posts cannot be edited",
        "FORBIDDEN"
      );
    }

    const safeTitle = sanitizeText(title.value!);
    const safeContent = sanitizeText(content.value!);

    const titleChanged = safeTitle !== existing.title;
    const contentChanged = safeContent !== existing.content;
    const shouldRemoderate = titleChanged || contentChanged;

    const post = await prisma.post.update({
      where: { postID: postId },
      data: {
        title: safeTitle,
        content: safeContent,
        ...(shouldRemoderate
          ? {
              editedAt: new Date(),
              moderationStatus: ModerationStatus.PENDING,
              aiLabel: "moderation_pending",
              aiReason: "Edited content is being reviewed by AI",
              summaryJson: Prisma.DbNull,
              summaryAt: null,
              summaryCommentCount: null,
            }
          : {}),
      },
    });

    if (shouldRemoderate) {
      const forum = await prisma.forumHub.findUnique({
        where: { forumID: existing.forumID },
        select: { name: true },
      });
      const nextTitle = safeTitle;
      const nextContent = safeContent;
      const forumName = forum?.name ?? "Forum";

      after(async () => {
        await applyPostModeration(postId, nextTitle, nextContent, forumName);
      });
    }

    return NextResponse.json(
      {
        message: shouldRemoderate
          ? "Post updated and sent for review"
          : "Post updated successfully",
        post: {
          id: post.postID,
          title: post.title,
          content: post.content,
          status: post.moderationStatus.toLowerCase(),
          createdAt: post.createdAt.toISOString(),
          updatedAt: post.updatedAt.toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update post error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const decoded = await verifyToken(request);
    if (!decoded) {
      return apiError(401, "Not authenticated", "UNAUTHORIZED");
    }

    const { postId } = await params;
    const existing = await prisma.post.findUnique({
      where: { postID: postId },
      select: { postID: true, authorID: true },
    });

    if (!existing) {
      return apiError(404, "Post not found", "NOT_FOUND");
    }

    const isModerator = decoded.role === "moderator" || decoded.role === "admin";
    if (existing.authorID !== decoded.id && !isModerator) {
      return apiError(
        403,
        "Forbidden: You can only delete your own posts",
        "FORBIDDEN"
      );
    }

    await prisma.post.delete({ where: { postID: postId } });

    return NextResponse.json(
      { message: "Post deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete post error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}

