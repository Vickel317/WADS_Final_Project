import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// TODO: replace with Prisma in Week 7
export let comments: Array<{
  id: string;
  postId: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt?: string;
}> = [
  {
    id: "c1",
    postId: "1",
    content: "Great question! I recommend the official React docs.",
    authorId: "user_1",
    authorName: "John Doe",
    createdAt: new Date().toISOString(),
  },
  {
    id: "c2",
    postId: "1",
    content: "Also check out the React course on Scrimba.",
    authorId: "user_2",
    authorName: "Sarah Chen",
    createdAt: new Date().toISOString(),
  },
];

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
  { params }: { params: { postId: string } }
) {
  try {
    const { postId } = params;
    const postComments = comments.filter((c) => c.postId === postId);

    return NextResponse.json({ comments: postComments }, { status: 200 });
  } catch (error) {
    console.error("Get comments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const decoded = verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { postId } = params;
    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const newComment = {
      id: `c${Date.now()}`,
      postId,
      content,
      authorId: decoded.id,
      authorName: decoded.email,
      createdAt: new Date().toISOString(),
    };

    comments.push(newComment);

    return NextResponse.json(
      { message: "Comment created successfully", comment: newComment },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create comment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
