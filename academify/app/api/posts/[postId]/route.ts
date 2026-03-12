import { NextRequest, NextResponse } from "next/server";
import { threads as posts } from "@/app/api/posts/route";

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
  { params }: { params: { postId: string } }
) {
  try {
    const post = posts.find((p) => p.id === params.postId);

    if (!post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ post }, { status: 200 });
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
  { params }: { params: { postId: string } }
) {
  try {
    const body = await request.json();
    const { title, content } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    const postIndex = posts.findIndex((p) => p.id === params.postId);

    if (postIndex === -1) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    // TODO: verify post owner via JWT in Week 8
    posts[postIndex] = {
      ...posts[postIndex],
      title,
      content,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(
      { message: "Post updated successfully", post: posts[postIndex] },
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
  { params }: { params: { postId: string } }
) {
  try {
    const postIndex = posts.findIndex((p) => p.id === params.postId);

    if (postIndex === -1) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    // TODO: verify post owner OR moderator role via JWT in Week 8
    const deleted = posts.splice(postIndex, 1)[0];

    return NextResponse.json(
      { message: "Post deleted successfully", post: deleted },
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