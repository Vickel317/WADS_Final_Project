import { NextRequest, NextResponse } from "next/server";
import { ModerationStatus } from "@prisma/client";
import { getSessionUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-response";
import { parseJson, parseRequiredString } from "@/lib/validation";

/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: Get all forum threads
 *     tags: [Forums]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filter threads by category
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of results to return
 *       - in: query
 *         name: trending
 *         schema:
 *           type: boolean
 *         description: Return trending threads
 *     responses:
 *       200:
 *         description: List of threads
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Create a new thread
 *     tags: [Forums]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content, categoryId]
 *             properties:
 *               title:
 *                 type: string
 *                 example: Best resources for learning React?
 *               content:
 *                 type: string
 *                 example: Looking for good React learning resources.
 *               categoryId:
 *                 type: string
 *                 example: tech
 *     responses:
 *       201:
 *         description: Thread created successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Internal server error
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const limit = parseInt(searchParams.get("limit") || "10");
    const trending = searchParams.get("trending") === "true";

    const where = categoryId
      ? {
          OR: [
            { forumID: categoryId },
            { forum: { name: { equals: categoryId, mode: "insensitive" as const } } },
          ],
        }
      : {};

    const result = await prisma.post.findMany({
      where,
      include: {
        author: { select: { name: true } },
        forum: { select: { name: true } },
        comments: { select: { commentID: true } },
      },
      orderBy: trending ? { _count: { comments: "desc" } } : { createdAt: "desc" },
      take: Number.isFinite(limit) ? limit : 10,
    });

    return NextResponse.json(
      {
        threads: result.map((post) => ({
          id: post.postID,
          title: post.title,
          content: post.content,
          forumId: post.forumID,
          tag: post.forum.name.toLowerCase(),
          author: post.author.name,
          replyCount: post.comments.length,
          replies: post.comments.length,
          views: 0,
          likes: 0,
          createdAt: post.createdAt.toISOString(),
          updatedAt: post.updatedAt.toISOString(),
          status: post.moderationStatus.toLowerCase(),
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get threads error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request.headers);
    if (!sessionUser) {
      return apiError(401, "Not authenticated", "UNAUTHORIZED");
    }

    const body = await parseJson<{
      title?: unknown;
      content?: unknown;
      categoryId?: unknown;
    }>(request);
    if (!body) {
      return apiError(400, "Invalid JSON", "BAD_REQUEST");
    }

    const errors = [] as Array<{ field?: string; message: string }>;
    const title = parseRequiredString(body.title);
    const content = parseRequiredString(body.content);
    const categoryId = parseRequiredString(body.categoryId);

    if (title.error) errors.push({ field: "title", message: `title ${title.error}` });
    if (content.error) {
      errors.push({ field: "content", message: `content ${content.error}` });
    }
    if (categoryId.error) {
      errors.push({ field: "categoryId", message: `categoryId ${categoryId.error}` });
    }

    if (errors.length) {
      return apiError(400, "Invalid request", "BAD_REQUEST", errors);
    }

    const category = await prisma.forumHub.findFirst({
      where: {
        OR: [
          { forumID: categoryId },
          { name: { equals: categoryId, mode: "insensitive" } },
        ],
      },
    });

    if (!category) {
      return apiError(404, "Category not found", "NOT_FOUND");
    }

    const created = await prisma.post.create({
      data: {
        title: title.value!,
        content: content.value!,
        forumID: category.forumID,
        authorID: sessionUser.user.userId,
        moderationStatus: ModerationStatus.PENDING,
      },
      include: {
        author: { select: { name: true } },
      },
    });

    return NextResponse.json(
      {
        message: "Thread created successfully",
        thread: {
          id: created.postID,
          title: created.title,
          content: created.content,
          forumId: created.forumID,
          author: created.author.name,
          status: created.moderationStatus.toLowerCase(),
          createdAt: created.createdAt.toISOString(),
          updatedAt: created.updatedAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create thread error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}
