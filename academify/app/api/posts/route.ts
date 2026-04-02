import { NextRequest, NextResponse } from "next/server";
import { ModerationStatus } from "@prisma/client";
import { getSessionUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";

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
            { categoryID: categoryId },
            { category: { name: { equals: categoryId, mode: "insensitive" as const } } },
          ],
        }
      : {};

    const result = await prisma.post.findMany({
      where,
      include: {
        author: { select: { name: true } },
        category: { select: { name: true } },
        comments: { select: { commentID: true } },
      },
      orderBy: trending ? { comments: { _count: "desc" } } : { createdAt: "desc" },
      take: Number.isFinite(limit) ? limit : 10,
    });

    return NextResponse.json(
      {
        threads: result.map((post) => ({
          id: post.postID,
          title: post.title,
          content: post.content,
          categoryId: post.categoryID,
          tag: post.category.name.toLowerCase(),
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request.headers);
    if (!sessionUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, categoryId } = body;

    if (!title || !content || !categoryId) {
      return NextResponse.json(
        { error: "Title, content, and categoryId are required" },
        { status: 400 }
      );
    }

    const category = await prisma.category.findFirst({
      where: {
        OR: [
          { categoryID: categoryId },
          { name: { equals: categoryId, mode: "insensitive" } },
        ],
      },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const created = await prisma.post.create({
      data: {
        title,
        content,
        categoryID: category.categoryID,
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
          categoryId: created.categoryID,
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
