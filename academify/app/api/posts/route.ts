import { NextRequest, NextResponse } from "next/server";

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

// TODO: replace with Prisma in Week 7
export let threads: Array<{
  id: string;
  title: string;
  content: string;
  categoryId: string;
  tag: string;
  author: string;
  replyCount: number;
  replies: number;
  views: number;
  likes: number;
  createdAt: string;
  updatedAt?: string;
}> = [
  {
    id: "1",
    title: "Best resources for learning React?",
    content: "Looking for good React learning resources.",
    categoryId: "tech",
    tag: "tech",
    author: "Alex Turner",
    replyCount: 24,
    replies: 24,
    views: 120,
    likes: 120,
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Tips for Data Structures exam",
    content: "Any tips for the upcoming DS exam?",
    categoryId: "academics",
    tag: "academics",
    author: "Sarah Chen",
    replyCount: 15,
    replies: 15,
    views: 89,
    likes: 89,
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    title: "Anyone joining the hackathon?",
    content: "Looking for teammates for the upcoming hackathon.",
    categoryId: "general",
    tag: "general",
    author: "Mike Johnson",
    replyCount: 8,
    replies: 8,
    views: 45,
    likes: 45,
    createdAt: new Date().toISOString(),
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const limit = parseInt(searchParams.get("limit") || "10");
    const trending = searchParams.get("trending") === "true";

    let result = [...threads];

    // Filter by category if provided
    if (categoryId) {
      result = result.filter((t) => t.categoryId === categoryId);
    }

    // Sort by replies if trending
    if (trending) {
      result = result.sort((a, b) => b.replyCount - a.replyCount);
    }

    // Apply limit
    result = result.slice(0, limit);

    return NextResponse.json({ threads: result }, { status: 200 });
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
    const body = await request.json();
    const { title, content, categoryId } = body;

    // Validation
    if (!title || !content || !categoryId) {
      return NextResponse.json(
        { error: "Title, content, and categoryId are required" },
        { status: 400 }
      );
    }

    // Create new thread
    const newThread = {
      id: Date.now().toString(),
      title,
      content,
      categoryId,
      tag: categoryId,
      author: "Current User", // TODO: get from JWT token in Week 8
      replyCount: 0,
      replies: 0,
      views: 0,
      likes: 0,
      createdAt: new Date().toISOString(),
    };

    threads.push(newThread);

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