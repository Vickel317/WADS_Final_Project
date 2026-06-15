import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-response";

async function getLikeState(postId: string, userId: string | null) {
  const [count, liked] = await Promise.all([
    prisma.postLike.count({ where: { postID: postId } }),
    userId
      ? prisma.postLike.findUnique({
          where: { postID_userID: { postID: postId, userID: userId } },
        })
      : Promise.resolve(null),
  ]);

  return { count, liked: Boolean(liked) };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const sessionUser = await getSessionUser(request.headers);
    const post = await prisma.post.findUnique({
      where: { postID: postId },
      select: { postID: true },
    });
    if (!post) {
      return apiError(404, "Post not found", "NOT_FOUND");
    }

    const state = await getLikeState(postId, sessionUser?.user.userId ?? null);
    return NextResponse.json(state);
  } catch (error) {
    console.error("Get post likes error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const sessionUser = await getSessionUser(request.headers);
    if (!sessionUser) {
      return apiError(401, "Not authenticated", "UNAUTHORIZED");
    }

    const { postId } = await params;
    const userId = sessionUser.user.userId;

    const post = await prisma.post.findUnique({
      where: { postID: postId },
      select: { postID: true },
    });
    if (!post) {
      return apiError(404, "Post not found", "NOT_FOUND");
    }

    const existing = await prisma.postLike.findUnique({
      where: { postID_userID: { postID: postId, userID: userId } },
    });

    if (existing) {
      await prisma.postLike.delete({
        where: { postID_userID: { postID: postId, userID: userId } },
      });
      const count = await prisma.postLike.count({ where: { postID: postId } });
      return NextResponse.json({ liked: false, count });
    }

    await prisma.postLike.create({
      data: { postID: postId, userID: userId },
    });
    const count = await prisma.postLike.count({ where: { postID: postId } });
    return NextResponse.json({ liked: true, count });
  } catch (error) {
    console.error("Toggle post like error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}
