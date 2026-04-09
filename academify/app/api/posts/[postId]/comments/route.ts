import { getJwtSecret } from "@/lib/auth-jwt";
import { handleApiError } from "@/lib/error-handler";
import { validateCreateCommentPayload } from "@/lib/security";


function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.substring(7);
  try {
    return jwt.verify(token, getJwtSecret()) as {
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
    return handleApiError("Get comments error:", error);
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
    const validationResult = validateCreateCommentPayload(body);
    if (!validationResult.ok) {
      return NextResponse.json({ error: validationResult.error }, { status: 400 });
    }

    const { content } = validationResult.data;

    const post = await prisma.post.findUnique({ where: { postID: postId } });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
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

    const newComment = await prisma.comment.create({
      data: {
        postID: postId,
        content,
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
    return handleApiError("Create comment error:", error);
  }
}
