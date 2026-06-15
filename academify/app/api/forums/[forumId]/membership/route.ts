import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-response";
import { isForumModerator } from "@/lib/forum-permissions";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ forumId: string }> }
) {
  try {
    const sessionUser = await getSessionUser(request.headers);
    const { forumId } = await params;

    const forum = await prisma.forumHub.findUnique({ where: { forumID: forumId } });
    if (!forum) return apiError(404, "Forum not found", "NOT_FOUND");

    const memberCount = await prisma.forumMember.count({ where: { forumID: forumId } });

    if (!sessionUser) {
      return NextResponse.json({ isMember: false, isModerator: false, memberCount }, { status: 200 });
    }

    const userId = sessionUser.user.userId;
    const [membership, isModerator] = await Promise.all([
      prisma.forumMember.findUnique({
        where: { forumID_userID: { forumID: forumId, userID: userId } },
      }),
      isForumModerator(userId, forumId),
    ]);

    return NextResponse.json(
      {
        isMember: Boolean(membership),
        isModerator,
        memberCount,
        joinedAt: membership?.joinedAt.toISOString() ?? null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get forum membership error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ forumId: string }> }
) {
  try {
    const sessionUser = await getSessionUser(request.headers);
    if (!sessionUser) return apiError(401, "Not authenticated", "UNAUTHORIZED");

    const { forumId } = await params;
    const forum = await prisma.forumHub.findUnique({ where: { forumID: forumId } });
    if (!forum) return apiError(404, "Forum not found", "NOT_FOUND");

    const userId = sessionUser.user.userId;
    const existing = await prisma.forumMember.findUnique({
      where: { forumID_userID: { forumID: forumId, userID: userId } },
    });
    const memberCount = await prisma.forumMember.count({ where: { forumID: forumId } });
    if (existing) {
      return NextResponse.json({ member: existing, isMember: true, memberCount }, { status: 200 });
    }

    const member = await prisma.forumMember.create({
      data: { forumID: forumId, userID: userId },
    });

    return NextResponse.json(
      { member, isMember: true, memberCount: memberCount + 1 },
      { status: 201 }
    );
  } catch (error) {
    console.error("Join forum error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ forumId: string }> }
) {
  try {
    const sessionUser = await getSessionUser(request.headers);
    if (!sessionUser) return apiError(401, "Not authenticated", "UNAUTHORIZED");

    const { forumId } = await params;
    const userId = sessionUser.user.userId;

    await prisma.$transaction([
      prisma.forumModerator.deleteMany({ where: { forumID: forumId, userID: userId } }),
      prisma.forumMember.deleteMany({ where: { forumID: forumId, userID: userId } }),
    ]);

    const memberCount = await prisma.forumMember.count({ where: { forumID: forumId } });

    return NextResponse.json({ isMember: false, memberCount }, { status: 200 });
  } catch (error) {
    console.error("Leave forum error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}
