import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-response";

async function getLikeState(commentId: string, userId: string | null) {
  const [count, liked] = await Promise.all([
    prisma.commentLike.count({ where: { commentID: commentId } }),
    userId
      ? prisma.commentLike.findUnique({
          where: { commentID_userID: { commentID: commentId, userID: userId } },
        })
      : Promise.resolve(null),
  ]);

  return { count, liked: Boolean(liked) };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const { commentId } = await params;
    const sessionUser = await getSessionUser(request.headers);
    const comment = await prisma.comment.findUnique({
      where: { commentID: commentId },
      select: { commentID: true },
    });
    if (!comment) {
      return apiError(404, "Comment not found", "NOT_FOUND");
    }

    const state = await getLikeState(commentId, sessionUser?.user.userId ?? null);
    return NextResponse.json(state);
  } catch (error) {
    console.error("Get comment likes error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const sessionUser = await getSessionUser(request.headers);
    if (!sessionUser) {
      return apiError(401, "Not authenticated", "UNAUTHORIZED");
    }

    const { commentId } = await params;
    const userId = sessionUser.user.userId;

    const comment = await prisma.comment.findUnique({
      where: { commentID: commentId },
      select: { commentID: true },
    });
    if (!comment) {
      return apiError(404, "Comment not found", "NOT_FOUND");
    }

    const existing = await prisma.commentLike.findUnique({
      where: { commentID_userID: { commentID: commentId, userID: userId } },
    });

    if (existing) {
      await prisma.commentLike.delete({
        where: { commentID_userID: { commentID: commentId, userID: userId } },
      });
      const count = await prisma.commentLike.count({ where: { commentID: commentId } });
      return NextResponse.json({ liked: false, count });
    }

    await prisma.commentLike.create({
      data: { commentID: commentId, userID: userId },
    });
    const count = await prisma.commentLike.count({ where: { commentID: commentId } });
    return NextResponse.json({ liked: true, count });
  } catch (error) {
    console.error("Toggle comment like error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}
