import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    const { postId } = await params;
    const post = await prisma.post.findUnique({
      where: { postID: postId },
      include: {
        author: { select: { name: true } },
        comments: { select: { commentID: true } },
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        post: {
          id: post.postID,
          title: post.title,
          content: post.content,
          categoryId: post.categoryID,
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const body = await request.json();
    const { title, content } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.post.findUnique({
      where: { postID: postId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    const post = await prisma.post.update({
      where: { postID: postId },
      data: {
        title,
        content,
      },
    });

    return NextResponse.json(
      {
        message: "Post updated successfully",
        post: {
          id: post.postID,
          title: post.title,
          content: post.content,
          categoryId: post.categoryID,
          createdAt: post.createdAt.toISOString(),
          updatedAt: post.updatedAt.toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update post error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const existing = await prisma.post.findUnique({
      where: { postID: postId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    await prisma.post.delete({ where: { postID: postId } });

    return NextResponse.json(
      { message: "Post deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete post error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

