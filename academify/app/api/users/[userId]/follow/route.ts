import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/get-session";
import { apiError } from "@/lib/api-response";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> | { userId: string } }
) {
  try {
    const sessionData = await getSession();
    if (!sessionData) {
      return apiError(401, "Not authenticated", "UNAUTHORIZED");
    }

    const { userId: targetUserId } = await Promise.resolve(params);

    if (sessionData.user.userId === targetUserId) {
      return apiError(400, "You cannot follow yourself", "BAD_REQUEST");
    }

    const targetUser = await prisma.user.findUnique({ where: { userId: targetUserId } });
    if (!targetUser) {
      return apiError(404, "Target user not found", "NOT_FOUND");
    }

    // Check existing
    const existing = await prisma.follow.findFirst({
      where: {
        followerId: sessionData.user.userId,
        followingId: targetUserId,
      },
    });

    if (existing) {
      return NextResponse.json({ message: "Already following" }, { status: 200 });
    }

    await prisma.follow.create({
      data: {
        followerId: sessionData.user.userId,
        followingId: targetUserId,
      },
    });

    return NextResponse.json({ message: "Followed successfully" }, { status: 200 });
  } catch (error) {
    console.error("Follow error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> | { userId: string } }
) {
  try {
    const sessionData = await getSession();
    if (!sessionData) {
      return apiError(401, "Not authenticated", "UNAUTHORIZED");
    }

    const { userId: targetUserId } = await Promise.resolve(params);

    await prisma.follow.deleteMany({
      where: {
        followerId: sessionData.user.userId,
        followingId: targetUserId,
      },
    });

    return NextResponse.json({ message: "Unfollowed successfully" }, { status: 200 });
  } catch (error) {
    console.error("Unfollow error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}
