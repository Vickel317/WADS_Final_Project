import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-session";
import { apiError } from "@/lib/api-response";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  try {
    const session = await getSessionUser(request.headers);
    const { spaceId } = await params;
    const space = await prisma.collabSpace.findUnique({
      where: { spaceID: spaceId },
      include: { members: { include: { user: { select: { userId: true, name: true } } } } },
    });

    if (!space) return apiError(404, "Space not found", "NOT_FOUND");

    const isMember = session
      ? Boolean(
          await prisma.spaceMember.findUnique({
            where: { spaceID_userID: { spaceID: spaceId, userID: session.user.userId } },
          })
        )
      : false;

    return NextResponse.json({ space, isMember }, { status: 200 });
  } catch (err) {
    console.error("Get collaboration space error:", err);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  try {
    const session = await getSessionUser(request.headers);
    if (!session) return apiError(401, "Not authenticated", "UNAUTHORIZED");

    const { spaceId } = await params;
    // Only allow admins/creators to delete
    const member = await prisma.spaceMember.findUnique({
      where: { spaceID_userID: { spaceID: spaceId, userID: session.user.userId } },
    });

    if (!member) return apiError(403, "Forbidden", "FORBIDDEN");
    if (member.role !== "OWNER") return apiError(403, "Only admins can delete a space", "FORBIDDEN");

    await prisma.spaceMember.deleteMany({ where: { spaceID: spaceId } });
    const deleted = await prisma.collabSpace.delete({ where: { spaceID: spaceId } });

    return NextResponse.json({ message: "Space deleted", space: deleted }, { status: 200 });
  } catch (err) {
    console.error("Delete collaboration space error:", err);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  try {
    const session = await getSessionUser(request.headers);
    if (!session) return apiError(401, "Not authenticated", "UNAUTHORIZED");

    const { spaceId } = await params;
    // create membership if not exists
    const existing = await prisma.spaceMember.findUnique({ where: { spaceID_userID: { spaceID: spaceId, userID: session.user.userId } } });
    if (existing) return NextResponse.json({ member: existing }, { status: 200 });

    const member = await prisma.spaceMember.create({ data: { spaceID: spaceId, userID: session.user.userId, role: 'MEMBER' } });
    return NextResponse.json({ member }, { status: 201 });
  } catch (err) {
    console.error("Join collaboration space error:", err);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}
