import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { ModerationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getJwtSecret } from "@/lib/auth-jwt";

type DecodedToken = {
  id: string;
  email?: string;
  role?: string;
};

function verifyToken(request: NextRequest): DecodedToken | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    return jwt.verify(token, getJwtSecret()) as DecodedToken;
  } catch {
    return null;
  }
}

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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 threads:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Thread'
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 thread:
 *                   $ref: '#/components/schemas/Thread'
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
        threads: result.map((p) => ({
          id: p.postID,
          title: p.title,
          content: p.content,
          categoryId: p.categoryID,
          tag: p.category.name.toLowerCase(),
          author: p.author.name,
          replyCount: p.comments.length,
          replies: p.comments.length,
          views: 0,
          likes: 0,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
          status: p.moderationStatus.toLowerCase(),
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get threads error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const decoded = verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, categoryId } = body;

    // Validation
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

    const author = await prisma.user.findFirst({
      where: {
        OR: [
          { userId: decoded.id },
          ...(decoded.email ? [{ email: decoded.email }] : []),
        ],
      },
    });
    if (!author) {
      return NextResponse.json(
        { error: "User record not found in database for this token" },
        { status: 401 }
      );
    }

    const created = await prisma.post.create({
      data: {
        title,
        content,
        categoryID: category.categoryID,
        authorID: author.userId,
        moderationStatus: ModerationStatus.PENDING,
      },
      include: {
        author: { select: { name: true } },
      },
    });

    const newThread = {
      id: created.postID,
      title: created.title,
      content: created.content,
      categoryId: created.categoryID,
      tag: category.name.toLowerCase(),
      author: created.author.name,
      replyCount: 0,
      replies: 0,
      views: 0,
      likes: 0,
      createdAt: created.createdAt.toISOString(),
      status: created.moderationStatus.toLowerCase(),
    };

    return NextResponse.json(
      { message: "Thread created successfully", thread: newThread },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create thread error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
