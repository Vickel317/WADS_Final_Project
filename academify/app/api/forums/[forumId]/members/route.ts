import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-response";
import { canManageForum, isPlatformAdmin } from "@/lib/forum-permissions";
import { parseJson } from "@/lib/validation";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ forumId: string }> }
) {
  try {
    const session = await getSessionUser(request.headers);
    if (!session) return apiError(401, "Not authenticated", "UNAUTHORIZED");

    const { forumId } = await params;
    const forum = await prisma.forumHub.findUnique({ where: { forumID: forumId } });
    if (!forum) return apiError(404, "Forum not found", "NOT_FOUND");

    const userId = session.user.userId;
    const role = session.user.role?.toLowerCase() ?? "";
    const allowed = await canManageForum(userId, forumId, role);
    if (!allowed) {
      return apiError(403, "Forbidden: forum admin access required", "FORBIDDEN");
    }

    const [members, moderators] = await Promise.all([
      prisma.forumMember.findMany({
        where: { forumID: forumId },
        orderBy: { joinedAt: "desc" },
        include: {
          user: {
            select: { userId: true, name: true, email: true, role: true },
          },
        },
      }),
      prisma.forumModerator.findMany({
        where: { forumID: forumId },
        select: { userID: true },
      }),
    ]);

    const modIds = new Set(moderators.map((m) => m.userID));

    return NextResponse.json(
      {
        members: members.map((m) => ({
          userId: m.user.userId,
          name: m.user.name,
          email: m.user.email,
          role: m.user.role.toLowerCase(),
          joinedAt: m.joinedAt.toISOString(),
          isModerator: modIds.has(m.user.userId),
        })),
        total: members.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("List forum members error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ forumId: string }> }
) {
  try {
    const session = await getSessionUser(request.headers);
    if (!session) return apiError(401, "Not authenticated", "UNAUTHORIZED");

    const { forumId } = await params;
    const forum = await prisma.forumHub.findUnique({ where: { forumID: forumId } });
    if (!forum) return apiError(404, "Forum not found", "NOT_FOUND");

    const actorId = session.user.userId;
    const role = session.user.role?.toLowerCase() ?? "";
    const allowed = await canManageForum(actorId, forumId, role);
    if (!allowed) {
      return apiError(403, "Forbidden: forum admin access required", "FORBIDDEN");
    }

    const body = await parseJson<{ userId?: unknown; isModerator?: unknown }>(request);
    if (!body || typeof body.userId !== "string" || typeof body.isModerator !== "boolean") {
      return apiError(400, "userId and isModerator are required", "BAD_REQUEST");
    }

    const targetUserId = body.userId;
    const target = await prisma.user.findUnique({ where: { userId: targetUserId } });
    if (!target) return apiError(404, "User not found", "NOT_FOUND");

    // Only platform admins can assign moderators to other admins
    if (!isPlatformAdmin(role) && target.role === "ADMIN") {
      return apiError(403, "Cannot change moderator status for platform admins", "FORBIDDEN");
    }

    // Forum moderators cannot demote themselves (platform admin can)
    if (targetUserId === actorId && !body.isModerator && !isPlatformAdmin(role)) {
      return apiError(400, "Cannot remove your own moderator role", "BAD_REQUEST");
    }

    await prisma.forumMember.upsert({
      where: { forumID_userID: { forumID: forumId, userID: targetUserId } },
      create: { forumID: forumId, userID: targetUserId },
      update: {},
    });

    if (body.isModerator) {
      await prisma.forumModerator.upsert({
        where: { forumID_userID: { forumID: forumId, userID: targetUserId } },
        create: { forumID: forumId, userID: targetUserId },
        update: {},
      });
    } else {
      await prisma.forumModerator.deleteMany({
        where: { forumID: forumId, userID: targetUserId },
      });
    }

    return NextResponse.json(
      { userId: targetUserId, isModerator: body.isModerator },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update forum moderator error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}
